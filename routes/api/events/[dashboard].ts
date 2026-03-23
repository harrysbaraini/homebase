/**
 * SSE Events Endpoint
 *
 * Server-Sent Events stream for real-time dashboard updates.
 * Watches for file changes and broadcasts to connected clients.
 */

import { Handlers } from "$fresh/server.ts";
import { debounce } from "@std/async/debounce";
import { join, extname, isAbsolute, dirname } from "@std/path";
import { getConfigDir, getDashboardsDir, loadDashboard } from "../../../src/lib/config.ts";
import { renderMarkdown } from "../../../src/lib/markdown.ts";

// Track active connections per dashboard
const connections = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

// Encoder for SSE messages
const encoder = new TextEncoder();

/**
 * Format an SSE message
 */
function formatSSE(event: string, data: unknown): Uint8Array {
  const json = JSON.stringify(data);
  return encoder.encode(`event: ${event}\ndata: ${json}\n\n`);
}

/**
 * Send heartbeat to keep connection alive
 */
function sendHeartbeat(controller: ReadableStreamDefaultController<Uint8Array>) {
  try {
    controller.enqueue(formatSSE("heartbeat", { timestamp: Date.now() }));
  } catch {
    // Connection closed
  }
}

/**
 * Broadcast event to all connections for a dashboard
 */
function broadcast(dashboard: string, event: string, data: unknown) {
  const dashboardConnections = connections.get(dashboard);
  if (!dashboardConnections) return;

  const message = formatSSE(event, data);
  for (const controller of dashboardConnections) {
    try {
      controller.enqueue(message);
    } catch {
      // Connection closed, will be cleaned up
      dashboardConnections.delete(controller);
    }
  }
}

/**
 * Start file watcher for a dashboard
 */
async function startWatcher(dashboard: string) {
  const configDir = getConfigDir();
  const dashboardsDir = getDashboardsDir();

  // Paths to watch
  const watchPaths = [
    join(dashboardsDir, `${dashboard}.yaml`),
    join(dashboardsDir, `${dashboard}.yml`),
    configDir, // Watch for markdown file changes
  ];

  // Also watch directories containing absolute-path markdown files
  try {
    const config = await loadDashboard(dashboard);
    for (const widget of config.widgets) {
      if (widget.type === "markdown" && widget.settings?.file) {
        const file = widget.settings.file as string;
        if (isAbsolute(file)) {
          const dir = dirname(file);
          if (!watchPaths.includes(dir)) {
            watchPaths.push(dir);
          }
        }
      }
    }
  } catch {
    // Dashboard load failed - just watch the default paths
  }

  // Debounced handler to avoid multiple events for single change
  const handleChange = debounce((event: Deno.FsEvent) => {
    const path = event.paths[0];
    if (!path) return;

    const ext = extname(path);

    // Dashboard YAML changed - trigger full reload
    if (ext === ".yaml" || ext === ".yml") {
      if (path.includes(dashboard)) {
        console.log(`[SSE] Dashboard config changed: ${dashboard}`);
        broadcast(dashboard, "dashboard:reload", { reason: "config_changed" });
      }
      return;
    }

    // Markdown file changed - update specific widget
    if (ext === ".md") {
      handleMarkdownChange(dashboard, path);
    }
  }, 200);

  try {
    const watcher = Deno.watchFs(watchPaths, { recursive: true });

    for await (const event of watcher) {
      if (event.kind === "modify" || event.kind === "create") {
        handleChange(event);
      }
    }
  } catch (error) {
    console.error(`[SSE] Watcher error for ${dashboard}:`, error);
  }
}

/**
 * Handle markdown file change
 */
async function handleMarkdownChange(dashboard: string, filePath: string) {
  const configDir = getConfigDir();

  // Get relative path from config dir (for relative-path widgets)
  const relativePath = filePath.startsWith(configDir + "/")
    ? filePath.replace(configDir + "/", "")
    : null;

  console.log(`[SSE] Markdown file changed: ${filePath}`);

  try {
    const content = await Deno.readTextFile(filePath);
    const html = await renderMarkdown(content);

    // Broadcast both the absolute path and relative path so widgets
    // using either form can match
    broadcast(dashboard, "widget:update", {
      widgetType: "markdown",
      filePath: relativePath,
      absolutePath: filePath,
      content: html,
    });
  } catch (error) {
    console.error(`[SSE] Error reading markdown:`, error);
  }
}

// Map to track active watchers
const activeWatchers = new Set<string>();

export const handler: Handlers = {
  GET(req, ctx) {
    const { dashboard } = ctx.params;

    // Initialize connections set for this dashboard
    if (!connections.has(dashboard)) {
      connections.set(dashboard, new Set());
    }

    // Start watcher if not already running
    if (!activeWatchers.has(dashboard)) {
      activeWatchers.add(dashboard);
      startWatcher(dashboard);
    }

    let controller: ReadableStreamDefaultController<Uint8Array>;
    let heartbeatInterval: number;

    const body = new ReadableStream<Uint8Array>({
      start(ctrl) {
        controller = ctrl;

        // Add to connections
        connections.get(dashboard)?.add(controller);

        // Send initial connection event
        controller.enqueue(formatSSE("connected", {
          dashboard,
          timestamp: Date.now(),
        }));

        // Start heartbeat every 30 seconds
        heartbeatInterval = setInterval(() => {
          sendHeartbeat(controller);
        }, 30000);
      },

      cancel() {
        // Clean up on disconnect
        clearInterval(heartbeatInterval);
        connections.get(dashboard)?.delete(controller);

        console.log(`[SSE] Client disconnected from ${dashboard}`);
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  },
};
