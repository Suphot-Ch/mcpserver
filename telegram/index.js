import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || "",
  telegramParseMode: process.env.TELEGRAM_PARSE_MODE || "",
  telegramDisableNotification: process.env.TELEGRAM_DISABLE_NOTIFICATION === "true",
  telegramAutoHeader: process.env.TELEGRAM_AUTO_HEADER !== "false",
  telegramSenderApp: process.env.TELEGRAM_SENDER_APP || "",
  telegramSenderSession: process.env.TELEGRAM_SENDER_SESSION || "",
  telegramSenderWorkspace: process.env.TELEGRAM_SENDER_WORKSPACE || "",
};

function requireBotToken() {
  const token = config.telegramBotToken;
  if (!token) {
    throw new Error("Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN in .env file.");
  }
  return token;
}

function getApiUrl(method) {
  const token = requireBotToken();
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function telegramRequest(method, body) {
  const response = await fetch(getApiUrl(method), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    const description = data?.description || `Telegram API request failed with status ${response.status}`;
    throw new Error(description);
  }

  return data.result;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function detectSenderApp() {
  return firstNonEmpty(
    config.telegramSenderApp,
    process.env.TELEGRAM_SENDER_APP,
    process.env.GEMINI_CLI ? "gemini" : "",
    process.env.CLAUDECODE,
    process.env.CLAUDE_CODE ? "claude" : "",
    process.env.CODEX_THREAD_ID ? "codex" : "",
    process.env.CODEX_WORKSPACE ? "codex" : "", // เพิ่มการเช็คจาก Workspace
    "unknown"
  );
}

function detectSenderSession() {
  return firstNonEmpty(
    config.telegramSenderSession,
    process.env.CODEX_THREAD_ID,
    process.env.CLAUDE_SESSION_ID,
    process.env.GEMINI_SESSION_ID,
    process.env.WT_SESSION,
    process.env.SESSIONNAME, // เพิ่มการเช็คชื่อ Session พื้นฐานของ Windows
    "cmd-session" // เปลี่ยนจาก unknown เป็นค่าที่สื่อความหมายขึ้น
  );
}

function detectSenderWorkspace() {
  return firstNonEmpty(
    config.telegramSenderWorkspace,
    process.env.TELEGRAM_SENDER_WORKSPACE,
    process.env.CODEX_WORKSPACE,
    process.env.CLAUDE_WORKSPACE,
    process.env.GEMINI_WORKSPACE,
    process.cwd()
  );
}

function buildMessageHeader(overrideSenderApp) {
  const senderApp = overrideSenderApp || detectSenderApp();
  const senderSession = detectSenderSession();
  const senderWorkspace = detectSenderWorkspace();

  return [
    `[from ${senderApp}]`,
    `session: ${senderSession}`,
    `workspace: ${senderWorkspace}`,
    "",
  ].join("\n");
}

function buildOutgoingText(text, includeHeader = true, overrideSenderApp) {
  if (!includeHeader) {
    return text;
  }

  return `${buildMessageHeader(overrideSenderApp)}${text}`;
}

const server = new Server(
  {
    name: "telegram-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send-message",
        description: "Send a Telegram message using a bot token and target chat ID.",
        inputSchema: {
          type: "object",
          properties: {
            chatId: {
              type: "string",
              description: "Telegram chat ID. Uses telegramDefaultChatId when omitted.",
            },
            text: {
              type: "string",
              description: "Message text to send.",
            },
            senderApp: {
              type: "string",
              description: "Override the sender application name (e.g., GEMINI, CODEX, CLAUDE).",
            },
            parseMode: {
              type: "string",
              enum: ["Markdown", "MarkdownV2", "HTML"],
              description: "Optional Telegram parse mode override.",
            },
            disableNotification: {
              type: "boolean",
              description: "Send silently without sound/vibration.",
            },
            includeHeader: {
              type: "boolean",
              description: "Prepend sender app, session, and workspace header. Defaults to true.",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "get-config",
        description: "Get the current Telegram configuration without exposing the bot token.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    if (name === "send-message") {
      const chatId = args.chatId || config.telegramDefaultChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;
      if (!chatId) {
        throw new Error("Missing chatId. Pass chatId in the tool call or set TELEGRAM_DEFAULT_CHAT_ID.");
      }

      const payload = {
        chat_id: chatId,
        text: buildOutgoingText(
          args.text,
          typeof args.includeHeader === "boolean" ? args.includeHeader : config.telegramAutoHeader !== false,
          args.senderApp
        ),
        disable_notification:
          typeof args.disableNotification === "boolean"
            ? args.disableNotification
            : Boolean(config.telegramDisableNotification),
      };

      const parseMode = args.parseMode || config.telegramParseMode;
      if (parseMode) {
        payload.parse_mode = parseMode;
      }

      const result = await telegramRequest("sendMessage", payload);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                chatId: String(result.chat.id),
                messageId: result.message_id,
                date: result.date,
                text: result.text,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get-config") {
      const safeConfig = { ...config };
      if (safeConfig.telegramBotToken) {
        safeConfig.telegramBotToken = "********";
      }
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Telegram MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
