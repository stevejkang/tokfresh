"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, AlertTriangle } from "lucide-react";

const DISMISS_KEY = "tokfresh_banner_mar17_dismissed";

export function AnnouncementBanner() {
  const t = useTranslations("Banner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="relative border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-300">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2">
        <AlertTriangle className="hidden h-4 w-4 shrink-0 sm:block" />
        <p>
          <span className="font-medium">{t("title")}</span>
          {" "}
          {t("description")}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-amber-400 transition-colors hover:text-amber-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
