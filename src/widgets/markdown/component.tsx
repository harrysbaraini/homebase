/**
 * Markdown Widget Component
 *
 * Renders pre-loaded markdown content.
 * Uses an island for SSE-based live updates when the file changes.
 */

import type { WidgetProps } from "../types.ts";
import type { MarkdownSettings } from "./schema.ts";
import MarkdownIsland from "../../../islands/MarkdownIsland.tsx";

export default function MarkdownWidget(
  props: WidgetProps<MarkdownSettings>,
) {
  const { id, settings, markdownContents } = props;
  const maxHeight = settings.max_height || "300px";
  const content = markdownContents?.[settings.file] ?? "";

  return (
    <MarkdownIsland
      widgetId={id}
      filePath={settings.file}
      initialContent={content}
      maxHeight={maxHeight}
    />
  );
}
