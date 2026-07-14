import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { GitHubStarButton } from "@/components/github-star-button";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function SiteHeader({
  showGitHubStars = true,
}: {
  showGitHubStars?: boolean;
} = {}) {
  const tNav = await getTranslations("Nav");

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TokFresh
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/posts"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            {tNav("posts")}
          </Link>
          {showGitHubStars && <GitHubStarButton />}
          <LanguageSwitcher />
          <Button asChild size="sm">
            <Link href="/setup">{tNav("getStarted")}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
