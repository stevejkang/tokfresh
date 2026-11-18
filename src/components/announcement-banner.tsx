"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";

const DISMISS_KEY = "tokfresh_banner_nov2026_dismissed";

const subscribe = () => () => {};
const getDismissedSnapshot = () => localStorage.getItem(DISMISS_KEY) !== null;
const getServerDismissedSnapshot = () => true;

export function AnnouncementBanner() {
  const t = useTranslations("Banner");
  const storedDismissed = useSyncExternalStore(subscribe, getDismissedSnapshot, getServerDismissedSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (storedDismissed || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="relative border-b border-border bg-muted/50 px-10 py-2.5 text-center text-sm text-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <Sparkles className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
        <p>
          <span className="font-medium">{t("title")}</span>
          {" "}
          <span className="text-muted-foreground">{t("description")}</span>
          {" "}
          <Link
            href="/posts/product-updates-november-2026"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            {t("learnMore")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
