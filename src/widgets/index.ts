/**
 * Widget Index
 *
 * Registers all built-in widgets with the registry.
 * Import this file to ensure all widgets are available.
 */

import type { ComponentType } from "preact";
import { registerWidget } from "./registry.ts";
import type { WidgetProps } from "./types.ts";

// Clock widget
import ClockWidget from "./clock/component.tsx";
import {
  clockSettingsSchema,
  defaultClockSettings,
} from "./clock/schema.ts";

// Bookmarks widget
import BookmarksWidget from "./bookmarks/component.tsx";
import {
  bookmarksSettingsSchema,
  defaultBookmarksSettings,
} from "./bookmarks/schema.ts";

// Markdown widget
import MarkdownWidget from "./markdown/component.tsx";
import {
  markdownSettingsSchema,
  defaultMarkdownSettings,
  type MarkdownSettings,
} from "./markdown/schema.ts";

// Register all widgets
export function initializeWidgets(): void {
  registerWidget({
    type: "clock",
    schema: clockSettingsSchema,
    component: ClockWidget,
    defaultSettings: defaultClockSettings,
  });

  registerWidget({
    type: "bookmarks",
    schema: bookmarksSettingsSchema,
    component: BookmarksWidget,
    defaultSettings: defaultBookmarksSettings,
  });

  registerWidget({
    type: "markdown",
    schema: markdownSettingsSchema,
    component: MarkdownWidget as unknown as ComponentType<WidgetProps<MarkdownSettings>>,
    defaultSettings: defaultMarkdownSettings,
  });
}

// Auto-initialize on import
initializeWidgets();

// Re-export registry functions
export { registerWidget, getWidget, getAllWidgets } from "./registry.ts";

// Re-export types
export type * from "./types.ts";
