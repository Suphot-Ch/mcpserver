import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "config.json");

// Load configuration
let config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiDefaultModel: "gpt-4o"
};

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    config = { ...config, ...fileConfig };
  }
} catch (error) {
  console.error("Error loading config.json:", error.message);
}

// Re-initialize with potentially updated API key
const openai = new OpenAI({
  apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
});

const server = new Server(
  {
    name: "openai-mcp-server",
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
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list-models",
        description: "List available models in OpenAI.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "chat-completion",
        description: "Generate a chat completion using OpenAI.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The name of the model to use (default: gpt-4o).",
            },
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["system", "user", "assistant"] },
                  content: { type: "string" },
                },
                required: ["role", "content"],
              },
              description: "The list of messages in the conversation.",
            },
          },
          required: ["messages"],
        },
      },
      {
        name: "get-config",
        description: "Get the current configuration (excluding API key).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handler for the MCP tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list-models") {
      const models = await openai.models.list();
      return {
        content: [{ type: "text", text: JSON.stringify(models.data, null, 2) }],
      };
    }

    if (name === "chat-completion") {
      const { model, messages } = args;
      const response = await openai.chat.completions.create({
        model: model || config.openaiDefaultModel,
        messages: messages,
      });

      return {
        content: [{ type: "text", text: response.choices[0].message.content }],
      };
    }

    if (name === "get-config") {
      const safeConfig = { ...config };
      if (safeConfig.openaiApiKey) safeConfig.openaiApiKey = "********";
      return {
        content: [{ type: "text", text: JSON.stringify(safeConfig, null, 2) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenAI MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
