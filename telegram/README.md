# Telegram MCP Server

MCP server for sending Telegram messages through a bot.

## Features

- `send-message`: Send a text message to a Telegram chat.
- `get-config`: View the active configuration without exposing the bot token.

By default, each sent message includes a header with:
- sender app: `codex`, `claude`, or `gemini`
- session ID
- workspace path

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file or set environment variables:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_DEFAULT_CHAT_ID=your_chat_id_here
   TELEGRAM_PARSE_MODE=
   TELEGRAM_SENDER_APP=codex
   TELEGRAM_SENDER_SESSION=
   TELEGRAM_SENDER_WORKSPACE=
   ```

## MCP Integration

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "node",
      "args": ["D:/antigravity/MCP-Server/telegram/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_telegram_bot_token_here",
        "TELEGRAM_DEFAULT_CHAT_ID": "your_chat_id_here"
      }
    }
  }
}
```

## Notes

- Your bot must already be allowed to message the target chat.
- For private chats, send `/start` to the bot first.
- For groups or channels, use the correct numeric chat ID and make sure the bot has permission to post.
- The server auto-detects session and workspace when possible. You can override them with `TELEGRAM_SENDER_*` env vars.
