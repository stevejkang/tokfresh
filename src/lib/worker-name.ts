// Worker names become a DNS label on workers.dev: only a-z, 0-9 and "-",
// at most 63 characters, no leading/trailing "-".
// https://developers.cloudflare.com/workers/configuration/routing/workers-dev/#limitations
// KV namespace titles (max 512 chars, any characters) reuse the same name.
const PREFIX = "tokfresh";
const MAX_LENGTH = 63;
const HASH_LENGTH = 6;

// Emails are treated case-insensitively. Slugifying alone collides
// (a.b@x.com vs a_b@x.com) and truncation can collide too, so a hash of the
// normalized email is appended. The result is deterministic, so re-running
// setup with the same account overwrites the same worker and KV namespace.
export async function getWorkerName(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, HASH_LENGTH);

  const maxSlugLength = MAX_LENGTH - PREFIX.length - HASH_LENGTH - 2;
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, maxSlugLength)
    .replace(/^-+|-+$/g, "");

  return slug ? `${PREFIX}-${slug}-${hash}` : `${PREFIX}-${hash}`;
}
