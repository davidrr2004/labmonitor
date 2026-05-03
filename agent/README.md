# Lab Monitor Agent

A standalone Python script that collects system metrics (CPU, memory, network) and sends them to the Lab Monitor backend.

## Features

- **Zero dependencies** — uses only Python standard library
- Reads metrics from `/proc` (Linux)
- Auto-registers with the backend on first run
- Sends metrics at a configurable interval (default: 10 seconds)
- Generates alerts when CPU > 90% or Memory > 90%

## Usage

```bash
python3 monitor.py --server http://your-server:8080 --college "My College" --lab "Lab A"
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--server` | `http://localhost:8080` | Backend server URL |
| `--college` | `Default College` | College name for system registration |
| `--lab` | `Default Lab` | Lab name for system registration |
| `--interval` | `10` | Seconds between metric reports |

## Requirements

- Python 3.6+
- Linux (reads from `/proc`)
- Network access to the Lab Monitor backend

## How It Works

1. On startup, the agent registers itself with the backend via `POST /api/v1/system-signup`
2. It receives a unique `computer_id` from the backend
3. Every `--interval` seconds, it collects CPU, memory, and network metrics
4. Metrics are sent to `POST /api/v1/resource`
5. The backend automatically generates alerts when thresholds are exceeded (CPU > 90%, Memory > 90%)
