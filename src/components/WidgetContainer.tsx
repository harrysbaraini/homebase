/**
 * Widget Container Component
 *
 * Wraps widgets in a TUI-style panel with grid positioning.
 */

import { getWidget } from "../widgets/index.ts";
import type { WidgetConfig, ThemeColors } from "../lib/types.ts";
import { getWidgetGridStyle } from "../lib/theme.ts";

type WidgetContainerProps = {
  widget: WidgetConfig;
  theme: ThemeColors;
  configDir: string;
  markdownContents?: Record<string, string>;
};

export default function WidgetContainer(props: WidgetContainerProps) {
  const { widget, theme, configDir, markdownContents } = props;

  // Get widget definition from registry
  const definition = getWidget(widget.type);

  // Generate unique ID for this widget instance
  const widgetId = `widget-${widget.type}-${widget.row}-${widget.col}`;

  // Calculate grid positioning
  const gridStyle = getWidgetGridStyle({
    row: widget.row,
    col: widget.col,
    row_span: widget.row_span,
    col_span: widget.col_span,
  });

  // Merge default settings with widget settings
  const settings = definition
    ? { ...(definition.defaultSettings as Record<string, unknown>), ...(widget.settings as Record<string, unknown>) }
    : widget.settings;

  const settingsRecord = settings as Record<string, unknown>;
  const url = settingsRecord.url as string | undefined;
  const urlLabel = settingsRecord.url_label as string | undefined;
  const hasUrl = !!url;

  return (
    <div
      class="widget-panel"
      data-label={hasUrl ? undefined : widget.label}
      style={gridStyle}
    >
      {hasUrl && widget.label && (
        <div class="widget-panel__label">
          <span>{widget.label} - </span>
          <a href={url} class="widget-panel__url" target="_blank" rel="noopener noreferrer">
            {urlLabel || url}
          </a>
        </div>
      )}
      <div class="widget-panel__content">
        {definition ? (
          <definition.component
            id={widgetId}
            label={widget.label}
            settings={settings}
            theme={theme}
            configDir={configDir}
            markdownContents={markdownContents}
          />
        ) : (
          <div class="widget-error">
            Unknown widget type: {widget.type}
          </div>
        )}
      </div>
    </div>
  );
}
