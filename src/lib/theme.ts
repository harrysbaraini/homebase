/**
 * Theme CSS generation utilities
 *
 * Converts dashboard theme config to CSS custom properties
 */

import { mapTailwindColor } from "./tailwind-colors.ts";
import type { ThemeColors, FontFace } from "./types.ts";

/**
 * Generate CSS custom properties from theme colors
 */
export function generateThemeCSS(theme: ThemeColors): string {
  const cssVars = Object.entries(theme)
    .map(([key, tailwindColor]) => {
      const cssKey = `--color-${key.replace(/_/g, "-")}`;
      const hexValue = mapTailwindColor(tailwindColor);
      return `  ${cssKey}: ${hexValue};`;
    })
    .join("\n");

  return `:root {\n${cssVars}\n}`;
}

/**
 * Generate @font-face CSS from font face config
 */
export function generateFontFaceCSS(fontFace: FontFace): string {
  const rules: string[] = [];

  rules.push(`font-family: '${fontFace.font_family}'`);

  if (fontFace.font_style) {
    rules.push(`font-style: ${fontFace.font_style}`);
  }

  if (fontFace.font_display) {
    rules.push(`font-display: ${fontFace.font_display}`);
  }

  if (fontFace.font_weight) {
    rules.push(`font-weight: ${fontFace.font_weight}`);
  }

  rules.push(`src: ${fontFace.src}`);

  if (fontFace.unicode_range) {
    rules.push(`unicode-range: ${fontFace.unicode_range}`);
  }

  return `@font-face {\n  ${rules.join(";\n  ")};\n}`;
}

/**
 * Generate CSS for font-family variable
 */
export function generateFontFamilyCSS(fontFamily: string): string {
  // Add fallback monospace fonts
  const fallbacks =
    '"Fira Code", "SF Mono", Menlo, Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace';
  return `:root {\n  --font-family: "${fontFamily}", ${fallbacks};\n}`;
}

/**
 * Generate CSS for container max-width
 */
export function generateContainerCSS(maxWidth: string): string {
  let value = maxWidth;

  // Handle special values
  if (maxWidth === "full") {
    value = "100%";
  } else if (!maxWidth.includes("%") && !maxWidth.includes("px")) {
    // Assume pixel value if no unit
    value = `${maxWidth}px`;
  }

  return `:root {\n  --container-max-width: ${value};\n}`;
}

/**
 * Generate CSS for grid configuration
 */
export function generateGridCSS(columns: number, gap: string): string {
  return `:root {\n  --grid-columns: ${columns};\n  --grid-gap: ${gap};\n}`;
}

/**
 * Combine all dashboard CSS into a single stylesheet
 */
export function generateDashboardCSS(options: {
  theme: ThemeColors;
  fontFamily?: string;
  fontFace?: FontFace;
  containerMaxWidth?: string;
  gridColumns?: number;
  gridGap?: string;
}): string {
  const parts: string[] = [];

  // Theme colors
  parts.push(generateThemeCSS(options.theme));

  // Font face (if using web font)
  if (options.fontFace) {
    parts.push(generateFontFaceCSS(options.fontFace));
  }

  // Font family
  if (options.fontFamily) {
    parts.push(generateFontFamilyCSS(options.fontFamily));
  } else if (options.fontFace) {
    parts.push(generateFontFamilyCSS(options.fontFace.font_family));
  }

  // Container
  if (options.containerMaxWidth) {
    parts.push(generateContainerCSS(options.containerMaxWidth));
  }

  // Grid
  if (options.gridColumns || options.gridGap) {
    parts.push(
      generateGridCSS(options.gridColumns ?? 4, options.gridGap ?? "1rem"),
    );
  }

  return parts.join("\n\n");
}

/**
 * Inline style object for widget grid positioning
 */
export function getWidgetGridStyle(position: {
  row: number;
  col: number;
  row_span?: number;
  col_span?: number;
}): Record<string, string> {
  return {
    gridRow: position.row_span
      ? `${position.row} / span ${position.row_span}`
      : String(position.row),
    gridColumn: position.col_span
      ? `${position.col} / span ${position.col_span}`
      : String(position.col),
  };
}
