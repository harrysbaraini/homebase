/**
 * Tests for configuration loading and validation
 */

import {
  assertEquals,
  assertRejects,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  validateDashboard,
  safeParseDashboard,
  validateWidgetSettings,
} from "../src/lib/schemas.ts";
import { mapTailwindColor, isValidTailwindColor } from "../src/lib/tailwind-colors.ts";
import { generateThemeCSS, generateDashboardCSS } from "../src/lib/theme.ts";

// =============================================================================
// Schema Validation Tests
// =============================================================================

Deno.test("validateDashboard - valid minimal config", () => {
  const config = {
    name: "test",
    dark_theme: {
      bg: "zinc-950",
      bg_panel: "zinc-900",
      border: "zinc-800",
      text: "zinc-100",
      text_dimmed: "zinc-500",
      text_accent: "blue-400",
      success: "green-500",
      success_dimmed: "green-900",
      warning: "yellow-500",
      warning_dimmed: "yellow-900",
      danger: "red-500",
      danger_dimmed: "red-900",
      info: "blue-500",
      info_dimmed: "blue-900",
    },
  };

  const result = validateDashboard(config);

  assertEquals(result.name, "test");
  assertEquals(result.grid.columns, 4); // default
  assertEquals(result.widgets.length, 0); // default empty
});

Deno.test("validateDashboard - invalid color format", () => {
  const config = {
    name: "test",
    dark_theme: {
      bg: "invalid-color", // Invalid format
      bg_panel: "zinc-900",
      border: "zinc-800",
      text: "zinc-100",
      text_dimmed: "zinc-500",
      text_accent: "blue-400",
      success: "green-500",
      success_dimmed: "green-900",
      warning: "yellow-500",
      warning_dimmed: "yellow-900",
      danger: "red-500",
      danger_dimmed: "red-900",
      info: "blue-500",
      info_dimmed: "blue-900",
    },
  };

  const result = safeParseDashboard(config);
  assertEquals(result.success, false);
});

Deno.test("validateDashboard - with widgets", () => {
  const config = {
    name: "test",
    dark_theme: {
      bg: "zinc-950",
      bg_panel: "zinc-900",
      border: "zinc-800",
      text: "zinc-100",
      text_dimmed: "zinc-500",
      text_accent: "blue-400",
      success: "green-500",
      success_dimmed: "green-900",
      warning: "yellow-500",
      warning_dimmed: "yellow-900",
      danger: "red-500",
      danger_dimmed: "red-900",
      info: "blue-500",
      info_dimmed: "blue-900",
    },
    widgets: [
      {
        type: "clock",
        row: 1,
        col: 1,
        settings: {},
      },
    ],
  };

  const result = validateDashboard(config);

  assertEquals(result.widgets.length, 1);
  assertEquals(result.widgets[0].type, "clock");
  assertEquals(result.widgets[0].row, 1);
});

// =============================================================================
// Widget Settings Validation Tests
// =============================================================================

Deno.test("validateWidgetSettings - clock with defaults", () => {
  const settings = validateWidgetSettings("clock", {});

  assertEquals(settings.timezone, "UTC");
  assertEquals(settings.format_24h, true);
  assertEquals(settings.show_seconds, true);
});

Deno.test("validateWidgetSettings - clock with custom values", () => {
  const settings = validateWidgetSettings("clock", {
    timezone: "America/Sao_Paulo",
    format_24h: false,
  });

  assertEquals(settings.timezone, "America/Sao_Paulo");
  assertEquals(settings.format_24h, false);
});

Deno.test("validateWidgetSettings - bookmarks", () => {
  const settings = validateWidgetSettings("bookmarks", {
    columns: 3,
    groups: [
      {
        name: "dev",
        links: [
          { label: "GitHub", url: "https://github.com" },
        ],
      },
    ],
  });

  assertEquals(settings.columns, 3);
  assertEquals(settings.groups.length, 1);
  assertEquals(settings.groups[0].links[0].label, "GitHub");
});

Deno.test("validateWidgetSettings - markdown", () => {
  const settings = validateWidgetSettings("markdown", {
    file: "notes/todo.md",
    max_height: "400px",
  });

  assertEquals(settings.file, "notes/todo.md");
  assertEquals(settings.max_height, "400px");
});

// =============================================================================
// Tailwind Color Mapping Tests
// =============================================================================

Deno.test("mapTailwindColor - valid colors", () => {
  assertEquals(mapTailwindColor("zinc-900"), "#18181b");
  assertEquals(mapTailwindColor("blue-400"), "#60a5fa");
  assertEquals(mapTailwindColor("red-500"), "#ef4444");
  assertEquals(mapTailwindColor("green-500"), "#22c55e");
});

Deno.test("mapTailwindColor - invalid color returns black", () => {
  assertEquals(mapTailwindColor("invalid-color"), "#000000");
  assertEquals(mapTailwindColor("unknown-500"), "#000000");
});

Deno.test("isValidTailwindColor", () => {
  assertEquals(isValidTailwindColor("zinc-900"), true);
  assertEquals(isValidTailwindColor("blue-400"), true);
  assertEquals(isValidTailwindColor("invalid"), false);
  assertEquals(isValidTailwindColor("zinc-999"), false);
});

// =============================================================================
// Theme CSS Generation Tests
// =============================================================================

Deno.test("generateThemeCSS - produces valid CSS", () => {
  const theme = {
    bg: "zinc-950",
    bg_panel: "zinc-900",
    border: "zinc-800",
    text: "zinc-100",
    text_dimmed: "zinc-500",
    text_accent: "blue-400",
    success: "green-500",
    success_dimmed: "green-900",
    warning: "yellow-500",
    warning_dimmed: "yellow-900",
    danger: "red-500",
    danger_dimmed: "red-900",
    info: "blue-500",
    info_dimmed: "blue-900",
  };

  const css = generateThemeCSS(theme);

  // Check for CSS variable declarations
  assertEquals(css.includes("--color-bg:"), true);
  assertEquals(css.includes("--color-text:"), true);
  assertEquals(css.includes("#09090b"), true); // zinc-950
  assertEquals(css.includes("#fafafa"), true); // zinc-100
});

Deno.test("generateDashboardCSS - combines all styles", () => {
  const css = generateDashboardCSS({
    theme: {
      bg: "zinc-950",
      bg_panel: "zinc-900",
      border: "zinc-800",
      text: "zinc-100",
      text_dimmed: "zinc-500",
      text_accent: "blue-400",
      success: "green-500",
      success_dimmed: "green-900",
      warning: "yellow-500",
      warning_dimmed: "yellow-900",
      danger: "red-500",
      danger_dimmed: "red-900",
      info: "blue-500",
      info_dimmed: "blue-900",
    },
    fontFamily: "JetBrains Mono",
    containerMaxWidth: "1100px",
    gridColumns: 4,
    gridGap: "1rem",
  });

  assertEquals(css.includes("--color-bg:"), true);
  assertEquals(css.includes("--font-family:"), true);
  assertEquals(css.includes("--container-max-width: 1100px"), true);
  assertEquals(css.includes("--grid-columns: 4"), true);
});
