import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to dynamically find the path to the Gemini CLI's index.js.
 */
function findGeminiCliPath() {
  const cliRelativePath = path.join("@google", "gemini-cli", "dist", "index.js");
  let globalNodeModulesPath;

  // Attempt to find via npm root -g
  try {
    globalNodeModulesPath = execSync("npm root -g", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    let fullPath = path.join(globalNodeModulesPath, cliRelativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  } catch (error) {
    // console.warn(`'npm root -g' failed or gemini-cli not found there.`);
  }

  // Fallback to common global paths
  const commonGlobalPaths = [];
  if (process.platform === "win32") {
    if (process.env.ProgramFiles) {
      commonGlobalPaths.push(
        path.join(process.env.ProgramFiles, "nodejs", "node_modules")
      );
    }
    if (process.env.APPDATA) {
      commonGlobalPaths.push(path.join(process.env.APPDATA, "npm", "node_modules"));
    }
    commonGlobalPaths.push(
      path.join(
        process.env.USERPROFILE || "",
        "AppData",
        "Roaming",
        "npm",
        "node_modules"
      )
    );
  } else {
    commonGlobalPaths.push("/usr/local/lib/node_modules", "/usr/lib/node_modules");
    if (process.env.NVM_DIR && process.version) {
      commonGlobalPaths.push(
        path.join(
          process.env.NVM_DIR,
          "versions",
          "node",
          process.version,
          "lib",
          "node_modules"
        )
      );
    }
  }

  for (const basePath of commonGlobalPaths) {
    const fullPath = path.join(basePath, cliRelativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Last resort: assume it's in the PATH or just return the known Windows path if everything else fails
  return "C:\\Program Files\\nodejs\\node_modules\\@google\\gemini-cli\\dist\\index.js";
}

const geminiJsPath = findGeminiCliPath();

const server = new Server(
  {
    name: "gemini-cli-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes an 'ask-gemini' tool for sending prompts to Gemini models.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask-gemini",
        description: "Send a prompt to Gemini and get a response.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt text to send to Gemini.",
            },
            model: {
              type: "string",
              description: "The Gemini model to use (e.g., gemini-2.0-flash).",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

/**
 * Handler for the ask-gemini tool.
 * Spawns the geminicli process and returns the output.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "ask-gemini") {
    throw new Error(`Tool not found: ${request.params.name}`);
  }

  const { prompt, model } = request.params.arguments;
  const args = [geminiJsPath, "--prompt", prompt];

  if (model) {
    args.push("--model", model);
  }

  return new Promise((resolve, reject) => {
    const geminiProcess = spawn("node", args);
    let output = "";
    let errorOutput = "";

    geminiProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      // Filter out initialization messages as done in the original server
      if (
        !chunk.includes("Loaded cached credentials") &&
        !chunk.includes("I am your senior software engineer")
      ) {
        output += chunk;
      }
    });

    geminiProcess.stderr.on("data", (data) => {
      const errChunk = data.toString();
      if (!errChunk.includes("Loaded cached credentials")) {
        errorOutput += errChunk;
      }
    });

    geminiProcess.on("close", (code) => {
      if (code !== 0 && errorOutput) {
        resolve({
          content: [
            {
              type: "text",
              text: `Error from Gemini CLI: ${errorOutput.substring(0, 1000)}`,
            },
          ],
          isError: true,
        });
      } else {
        resolve({
          content: [{ type: "text", text: output.trim() }],
        });
      }
    });

    geminiProcess.on("error", (err) => {
      resolve({
        content: [
          {
            type: "text",
            text: `Failed to start Gemini process: ${err.message}`,
          },
        ],
        isError: true,
      });
    });
  });
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini CLI MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
