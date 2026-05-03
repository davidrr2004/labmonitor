#!/usr/bin/env python3
"""
Lab Monitor Agent — Standalone system metrics collector.

Collects CPU, memory, and network usage from /proc and sends
metrics to the Lab Monitor backend via HTTP.

Usage:
    python3 monitor.py --server http://localhost:8080 --college "My College" --lab "Lab A"

No external dependencies required — uses Python standard library only.
"""

import argparse
import json
import os
import platform
import socket
import time
import urllib.request
import urllib.error


def read_proc_stat():
    """Read /proc/stat and return CPU times."""
    with open("/proc/stat") as f:
        line = f.readline()
    parts = line.split()
    return [int(x) for x in parts[1:]]


def cpu_percent(interval=1.0):
    """Calculate CPU usage percentage over an interval."""
    try:
        t1 = read_proc_stat()
        time.sleep(interval)
        t2 = read_proc_stat()
        d = [b - a for a, b in zip(t1, t2)]
        total = sum(d)
        if total == 0:
            return 0.0
        idle = d[3]
        return round((1 - idle / total) * 100, 2)
    except FileNotFoundError:
        return 0.0


def memory_percent():
    """Read memory usage from /proc/meminfo."""
    try:
        info = {}
        with open("/proc/meminfo") as f:
            for line in f:
                parts = line.split()
                info[parts[0].rstrip(":")] = int(parts[1])
        total = info.get("MemTotal", 1)
        avail = info.get("MemAvailable", info.get("MemFree", 0))
        return round((1 - avail / total) * 100, 2)
    except FileNotFoundError:
        return 0.0


def network_bytes():
    """Read total network bytes from /proc/net/dev."""
    try:
        rx, tx = 0, 0
        with open("/proc/net/dev") as f:
            for line in f:
                if ":" not in line:
                    continue
                iface, data = line.split(":")
                iface = iface.strip()
                if iface == "lo":
                    continue
                parts = data.split()
                rx += int(parts[0])
                tx += int(parts[8])
        return rx, tx
    except FileNotFoundError:
        return 0, 0


def post_json(url, data):
    """Send JSON data via HTTP POST."""
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP {e.code}: {err_body}")
        raise
    except urllib.error.URLError as e:
        print(f"  Connection error: {e.reason}")
        raise


def register_system(server, college, lab_name):
    """Register this system with the backend and return the computer_id."""
    url = f"{server}/api/v1/system-signup"
    data = {"college": college, "lab_name": lab_name}
    print(f"Registering system at {url} ...")
    result = post_json(url, data)
    system_id = result.get("system_id", "")
    print(f"  Registered with system_id: {system_id}")
    return system_id


def send_metrics(server, computer_id, cpu, mem, net_in, net_out):
    """Send metrics to the backend."""
    url = f"{server}/api/v1/resource"
    data = {
        "computer_id": computer_id,
        "cpu": cpu,
        "memory": mem,
        "network_in": net_in,
        "network_out": net_out,
    }
    post_json(url, data)


def main():
    parser = argparse.ArgumentParser(description="Lab Monitor Agent")
    parser.add_argument("--server", default="http://localhost:8080", help="Backend server URL")
    parser.add_argument("--college", default="Default College", help="College name for registration")
    parser.add_argument("--lab", default="Default Lab", help="Lab name for registration")
    parser.add_argument("--interval", type=int, default=10, help="Seconds between metric reports")
    args = parser.parse_args()

    server = args.server.rstrip("/")
    hostname = socket.gethostname()

    print(f"=== Lab Monitor Agent ===")
    print(f"Host:     {hostname}")
    print(f"OS:       {platform.system()} {platform.release()}")
    print(f"Server:   {server}")
    print(f"College:  {args.college}")
    print(f"Lab:      {args.lab}")
    print(f"Interval: {args.interval}s")
    print()

    # Register system
    while True:
        try:
            computer_id = register_system(server, args.college, args.lab)
            break
        except Exception as e:
            print(f"  Registration failed: {e}")
            print(f"  Retrying in 5s ...")
            time.sleep(5)

    # Metric collection loop
    prev_rx, prev_tx = network_bytes()
    prev_time = time.time()

    print(f"\nCollecting metrics every {args.interval}s (Ctrl+C to stop)\n")

    while True:
        try:
            cpu = cpu_percent(interval=1.0)
            mem = memory_percent()

            cur_rx, cur_tx = network_bytes()
            cur_time = time.time()
            elapsed = cur_time - prev_time
            if elapsed > 0:
                net_in = (cur_rx - prev_rx) / elapsed
                net_out = (cur_tx - prev_tx) / elapsed
            else:
                net_in, net_out = 0.0, 0.0

            prev_rx, prev_tx = cur_rx, cur_tx
            prev_time = cur_time

            print(
                f"[{time.strftime('%H:%M:%S')}] "
                f"CPU: {cpu:.1f}%  MEM: {mem:.1f}%  "
                f"NET-IN: {net_in:.0f} B/s  NET-OUT: {net_out:.0f} B/s"
            )

            try:
                send_metrics(server, computer_id, cpu, mem, net_in, net_out)
            except Exception as e:
                print(f"  Failed to send metrics: {e}")

            time.sleep(max(0, args.interval - 1))

        except KeyboardInterrupt:
            print("\nAgent stopped.")
            break


if __name__ == "__main__":
    main()
