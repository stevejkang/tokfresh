"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Github, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const APPEAR_DELAY_MS = 1500;

function StarNudgeContent() {
  const t = useTranslations("StarNudge");

  return (
    <div>
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {t("title")}
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">{t("description")}</p>
      <Button asChild size="sm" variant="outline" className="w-full">
        <a
          href="https://github.com/stevejkang/tokfresh"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="mr-2 h-3.5 w-3.5" />
          {t("cta")}
        </a>
      </Button>
    </div>
  );
}

export function GitHubStarNudge() {
  const t = useTranslations("StarNudge");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  const dismissButton = (
    <button
      onClick={() => setDismissed(true)}
      className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  );

  return (
    <>
      {/* PC & mid-size (sm+): bottom-right floating card */}
      <div
        className={`fixed bottom-6 right-6 z-50 hidden w-72 sm:block transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
        onMouseEnter={() => {
          setHasHovered(true);
          setIsHovering(true);
        }}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className={`pointer-events-none absolute -top-9 right-0 rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md transition-opacity duration-150 ${
            isHovering ? "opacity-100" : "opacity-0"
          }`}
        >
          {t("hoverTooltip")}
        </div>
        <div
          className={`relative rounded-xl border border-border bg-background/95 p-5 shadow-lg backdrop-blur-sm ${
            visible && !hasHovered ? "animate-bounce-subtle" : ""
          }`}
        >
          {dismissButton}
          <StarNudgeContent />
        </div>
      </div>

      {/* Mobile (<sm): bottom popup */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 sm:hidden transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="relative border-t border-border bg-background/95 px-5 pb-6 pt-4 shadow-2xl backdrop-blur-sm">
          {dismissButton}
          <StarNudgeContent />
        </div>
      </div>
    </>
  );
}
