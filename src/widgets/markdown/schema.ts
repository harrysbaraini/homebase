/**
 * Markdown Widget Schema
 */

import { z } from "zod";

export const markdownSettingsSchema = z.object({
  file: z.string(),
  max_height: z.string().optional(),
  url: z.string().optional(),
  url_label: z.string().optional(),
});

export type MarkdownSettings = z.output<typeof markdownSettingsSchema>;

export const defaultMarkdownSettings: Partial<MarkdownSettings> = {
  max_height: "300px",
};
