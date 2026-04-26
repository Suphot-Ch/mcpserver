# API Testing Examples

Quick reference for testing each API format.

## Using curl

### OpenAI Format
```bash
# List models
curl http://localhost:3001/v1/models

# Chat completion
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {"role": "user", "content": "What is 2+2?"}
    ]
  }'
```

### Anthropic Format
```bash
# List models
curl http://localhost:3001/anthropic/models

# Send message
curl -X POST http://localhost:3001/anthropic/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "What is 2+2?"}
    ]
  }'
```

### Ollama Format
```bash
# List models
curl http://localhost:3001/api/tags

# Generate
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "prompt": "What is 2+2?"
  }'

# Chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {"role": "user", "content": "What is 2+2?"}
    ]
  }'
```

### Native Gemini Format
```bash
# List models
curl http://localhost:3001/api/models

# Chat
curl -X POST http://localhost:3001/api/gemini/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is 2+2?",
    "model": "gemini-2.5-flash"
  }'
```

---

## Using Python

### OpenAI SDK
```python
from openai import OpenAI

client = OpenAI(
    api_key="not-needed",
    base_url="http://localhost:3001/v1"
)

response = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=[
        {"role": "user", "content": "What is 2+2?"}
    ]
)

print(response.choices[0].message.content)
```

### Anthropic SDK
```python
import anthropic

client = anthropic.Anthropic(
    api_key="not-needed",
    base_url="http://localhost:3001/anthropic"
)

message = client.messages.create(
    model="gemini-2.5-flash",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "What is 2+2?"}
    ]
)

print(message.content[0].text)
```

### Requests Library
```python
import requests

# OpenAI format
response = requests.post(
    "http://localhost:3001/v1/chat/completions",
    json={
        "model": "gemini-2.5-flash",
        "messages": [{"role": "user", "content": "What is 2+2?"}]
    }
)
print(response.json()["choices"][0]["message"]["content"])

# Anthropic format
response = requests.post(
    "http://localhost:3001/anthropic/messages",
    json={
        "model": "gemini-2.5-flash",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": "What is 2+2?"}]
    }
)
print(response.json()["content"][0]["text"])

# Ollama format
response = requests.post(
    "http://localhost:3001/api/generate",
    json={
        "model": "gemini-2.5-flash",
        "prompt": "What is 2+2?"
    }
)
print(response.json()["response"])

# Native Gemini format
response = requests.post(
    "http://localhost:3001/api/gemini/chat",
    json={
        "text": "What is 2+2?",
        "model": "gemini-2.5-flash"
    }
)
print(response.json()["response"])
```

---

## Using JavaScript/Node.js

### OpenAI JS SDK
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'not-needed',
  baseURL: 'http://localhost:3001/v1',
  dangerouslyAllowBrowser: true
});

const response = await openai.chat.completions.create({
  model: 'gemini-2.5-flash',
  messages: [
    { role: 'user', content: 'What is 2+2?' }
  ]
});

console.log(response.choices[0].message.content);
```

### Fetch API
```javascript
// OpenAI format
const response = await fetch('http://localhost:3001/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    messages: [{ role: 'user', content: 'What is 2+2?' }]
  })
});
const data = await response.json();
console.log(data.choices[0].message.content);

// Anthropic format
const response = await fetch('http://localhost:3001/anthropic/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'What is 2+2?' }]
  })
});
const data = await response.json();
console.log(data.content[0].text);

// Ollama format
const response = await fetch('http://localhost:3001/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    prompt: 'What is 2+2?'
  })
});
const data = await response.json();
console.log(data.response);

// Native Gemini format
const response = await fetch('http://localhost:3001/api/gemini/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'What is 2+2?',
    model: 'gemini-2.5-flash'
  })
});
const data = await response.json();
console.log(data.response);
```

---

## Using WebSocket (Node.js)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
  
  socket.emit('message', {
    text: 'What is 2+2?',
    model: 'gemini-2.5-flash'
  });
});

socket.on('response', (data) => {
  console.log('Response:', data);
});

socket.on('done', (code) => {
  console.log('Done with code:', code);
  process.exit(code || 0);
});
```

---

## Using WebSocket (Browser)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <button onclick="sendMessage()">Send Message</button>
  <div id="output"></div>

  <script>
    const socket = io('http://localhost:3001');
    const output = document.getElementById('output');

    socket.on('response', (data) => {
      output.innerHTML += data + '<br>';
    });

    socket.on('done', (code) => {
      output.innerHTML += `<strong>Done (code: ${code})</strong><br>`;
    });

    function sendMessage() {
      socket.emit('message', {
        text: 'What is 2+2?',
        model: 'gemini-2.5-flash'
      });
    }
  </script>
</body>
</html>
```

---

## Environment Variables

You can customize the server behavior with environment variables:

```bash
# Port
export PORT=3001

# Run the server
node server/index.js
```

---

## Troubleshooting

### "Model not supported" error
Make sure you're using one of the supported models:
- `gemini-3.1-pro-preview`
- `gemini-3-flash-preview`
- `gemini-3.1-flash-lite-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`

### "API Rate Limit Reached (429)" error
The underlying Gemini API is rate-limited. Wait a moment and retry.

### "Failed to start gemini process" error
Make sure the Gemini CLI is installed globally:
```bash
npm install -g @google/gemini-cli
```

### "CORS" errors
The server has CORS enabled. If you're still getting errors, check that the origin matches the configuration in `server/index.js`.
