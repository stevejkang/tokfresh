import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Zap,
  Shield,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Cloud,
  Link2,
  CalendarClock,
  Rocket,
  Github,
  Heart,
} from "lucide-react";
import { GitHubStarButton } from "@/components/github-star-button";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Landing");
  const tNav = await getTranslations("Nav");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            TokFresh
          </Link>
          <div className="flex items-center gap-3" aria-label={tNav("star")}>
            <GitHubStarButton />
            <LanguageSwitcher />
            <Button asChild size="sm">
              <Link href="/setup">{tNav("getStarted")}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("heroTitle1")}
            <br />
            {t("heroTitle2")}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            {t("heroDescription")}
          </p>
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/setup">
              {t("heroCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            {t("problemTitle")}
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-muted-foreground">
            {t("problemSubtitle")}
            <span className="font-medium text-foreground">{t("problemHighlight")}</span>
          </p>

          <div className="space-y-8">
            {/* Without TokFresh */}
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <XCircle className="h-4 w-4 text-red-500" />
                {t("withoutTokFresh")}
              </div>

              <div className="flex items-stretch gap-2.5">
                <div className="flex h-[4.5rem] flex-[5] items-center justify-center rounded-xl border border-border bg-muted">
                  <div className="text-center">
                    <div className="text-xs font-medium text-foreground">
                      {t("session")}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {t("limitReached")}
                    </div>
                  </div>
                </div>

                <div className="flex h-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 dark:border-red-500/20 dark:bg-red-950/40">
                  <span className="text-base leading-none">⏳</span>
                  <span className="mt-1 text-[9px] font-medium text-red-600 dark:text-red-400">
                    {t("wait")}
                  </span>
                </div>

                <div className="flex h-[4.5rem] flex-[3] items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
                  <span className="text-[10px] text-muted-foreground">
                    {t("restOfWork")}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-red-600/80 dark:text-red-400/80">
                {t("withoutDescription")}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
              <div className="h-px flex-1 bg-border" />
              <span className="shrink-0">{t("sameWork")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* With TokFresh */}
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {t("withTokFresh")}
              </div>

              <div className="flex h-[4.5rem] items-stretch overflow-hidden rounded-xl border border-emerald-200 shadow-sm dark:border-emerald-500/20 dark:shadow-emerald-500/5">
                <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {t("session1")}
                  </span>
                </div>
                <div className="flex w-12 shrink-0 flex-col items-center justify-center bg-emerald-100 dark:bg-emerald-500/25 dark:shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                  <span className="text-sm font-bold leading-none text-emerald-700 dark:text-emerald-300">
                    ↻
                  </span>
                  <span className="mt-0.5 text-[8px] font-medium text-emerald-600/60 dark:text-emerald-400/60">
                    {t("refresh")}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {t("session2")}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {t("withHighlight")}
                </span>{" "}
                {t("withDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            {t("featuresTitle")}
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            {t("featuresSubtitle")}
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("feature1Title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {t("feature1Description")}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("feature2Title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {t("feature2Description")}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("feature3Title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {t("feature3Description")}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            {t("howTitle")}
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            {t("howSubtitle")}
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                1
              </div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t("how1Title")}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t("how1Description")}</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                2
              </div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t("how2Title")}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t("how2Description")}</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                3
              </div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t("how3Title")}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t("how3Description")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Rocket className="mx-auto mb-6 h-10 w-10 text-primary" />
          <h2 className="mb-4 text-3xl font-bold tracking-tight">{t("ctaTitle")}</h2>
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

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            {t("faqTitle")}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="change-schedule">
              <AccordionTrigger>{t("faq1Question")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq1Answer")}
                <a
                  href="https://dash.cloudflare.com/?to=/:account/workers/services/view/tokfresh-scheduler/production/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {t("faq1Link")}
                </a>
                .
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delete-worker">
              <AccordionTrigger>{t("faq2Question")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq2Answer1")}
                <a
                  href="https://dash.cloudflare.com/?to=/:account/workers/services/view/tokfresh-scheduler/production/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {t("faq2Link")}
                </a>
                {t("faq2Answer2")}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {t("faq2Code")}
                </code>
                {t("faq2Answer3")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <span className="text-sm text-muted-foreground">
            {t("footerMadeWith")} {" "}
            <Heart className="inline h-3.5 w-3.5 fill-current text-red-500" /> {" "}
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
    </div>
  );
}
