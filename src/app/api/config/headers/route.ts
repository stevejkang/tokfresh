import { NextResponse } from "next/server";

const CLI_VERSION = "2.1.80";
const MODEL = "claude-haiku-4-5-20251001";

const HEADERS_CONFIG = {
  "anthropic-version": "2023-06-01",
  "anthropic-beta":
    "claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,prompt-caching-scope-2026-01-05",
  "user-agent": `claude-cli/${CLI_VERSION} (external, cli)`,
  "x-app": "cli",
  "x-anthropic-billing-header": `cc_version=${CLI_VERSION}.${MODEL}; cc_entrypoint=cli; cch=00000;`,
};

export async function GET() {
  return NextResponse.json(HEADERS_CONFIG, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
