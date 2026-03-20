require('dotenv').config({ quiet: true });
// Standard MCP servers must strictly use stdout for the protocol.
// To prevent any third-party library from accidentally logging to stdout,
// we alias console.log to console.error.
console.log = console.error;

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.token');

const API_BASE_URL = process.env.RM012G_API_URL || 'http://192.168.109.200:8080';
let API_TOKEN = process.env.RM012G_API_TOKEN || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  if (API_TOKEN) {
    config.headers.Authorization = `Bearer ${API_TOKEN}`;
  }
  return config;
});

function loadToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      API_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
      console.error('Loaded persistent token from file.');
    }
  } catch (error) {
    console.error('Error loading token:', error.message);
  }
}

function saveToken(token) {
  try {
    fs.writeFileSync(TOKEN_FILE, token, 'utf8');
    API_TOKEN = token;
  } catch (error) {
    console.error('Error saving token:', error.message);
  }
}

const server = new Server(
  {
    name: 'rm-012g-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools = [
  {
    name: 'login',
    description: 'Login to RM-012G and get session token',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['username', 'password'],
    },
  },
  {
    name: 'get_system_status',
    description: 'Get RM-012G system status and version',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_devices',
    description: 'Get list of configured Modbus devices',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_tags',
    description: 'Get list of configured Modbus tags',
    inputSchema: {
        type: 'object',
        properties: {
            port: { type: 'string', description: 'Port name (optional)' },
            device: { type: 'string', description: 'Device name (optional)' }
        }
    },
  },
  {
    name: 'write_tag',
    description: 'Write value to a Modbus tag',
    inputSchema: {
      type: 'object',
      properties: {
        port: { type: 'string' },
        device: { type: 'string' },
        tag: { type: 'string' },
        value: { type: 'number' },
        type: { type: 'string', enum: ['U_INT16', 'INT16', 'U_INT32', 'INT32', 'FLOAT32'], default: 'U_INT16' },
      },
      required: ['port', 'device', 'tag', 'value'],
    },
  },
  {
    name: 'get_mqtt_status',
    description: 'Get MQTT Broker service status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'control_mqtt_service',
    description: 'Start, Stop or Restart MQTT Broker',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop', 'restart'] },
      },
      required: ['action'],
    },
  },
  {
    name: 'get_node_red_status',
    description: 'Get Node-RED service status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'control_node_red',
    description: 'Start, Stop or Restart Node-RED service',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop', 'restart'] },
      },
      required: ['action'],
    },
  },
  {
    name: 'get_network_status',
    description: 'Get current network interfaces and status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'scan_network',
    description: 'Scan network for Modbus devices',
    inputSchema: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'IP range to scan (e.g. 192.168.1.0/24)' },
        port: { type: 'string', description: 'Port range to scan (e.g. 502-602)' },
      },
      required: ['ip', 'port'],
    },
  },
  {
    name: 'list_csv_files',
    description: 'List all CSV data files in the data directory',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'read_csv_file',
    description: 'Read content of a specific CSV file',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Relative path to CSV file (e.g. /2025/01/data.csv)' },
      },
      required: ['file'],
    },
  },
  {
    name: 'get_vpn_status',
    description: 'Get status of OpenVPN and WireGuard',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'control_vpn',
    description: 'Connect, Disconnect or Reconnect VPN',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['openvpn', 'wireguard'] },
        action: { type: 'string', enum: ['connect', 'disconnect', 'reconnect'] },
        clientName: { type: 'string', description: 'Config file name (e.g. client.ovpn or wg0.conf)' },
      },
      required: ['type', 'action', 'clientName'],
    },
  },
  {
    name: 'get_mqtt_client_prisoft',
    description: 'Get MQTT Client Prisoft settings',
    inputSchema: { type: 'object', properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'login': {
        const response = await apiClient.post('/api/users/login', {
          username: args.username,
          password: args.password,
        });
        if (response.data && response.data.token) {
          saveToken(response.data.token);
          return { content: [{ type: 'text', text: `Login successful. Token acquired and persisted.` }] };
        }
        return { content: [{ type: 'text', text: `Login failed: ${JSON.stringify(response.data)}` }], isError: true };
      }

      case 'get_system_status': {
        const [vResponse, hResponse, tResponse] = await Promise.all([
          apiClient.get('/api/system/version'),
          apiClient.get('/api/system/hostname'),
          apiClient.get('/api/datetime'),
        ]);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ version: vResponse.data, hostname: hResponse.data, time: tResponse.data }, null, 2)
          }],
        };
      }

      case 'get_devices': {
        const response = await apiClient.get('/api/device');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_tags': {
        let url = '/api/tag';
        if (args.port && args.device) {
            url = `/api/tag/${args.port}/${args.device}`;
        } else if (args.port) {
            url = `/api/tag/${args.port}`;
        }
        const response = await apiClient.get(url);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'write_tag': {
        const response = await apiClient.post(`/api/tag/write/${args.port}/${args.device}/${args.tag}`, {
          type: args.type || 'U_INT16',
          value: args.value,
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_mqtt_status': {
        const response = await apiClient.get('/api/mqtt/broker/status');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'control_mqtt_service': {
        const response = await apiClient.post(`/api/mqtt/broker/${args.action}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_node_red_status': {
        const response = await apiClient.get('/api/nodered/status');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'control_node_red': {
        const response = await apiClient.post(`/api/nodered/${args.action}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_network_status': {
        const [status, config, interfaceStatus] = await Promise.all([
          apiClient.get('/api/network/status'),
          apiClient.get('/api/network/configall'),
          apiClient.get('/api/interface/status'),
        ]);
        return { content: [{ type: 'text', text: JSON.stringify({ status: status.data, config: config.data, interfaces: interfaceStatus.data }, null, 2) }] };
      }

      case 'scan_network': {
        const response = await apiClient.post('/api/network/tools/scan', {
          ip: args.ip,
          port: args.port,
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'list_csv_files': {
        const response = await apiClient.get('/api/files/csv/list');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'read_csv_file': {
        const response = await apiClient.get('/api/files/csv/file', { params: { file: args.file } });
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_vpn_status': {
        const [ovpn, wg] = await Promise.all([
          apiClient.get('/api/vpn/openvpn'),
          apiClient.get('/api/vpn/wireguard'),
        ]);
        return { content: [{ type: 'text', text: JSON.stringify({ openvpn: ovpn.data, wireguard: wg.data }, null, 2) }] };
      }

      case 'control_vpn': {
        const url = args.type === 'openvpn' 
            ? `/api/vpn/openvpn/active/${args.action}`
            : `/api/vpn/wireguard/active/${args.action}`;
        const response = await apiClient.post(url, { clientName: args.clientName });
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_mqtt_client_prisoft': {
        const response = await apiClient.get('/api/mqtt/prisoft');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error.response ? JSON.stringify(error.response.data) : error.message;
    return {
      content: [{ type: 'text', text: `Error calling ${name}: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  loadToken();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
