import { Github, Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Landing");

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <span className="text-sm text-muted-foreground">
          {t("footerMadeWith")}{" "}
          <Heart className="inline h-3.5 w-3.5 fill-current text-red-500" />{" "}
          {t("footerBy")}{" "}
          <a
            href="https://github.com/stevejkang"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-foreground"
          >
            stevejkang
          </a>
          {" "}&copy; {new Date().getFullYear()}
        </span>
        <a
          href="https://github.com/stevejkang/tokfresh"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </footer>
  );
}
