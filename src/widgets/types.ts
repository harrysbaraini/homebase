/**
 * Widget-specific types
 *
 * Re-exports from main types and adds widget-specific utilities
 */

export type {
  WidgetProps,
  WidgetConfig,
  WidgetDefinition,
  ThemeColors,
  GridPosition,
  ClockSettings,
  BookmarksSettings,
  BookmarkLink,
  BookmarkGroup,
  MarkdownSettings,
} from "../lib/types.ts";

export type {
  RegisteredWidget,
} from "./registry.ts";
