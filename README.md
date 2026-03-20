# MCP Server Workspace

This repository serves as a centralized workspace for various Model Context Protocol (MCP) servers and tools. Each project is organized into its own subdirectory with specific instructions and documentation.

## 📂 Repository Structure

- **[rm-012g/](./rm-012g/)**: 
  - **Description**: MCP server for industrial control and monitoring of RM-012G devices.
  - **Features**: Modbus read/write, system status, VPN/Node-RED control.
  
- **[gemini-cli/](./gemini-cli/)**: 
  - **Description**: A collection of tools for interacting with Gemini models.
  - **Components**: Client, server, and MCP implementations.

## 🛠 Usage Overview

To use these servers, point your MCP-enabled application (like Claude Desktop or Gemini) to the corresponding project directory's entry point (usually `index.js`).

### Example Integration (RM-012G)
```json
{
  "mcpServers": {
    "rm012g": {
      "command": "node",
      "args": ["D:/antigravity/MCP-Server/rm-012g/index.js"]
    }
  }
}
```

## 🏗 Development

The projects in this repository utilize Node.js. Each subdirectory has its own `package.json` and dependency list.

---
*Maintained by Suphot-Ch.*
