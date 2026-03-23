/**
 * Clock Island
 *
 * Client-side component for live clock updates.
 * Receives initial values from server and updates every second.
 */

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

type ClockIslandProps = {
  timezone: string;
  format24h: boolean;
  showSeconds: boolean;
  showDate: boolean;
  initialTime: string;
  initialPeriod: string;
  initialDate: string;
};

/**
 * Format time string
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

  const parts = formatted.split(" ");
  return {
    time: parts[0] || formatted,
    period: parts[1]?.toLowerCase() || "",
  };
}

/**
 * Format date string
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

export default function ClockIsland(props: ClockIslandProps) {
  const time = useSignal(props.initialTime);
  const period = useSignal(props.initialPeriod);
  const dateStr = useSignal(props.initialDate);

  useEffect(() => {
    // Update immediately on mount (server time might be stale)
    const update = () => {
      const now = new Date();
      const formatted = formatTime(
        now,
        props.timezone,
        props.format24h,
        props.showSeconds,
      );
      time.value = formatted.time;
      period.value = formatted.period;

      if (props.showDate) {
        dateStr.value = formatDate(now, props.timezone);
      }
    };

    update();

    // Update every second
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [props.timezone, props.format24h, props.showSeconds, props.showDate]);

  return (
    <div class="widget-clock">
      <div class="widget-clock__time">
        {time.value}
        {period.value && (
          <span class="widget-clock__time-period">{period.value}</span>
        )}
      </div>
      {props.showDate && (
        <div class="widget-clock__date">{dateStr.value}</div>
      )}
    </div>
  );
}
