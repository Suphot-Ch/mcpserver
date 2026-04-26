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

let currentBaseUrl = process.env.RM012G_API_URL || 'http://192.168.109.200:8080';
let API_TOKEN = process.env.RM012G_API_TOKEN || '';

const apiClient = axios.create({
  baseURL: currentBaseUrl,
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
    name: 'set_base_url',
    description: 'Change the base URL (IP address) of the RM-012G device dynamically',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'New base URL (e.g. http://192.168.1.100:8080)' }
      },
      required: ['url'],
    },
  },
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
  {
    name: 'set_network_config',
    description: 'Update network interface configuration (IP, Netmask, Gateway, DNS)',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Interface name (e.g., eth0, wlan0)' },
        proto: { type: 'string', enum: ['static', 'dhcp'], description: 'Protocol (dhcp or static)' },
        ipaddr: { type: 'string', description: 'IP address (required for static)' },
        netmask: { type: 'string', description: 'Netmask (required for static)' },
        gateway: { type: 'string', description: 'Gateway (optional for static)' },
        dns: { type: 'string', description: 'DNS server (optional)' },
      },
      required: ['interface', 'proto'],
    },
  },
  {
    name: 'get_wifi_status',
    description: 'Get Wifi connection status and scanned networks',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'config_wifi',
    description: 'Configure Wifi connection (SSID, Password)',
    inputSchema: {
      type: 'object',
      properties: {
        ssid: { type: 'string' },
        password: { type: 'string' },
        encryption: { type: 'string', enum: ['none', 'psk', 'psk2'], default: 'psk2' },
      },
      required: ['ssid'],
    },
  },
  {
    name: 'reboot',
    description: 'Reboot the RM-012G device',
    inputSchema: { type: 'object', properties: {} },
  },
  // --- New Alarm Tools ---
  {
    name: 'get_alarms',
    description: 'Get list of configured alarms',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_alarm',
    description: 'Create a new alarm configuration',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        message: { type: 'string' },
        condition_port: { type: 'number' },
        condition_device: { type: 'string' },
        condition_tag: { type: 'string' },
        condition_operate: { type: 'string' },
        condition_compare: { type: 'string' },
        compare_value: { type: 'number' },
        line_notifly: { type: 'string', enum: ['enable', 'disable'] },
        telegram: { type: 'string', enum: ['enable', 'disable'] },
      },
      required: ['name', 'message', 'condition_port', 'condition_device', 'condition_tag', 'condition_operate'],
    },
  },
  {
    name: 'delete_alarm',
    description: 'Delete an alarm by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id'],
    },
  },
  {
    name: 'get_alarm_logs',
    description: 'Get alarm logs',
    inputSchema: { type: 'object', properties: {} },
  },
  // --- New Modbus Device Tools ---
  {
    name: 'create_device',
    description: 'Create a new Modbus device',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        port_id: { type: 'number' },
        address: { type: 'number' },
        model: { type: 'string' },
        enable: { type: 'string', enum: ['enable', 'disable'] },
        timeout: { type: 'number' },
        betweenpoll: { type: 'number' },
      },
      required: ['name', 'port_id', 'address', 'model'],
    },
  },
  {
    name: 'delete_device',
    description: 'Delete a Modbus device by name and port',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        port: { type: 'string' },
      },
      required: ['name', 'port'],
    },
  },
  {
    name: 'get_device_models',
    description: 'Get available device models for a specific port',
    inputSchema: {
      type: 'object',
      properties: { port: { type: 'string' } },
      required: ['port'],
    },
  },
  // --- New Modbus Port Tools ---
  {
    name: 'get_modbus_ports',
    description: 'Get list of configured Modbus ports',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_physical_ports',
    description: 'Get list of physical serial ports (e.g. COM1, /dev/ttyS0)',
    inputSchema: { type: 'object', properties: {} },
  },
  // --- New MQTT Admin Tools ---
  {
    name: 'manage_mqtt_users',
    description: 'Manage MQTT Broker users',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'remove', 'passwd', 'list'] },
        user: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'get_mqtt_config',
    description: 'Get current MQTT Broker configuration',
    inputSchema: { type: 'object', properties: {} },
  },
  // --- New Notification Tools ---
  {
    name: 'get_notifications',
    description: 'Get list of notification targets (Notifly)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'send_test_notification',
    description: 'Send a test notification message',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['line_notifly', 'telegram'] },
        token: { type: 'string' },
        text: { type: 'string' },
        room: { type: 'string' },
      },
      required: ['type', 'token', 'text'],
    },
  },
  // --- New Polling Status ---
  {
    name: 'get_poll_status',
    description: 'Get real-time polling status for devices or tags',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', enum: ['device', 'tags'], default: 'device' },
      },
    },
  },
  // --- New Event Log ---
  {
    name: 'get_event_logs',
    description: 'Get system event logs with optional time range and limit',
    inputSchema: {
      type: 'object',
      properties: {
        start: { type: 'string', description: 'Start time (YYYY-MM-DD HH:mm:ss)' },
        end: { type: 'string', description: 'End time (YYYY-MM-DD HH:mm:ss)' },
        limit: { type: 'number', default: 100 },
        order: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
      },
    },
  },
  // --- Advanced Node-RED ---
  {
    name: 'manage_node_red_settings',
    description: 'Manage advanced Node-RED settings (port, bind IP)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['port', 'bind', 'reset'] },
        value: { type: 'string', description: 'Port number or IP address' },
      },
      required: ['action'],
    },
  },
  // --- OffAlarm ---
  {
    name: 'manage_offalarm',
    description: 'Manage OffAlarm service (status, config, control)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'start', 'stop', 'restart', 'enable', 'disable', 'log'] },
        lines: { type: 'number', description: 'Number of log lines to read' },
      },
      required: ['action'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'set_base_url': {
        currentBaseUrl = args.url;
        apiClient.defaults.baseURL = currentBaseUrl;
        return { content: [{ type: 'text', text: `Base URL successfully changed to ${currentBaseUrl}` }] };
      }

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
      
      case 'set_network_config': {
        const response = await apiClient.post('/api/network/config', args);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'get_wifi_status': {
        const [status, scan] = await Promise.all([
          apiClient.get('/api/wifi/status'),
          apiClient.get('/api/wifi/scan'),
        ]);
        return { content: [{ type: 'text', text: JSON.stringify({ status: status.data, scan: scan.data }, null, 2) }] };
      }

      case 'config_wifi': {
        const response = await apiClient.post('/api/wifi/config', args);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      case 'reboot': {
        const response = await apiClient.post('/api/system/reboot');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Alarms ---
      case 'get_alarms': {
        const response = await apiClient.get('/api/alarm');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'create_alarm': {
        const response = await apiClient.post('/api/alarm', args);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'delete_alarm': {
        const response = await apiClient.delete(`/api/alarm/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'get_alarm_logs': {
        const response = await apiClient.get('/api/alarm/log');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Devices ---
      case 'create_device': {
        const response = await apiClient.post('/api/device', args);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'delete_device': {
        const response = await apiClient.delete(`/api/device/${args.name}/${args.port}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'get_device_models': {
        const response = await apiClient.get(`/api/device/port/${args.port}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Ports ---
      case 'get_modbus_ports': {
        const response = await apiClient.get('/api/modbus');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'get_physical_ports': {
        const response = await apiClient.get('/api/modbus/portlist');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- MQTT Admin ---
      case 'manage_mqtt_users': {
        let url = '/api/mqtt/broker/users';
        let method = 'get';
        if (args.action === 'add') { url = '/api/mqtt/broker/user/add'; method = 'post'; }
        else if (args.action === 'remove') { url = '/api/mqtt/broker/user/remove'; method = 'post'; }
        else if (args.action === 'passwd') { url = '/api/mqtt/broker/user/passwd'; method = 'post'; }
        
        const response = method === 'get' 
            ? await apiClient.get(url) 
            : await apiClient.post(url, { user: args.user, password: args.password });
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'get_mqtt_config': {
        const response = await apiClient.get('/api/mqtt/broker/config/get');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Notifications ---
      case 'get_notifications': {
        const response = await apiClient.get('/api/notifly');
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }
      case 'send_test_notification': {
        const response = await apiClient.post('/api/notifly/send', args);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Polling ---
      case 'get_poll_status': {
        const url = args.target === 'tags' ? '/api/poll/status/tags' : '/api/poll/status/device';
        const response = await apiClient.get(url);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Event Log ---
      case 'get_event_logs': {
        const response = await apiClient.get('/api/event_log', { params: args });
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- Node-RED Advanced ---
      case 'manage_node_red_settings': {
        const url = `/api/nodered/${args.action}`;
        const data = args.action === 'port' ? { port: parseInt(args.value) } : { ip: args.value };
        const response = args.action === 'reset' ? await apiClient.post('/api/nodered/resetsettings') : await apiClient.post(url, data);
        return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
      }

      // --- OffAlarm ---
      case 'manage_offalarm': {
        const url = `/api/offalarm/${args.action}`;
        const response = ['status', 'log'].includes(args.action) 
            ? await apiClient.get(url, { params: { lines: args.lines } })
            : await apiClient.post(url);
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
