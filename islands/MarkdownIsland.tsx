/**
 * Markdown Island
 *
 * Client-side component that listens for SSE updates
 * when the markdown file changes.
 */

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

type MarkdownIslandProps = {
  widgetId: string;
  filePath: string;
  initialContent: string;
  maxHeight: string;
};

export default function MarkdownIsland(props: MarkdownIslandProps) {
  const content = useSignal(props.initialContent);
  const isLoading = useSignal(false);

  useEffect(() => {
    // Get dashboard slug from URL
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const dashboard = pathParts[0] || "default";

    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/events/${dashboard}`);

    eventSource.addEventListener("widget:update", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.filePath === props.filePath || data.absolutePath === props.filePath) {
          content.value = data.content;
        }
      } catch (e) {
        console.error("Error parsing SSE event:", e);
      }
    });

    eventSource.addEventListener("dashboard:reload", () => {
      // Full page reload on dashboard config change
      window.location.reload();
    });

    eventSource.onerror = () => {
      console.warn("SSE connection error, will auto-reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [props.widgetId]);

  return (
    <div
      class="widget-markdown"
      style={`--markdown-max-height: ${props.maxHeight}`}
    >
      {isLoading.value ? (
        <div class="widget-loading">Loading...</div>
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: content.value }}
        />
      )}
    </div>
  );
}
