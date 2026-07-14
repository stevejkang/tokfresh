import { ArrowRight, Rocket, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function CtaSection() {
  const t = await getTranslations("Landing");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Rocket className="mx-auto mb-6 h-10 w-10 text-primary" />
        <h2 className="mb-4 text-3xl font-bold tracking-tight">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
          {t("ctaDescription")}
        </p>
        <p className="mx-auto mb-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
          <Shield className="h-3 w-3" />
          {t("ctaPrivacy")}
        </p>
        <Button asChild size="lg" className="h-12 px-8 text-base">
          <Link href="/setup">
            {t("heroCta")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
