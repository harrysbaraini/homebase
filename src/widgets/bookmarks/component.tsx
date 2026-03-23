/**
 * Bookmarks Widget Component
 *
 * Renders bookmark groups in a multi-column layout.
 * Server-rendered only - no client-side interactivity needed.
 */

import type { WidgetProps } from "../types.ts";
import type { BookmarksSettings, BookmarkGroup, BookmarkLink } from "./schema.ts";

function BookmarkLinkItem({ link }: { link: BookmarkLink }) {
  return (
    <a
      href={link.url}
      class="widget-bookmarks__link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {link.label}
    </a>
  );
}

function BookmarkGroupColumn({ group }: { group: BookmarkGroup }) {
  return (
    <div class="widget-bookmarks__group">
      <div class="widget-bookmarks__group-name">{group.name}</div>
      {group.links.map((link, index) => (
        <BookmarkLinkItem key={index} link={link} />
      ))}
    </div>
  );
}

export default function BookmarksWidget(props: WidgetProps<BookmarksSettings>) {
  const { settings } = props;
  const { groups, columns } = settings;

  if (!groups || groups.length === 0) {
    return (
      <div class="widget-bookmarks" style={{ "--bookmark-columns": 1 }}>
        <div class="widget-bookmarks__empty">No bookmarks configured</div>
      </div>
    );
  }

  return (
    <div
      class="widget-bookmarks"
      style={`--bookmark-columns: ${columns}`}
    >
      {groups.map((group, index) => (
        <BookmarkGroupColumn key={index} group={group} />
      ))}
    </div>
  );
}
