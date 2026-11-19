import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

export interface ReminderClaims {
  claudeEmail: string;
  expiresAt: number;
}

interface TokenPayload extends ReminderClaims {
  issuedAt: number;
}

function sign(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function issueReminderToken(claims: ReminderClaims, secret: string): string {
  const payload: TokenPayload = { ...claims, issuedAt: Date.now() };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, secret).toString("base64url")}`;
}

export function verifyReminderToken(token: unknown, secret: string): ReminderClaims | null {
  if (typeof token !== "string") return null;
  const [data, signature, ...rest] = token.split(".");
  if (!data || !signature || rest.length > 0) return null;

  const expected = sign(data, secret);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  let payload: Partial<TokenPayload>;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const { claudeEmail, expiresAt, issuedAt } = payload;
  if (typeof claudeEmail !== "string" || typeof expiresAt !== "number" || typeof issuedAt !== "number") {
    return null;
  }
  if (Date.now() - issuedAt > TOKEN_TTL_MS) return null;

  return { claudeEmail, expiresAt };
}
