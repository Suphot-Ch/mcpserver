# Gemini CLI Client

A modern Web interface for interacting with the Gemini CLI via a WebSocket-powered server. Built with **React**, **TypeScript**, and **Vite**, this client provides a smooth, real-time chat experience for various Gemini models.

## ✨ Features

- **Real-time Interaction**: Powered by Socket.io for instant message delivery.
- **Model Management**: Switch between different Gemini models effortlessly.
- **Modern UI**: Clean, responsive design built with React and TypeScript.
- **Terminal Integration**: Designed to work in tandem with the Gemini CLI backend.

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later)

### 2. Installation
```bash
# From the client directory
npm install
```

### 3. Development
```bash
# Start the development server
npm run dev
```

### 4. Build
```bash
# Create a production build
npm run build
```

## ⚙️ Configuration
The client connects to the backend server via a WebSocket connection. Ensure the [Gemini CLI Server](../server/) is running before starting the client.

---
*Part of the Gemini CLI Workspace.*
