# Gemini CLI API Gateway - Multi-Format Support

**Version:** 2.0.0  
**API Server:** `http://localhost:3001`

## Overview

The Gemini CLI API Gateway now supports **four major API formats** for maximum compatibility with different clients and frameworks:

1. **OpenAI-compatible** (`/v1/*`) - Use tools built for OpenAI API
2. **Anthropic-compatible** (`/anthropic/*`) - Use tools built for Anthropic API
3. **Ollama-compatible** (`/api/*`) - Use tools built for Ollama
4. **Native Gemini** (`/api/gemini/*`) - Direct Gemini API

---

## Supported Models

All endpoints support the following Gemini models:

- `gemini-3.1-pro-preview`
- `gemini-3-flash-preview`
- `gemini-3.1-flash-lite-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`

---

## API Formats

### 1. OpenAI-Compatible API (`/v1/*`)

Full OpenAI API compatibility. Use this if you have code written for OpenAI's API.

#### List Models
```bash
GET /v1/models
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gemini-2.5-flash",
      "object": "model",
      "created": 1234567890,
      "owned_by": "google",
      "permission": [],
      "root": "gemini-2.5-flash",
      "parent": null
    }
  ]
}
```

#### Chat Completions
```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "gemini-2.5-flash",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7
}
```

**Response:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gemini-2.5-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'm doing well, thank you for asking!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": -1,
    "completion_tokens": -1,
    "total_tokens": -1
  }
}
```

---

### 2. Anthropic-Compatible API (`/anthropic/*`)

Full Anthropic API compatibility. Use this if you have code written for Anthropic's API.

#### List Models
```bash
GET /anthropic/models
```

**Response:**
```json
{
  "data": [
    {
      "id": "gemini-2.5-flash",
      "type": "model",
      "display_name": "gemini-2.5-flash",
      "created_at": "2024-01-15T10:30:00Z",
      "input_tokens": 200000,
      "output_tokens": 4096
    }
  ],
  "_request_id": "req_abc123"
}
```

#### Send Message
```bash
POST /anthropic/messages
Content-Type: application/json

{
  "model": "gemini-2.5-flash",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "system": "You are a helpful assistant."
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "I'm doing well, thank you for asking!"
    }
  ],
  "id": "msg_abc123",
  "model": "gemini-2.5-flash",
  "role": "assistant",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "type": "message",
  "usage": {
    "input_tokens": -1,
    "output_tokens": -1
  }
}
```

---

### 3. Ollama-Compatible API (`/api/*`)

Full Ollama API compatibility. Use this if you have code written for Ollama.

#### List Models
```bash
GET /api/tags
```

**Response:**
```json
{
  "models": [
    {
      "name": "gemini-2.5-flash",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 0,
      "digest": "sha256:abc123..."
    }
  ]
}
```

#### Generate Completion
```bash
POST /api/generate
Content-Type: application/json

{
  "model": "gemini-2.5-flash",
  "prompt": "Hello, how are you?"
}
```

**Response:**
```json
{
  "model": "gemini-2.5-flash",
  "created_at": "2024-01-15T10:30:00Z",
  "response": "I'm doing well, thank you for asking!",
  "done": true,
  "context": [],
  "total_duration": 0,
  "load_duration": 0,
  "prompt_eval_count": 0,
  "prompt_eval_duration": 0,
  "eval_count": 0,
  "eval_duration": 0
}
```

#### Chat Completion
```bash
POST /api/chat
Content-Type: application/json

{
  "model": "gemini-2.5-flash",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

**Response:**
```json
{
  "model": "gemini-2.5-flash",
  "created_at": "2024-01-15T10:30:00Z",
  "message": {
    "role": "assistant",
    "content": "I'm doing well, thank you for asking!"
  },
  "done": true,
  "total_duration": 0,
  "load_duration": 0,
  "prompt_eval_count": 0,
  "prompt_eval_duration": 0,
  "eval_count": 0,
  "eval_duration": 0
}
```

---

### 4. Native Gemini API (`/api/gemini/*`)

Direct Gemini API. Use this for simple text-to-text requests.

#### List Models
```bash
GET /api/models
```

**Response:**
```json
{
  "models": [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
  ]
}
```

#### Chat
```bash
POST /api/gemini/chat
Content-Type: application/json

{
  "text": "Hello, how are you?",
  "model": "gemini-2.5-flash"
}
```

**Response:**
```json
{
  "response": "I'm doing well, thank you for asking!",
  "model": "gemini-2.5-flash"
}
```

---

## General Endpoints

### Welcome / Info
```bash
GET /
```

**Response:**
```json
{
  "message": "Welcome to Gemini CLI API Gateway",
  "version": "2.0.0",
  "documentation": {
    "swagger": "http://localhost:3001/api-docs",
    "alternative": "http://localhost:3001/docs"
  },
  "supportedFormats": ["OpenAI", "Anthropic", "Ollama", "Native Gemini"],
  "baseModels": ["gemini-3-pro-preview", "..."]
}
```

---

## Documentation

- **Swagger UI:** `http://localhost:3001/api-docs`
- **Alternative Docs:** `http://localhost:3001/docs`

---

## Error Handling

All endpoints return errors in their respective format:

### OpenAI Format
```json
{
  "error": {
    "message": "Model not supported",
    "type": "invalid_request_error"
  }
}
```

### Anthropic Format
```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "Model not supported"
  }
}
```

### Ollama Format
```json
{
  "error": "Model not supported"
}
```

---

## WebSocket Support

For real-time streaming, connect to the WebSocket server:

```javascript
const socket = io('http://localhost:3001');

socket.emit('message', {
  text: 'Hello, how are you?',
  model: 'gemini-2.5-flash'
});

socket.on('response', (data) => {
  console.log('Response:', data);
});

socket.on('done', (code) => {
  console.log('Process exited with code:', code);
});
```

---

## Usage Examples

### Using curl with OpenAI format
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Using Python with OpenAI format
```python
import requests

response = requests.post(
  'http://localhost:3001/v1/chat/completions',
  json={
    'model': 'gemini-2.5-flash',
    'messages': [{'role': 'user', 'content': 'Hello'}]
  }
)
print(response.json())
```

### Using JavaScript/Node.js with Anthropic format
```javascript
const fetch = require('node-fetch');

const response = await fetch('http://localhost:3001/anthropic/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello' }]
  })
});

const data = await response.json();
console.log(data);
```

---

## Implementation Notes

- All endpoints validate that the requested model is in the `SUPPORTED_MODELS` list
- The API automatically filters out CLI noise from the underlying Gemini CLI process
- Token counts are set to `-1` as they're calculated by the underlying service
- Error responses respect each format's standard error structure
- The server supports CORS for cross-origin requests
