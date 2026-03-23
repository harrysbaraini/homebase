/**
 * Bookmarks Widget Schema
 */

import { z } from "zod";

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

export type BookmarkLink = z.output<typeof bookmarkLinkSchema>;
export type BookmarkGroup = z.output<typeof bookmarkGroupSchema>;
export type BookmarksSettings = z.output<typeof bookmarksSettingsSchema>;

export const defaultBookmarksSettings: BookmarksSettings = {
  columns: 4,
  groups: [],
};
