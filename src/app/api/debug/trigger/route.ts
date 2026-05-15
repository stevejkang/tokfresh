import { NextRequest, NextResponse } from "next/server";
import { CLAUDE_MODEL, CLAUDE_HEADERS } from "@/lib/claude-config";

const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const TOKEN_ENDPOINT = "https://console.anthropic.com/v1/oauth/token";
const MESSAGES_ENDPOINT = "https://api.anthropic.com/v1/messages";

interface TriggerStep {
  name: string;
  status: "success" | "error";
  statusCode?: number;
  response?: unknown;
  error?: string;
  durationMs: number;
}

export async function POST(request: NextRequest) {
  let body: { refreshToken?: string; accessToken?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { refreshToken, accessToken: providedAccessToken } = body;

  if (!refreshToken && !providedAccessToken) {
    return NextResponse.json(
      { error: "Provide refreshToken or accessToken" },
      { status: 400 },
    );
  }

  const steps: TriggerStep[] = [];
  let accessToken = providedAccessToken ?? null;
  let newRefreshToken: string | null = null;

  if (refreshToken && !providedAccessToken) {
    const start = Date.now();
    try {
      const res = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: CLIENT_ID,
        }),
      });

      const text = await res.text();
      const durationMs = Date.now() - start;

      if (!res.ok) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
        steps.push({
          name: "Token Refresh",
          status: "error",
          statusCode: res.status,
          response: parsed,
          durationMs,
        });
        return NextResponse.json({ steps, newRefreshToken: null });
      }

      const data = JSON.parse(text);
      accessToken = data.access_token;
      newRefreshToken = data.refresh_token ?? null;

      steps.push({
        name: "Token Refresh",
        status: "success",
        statusCode: res.status,
        response: {
          hasAccessToken: !!accessToken,
          hasNewRefreshToken: !!newRefreshToken,
        },
        durationMs,
      });
    } catch (err) {
      steps.push({
        name: "Token Refresh",
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
      return NextResponse.json({ steps, newRefreshToken: null });
    }
  }

  const apiStart = Date.now();
  try {
    const res = await fetch(MESSAGES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...CLAUDE_HEADERS,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 128,
        system: [
          {
            type: "text",
            text: "You are Claude Code, Anthropic\u0027s official CLI for Claude.",
          },
        ],
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    const text = await res.text();
    const durationMs = Date.now() - apiStart;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    steps.push({
      name: "Claude API Call",
      status: res.ok ? "success" : "error",
      statusCode: res.status,
      response: parsed,
      durationMs,
    });
  } catch (err) {
    steps.push({
      name: "Claude API Call",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - apiStart,
    });
  }

  return NextResponse.json({ steps, newRefreshToken });
}
