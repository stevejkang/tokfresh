const REPO = "stevejkang/tokfresh";

export async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
}
