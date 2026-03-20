import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "ollama-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list-models",
        description: "List available models in Ollama.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "generate-completion",
        description: "Generate a completion for a prompt using a specific model.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The name of the model to use.",
            },
            prompt: {
              type: "string",
              description: "The prompt to generate a completion for.",
            },
            system: {
              type: "string",
              description: "System message to guide the model.",
            },
            template: {
              type: "string",
              description: "The full prompt or template (overrides others).",
            },
            stream: {
              type: "boolean",
              description: "Whether to stream the response (default false).",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "chat-completion",
        description: "Generate a chat completion using a specific model.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The name of the model to use.",
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
            stream: {
              type: "boolean",
              description: "Whether to stream the response (default false).",
            },
          },
          required: ["messages"],
        },
      },
      {
        name: "show-model-info",
        description: "Show details for a specific model.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the model.",
            },
          },
          required: ["name"],
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
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "generate-completion") {
      const { model, prompt, system, template, stream = false } = args;
      const activeModel = model || process.env.OLLAMA_DEFAULT_MODEL;

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeModel,
          prompt,
          system,
          template,
          stream,
        }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      
      if (stream) {
        return {
          content: [{ type: "text", text: "Streaming not fully implemented in this wrapper yet. Set stream to false." }],
          isError: true,
        };
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: data.response }],
      };
    }

    if (name === "chat-completion") {
      const { model, messages, stream = false } = args;
      const activeModel = model || process.env.OLLAMA_DEFAULT_MODEL;

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeModel,
          messages,
          stream,
        }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

      if (stream) {
        return {
          content: [{ type: "text", text: "Streaming not fully implemented in this wrapper yet. Set stream to false." }],
          isError: true,
        };
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: data.message.content }],
      };
    }

    if (name === "show-model-info") {
      const { name: modelName } = args;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
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
  console.error("Ollama MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
