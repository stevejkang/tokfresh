import { NextResponse } from "next/server";
import { CLAUDE_HEADERS } from "@/lib/claude-config";

export async function GET() {
  return NextResponse.json(CLAUDE_HEADERS, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
