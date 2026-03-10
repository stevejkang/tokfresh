import { Github, Star } from "lucide-react";
import { getStarCount } from "@/lib/github";

export async function GitHubStarButton() {
  const stars = await getStarCount();

  return (
    <a
      href="https://github.com/stevejkang/tokfresh"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Github className="h-4 w-4" />
      <Star className="h-3 w-3" />
      Star
      {stars !== null && (
        <>
          <span className="mx-0.5 h-3 w-px bg-border" />
          <span className="tabular-nums">{stars.toLocaleString()}</span>
        </>
      )}
    </a>
  );
}
