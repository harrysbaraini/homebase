/**
 * Index Route
 *
 * Lists all available dashboards from the config directory.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { listDashboards } from "../src/lib/config.ts";
import type { DashboardMeta } from "../src/lib/types.ts";

type PageData = {
  dashboards: DashboardMeta[];
};

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    const dashboards = await listDashboards();
    return ctx.render({ dashboards });
  },
};

export default function IndexPage({ data }: PageProps<PageData>) {
  const { dashboards } = data;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>homebase</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <main class="dashboard-list">
          <h1 class="dashboard-list__title">dashboards</h1>

          {dashboards.length === 0 ? (
            <div>
              <p style={{ color: "var(--color-text-dimmed)" }}>
                No dashboards found.
              </p>
              <p style={{ color: "var(--color-text-dimmed)", marginTop: "1rem" }}>
                Create a YAML file in{" "}
                <code>~/.config/homebase/dashboards/</code>
              </p>
            </div>
          ) : (
            <nav class="dashboard-list__items">
              {dashboards.map((dashboard) => (
                <a
                  key={dashboard.slug}
                  href={`/${dashboard.slug}`}
                  class="dashboard-list__item"
                >
                  {dashboard.name}
                </a>
              ))}
            </nav>
          )}
        </main>
      </body>
    </html>
  );
}
