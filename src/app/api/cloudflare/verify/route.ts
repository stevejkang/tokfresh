import { NextRequest, NextResponse } from "next/server";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export async function POST(request: NextRequest) {
  const { apiToken } = await request.json();

  if (!apiToken) {
    return NextResponse.json(
      { valid: false, error: "Missing API token" },
      { status: 400 },
    );
  }

  const headers = { Authorization: `Bearer ${apiToken}` };

  const verifyRes = await fetch(`${CF_API_BASE}/user/tokens/verify`, {
    headers,
  });

  if (!verifyRes.ok) {
    return NextResponse.json({
      valid: false,
      error: `Invalid token (${verifyRes.status})`,
    });
  }

  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return NextResponse.json({
      valid: false,
      error: "Token verification failed",
    });
  }

  const accountsRes = await fetch(`${CF_API_BASE}/accounts?per_page=1`, {
    headers,
  });

  if (!accountsRes.ok) {
    return NextResponse.json({
      valid: false,
      error: `Failed to fetch accounts (${accountsRes.status})`,
    });
  }

  const accountsData = await accountsRes.json();
  const accounts = accountsData.result;

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({
      valid: false,
      error: "No Cloudflare accounts found",
    });
  }

  return NextResponse.json({ valid: true, accountId: accounts[0].id });
}
