import { cache } from "react";

const REPO = "stevejkang/tokfresh";

export const getStarCount = cache(async (): Promise<number | null> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
});
