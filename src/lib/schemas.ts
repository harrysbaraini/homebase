/**
 * Zod schemas for validating dashboard YAML configurations
 */

import { z } from "zod";

// ============================================================================
// Theme Schemas
// ============================================================================

/**
 * Valid Tailwind color pattern: color-shade (e.g., "zinc-900", "blue-400")
 */
const tailwindColorPattern = /^[a-z]+-\d{2,3}$/;

const tailwindColorSchema = z.string().regex(tailwindColorPattern, {
  message:
    'Color must be a Tailwind color name like "zinc-900" or "blue-400"',
});

export const themeColorsSchema = z.object({
  bg: tailwindColorSchema,
  bg_panel: tailwindColorSchema,
  border: tailwindColorSchema,
  text: tailwindColorSchema,
  text_dimmed: tailwindColorSchema,
  text_accent: tailwindColorSchema,
  success: tailwindColorSchema,
  success_dimmed: tailwindColorSchema,
  warning: tailwindColorSchema,
  warning_dimmed: tailwindColorSchema,
  danger: tailwindColorSchema,
  danger_dimmed: tailwindColorSchema,
  info: tailwindColorSchema,
  info_dimmed: tailwindColorSchema,
});

export const fontFaceSchema = z.object({
  font_family: z.string(),
  font_style: z.string().optional(),
  font_display: z.string().optional(),
  font_weight: z.string().optional(),
  src: z.string(),
  unicode_range: z.string().optional(),
});

// ============================================================================
// Grid Schemas
// ============================================================================

export const gridConfigSchema = z.object({
  columns: z.number().int().min(1).max(12).default(4),
  gap: z.string().default("1rem"),
});

export const gridPositionSchema = z.object({
  row: z.number().int().min(1),
  col: z.number().int().min(1),
  row_span: z.number().int().min(1).optional(),
  col_span: z.number().int().min(1).optional(),
});

// ============================================================================
// Widget Settings Schemas
// ============================================================================

export const clockSettingsSchema = z.object({
  timezone: z.string().default("UTC"),
  format_24h: z.boolean().default(true),
  show_seconds: z.boolean().default(true),
  show_date: z.boolean().default(true),
});

export const bookmarkLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  icon: z.string().optional(),
});

export const bookmarkGroupSchema = z.object({
  name: z.string(),
  links: z.array(bookmarkLinkSchema),
});

export const bookmarksSettingsSchema = z.object({
  columns: z.number().int().min(1).max(6).default(4),
  groups: z.array(bookmarkGroupSchema).default([]),
});

export const markdownSettingsSchema = z.object({
  file: z.string(),
  max_height: z.string().optional(),
  url: z.string().optional(),
  url_label: z.string().optional(),
});

// ============================================================================
// Widget Config Schema (generic)
// ============================================================================

export const widgetConfigSchema = gridPositionSchema.extend({
  type: z.string(),
  label: z.string().optional(),
  settings: z.record(z.unknown()).default({}),
});

// ============================================================================
// Dashboard Schema
// ============================================================================

export const dashboardSchema = z.object({
  name: z.string(),
  container_max_width: z.string().optional(),
  font_family: z.string().optional(),
  font_face: fontFaceSchema.optional(),
  grid: gridConfigSchema.default({ columns: 4, gap: "1rem" }),
  dark_theme: themeColorsSchema,
  light_theme: themeColorsSchema.optional(),
  widgets: z.array(widgetConfigSchema).default([]),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type ThemeColorsInput = z.input<typeof themeColorsSchema>;
export type ThemeColors = z.output<typeof themeColorsSchema>;
export type FontFace = z.output<typeof fontFaceSchema>;
export type GridConfig = z.output<typeof gridConfigSchema>;
export type GridPosition = z.output<typeof gridPositionSchema>;
export type WidgetConfig = z.output<typeof widgetConfigSchema>;
export type Dashboard = z.output<typeof dashboardSchema>;

export type ClockSettings = z.output<typeof clockSettingsSchema>;
export type BookmarksSettings = z.output<typeof bookmarksSettingsSchema>;
export type MarkdownSettings = z.output<typeof markdownSettingsSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate and parse dashboard YAML data
 */
export function validateDashboard(data: unknown): Dashboard {
  return dashboardSchema.parse(data);
}

/**
 * Safe validation that returns result object
 */
export function safeParseDashboard(data: unknown) {
  return dashboardSchema.safeParse(data);
}

/**
 * Validate widget settings based on type
 */
export function validateWidgetSettings(
  type: string,
  settings: unknown,
): Record<string, unknown> {
  switch (type) {
    case "clock":
      return clockSettingsSchema.parse(settings);
    case "bookmarks":
      return bookmarksSettingsSchema.parse(settings);
    case "markdown":
      return markdownSettingsSchema.parse(settings);
    default:
      // Unknown widget types pass through (for extensibility)
      return settings as Record<string, unknown>;
  }
}
