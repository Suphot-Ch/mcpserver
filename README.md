# RM-012G MCP Server

This MCP server provides tools to control and monitor the RM-012G device via its REST API.

## Setup

1. **Environment Variables**:
   Create a `.env` file in the project directory or set these in your environment:
   ```env
   RM012G_API_URL=http://192.168.109.200:8080
   RM012G_API_TOKEN=your_jwt_token_here (optional, can also use login tool)
   ```

2. **Integration with Gemini/Claude**:
   Add the server to your MCP configuration:
   ```json
   {
     "mcpServers": {
       "rm012g": {
         "command": "node",
         "args": ["d:/antigravity/rm012g/mcp-server-rm012g/index.js"],
         "env": {
           "RM012G_API_URL": "http://192.168.109.200:8080"
         }
       }
     }
   }
   ```

## Available Tools

- **Auth**: `login`
- **System**: `get_system_status`, `get_network_status`, `scan_network`
- **Modbus**: `get_devices`, `get_tags`, `write_tag`
- **MQTT**: `get_mqtt_status`, `control_mqtt_service`, `get_mqtt_client_prisoft`
- **Node-RED**: `get_node_red_status`, `control_node_red`
- **Files**: `list_csv_files`, `read_csv_file`
- **VPN**: `get_vpn_status`, `control_vpn`

## Development

Install dependencies:
```bash
npm install
```

Run directly for testing (stdio):
```bash
node index.js
```
