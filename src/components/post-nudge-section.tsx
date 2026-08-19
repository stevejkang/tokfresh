"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Shield, X, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

function NudgeContent({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("PostNudge");

  const points: { text: string; href?: string }[] = [
    { text: t("point1") },
    { text: t("point2") },
    { text: t("point3") },
    { text: t("point4") },
    { text: t("point5") },
    { text: t("point6"), href: "https://github.com/stevejkang/tokfresh" },
    { text: t("point7") },
  ];

  return (
    <div>
      <h3
        className={`font-semibold text-foreground ${compact ? "mb-1 text-sm" : "mb-2 text-base"}`}
      >
        {t("title")}
      </h3>
      <p
        className={`text-muted-foreground ${compact ? "mb-4 text-xs" : "mb-5 text-sm"}`}
      >
        {t("subtitle")}
      </p>
      <ul className={`space-y-2 ${compact ? "mb-4" : "mb-5"}`}>
        {points.map((point, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 ${compact ? "text-xs" : "text-sm"}`}
          >
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {point.href ? (
              <a
                href={point.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
              >
                {point.text}
              </a>
            ) : (
              <span className="text-foreground">{point.text}</span>
            )}
          </li>
        ))}
      </ul>
      <Button asChild size={compact ? "sm" : "default"} className="w-full">
        <Link href="/setup?ref=post_nudge">
          {t("cta")}
          <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Link>
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
        <Shield className="h-2.5 w-2.5" />
        {t("privacy")}
      </p>
    </div>
  );
}

/** PC: sticky sidebar right of article */
function DesktopSidebar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollPercent =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.1);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside
      className={`pointer-events-none fixed right-0 top-0 z-40 hidden h-screen xl:block`}
    >
      <div
        className={`pointer-events-auto sticky top-24 mr-6 w-64 transition-all duration-300 2xl:mr-10 ${
          visible
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-4 opacity-0"
        }`}
        style={{
          position: "fixed",
          top: "6rem",
          right: "max(1.5rem, calc((100vw - 48rem) / 2 - 18rem))",
        }}
      >
        <div className="rounded-xl border border-emerald-200 bg-background/95 p-5 shadow-lg backdrop-blur-sm dark:border-emerald-500/20 dark:bg-background/90">
          <NudgeContent compact />
        </div>
      </div>
    </aside>
  );
}

/** Mobile: scroll-triggered bottom popup */
function MobilePopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const onScroll = useCallback(() => {
    if (dismissed) return;
    const scrollPercent =
      window.scrollY /
      (document.documentElement.scrollHeight - window.innerHeight);
    setVisible(scrollPercent > 0.3);
  }, [dismissed]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 xl:hidden transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="relative mx-auto max-w-lg border-t border-emerald-200 bg-background/95 px-5 pb-6 pt-4 shadow-2xl backdrop-blur-sm dark:border-emerald-500/20 dark:bg-background/95 sm:mx-4 sm:mb-4 sm:rounded-xl sm:border">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <NudgeContent compact />
      </div>
    </div>
  );
}

export function PostNudgeSection() {
  return (
    <>
      <DesktopSidebar />
      <MobilePopup />
    </>
  );
}
