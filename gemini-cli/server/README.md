# Gemini CLI Server

The backend core of the Gemini CLI Workspace, providing a robust REST API and WebSocket interface for seamless communication with Gemini models. Built with **Node.js**, **Express**, and **Socket.io**, it features real-time interaction and full Swagger documentation.

## ✨ Features

- **REST API**: Comprehensive endpoints for chatting, listing models, and more.
- **WebSocket Interaction**: Real-time message streaming for a smooth chat experience.
- **Swagger Documentation**: Interactive API testing and exploration via Swagger UI.
- **CORS Support**: Securely integrable with various frontend clients.

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or later)

### 2. Installation
```bash
# From the server directory
npm install
```

### 3. Usage
```bash
# Start the server
npm start
```

## 🔌 API Documentation

Once the server is running, access the interactive Swagger documentation at:
`http://localhost:3000/api-docs`

### Core Endpoints
- `POST /api/chat`: Send a message to Gemini.
- `GET /api/models`: List available Gemini models.

## 🛠 Tech Stack
- **Framework**: Express.js
- **Real-time**: Socket.io
- **API Docs**: Swagger / OpenAPI 3.0
- **Cross-Origin**: CORS middleware

---
*Part of the Gemini CLI Workspace.*
