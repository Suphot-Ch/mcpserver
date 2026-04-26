# RM-012G MCP Server

An advanced Model Context Protocol (MCP) server for controlling and monitoring **RM-012G** devices via their REST API.

## ✨ Key Features

- **Industrial Control**: Real-time Modbus tag reading/writing.
- **Alarm Management**: Configure and monitor alarms, read alarm logs.
- **Modbus Connectivity**: Manage physical ports, devices, and poll status.
- **System Management**: Monitor status, network interfaces, and system logs.
- **Service Control**: Manage Node-RED, MQTT Broker, VPN, and OffAlarm services.
- **Data Access**: List and read CSV and Log data files.
- **Network Tools**: Perform network scans to discover Modbus devices.

## 🛠 Available Tool Categories

| Category | Description |
| :--- | :--- |
| **Authentication & Connection** | `login`, `set_base_url` |
| **Alarms** | `get_alarms`, `create_alarm`, `delete_alarm`, `get_alarm_logs` |
| **Modbus Devices** | `get_devices`, `create_device`, `delete_device`, `get_device_models` |
| **Modbus Ports** | `get_modbus_ports`, `get_physical_ports`, `write_tag`, `get_tags` |
| **MQTT** | `get_mqtt_status`, `control_mqtt_service`, `manage_mqtt_users`, `get_mqtt_config` |
| **Network** | `get_network_status`, `set_network_config`, `scan_network`, `get_wifi_status`, `config_wifi` |
| **Node-RED** | `get_node_red_status`, `control_node_red`, `manage_node_red_settings` |
| **Files** | `list_csv_files`, `read_csv_file`, `list_log_files`, `read_log_file` |
| **System** | `get_system_status`, `get_event_logs`, `reboot`, `get_poll_status` |
| **Notification** | `get_notifications`, `send_test_notification` |
| **OffAlarm** | `manage_offalarm` |

## 🚀 Setup

Refer to the root [README](../README.md) for global configuration.

### 1. Configuration
Create a `.env` file in this directory:

```env
RM012G_API_URL=http://your-device-ip:8080
RM012G_API_TOKEN=your_jwt_token_here (optional)
```

### 2. Run
```bash
node index.js
```
