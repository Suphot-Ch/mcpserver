# OpenAI MCP Server

MCP server for interacting with OpenAI models.

## 🚀 Features

- **list-models**: List available models in OpenAI.
- **chat-completion**: Generate chat completions using OpenAI models.
- **get-config**: View current server configuration (safe view).

## 🛠 Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in this directory and add your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_api_key_here
    ```

3.  **Local Configuration**:
    You can optionally create a `config.json` to override defaults:
    ```json
    {
      "openaiDefaultModel": "gpt-4-turbo"
    }
    ```

## 🔌 Integration

Add this to your MCP settings (e.g., `mcp_config.json` or Claude Desktop config):

```json
{
  "mcpServers": {
    "openai": {
      "command": "node",
      "args": ["D:/antigravity/MCP-Server/openai/index.js"],
      "env": {
        "OPENAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 🏗 Development

Run the server locally:
```bash
node index.js
```
The server communicates over `stdio`.
