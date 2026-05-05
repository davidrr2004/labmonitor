#!/usr/bin/env python3
"""
LabMonitor Agent — lightweight system monitoring script.

Collects CPU, memory, and network metrics from the host machine
and sends them to the LabMonitor server at a configurable interval.

Also polls the server for commands (e.g. APP_USAGE_SNAPSHOT, RESTART,
SHUTDOWN) and executes them locally.

Usage:
    python agent.py --server-url http://your-server:8080 --computer-id LAB-CS-001
    python agent.py --server-url http://your-server:8080 --computer-id LAB-CS-001 --interval 15

Requirements:
    pip install psutil
"""

import argparse
import json
import logging
import signal
import sys
import time
import urllib.error
import urllib.request

try:
    import psutil
except ImportError:
    print(
        "ERROR: 'psutil' is required. Install it with:\n"
        "  pip install psutil",
        file=sys.stderr,
    )
    sys.exit(1)

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
logger = logging.getLogger("labmonitor-agent")

_running = True


def _handle_signal(signum, _frame):
    global _running
    logger.info("Received signal %s — shutting down.", signal.Signals(signum).name)
    _running = False


def collect_metrics(prev_net):
    """Return a dict of current system metrics and the raw net counters."""
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory().percent

    net = psutil.net_io_counters()
    net_in = 0.0
    net_out = 0.0
    if prev_net is not None:
        net_in = float(net.bytes_recv - prev_net.bytes_recv)
        net_out = float(net.bytes_sent - prev_net.bytes_sent)

    return {
        "cpu": round(cpu, 2),
        "memory": round(mem, 2),
        "network_in": round(net_in, 2),
        "network_out": round(net_out, 2),
    }, net


def send_metrics(server_url, computer_id, metrics):
    """POST metrics to the LabMonitor server. Returns True on success."""
    payload = {"computer_id": computer_id, **metrics}
    data = json.dumps(payload).encode("utf-8")

    url = f"{server_url.rstrip('/')}/api/v1/resource"
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                logger.debug("Metrics sent successfully.")
                return True
            logger.warning("Server returned status %s.", resp.status)
            return False
    except urllib.error.HTTPError as exc:
        logger.warning("HTTP error %s: %s", exc.code, exc.reason)
        return False
    except urllib.error.URLError as exc:
        logger.warning("Connection error: %s", exc.reason)
        return False
    except Exception as exc:
        logger.warning("Unexpected error sending metrics: %s", exc)
        return False


# ─── Command handling ────────────────────────────────────────────────────────


def poll_commands(server_url, computer_id):
    """Poll the server for queued commands destined for this computer."""
    url = f"{server_url.rstrip('/')}/api/v1/agent/commands/poll"
    payload = json.dumps({"system_id": computer_id}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body.get("commands", [])
    except Exception as exc:
        logger.warning("Failed to poll commands: %s", exc)
        return []


def collect_process_snapshot(top_n=10):
    """Collect the top N processes sorted by CPU usage."""
    procs = []
    for p in psutil.process_iter(attrs=["pid", "name", "username"]):
        try:
            cpu = p.cpu_percent(interval=0)
            mem_mb = p.memory_info().rss / (1024 * 1024)
            procs.append({
                "name": p.info["name"] or "unknown",
                "pid": p.info["pid"],
                "cpu": round(cpu, 2),
                "memory_mb": round(mem_mb, 2),
                "username": p.info.get("username") or "",
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    # Sort by CPU descending, keep top N
    procs.sort(key=lambda x: x["cpu"], reverse=True)
    return procs[:top_n]


def send_app_usage(server_url, system_id, command_id, processes):
    """POST a process snapshot back to the server."""
    url = f"{server_url.rstrip('/')}/api/v1/app-usage"
    payload = {
        "system_id": system_id,
        "command_id": command_id,
        "captured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "processes": processes,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            if resp.status == 200:
                logger.info("App usage snapshot sent successfully.")
                return True
            logger.warning("Server returned status %s for app-usage.", resp.status)
            return False
    except Exception as exc:
        logger.warning("Failed to send app usage snapshot: %s", exc)
        return False


def handle_commands(server_url, computer_id):
    """Poll for commands and dispatch each one."""
    commands = poll_commands(server_url, computer_id)
    if not commands:
        return

    logger.info("Received %d command(s).", len(commands))
    for cmd in commands:
        cmd_type = cmd.get("type", "")
        cmd_id = cmd.get("id", "")
        logger.info("Processing command %s (type=%s)", cmd_id, cmd_type)

        if cmd_type == "APP_USAGE_SNAPSHOT":
            processes = collect_process_snapshot(top_n=10)
            send_app_usage(server_url, computer_id, cmd_id, processes)

        elif cmd_type == "RESTART":
            logger.warning("RESTART command received — stub only, not executing.")
            # Uncomment to actually restart:
            # import subprocess
            # subprocess.run(["shutdown", "-r", "now"])

        elif cmd_type == "SHUTDOWN":
            logger.warning("SHUTDOWN command received — stub only, not executing.")
            # Uncomment to actually shutdown:
            # import subprocess
            # subprocess.run(["shutdown", "-h", "now"])

        else:
            logger.warning("Unknown command type: %s", cmd_type)


# ─── Main loop ───────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="LabMonitor Agent — collect and report system metrics.",
    )
    parser.add_argument(
        "--server-url",
        required=True,
        help="Base URL of the LabMonitor server (e.g. http://192.168.1.10:8080)",
    )
    parser.add_argument(
        "--computer-id",
        required=True,
        help="Computer ID assigned during system registration",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=10,
        help="Seconds between metric reports (default: 10)",
    )
    parser.add_argument(
        "--log-file",
        default=None,
        help="Optional path to a log file",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()

    level = logging.DEBUG if args.verbose else logging.INFO
    handlers = [logging.StreamHandler(sys.stdout)]
    if args.log_file:
        handlers.append(logging.FileHandler(args.log_file))
    logging.basicConfig(level=level, format=LOG_FORMAT, handlers=handlers)

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    logger.info("LabMonitor Agent starting.")
    logger.info("  Server URL : %s", args.server_url)
    logger.info("  Computer ID: %s", args.computer_id)
    logger.info("  Interval   : %ds", args.interval)
    logger.info("Press Ctrl+C to stop.")

    prev_net = psutil.net_io_counters()
    backoff = 0

    while _running:
        # ── Collect and send resource metrics ──
        metrics, prev_net = collect_metrics(prev_net)
        logger.info(
            "CPU=%.1f%%  MEM=%.1f%%  NET_IN=%.0fB  NET_OUT=%.0fB",
            metrics["cpu"],
            metrics["memory"],
            metrics["network_in"],
            metrics["network_out"],
        )

        ok = send_metrics(args.server_url, args.computer_id, metrics)
        if ok:
            backoff = 0
        else:
            backoff = min(backoff + 1, 6)
            extra = 2**backoff
            logger.info("Retrying in %ds (backoff).", extra)
            _sleep(extra)

        # ── Poll for and handle commands ──
        handle_commands(args.server_url, args.computer_id)

        _sleep(args.interval)

    logger.info("Agent stopped.")


def _sleep(seconds):
    """Sleep in small increments so we can respond to shutdown signals quickly."""
    end = time.monotonic() + seconds
    while _running and time.monotonic() < end:
        time.sleep(0.5)


if __name__ == "__main__":
    main()
