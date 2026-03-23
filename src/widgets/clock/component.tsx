/**
 * Clock Widget Component
 *
 * Server-renders initial time, hydrates with ClockIsland for live updates.
 */

import type { WidgetProps } from "../types.ts";
import type { ClockSettings } from "./schema.ts";
import ClockIsland from "../../../islands/ClockIsland.tsx";

/**
 * Format time for initial server render
 */
function formatTime(
  date: Date,
  timezone: string,
  format24h: boolean,
  showSeconds: boolean,
): { time: string; period: string } {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: !format24h,
  };

  if (showSeconds) {
    options.second = "2-digit";
  }

  const formatted = new Intl.DateTimeFormat("en-US", options).format(date);

  if (format24h) {
    return { time: formatted, period: "" };
  }

  // Extract AM/PM for 12-hour format
  const parts = formatted.split(" ");
  return {
    time: parts[0] || formatted,
    period: parts[1]?.toLowerCase() || "",
  };
}

/**
 * Format date for display
 */
function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function ClockWidget(props: WidgetProps<ClockSettings>) {
  const { settings } = props;
  const now = new Date();

  // Initial server-rendered values
  const { time, period } = formatTime(
    now,
    settings.timezone,
    settings.format_24h,
    settings.show_seconds,
  );
  const dateStr = settings.show_date ? formatDate(now, settings.timezone) : "";

  // Pass to island for client-side updates
  return (
    <ClockIsland
      timezone={settings.timezone}
      format24h={settings.format_24h}
      showSeconds={settings.show_seconds}
      showDate={settings.show_date}
      initialTime={time}
      initialPeriod={period}
      initialDate={dateStr}
    />
  );
}
