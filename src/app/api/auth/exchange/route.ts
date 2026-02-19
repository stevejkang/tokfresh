import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";
const TOKEN_ENDPOINT = "https://console.anthropic.com/v1/oauth/token";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, verifier } = body;

  if (!code || !verifier) {
    return NextResponse.json(
      { error: "Missing code or verifier" },
      { status: 400 },
    );
  }

  const splits = code.trim().split("#");
  const authCode = splits[0];
  const state = splits[1] || "";

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: authCode,
      state,
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `Token exchange failed (${response.status}): ${text}` },
      { status: response.status },
    );
  }

  const json = await response.json();

  return NextResponse.json({
    refresh_token: json.refresh_token,
    access_token: json.access_token,
  });
}
