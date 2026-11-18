import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { redis } from "@/lib/redis";
import { buildReminderEmail, REMINDER_LEAD_DAYS } from "@/lib/reminder-email";

const FROM = "TokFresh <noreply@updates.tokfresh.com>";
const DAY_MS = 24 * 60 * 60 * 1000;
// Resend accepts scheduled_at up to 30 days ahead; keep a margin.
const MAX_SCHEDULE_AHEAD_MS = 30 * DAY_MS - 60 * 60 * 1000;
const MIN_SCHEDULE_AHEAD_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60 * 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Reminder not configured" },
      { status: 500 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    const key = `remind_rl:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);
    if (count > RATE_LIMIT) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }
  } catch (err) {
    console.error("Reminder rate limit check failed:", err);
  }

  const body = await request.json().catch(() => null);
  const { email, claudeEmail, expiresAt, timeZone } = body ?? {};

  if (!isValidEmail(email) || !isValidEmail(claudeEmail)) {
    return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
  }

  const now = Date.now();
  if (typeof expiresAt !== "number" || expiresAt <= now || expiresAt > now + 90 * DAY_MS) {
    return NextResponse.json({ success: false, error: "Invalid expiresAt" }, { status: 400 });
  }

  const remindAt = Math.min(expiresAt - REMINDER_LEAD_DAYS * DAY_MS, now + MAX_SCHEDULE_AHEAD_MS);
  if (remindAt < now + MIN_SCHEDULE_AHEAD_MS) {
    return NextResponse.json(
      { success: false, error: "Login expires too soon to schedule a reminder" },
      { status: 400 },
    );
  }

  const { subject, html, text } = buildReminderEmail({
    claudeEmail,
    expiresAt: new Date(expiresAt),
    timeZone: typeof timeZone === "string" && timeZone ? timeZone : "UTC",
  });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject,
    html,
    text,
    scheduledAt: new Date(remindAt).toISOString(),
  });

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to schedule reminder" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: data.id, remindAt });
}
