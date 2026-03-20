# Gemini CLI MCP Server

This is an MCP (Model Context Protocol) server that wraps the `geminicli` tool, allowing AI models to interact with Gemini directly via a local CLI.

## Features

- **ask-gemini**: A tool to send prompts to Gemini and get responses. Supports specifying different Gemini models.

## Installation

1.  Ensure you have Node.js and the `@google/gemini-cli` installed globally:
    ```bash
    npm install -g @google/gemini-cli
    ```
2.  Navigate to the `mcpserver` directory:
    ```bash
    cd D:\gemini\gemini-cli-webserver\mcpserver
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

To use this server with an MCP client (e.g., Claude Desktop, Gemini Code Assist), add the following to your configuration file:

### Claude Desktop (Windows)
File: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-cli": {
      "command": "node",
      "args": ["D:\\gemini\\gemini-cli-webserver\\mcpserver\\index.js"]
    }
  }
}
```

## Usage

Once configured, your AI assistant will have access to the `ask-gemini` tool.

### ask-gemini
Prompts Gemini for information.

**Arguments:**
- `prompt` (string, required): The text to send to Gemini.
- `model` (string, optional): The model name (e.g., `gemini-2.0-flash`). Defaults to the CLI's default or `gemini-2.0-flash`.

---
Developed as part of the `gemini-cli-webserver` project.
