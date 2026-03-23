/**
 * Dashboard Route
 *
 * Renders a single dashboard based on the URL slug.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { loadDashboard, dashboardExists, getConfigDir, resolveConfigPath } from "../src/lib/config.ts";
import { generateDashboardCSS } from "../src/lib/theme.ts";
import { renderMarkdown } from "../src/lib/markdown.ts";
import { getWidget } from "../src/widgets/index.ts";
import type { Dashboard, WidgetConfig } from "../src/lib/types.ts";
import WidgetContainer from "../src/components/WidgetContainer.tsx";

type PageData = {
  dashboard: Dashboard;
  themeCSS: string;
  configDir: string;
  markdownContents: Record<string, string>;
};

type ErrorData = {
  error: string;
  slug: string;
};

export const handler: Handlers<PageData | ErrorData> = {
  async GET(_req, ctx) {
    const { dashboard: slug } = ctx.params;

    // Check if dashboard exists
    if (!(await dashboardExists(slug))) {
      return ctx.renderNotFound();
    }

    try {
      const dashboard = await loadDashboard(slug);

      // Generate theme CSS
      const themeCSS = generateDashboardCSS({
        theme: dashboard.dark_theme,
        fontFamily: dashboard.font_family,
        fontFace: dashboard.font_face,
        containerMaxWidth: dashboard.container_max_width,
        gridColumns: dashboard.grid.columns,
        gridGap: dashboard.grid.gap,
      });

      // Pre-load markdown content for all markdown widgets
      const markdownContents: Record<string, string> = {};
      for (const widget of dashboard.widgets) {
        if (widget.type === "markdown" && widget.settings?.file) {
          const filePath = resolveConfigPath(widget.settings.file as string);
          console.log(`[markdown] Resolved path: "${filePath}" (from settings.file: "${widget.settings.file}")`);
          try {
            const raw = await Deno.readTextFile(filePath);
            markdownContents[widget.settings.file as string] = await renderMarkdown(raw);
          } catch (e) {
            if (e instanceof Deno.errors.NotFound) {
              markdownContents[widget.settings.file as string] = `<p class="widget-error">File not found: ${widget.settings.file}</p>`;
            } else {
              markdownContents[widget.settings.file as string] = `<p class="widget-error">Error reading file: ${e instanceof Error ? e.message : String(e)}</p>`;
            }
          }
        }
      }

      return ctx.render({
        dashboard,
        themeCSS,
        configDir: getConfigDir(),
        markdownContents,
      });
    } catch (error) {
      return ctx.render({
        error: error instanceof Error ? error.message : String(error),
        slug,
      });
    }
  },
};

function isErrorData(data: PageData | ErrorData): data is ErrorData {
  return "error" in data;
}

export default function DashboardPage({ data }: PageProps<PageData | ErrorData>) {
  if (isErrorData(data)) {
    return (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Error - homebase</title>
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <main class="page-404">
            <div class="page-404__code">error</div>
            <p class="page-404__message">{data.error}</p>
            <a href="/" class="page-404__link">← back to dashboards</a>
          </main>
        </body>
      </html>
    );
  }

  const { dashboard, themeCSS, configDir, markdownContents } = data;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{dashboard.name} - homebase</title>
        <link rel="stylesheet" href="/styles.css" />
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body>
        <main class="dashboard-container">
          <div
            class="dashboard-grid"
            style={`--grid-columns: ${dashboard.grid.columns}`}
          >
            {dashboard.widgets.map((widget, index) => (
              <WidgetContainer
                key={index}
                widget={widget}
                theme={dashboard.dark_theme}
                configDir={configDir}
                markdownContents={markdownContents}
              />
            ))}
          </div>
        </main>
      </body>
    </html>
  );
}
