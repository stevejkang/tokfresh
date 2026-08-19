import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const [totalTriggers, lastTriggerAt] = await Promise.all([
      redis.get<number>("total_triggers"),
      redis.get<number>("last_trigger_at"),
    ]);

    return NextResponse.json({
      totalTriggers: totalTriggers ?? 0,
      lastTriggerAt: lastTriggerAt ?? null,
    });
  } catch {
    return NextResponse.json(
      { totalTriggers: 0, lastTriggerAt: null },
      { status: 500 },
    );
  }
}
