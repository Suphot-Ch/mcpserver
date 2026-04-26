#!/bin/bash

# Gemini CLI API - Session Testing Script
# Tests multi-turn conversations with session management

BASE_URL="http://localhost:3001"

echo "🚀 Gemini CLI API - Session Testing"
echo "===================================="
echo ""

# Create a new session
echo "📝 Creating a new session..."
SESSION_RESPONSE=$(curl -s -X POST $BASE_URL/sessions)
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')
echo "✅ Session created: $SESSION_ID"
echo ""

# Function to send a message with session
send_message() {
  local turn=$1
  local message=$2

  echo "💬 Turn $turn: User says: \"$message\""

  RESPONSE=$(curl -s -X POST $BASE_URL/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "session-id: $SESSION_ID" \
    -d '{
      "model": "gemini-2.5-flash",
      "messages": [{"role": "user", "content": "'"$message"'"}]
    }')

  ASSISTANT_MESSAGE=$(echo $RESPONSE | jq -r '.choices[0].message.content')
  echo "🤖 Assistant: $ASSISTANT_MESSAGE"
  echo ""
}

# Test multi-turn conversation
echo "=== Testing Multi-Turn Conversation ==="
echo ""

send_message "1" "What is machine learning?"
send_message "2" "Can you give me a simple example?"
send_message "3" "How is it different from regular programming?"

# View session history
echo "=== Viewing Session History ==="
echo ""
HISTORY=$(curl -s $BASE_URL/sessions/$SESSION_ID)
echo "History for session $SESSION_ID:"
echo $HISTORY | jq '.history[] | "\(.role | ascii_upcase): \(.content)"' | head -20
echo ""

TOTAL_MESSAGES=$(echo $HISTORY | jq '.messageCount')
echo "📊 Total messages in session: $TOTAL_MESSAGES"
echo ""

# Test session cleanup
echo "=== Cleaning Up Session ==="
echo ""
curl -s -X DELETE $BASE_URL/sessions/$SESSION_ID | jq .
echo ""

echo "✅ Session testing completed!"
