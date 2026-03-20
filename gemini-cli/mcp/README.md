# Gemini CLI MCP Server

This is a Model Context Protocol (MCP) server that provides a bridge to the `geminicli` tool. It allows AI models (like Gemini or Claude) to interact with your local Gemini CLI installation to perform tasks and retrieve information.

## ✨ Features

- **ask-gemini**: Send prompts directly to Gemini and receive high-quality responses.
- **Model Selection**: Supports specifying different Gemini models (e.g., `gemini-2.0-flash`, `gemini-1.5-pro`).
  To set a default model for the server, create a `config.json` file in the same directory as `index.js`:

```json
{
  "geminiModel": "gemini-2.0-flash"
}
```

## 🚀 Installation

1.  **Ensure Gemini CLI is installed**:
    ```bash
    npm install -g @google/gemini-cli
    ```

2.  **Install dependencies**:
    Navigate to this directory and run:
    ```bash
    npm install
    ```

## ⚙️ Configuration

To use this server with an MCP client (e.g., Claude Desktop, VS Code), add the following entry to your configuration:

```json
{
  "mcpServers": {
    "gemini-cli": {
      "command": "node",
      "args": ["D:/antigravity/MCP-Server/gemini-cli/mcp/index.js"]
    }
  }
}
```

## 🛠 Available Tools

### `ask-gemini`
Sends a text prompt to Gemini.

**Arguments:**
- `prompt` (string, required): The query or instruction for Gemini.
- `model` (string, optional): The specific model version to use. Defaults to the CLI's configured default.

## 💻 Development

You can test the server in stdio mode:
```bash
node index.js
```

Or run the provided test script:
```bash
node test-mcp.js
```

---
*Part of the Gemini CLI Workspace.*
