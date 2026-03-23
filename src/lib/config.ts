/**
 * Dashboard configuration loader
 *
 * Loads and validates YAML dashboard configurations from the filesystem
 */

import { parse as parseYaml } from "@std/yaml";
import { join, basename, extname, isAbsolute } from "@std/path";
import { exists } from "@std/fs";
import {
  validateDashboard,
  safeParseDashboard,
  validateWidgetSettings,
  type Dashboard,
} from "./schemas.ts";
import type { DashboardMeta } from "./types.ts";

/**
 * Get the config directory path
 * Supports ~ expansion and environment variable
 */
export function getConfigDir(): string {
  const envDir = Deno.env.get("CONFIG_DIR") ||
    Deno.env.get("HOMEBASE_CONFIG_DIR");

  if (envDir) {
    return expandHome(envDir);
  }

  // Default to ~/.config/homebase
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
  return join(home, ".config", "homebase");
}

/**
 * Get the dashboards directory path
 */
export function getDashboardsDir(): string {
  return join(getConfigDir(), "dashboards");
}

/**
 * Expand ~ to home directory
 */
function expandHome(path: string): string {
  if (path.startsWith("~")) {
    const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
    return join(home, path.slice(1));
  }
  return path;
}

/**
 * Load a dashboard configuration from YAML file
 *
 * @param slug - Dashboard slug (filename without extension)
 * @returns Parsed and validated dashboard config
 * @throws Error if file not found or validation fails
 */
export async function loadDashboard(slug: string): Promise<Dashboard> {
  const dashboardsDir = getDashboardsDir();
  const filePath = join(dashboardsDir, `${slug}.yaml`);

  // Check if file exists
  if (!(await exists(filePath))) {
    // Try .yml extension
    const ymlPath = join(dashboardsDir, `${slug}.yml`);
    if (!(await exists(ymlPath))) {
      throw new Error(`Dashboard not found: ${slug}`);
    }
    return loadDashboardFromPath(ymlPath);
  }

  return loadDashboardFromPath(filePath);
}

/**
 * Load dashboard from a specific file path
 */
export async function loadDashboardFromPath(
  filePath: string,
): Promise<Dashboard> {
  const content = await Deno.readTextFile(filePath);
  const data = parseYaml(content);

  // Validate with Zod
  const result = safeParseDashboard(data);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid dashboard configuration:\n${errors}`);
  }

  const dashboard = result.data;

  // Validate individual widget settings
  dashboard.widgets = dashboard.widgets.map((widget, index) => {
    try {
      const validatedSettings = validateWidgetSettings(
        widget.type,
        widget.settings,
      );
      return { ...widget, settings: validatedSettings };
    } catch (error) {
      throw new Error(
        `Invalid settings for widget ${index} (${widget.type}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  return dashboard;
}

/**
 * List all available dashboards
 *
 * @returns Array of dashboard metadata
 */
export async function listDashboards(): Promise<DashboardMeta[]> {
  const dashboardsDir = getDashboardsDir();

  // Ensure directory exists
  if (!(await exists(dashboardsDir))) {
    return [];
  }

  const dashboards: DashboardMeta[] = [];

  for await (const entry of Deno.readDir(dashboardsDir)) {
    if (!entry.isFile) continue;

    const ext = extname(entry.name);
    if (ext !== ".yaml" && ext !== ".yml") continue;

    const slug = basename(entry.name, ext);
    const filePath = join(dashboardsDir, entry.name);

    try {
      // Quick parse to get display name
      const content = await Deno.readTextFile(filePath);
      const data = parseYaml(content) as { name?: string };

      dashboards.push({
        slug,
        name: data.name || slug,
        path: filePath,
      });
    } catch {
      // Skip invalid files
      console.warn(`Skipping invalid dashboard file: ${entry.name}`);
    }
  }

  // Sort alphabetically by name
  return dashboards.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if a dashboard exists
 */
export async function dashboardExists(slug: string): Promise<boolean> {
  const dashboardsDir = getDashboardsDir();
  const yamlPath = join(dashboardsDir, `${slug}.yaml`);
  const ymlPath = join(dashboardsDir, `${slug}.yml`);

  return (await exists(yamlPath)) || (await exists(ymlPath));
}

/**
 * Get the path to a file relative to the config directory
 * Used for markdown widget file paths
 */
export function resolveConfigPath(filePath: string): string {
  const expanded = expandHome(filePath);
  if (isAbsolute(expanded)) {
    return expanded;
  }
  const configDir = getConfigDir();
  return join(configDir, expanded);
}

/**
 * Watch for changes in dashboard files
 * Returns an async iterator of file change events
 */
export async function* watchDashboards(): AsyncGenerator<{
  kind: string;
  paths: string[];
}> {
  const dashboardsDir = getDashboardsDir();

  // Ensure directory exists
  if (!(await exists(dashboardsDir))) {
    await Deno.mkdir(dashboardsDir, { recursive: true });
  }

  const watcher = Deno.watchFs(dashboardsDir);

  for await (const event of watcher) {
    // Filter to YAML files only
    const yamlPaths = event.paths.filter((p) => {
      const ext = extname(p);
      return ext === ".yaml" || ext === ".yml";
    });

    if (yamlPaths.length > 0) {
      yield { kind: event.kind, paths: yamlPaths };
    }
  }
}

/**
 * Ensure config directories exist
 */
export async function ensureConfigDirs(): Promise<void> {
  const configDir = getConfigDir();
  const dashboardsDir = getDashboardsDir();
  const notesDir = join(configDir, "notes");

  await Deno.mkdir(dashboardsDir, { recursive: true });
  await Deno.mkdir(notesDir, { recursive: true });
}
