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

export function timeToCron(times: string[]): string {
  const hours = times.map((t) => parseInt(t.split(":")[0], 10));
  const minute = parseInt(times[0].split(":")[1], 10);
  return `${minute} ${hours.join(",")} * * *`;
}

export function getNextTrigger(
  schedule: string[],
  timezone: string,
): { time: string; label: string } {
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

  for (const time of schedule) {
    const [h, m] = time.split(":").map(Number);
    const timeMinutes = h * 60 + m;
    if (timeMinutes > currentMinutes) {
      return { time, label: `Today ${time} ${tzAbbr}` };
    }
  }

  return { time: schedule[0], label: `Tomorrow ${schedule[0]} ${tzAbbr}` };
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
