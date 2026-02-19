const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";

async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return { verifier, challenge };
}

export async function generateAuthUrl(): Promise<{
  url: string;
  verifier: string;
}> {
  const pkce = await generatePKCE();

  const url = new URL("https://claude.ai/oauth/authorize");
  url.searchParams.set("code", "true");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set(
    "scope",
    "org:create_api_key user:profile user:inference",
  );
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", pkce.verifier);

  return { url: url.toString(), verifier: pkce.verifier };
}

export async function exchangeCode(
  code: string,
  verifier: string,
): Promise<{
  success: boolean;
  refreshToken?: string;
  accessToken?: string;
  error?: string;
}> {
  try {
    const response = await fetch("/api/auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, verifier }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      return {
        success: false,
        error: json?.error ?? `Token exchange failed (${response.status})`,
      };
    }

    const json = await response.json();
    return {
      success: true,
      refreshToken: json.refresh_token,
      accessToken: json.access_token,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
