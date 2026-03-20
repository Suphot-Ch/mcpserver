# Ollama MCP Server

An MCP server wrapper for [Ollama](https://ollama.com/), providing tools to interact with local Large Language Models.

## Features

- **list-models**: List all models installed on your local Ollama server.
- **generate-completion**: Single-turn text generation.
- **chat-completion**: Multi-turn chat conversations.
- **show-model-info**: Detailed information about a specific model.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Configure environment**:
    Create a `.env` file based on `.env.example`:
    ```env
    OLLAMA_BASE_URL=http://localhost:11434
    OLLAMA_DEFAULT_MODEL=gemma3:1b
    ```
3.  **Start the server**:
    ```bash
    npm start
    ```

## Usage in MCP Clients

Add the following to your MCP client configuration (e.g., Claude Desktop or Gemini CLI):

```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["D:/antigravity/MCP-Server/ollama/index.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "OLLAMA_DEFAULT_MODEL": "gemma3:1b"
      }
    }
  }
}
```

## Tools

### `list-models`
- No arguments.
- Returns a JSON list of available models.

### `generate-completion`
- `prompt` (required): The prompt text.
- `model` (optional): Override the default model.
- `system` (optional): System message.

### `chat-completion`
- `messages` (required): Array of `{ role, content }` objects.
- `model` (optional): Override the default model.

### `show-model-info`
- `name` (required): The model name.
