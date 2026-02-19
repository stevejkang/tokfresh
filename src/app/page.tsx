import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            TokFresh
          </Link>
          <Button asChild size="sm">
            <Link href="/setup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            Free forever. No API keys needed.
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Automate Your Claude
            <br />
            Token Reset Timing
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Never wait for token resets again. Schedule automatic API calls to
            start your 5-hour cycle exactly when you want.
          </p>
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/setup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Your workday, optimized
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-muted-foreground">
            Same work, same session limit.{" "}
            <span className="font-medium text-foreground">
              Zero interruption.
            </span>
          </p>

          <div className="space-y-8">
            {/* Without TokFresh */}
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <XCircle className="h-4 w-4 text-red-500" />
                Without TokFresh
              </div>

              <div className="flex items-stretch gap-2.5">
                <div className="flex h-[4.5rem] flex-[5] items-center justify-center rounded-xl border border-zinc-700/40 bg-zinc-800/60">
                  <div className="text-center">
                    <div className="text-xs font-medium text-zinc-300">
                      Session
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">
                      limit reached
                    </div>
                  </div>
                </div>

                <div className="flex h-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-950/40 px-5">
                  <span className="text-base leading-none">⏳</span>
                  <span className="mt-1 text-[9px] font-medium text-red-400">
                    wait
                  </span>
                </div>

                <div className="flex h-[4.5rem] flex-[3] items-center justify-center rounded-xl border border-dashed border-zinc-700/40 bg-zinc-800/20">
                  <span className="text-[10px] text-zinc-500">
                    rest of work
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-red-400/80">
                Hit the limit mid-task. Wait hours, then finish the rest.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
              <div className="h-px flex-1 bg-border" />
              <span className="shrink-0">↓ Same work</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* With TokFresh */}
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                With TokFresh
              </div>

              <div className="flex h-[4.5rem] items-stretch overflow-hidden rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                <div className="flex flex-1 items-center justify-center bg-emerald-500/10">
                  <span className="text-xs font-medium text-emerald-300">
                    Session 1
                  </span>
                </div>
                <div className="flex w-12 shrink-0 flex-col items-center justify-center bg-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                  <span className="text-sm font-bold leading-none text-emerald-300">
                    ↻
                  </span>
                  <span className="mt-0.5 text-[8px] font-medium text-emerald-400/60">
                    refresh
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center bg-emerald-500/10">
                  <span className="text-xs font-medium text-emerald-300">
                    Session 2
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs font-medium text-emerald-400">
                Limit refreshes mid-work. No interruption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Why TokFresh?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Set it once and forget. Works 24/7, even when your computer is off.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">24/7 Automatic</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Computer off? No problem. Cloudflare Workers run on the edge,
                automatically triggering your token timer on schedule.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Zero Cost</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Cloudflare free tier gives you 100,000 requests/day. You use 5.
                Combined with your existing Claude subscription: $0/month.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Secure by Design</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                OAuth only, no API keys. Tokens stored encrypted in YOUR
                Cloudflare account. Our service never sees your credentials.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            3 minutes to set up. Zero maintenance after that.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                1
              </div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Connect Claude</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                One-click OAuth with your Claude Pro or Max subscription. No API
                keys needed.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                2
              </div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Set Your Schedule</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose when your 5-hour cycles start. We auto-calculate the full
                daily schedule.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                3
              </div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Deploy to Cloudflare</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Auto-deploy a worker to your free Cloudflare account. Runs
                forever at zero cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Rocket className="mx-auto mb-6 h-10 w-10 text-primary" />
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Ready to optimize your Claude workflow?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            Set up in 3 minutes. Free forever. Your computer can be off.
          </p>
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/setup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <span className="text-sm text-muted-foreground">
            TokFresh &copy; {new Date().getFullYear()}
          </span>
          <a
            href="https://github.com"
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
