"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const otherLocale = locale === "en" ? "ko" : "en";
  const label = locale === "en" ? "한국어" : "English";

  return (
    <button
      onClick={() => router.replace(pathname, { locale: otherLocale })}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Globe className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
