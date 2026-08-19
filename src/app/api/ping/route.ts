import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST() {
  try {
    await Promise.all([
      redis.incr("total_triggers"),
      redis.set("last_trigger_at", Date.now()),
    ]);
  } catch {}

  return new NextResponse(null, { status: 204 });
}
