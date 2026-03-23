/**
 * Core type definitions for homebase dashboard system
 */

import type { ComponentType } from "preact";

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Semantic color roles for theming
 * Values should be Tailwind color names (e.g., "zinc-900", "blue-400")
 */
export type ThemeColors = {
  bg: string;
  bg_panel: string;
  border: string;
  text: string;
  text_dimmed: string;
  text_accent: string;
  success: string;
  success_dimmed: string;
  warning: string;
  warning_dimmed: string;
  danger: string;
  danger_dimmed: string;
  info: string;
  info_dimmed: string;
};

/**
 * Font face definition for custom fonts
 */
export type FontFace = {
  font_family: string;
  font_style?: string;
  font_display?: string;
  font_weight?: string;
  src: string;
  unicode_range?: string;
};

// ============================================================================
// Grid Types
// ============================================================================

/**
 * Grid configuration for dashboard layout
 */
export type GridConfig = {
  columns: number;
  gap: string;
};

/**
 * Widget position in the grid
 */
export type GridPosition = {
  row: number;
  col: number;
  row_span?: number;
  col_span?: number;
};

// ============================================================================
// Widget Types
// ============================================================================

/**
 * Base widget configuration from YAML
 */
export type WidgetConfig<T = unknown> = GridPosition & {
  type: string;
  label?: string;
  settings: T;
};

/**
 * Props passed to widget components
 */
export type WidgetProps<T = unknown> = {
  id: string;
  label?: string;
  settings: T;
  theme: ThemeColors;
  configDir: string;
  markdownContents?: Record<string, string>;
};

/**
 * Widget definition for the registry
 */
export type WidgetDefinition<T = unknown> = {
  type: string;
  // Zod schema for validating settings
  // Using `unknown` here to avoid importing zod in types
  schema: unknown;
  // Server-side component
  component: ComponentType<WidgetProps<T>>;
  // Optional client-side island for interactivity
  island?: ComponentType<WidgetProps<T>>;
  // Default settings when not specified in YAML
  defaultSettings: Partial<T>;
};

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Complete dashboard configuration
 */
export type Dashboard = {
  name: string;
  container_max_width?: string;
  font_family?: string;
  font_face?: FontFace;
  grid: GridConfig;
  dark_theme: ThemeColors;
  light_theme?: ThemeColors;
  widgets: WidgetConfig[];
};

/**
 * Dashboard metadata for listing
 */
export type DashboardMeta = {
  slug: string;
  name: string;
  path: string;
};

// ============================================================================
// SSE Event Types
// ============================================================================

/**
 * Server-sent events for real-time updates
 */
export type SSEEvent =
  | { type: "widget:update"; widgetId: string; data: unknown }
  | { type: "dashboard:reload"; reason?: string }
  | { type: "heartbeat"; timestamp: number }
  | { type: "error"; message: string };

// ============================================================================
// Widget Settings Types (for built-in widgets)
// ============================================================================

export type ClockSettings = {
  timezone: string;
  format_24h: boolean;
  show_seconds: boolean;
  show_date: boolean;
};

export type BookmarkLink = {
  label: string;
  url: string;
  icon?: string;
};

export type BookmarkGroup = {
  name: string;
  links: BookmarkLink[];
};

export type BookmarksSettings = {
  columns: number;
  groups: BookmarkGroup[];
};

export type MarkdownSettings = {
  file: string;
  max_height?: string;
  url?: string;
  url_label?: string;
};
