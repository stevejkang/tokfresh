import { NextResponse } from "next/server";

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
