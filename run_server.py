#!/usr/bin/env python3
"""
Sielsoord Website — Local Dev Server
=====================================
Starts a local HTTP server for the Sielsoord static website,
opens it in the default browser, and serves until you press Ctrl+C.

Usage:
    python3 run_server.py              # default port 8765
    python3 run_server.py --port 9000  # custom port
    python3 run_server.py --no-open    # don't auto-open browser
"""

import argparse
import http.server
import socketserver
import webbrowser
import socket
import sys
import os
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────
DEFAULT_PORT = 8765
SERVE_DIR = Path(__file__).resolve().parent  # serve from where the script lives
# ────────────────────────────────────────────────────────────────

BANNER = r"""
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║        ⛰️  SIELSOORD  —  Dev Server  🦅          ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
"""


def find_free_port(preferred: int) -> int:
    """Try the preferred port; if taken, walk up to find a free one."""
    for port in range(preferred, preferred + 20):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("", port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"No free port found near {preferred}")


def main():
    parser = argparse.ArgumentParser(description="Sielsoord local dev server")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT,
                        help=f"Port number (default {DEFAULT_PORT})")
    parser.add_argument("--no-open", action="store_true",
                        help="Don't auto-open the browser")
    args = parser.parse_args()

    port = find_free_port(args.port)
    os.chdir(SERVE_DIR)

    handler = http.server.SimpleHTTPRequestHandler
    # Silence default logging unless you want it — uncomment next line for noisy logs
    # handler.__init__ = lambda self, *a, **kw: http.server.SimpleHTTPRequestHandler.__init__(self, *a, directory=str(SERVE_DIR), **kw)

    url = f"http://localhost:{port}"

    print(BANNER)
    print(f"  📂  Serving:  {SERVE_DIR}")
    print(f"  🌐  URL:      {url}")
    print(f"  🚪  Stop:     press Ctrl+C")
    print()

    if not args.no_open:
        print("  Opening browser…")
        webbrowser.open(url)

    print("\n  " + "─" * 50)
    print(f"  Serving Sielsoord on port {port}  —  Ctrl+C to stop\n")

    try:
        with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n  ⛔  Server stopped.  Gaai sag, baas!  👋\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
