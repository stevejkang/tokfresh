import { NextResponse } from "next/server";
import { CLAUDE_MODEL } from "@/lib/claude-config";

export async function GET() {
  return new NextResponse(CLAUDE_MODEL, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
