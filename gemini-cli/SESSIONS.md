# Conversation Sessions Guide

The API now supports **conversation sessions** that maintain message history across multiple requests. This allows you to have multi-turn conversations where the model remembers previous messages in the conversation.

## Overview

Sessions store conversation history and automatically include it in subsequent requests, enabling natural multi-turn conversations.

## Session Management

### Create a New Session

```bash
curl -X POST http://localhost:3001/sessions
```

**Response:**
```json
{
  "sessionId": "sess_abc123def456",
  "message": "Session created. Use session-id header in requests to maintain conversation history.",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Get Session History

```bash
curl http://localhost:3001/sessions/sess_abc123def456
```

**Response:**
```json
{
  "sessionId": "sess_abc123def456",
  "history": [
    { "role": "user", "content": "What is 2+2?" },
    { "role": "assistant", "content": "2+2 equals 4." },
    { "role": "user", "content": "What about 3+3?" },
    { "role": "assistant", "content": "3+3 equals 6." }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastAccess": "2024-01-15T10:35:00.000Z",
  "messageCount": 4
}
```

### Clear Session History

```bash
curl -X DELETE http://localhost:3001/sessions/sess_abc123def456
```

**Response:**
```json
{
  "message": "Session sess_abc123def456 cleared"
}
```

## Using Sessions in Requests

To maintain conversation history, include the `session-id` header in your API requests.

### Option 1: Create Session First, Then Use It

```bash
# 1. Create a session
SESSION=$(curl -s -X POST http://localhost:3001/sessions | jq -r .sessionId)

# 2. First message
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: $SESSION" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "What is 2+2?"}]
  }'

# 3. Follow-up message (history is included automatically)
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: $SESSION" \
  -d '{
    "model": "gemini-3.1-pro-preview",
    "messages": [{"role": "user", "content": "What about 3+3?"}]
  }'
```

### Option 2: Auto-Create Session with First Request

If you don't provide a `session-id`, one will be created automatically and returned in the response:

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: my-session-1" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Response** (note `sessionId` field):
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gemini-2.5-flash",
  "sessionId": "my-session-1",
  "choices": [...]
}
```

## Session Support by Format

Sessions are supported across all API formats:

### OpenAI Format (`/v1/chat/completions`)
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: sess_12345" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Your message"}]
  }'
```

### Anthropic Format (`/anthropic/messages`)
```bash
curl -X POST http://localhost:3001/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "session-id: sess_12345" \
  -d '{
    "model": "gemini-2.5-flash",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Your message"}]
  }'
```

### Ollama Format (`/api/chat`)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "session-id: sess_12345" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Your message"}]
  }'
```

### Native Gemini Format (`/api/gemini/chat`)
```bash
curl -X POST http://localhost:3001/api/gemini/chat \
  -H "Content-Type: application/json" \
  -H "session-id: sess_12345" \
  -d '{
    "text": "Your message",
    "model": "gemini-2.5-flash"
  }'
```

## How It Works

1. **Create a Session** (or reuse existing one via `session-id` header)
2. **Send a Message** with the `session-id` header
3. **API automatically**:
   - Retrieves the session history
   - Includes it in the prompt sent to Gemini
   - Stores your message and the response in the session
4. **Next Message** includes all previous messages automatically

### Example: Multi-Turn Conversation

```bash
# Create session
SESSION=$(curl -s -X POST http://localhost:3001/sessions | jq -r .sessionId)
echo "Session: $SESSION"

# Turn 1: Initial question
echo -e "\n=== Turn 1 ==="
curl -s -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: $SESSION" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "What is Python?"}]
  }' | jq .choices[0].message.content

# Turn 2: Follow-up (history is included)
echo -e "\n=== Turn 2 ==="
curl -s -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: $SESSION" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Can you give me an example?"}]
  }' | jq .choices[0].message.content

# Turn 3: Another follow-up
echo -e "\n=== Turn 3 ==="
curl -s -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "session-id: $SESSION" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "How do I run it?"}]
  }' | jq .choices[0].message.content

# View complete history
echo -e "\n=== Full Conversation History ==="
curl -s http://localhost:3001/sessions/$SESSION | jq .history
```

## Implementation Examples

### Python with Sessions

```python
import requests
import json

BASE_URL = "http://localhost:3001"

# Create session
response = requests.post(f"{BASE_URL}/sessions")
session_id = response.json()["sessionId"]
print(f"Session created: {session_id}")

# Function for chat
def chat(message):
    response = requests.post(
        f"{BASE_URL}/v1/chat/completions",
        headers={"session-id": session_id},
        json={
            "model": "gemini-2.5-flash",
            "messages": [{"role": "user", "content": message}]
        }
    )
    return response.json()["choices"][0]["message"]["content"]

# Multi-turn conversation
print("\n1.", chat("What is Python?"))
print("\n2.", chat("Can you give me an example?"))
print("\n3.", chat("How do I run it?"))

# View history
response = requests.get(f"{BASE_URL}/sessions/{session_id}")
print("\nFull conversation:")
for msg in response.json()["history"]:
    print(f"{msg['role']}: {msg['content']}")
```

### Node.js with Sessions

```javascript
const fetch = require('node-fetch');

const BASE_URL = "http://localhost:3001";

async function chat(sessionId, message) {
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'session-id': sessionId
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: message }]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  // Create session
  const sessionRes = await fetch(`${BASE_URL}/sessions`, { method: 'POST' });
  const sessionId = (await sessionRes.json()).sessionId;
  console.log(`Session: ${sessionId}`);

  // Multi-turn conversation
  console.log("\n1.", await chat(sessionId, "What is Python?"));
  console.log("\n2.", await chat(sessionId, "Can you give me an example?"));
  console.log("\n3.", await chat(sessionId, "How do I run it?"));

  // View history
  const historyRes = await fetch(`${BASE_URL}/sessions/${sessionId}`);
  const history = (await historyRes.json()).history;
  console.log("\nFull conversation:");
  history.forEach(msg => console.log(`${msg.role}: ${msg.content}`));
}

main();
```

## Notes

- **Session Storage**: Sessions are stored in-memory and will be lost when the server restarts
- **No Persistence**: For persistent sessions, implement database storage
- **Header Name**: Use lowercase `session-id` header
- **Auto-Creation**: Sessions are created automatically if the ID doesn't exist
- **History Limit**: No built-in limit on history size (consider implementing one for production)
- **Cleanup**: Use `DELETE /sessions/{sessionId}` to clear a session

## Production Considerations

For production use, consider:

1. **Persistent Storage**: Save sessions to a database
2. **Session Expiry**: Auto-delete sessions after N minutes of inactivity
3. **History Truncation**: Limit history size to prevent context overflow
4. **User Association**: Link sessions to authenticated users
5. **Memory Management**: Implement LRU cache for large-scale deployments

## Troubleshooting

### Session not found
- Ensure you're using the correct `session-id` header
- Create a new session with `POST /sessions`

### History not including previous messages
- Verify the `session-id` header is being sent
- Check that responses include the `sessionId` field

### Session lost after server restart
- This is expected with in-memory storage
- Use `DELETE /sessions/{sessionId}` before restart if needed
