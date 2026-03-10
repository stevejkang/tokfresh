import { Github, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getStarCount } from "@/lib/github";

export async function GitHubStarButton() {
  const [stars, t] = await Promise.all([
    getStarCount(),
    getTranslations("Nav"),
  ]);

  return (
    <a
      href="https://github.com/stevejkang/tokfresh"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
    >
      <Github className="h-4 w-4" />
      <Star className="hidden h-3 w-3 sm:block" />
      <span className="hidden sm:inline">{t("star")}</span>
      {stars !== null && (
        <>
          <span className="mx-0.5 hidden h-3 w-px bg-border sm:block" />
          <span className="hidden tabular-nums sm:inline">{stars.toLocaleString()}</span>
        </>
      )}
    </a>
  );
}
