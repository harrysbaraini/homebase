/**
 * Clock Widget Schema
 */

import { z } from "zod";

export const clockSettingsSchema = z.object({
  timezone: z.string().default("UTC"),
  format_24h: z.boolean().default(true),
  show_seconds: z.boolean().default(true),
  show_date: z.boolean().default(true),
});

export type ClockSettings = z.output<typeof clockSettingsSchema>;

export const defaultClockSettings: ClockSettings = {
  timezone: "UTC",
  format_24h: true,
  show_seconds: true,
  show_date: true,
};
