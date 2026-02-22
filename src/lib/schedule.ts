export const ACTIVE_TRIGGER_COUNT = 4;

export function calculateSchedule(startTime: string): string[] {
  const [hours, minutes] = startTime.split(":").map(Number);
  const schedule: string[] = [];

  for (let i = 0; i < 5; i++) {
    const totalMinutes = (hours * 60 + minutes + i * 300) % 1440;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    schedule.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );
  }

  return schedule;
}

export function getResetTime(triggerTime: string): string {
  const [hours, minutes] = triggerTime.split(":").map(Number);
  const totalMinutes = (hours * 60 + minutes + 300) % 1440;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getTimezoneOffsetMinutes(timezone: string): number {
  const now = new Date();
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = now.toLocaleString("en-US", { timeZone: timezone });
  return (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60000;
}

export function timeToCron(times: string[], timezone: string): string {
  const active = times.slice(0, ACTIVE_TRIGGER_COUNT);
  const offsetMinutes = getTimezoneOffsetMinutes(timezone);
  const [firstH, firstM] = active[0].split(":").map(Number);
  const utcBase = ((firstH * 60 + firstM - offsetMinutes) % 1440 + 1440) % 1440;
  const utcMinute = utcBase % 60;
  const utcHours = active.map((t) => {
    const [h, m] = t.split(":").map(Number);
    const totalUtc = ((h * 60 + m - offsetMinutes) % 1440 + 1440) % 1440;
    return Math.floor(totalUtc / 60);
  });
  return `${utcMinute} ${utcHours.join(",")} * * *`;
}

export function getNextTrigger(
  schedule: string[],
  timezone: string,
): { time: string; label: string } {
  const active = schedule.slice(0, ACTIVE_TRIGGER_COUNT);
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const currentTime = formatter.format(now);
  const currentDate = dateFormatter.format(now);
  const [currentH, currentM] = currentTime.split(":").map(Number);
  const currentMinutes = currentH * 60 + currentM;

  const tzAbbr = getTimezoneAbbr(timezone);

  const sorted = [...active].sort((a, b) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  for (const time of sorted) {
    const [h, m] = time.split(":").map(Number);
    const timeMinutes = h * 60 + m;
    if (timeMinutes > currentMinutes) {
      return { time, label: `Today ${time} ${tzAbbr}` };
    }
  }

  return { time: sorted[0], label: `Tomorrow ${sorted[0]} ${tzAbbr}` };
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Asia/Seoul";
  }
}

function getTimezoneAbbr(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}
