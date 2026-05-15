import { NextResponse } from "next/server";

const MODEL = "claude-haiku-4-5-20251001";

export async function GET() {
  return new NextResponse(MODEL, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
