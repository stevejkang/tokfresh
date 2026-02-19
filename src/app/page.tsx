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
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Timer,
  Cloud,
  Link2,
  CalendarClock,
  Rocket,
  Github,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-sm">
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
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            The Problem
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Claude resets your tokens 5 hours after your first use. Without
            planning, you waste peak hours waiting.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Before */}
            <Card className="border-destructive/20 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Before TokFresh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>10:00 - First Claude use</span>
                  </div>
                  <div className="ml-7 border-l-2 border-dashed border-muted-foreground/30 py-2 pl-4 text-muted-foreground">
                    Token timer starts...
                  </div>
                  <div className="flex items-start gap-3">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-destructive">
                      14:00 - Tokens exhausted
                    </span>
                  </div>
                  <div className="ml-7 border-l-2 border-dashed border-destructive/30 py-2 pl-4 text-destructive">
                    1 hour waiting...
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>15:00 - Token reset</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* After */}
            <Card className="border-primary/20 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  After TokFresh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>06:00 - Auto API call</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>11:00 - Reset / Auto API call</span>
                  </div>
                  <div className="ml-7 border-l-2 border-dashed border-primary/30 py-2 pl-4 text-primary">
                    Full coverage during work hours
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>16:00 - Reset / Auto API call</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>21:00 - Reset / Auto API call</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <Card className="bg-white">
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

            <Card className="bg-white">
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

            <Card className="bg-white">
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
