# LabMonitor Agent

A lightweight Python script that collects system metrics (CPU, memory, network) and sends them to the LabMonitor server.

## Requirements

- Python 3.7+
- `psutil` library

## Quick Start

### 1. Register your system

Before running the agent, register the lab computer with the server:

```bash
curl -X POST http://YOUR_SERVER:8080/api/v1/system-signup \
  -H "Content-Type: application/json" \
  -d '{"college": "Computer Science", "lab_name": "Lab A"}'
```

This returns a `system_id` — use it as the `--computer-id` below.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the agent

```bash
python agent.py \
  --server-url http://YOUR_SERVER:8080 \
  --computer-id LAB-CS-001 \
  --interval 10
```

## Options

| Flag | Required | Default | Description |
|---|---|---|---|
| `--server-url` | Yes | — | Base URL of the LabMonitor server |
| `--computer-id` | Yes | — | ID returned from system registration |
| `--interval` | No | 10 | Seconds between metric reports |
| `--log-file` | No | — | Path to write logs to a file |
| `--verbose` | No | — | Enable debug-level logging |

## Running as a Service

### Linux (systemd)

Create `/etc/systemd/system/labmonitor-agent.service`:

```ini
[Unit]
Description=LabMonitor Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/labmonitor/agent.py --server-url http://YOUR_SERVER:8080 --computer-id LAB-CS-001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now labmonitor-agent
```

### Windows (Task Scheduler)

1. Open Task Scheduler.
2. Create a new task that runs `python agent.py --server-url ... --computer-id ...` at login.
3. Set it to restart on failure.

## Collected Metrics

| Metric | Unit | Description |
|---|---|---|
| CPU | % | Overall CPU utilization |
| Memory | % | Physical memory usage |
| Network In | bytes/interval | Bytes received since last report |
| Network Out | bytes/interval | Bytes sent since last report |
