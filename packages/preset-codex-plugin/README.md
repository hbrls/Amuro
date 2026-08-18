# Preset Codex Plugin

This is a minimal Codex plugin that demonstrates one capability: rendering
static HTML inside a conversation through MCP Apps.

## Design

- The plugin bundles one MCP server.
- The server exposes one render tool and one HTML resource.
- Codex mounts the HTML resource in an inline iframe when the tool is called.
- The HTML is static and has no JavaScript, interaction, state, or network access.

The plugin intentionally contains no Skills, Hooks, tests, business logic, or
additional MCP tools.

## Python runtime

- The MCP server runs with the host's `python` executable from `PATH`.
- The plugin explicitly inherits `PATH` when Codex starts the stdio server.
- The current implementation uses only the Python standard library.
- Do not create or use a virtual environment for this plugin.
- If the official Python MCP SDK is introduced later, install the `mcp` package
  into the host Python environment. The plugin must continue to run without a
  virtual environment.

## Local development

MCP Apps must be enabled in the Codex host before installing or testing this
plugin:

```powershell
codex features enable enable_mcp_apps
```

Codex caches installed plugins by version. After changing the plugin, increment
the version, reinstall it, restart Codex, and test from a new conversation. If
local changes are still not picked up, temporarily append a cachebuster such as
`0.0.1+codex.<timestamp>` before reinstalling.

## Structure

```text
.codex-plugin/plugin.json  Plugin manifest
.mcp.json                  Bundled MCP server configuration
scripts/server.py          Minimal stdio MCP Apps server
ui/widget.html             Static HTML resource
```
