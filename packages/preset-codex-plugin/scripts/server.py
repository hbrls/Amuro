#!/usr/bin/env python3
"""Serve one static MCP Apps UI over stdio."""

import json
import sys
from pathlib import Path
from urllib.parse import urlsplit


PROTOCOL_VERSION = "2025-06-18"
SERVER_VERSION = "0.0.1"
RESOURCE_URI = "ui://preset-codex/widget.html"
RESOURCE_MIME_TYPE = "text/html;profile=mcp-app"

TOOL = {
    "name": "show_ui",
    "title": "Show Preset Codex Plugin UI",
    "description": "Display the Preset Codex Plugin's static HTML UI.",
    "inputSchema": {
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    },
    "_meta": {
        "ui": {
            "resourceUri": RESOURCE_URI,
            "visibility": ["model"],
        }
    },
}


def send(request_id, payload, *, is_error=False):
    key = "error" if is_error else "result"
    message = {"jsonrpc": "2.0", "id": request_id, key: payload}
    sys.stdout.write(json.dumps(message, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def handle(message):
    method = message.get("method")
    request_id = message.get("id")

    # Notifications, including `notifications/initialized`, do not receive a reply.
    if request_id is None:
        return

    if method == "initialize":
        send(
            request_id,
            {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"subscribe": False, "listChanged": False},
                },
                "serverInfo": {
                    "name": "preset-codex-plugin",
                    "version": SERVER_VERSION,
                },
            },
        )
    elif method == "ping":
        send(request_id, {})
    elif method == "tools/list":
        send(request_id, {"tools": [TOOL]})
    elif method == "resources/list":
        send(
            request_id,
            {
                "resources": [
                    {
                        "uri": RESOURCE_URI,
                        "name": "Preset Codex Plugin widget",
                        "mimeType": RESOURCE_MIME_TYPE,
                    }
                ]
            },
        )
    elif method == "resources/read":
        uri = (message.get("params") or {}).get("uri")
        if uri != RESOURCE_URI:
            send(
                request_id,
                {"code": -32602, "message": f"Unknown resource: {uri}"},
                is_error=True,
            )
            return
        resource_name = Path(urlsplit(uri).path).name
        send(
            request_id,
            {
                "contents": [
                    {
                        "uri": RESOURCE_URI,
                        "mimeType": RESOURCE_MIME_TYPE,
                        "text": (
                            Path(__file__).resolve().parents[1]
                            / "ui"
                            / resource_name
                        ).read_text(encoding="utf-8"),
                        "_meta": {
                            "ui": {
                                "prefersBorder": True,
                                "csp": {
                                    "connectDomains": [],
                                    "resourceDomains": [],
                                },
                            }
                        },
                    }
                ]
            },
        )
    elif method == "tools/call":
        name = (message.get("params") or {}).get("name")
        if name != "show_ui":
            send(
                request_id,
                {"code": -32602, "message": f"Unknown tool: {name}"},
                is_error=True,
            )
            return
        send(
            request_id,
            {
                "content": [
                    {
                        "type": "text",
                        "text": "Static UI ready.",
                    }
                ],
                "isError": False,
            },
        )
    else:
        send(
            request_id,
            {"code": -32601, "message": f"Method not found: {method}"},
            is_error=True,
        )


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(message, dict):
            handle(message)


if __name__ == "__main__":
    main()
