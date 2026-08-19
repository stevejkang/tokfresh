"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GitHubStarNudge } from "@/components/github-star-nudge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Shield,
  Globe,
  CheckCircle2,
  XCircle,
  Info,
  Copy,
  Mail,
} from "lucide-react";
import { type SetupState, INITIAL_SETUP_STATE } from "@/lib/types";
import { generateAuthUrl, exchangeCode } from "@/lib/claude-oauth";
import {
  ACTIVE_TRIGGER_COUNT,
  calculateSchedule,
  getResetTime,
  timeToCron,
  getNextTrigger,
  detectTimezone,
} from "@/lib/schedule";
import { generateWorkerCode } from "@/lib/worker-template";
import {
  verifyCloudflareToken,
  deployWorker,
} from "@/lib/cloudflare-api";
import { trackEvent } from "@/lib/analytics";

const STEP_TITLES_EN = [
  "Connect Claude",
  "Configure Schedule",
  "Notifications",
  "Deploy",
];

function categorizeError(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes("network") || lower.includes("fetch")) return "network_error";
  if (lower.includes("unauthorized") || lower.includes("403") || lower.includes("invalid token")) return "auth_failed";
  if (lower.includes("rate limit") || lower.includes("429")) return "rate_limited";
  if (lower.includes("timeout")) return "timeout";
  if (lower.includes("subdomain") || lower.includes("10063")) return "subdomain_not_configured";
  if (lower.includes("not found") || lower.includes("404")) return "not_found";
  return "unknown";
}

function SetupPageContent() {
  const t = useTranslations("Setup");
  const tFaq = useTranslations("SetupFaq");
  const tLanding = useTranslations("Landing");
  const stepTitles = [t("stepConnect"), t("stepSchedule"), t("stepNotifications"), t("stepDeploy")];

  const searchParams = useSearchParams();
  const referrer = searchParams.get("ref") || "direct";
  const isFromPost = referrer.startsWith("post_") || referrer.startsWith("cta_post_");

  const [state, setState] = useState<SetupState>(INITIAL_SETUP_STATE);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [onboardingInitialized, setOnboardingInitialized] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [oauthOpened, setOauthOpened] = useState(false);
  const [deployProgress, setDeployProgress] = useState<string[]>([]);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "submitting" | "success" | "already" | "error">("idle");
  const trackedSteps = useRef(new Set<number>());
  const trackedActions = useRef(new Set<string>());
  const deployAttemptRef = useRef(0);

  const trackSetupEvent = useMemo(() => {
    return (action: string, params?: Record<string, string | number>) => {
      trackEvent({ action, params: { ...params, referrer } });
    };
  }, [referrer]);

  useEffect(() => {
    if (!onboardingInitialized) {
      setOnboardingInitialized(true);
      if (isFromPost) {
        setOnboardingStep(1);
        trackSetupEvent("setup_onboarding_started", { referrer });
      }
    }
  }, [isFromPost, onboardingInitialized, trackSetupEvent, referrer]);

  useEffect(() => {
    setState((prev) => ({ ...prev, timezone: detectTimezone() }));
    trackSetupEvent("setup_started");
  }, [trackSetupEvent]);

  useEffect(() => {
    if (trackedSteps.current.has(state.step)) return;
    trackedSteps.current.add(state.step);

    if (state.step <= 4) {
      trackSetupEvent("setup_step_viewed", { step: state.step, step_name: STEP_TITLES_EN[state.step - 1] });
    }

    if (state.step === 5) {
      trackSetupEvent("setup_completed");
    }
  }, [state.step, trackSetupEvent]);

  const update = useCallback(
    (partial: Partial<SetupState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    [],
  );

  const schedule = calculateSchedule(state.startTime);

  const handleConnectClaude = async () => {
    const { url, verifier } = await generateAuthUrl();
    sessionStorage.setItem("tokfresh_verifier", verifier);
    window.open(url, "_blank", "noopener");
    setOauthOpened(true);
    trackSetupEvent("setup_oauth_window_opened");
  };

  const handleExchangeCode = async () => {
    trackSetupEvent("setup_oauth_code_submitted");

    const verifier = sessionStorage.getItem("tokfresh_verifier");
    if (!verifier) {
      setExchangeError("Session expired. Please connect Claude again.");
      trackSetupEvent("setup_oauth_exchange_error", { error_type: "session_expired" });
      return;
    }

    setIsExchanging(true);
    setExchangeError(null);

    const result = await exchangeCode(authCode, verifier);

    if (result.success) {
      sessionStorage.removeItem("tokfresh_verifier");
      update({
        claudeRefreshToken: result.refreshToken ?? null,
        claudeAccessToken: result.accessToken ?? null,
        step: 2,
      });
      trackSetupEvent("setup_oauth_exchange_success");
    } else {
      setExchangeError(result.error ?? "Failed to verify code");
      trackSetupEvent("setup_oauth_exchange_error", { error_type: "exchange_failed" });
    }

    setIsExchanging(false);
  };

  const handleScheduleContinue = () => {
    if (!trackedActions.current.has("schedule_configured")) {
      trackedActions.current.add("schedule_configured");
      trackSetupEvent("setup_schedule_configured", { start_time: state.startTime, timezone: state.timezone });
    }
    update({ step: 3 });
  };

  const handleNotificationContinue = () => {
    if (!trackedActions.current.has("notification_configured")) {
      trackedActions.current.add("notification_configured");
      trackSetupEvent("setup_notification_configured", { type: state.notificationType, failure_only: state.notifyOnFailureOnly ? "true" : "false" });
    }
    update({ step: 4 });
  };

  const handleDeploy = async () => {
    if (!state.cloudflareApiToken || !state.claudeRefreshToken) return;

    deployAttemptRef.current += 1;
    const attempt = deployAttemptRef.current;

    trackSetupEvent("setup_deploy_initiated", { attempt });
    update({ deploymentStatus: "deploying", deploymentError: null, deploymentErrorCode: null });
    setDeployProgress(["Verifying Cloudflare token..."]);

    const verification = await verifyCloudflareToken(state.cloudflareApiToken);

    if (!verification.valid) {
      const error = verification.error ?? "Token verification failed";
      update({
        deploymentStatus: "error",
        deploymentError: error,
      });
      trackSetupEvent("setup_cf_verify_error", { error_type: categorizeError(error), attempt });
      return;
    }

    const accountId = verification.accountId!;
    update({ cloudflareAccountId: accountId });
    setDeployProgress((prev) => [...prev, "Token verified"]);
    trackSetupEvent("setup_cf_verify_success", { attempt });

    const cronExpression = timeToCron(schedule, state.timezone);
    const workerCode = generateWorkerCode();

    let notificationConfig: string | undefined;
    if (state.notificationType !== "none" && state.notificationWebhook) {
      const config: Record<string, string | boolean> = {};
      if (state.notificationType === "slack") {
        config.slackWebhook = state.notificationWebhook;
      } else {
        config.discordWebhook = state.notificationWebhook;
      }
      if (state.notifyOnFailureOnly) {
        config.failureOnly = true;
      }
      notificationConfig = JSON.stringify(config);
    }

    const result = await deployWorker({
      apiToken: state.cloudflareApiToken,
      accountId,
      workerCode,
      refreshToken: state.claudeRefreshToken,
      schedule: cronExpression,
      timezone: state.timezone,
      notificationConfig,
      enableLogs: state.enableLogs,
      enableTraces: state.enableTraces,
      onProgress: (step) => setDeployProgress((prev) => [...prev, step]),
    });

    if (result.success) {
      update({ deploymentStatus: "success", step: 5 });
      trackSetupEvent("setup_deploy_success", { attempt });
    } else {
      const error = result.error ?? "Deployment failed";
      const errorCode = result.errorCode ?? null;
      update({
        deploymentStatus: "error",
        deploymentError: error,
        deploymentErrorCode: errorCode,
      });
      const params: Record<string, string | number> = { error_type: categorizeError(error), attempt };
      if (errorCode != null) params.error_code = errorCode;
      trackSetupEvent("setup_deploy_error", params);
    }
  };

  const handleSubscribe = async () => {
    if (!subscribeEmail.trim()) return;

    trackSetupEvent("setup_subscribe_submitted");
    setSubscribeStatus("submitting");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        const status = data.alreadySubscribed ? "already" : "success";
        setSubscribeStatus(status);
        trackSetupEvent("setup_subscribe_result", { result: status });
      } else {
        setSubscribeStatus("error");
        trackSetupEvent("setup_subscribe_result", { result: "error" });
      }
    } catch {
      setSubscribeStatus("error");
      trackSetupEvent("setup_subscribe_result", { result: "error" });
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep === null) return;
    if (onboardingStep >= 3) {
      trackSetupEvent("setup_onboarding_completed");
      setOnboardingStep(null);
    } else {
      setOnboardingStep(onboardingStep + 1);
    }
  };

  const handleOnboardingSkip = () => {
    trackSetupEvent("setup_onboarding_skipped", { at_step: onboardingStep ?? 0 });
    setOnboardingStep(null);
  };

  const renderOnboarding = () => {
    if (onboardingStep === null) return null;

    return (
      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    s <= onboardingStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleOnboardingSkip}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("onboardingSkip")}
            </button>
          </div>
          <CardTitle className="text-xl">
            {onboardingStep === 1 && t("onboardingStep1Title")}
            {onboardingStep === 2 && t("onboardingStep2Title")}
            {onboardingStep === 3 && t("onboardingStep3Title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {onboardingStep === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                {t("onboardingStep1Description")}
              </p>

              <div className="space-y-6">
                {/* Scenario 1: Start at 9 AM — 2T */}
                <div>
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {tLanding("tokenMathScenario1Label")}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
                        {tLanding("tokenMathScenario1Tag")}
                      </span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-muted-foreground">
                      2T{" "}
                      <span className="font-normal text-muted-foreground/70">
                        {tLanding("tokenMathAvailable")}
                      </span>
                    </div>
                  </div>

                  <div className="mb-1.5 flex items-stretch">
                    <div className="flex-[3]" />
                    <div className="flex h-5 flex-[9] items-center justify-center rounded-md border border-dashed border-muted-foreground/50 dark:border-muted-foreground/55">
                      <span className="text-[9px] font-medium tracking-wide text-muted-foreground/80 dark:text-muted-foreground/80">
                        9–18 {tLanding("tokenMathWorkingHours")}
                      </span>
                    </div>
                    <div className="hidden flex-[3] sm:block" />
                  </div>

                  <div className="flex items-stretch gap-1">
                    <div className="flex h-14 flex-[3] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <span className="hidden text-[10px] text-muted-foreground/40 sm:inline">
                        {tLanding("tokenMathIdle")}
                      </span>
                    </div>
                    <div className="flex h-14 flex-[5] items-center justify-center rounded-lg border border-border bg-muted">
                      <div className="text-center">
                        <div className="text-xs font-medium text-foreground">
                          {tLanding("tokenMathSession")} 1
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          9–14
                        </div>
                      </div>
                    </div>
                    <div className="flex h-14 flex-[5] items-center justify-center rounded-lg border border-border bg-muted">
                      <div className="text-center">
                        <div className="text-xs font-medium text-foreground">
                          {tLanding("tokenMathSession")} 2
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          14–19
                        </div>
                      </div>
                    </div>
                    <div className="hidden h-14 flex-[2] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 sm:flex" />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                  <div className="h-px flex-1 bg-border" />
                  <span className="shrink-0">↓</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Scenario 2: Start at 6 AM — 3T */}
                <div>
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {tLanding("tokenMathScenario2Label")}
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {tLanding("tokenMathScenario2Tag")}
                      </span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      3T{" "}
                      <span className="font-normal text-emerald-600/70 dark:text-emerald-400/70">
                        {tLanding("tokenMathAvailable")}
                      </span>
                    </div>
                  </div>

                  <div className="mb-1.5 flex items-stretch">
                    <div className="flex-[3]" />
                    <div className="flex h-5 flex-[9] items-center justify-center rounded-md border border-dashed border-muted-foreground/50 dark:border-muted-foreground/55">
                      <span className="text-[9px] font-medium tracking-wide text-muted-foreground/80 dark:text-muted-foreground/80">
                        9–18 {tLanding("tokenMathWorkingHours")}
                      </span>
                    </div>
                    <div className="flex-[3]" />
                  </div>

                  <div className="flex h-14 items-stretch overflow-hidden rounded-xl border border-emerald-200 shadow-sm dark:border-emerald-500/20 dark:shadow-emerald-500/5">
                    <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                      <div className="text-center">
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {tLanding("tokenMathSession")} 1
                        </div>
                        <div className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">
                          6–11
                        </div>
                      </div>
                    </div>
                    <div className="w-px bg-emerald-200 dark:bg-emerald-500/30" />
                    <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                      <div className="text-center">
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {tLanding("tokenMathSession")} 2
                        </div>
                        <div className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">
                          11–16
                        </div>
                      </div>
                    </div>
                    <div className="w-px bg-emerald-200 dark:bg-emerald-500/30" />
                    <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                      <div className="text-center">
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {tLanding("tokenMathSession")} 3
                        </div>
                        <div className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">
                          16–21
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Punchline */}
              <div className="text-center">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {tLanding("tokenMathPunchline")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tLanding("tokenMathPunchlineDetail")}
                </p>
              </div>
            </>
          )}

          {onboardingStep === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                {t("onboardingStep2Description")}
              </p>

              <div className="space-y-6">
                {/* Without TokFresh */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {tLanding("withoutTokFresh")}
                  </div>

                  <div className="flex items-stretch gap-2.5">
                    <div className="flex h-[4.5rem] flex-[5] items-center justify-center rounded-xl border border-border bg-muted">
                      <div className="text-center">
                        <div className="text-xs font-medium text-foreground">
                          {tLanding("session")}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {tLanding("limitReached")}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 dark:border-red-500/20 dark:bg-red-950/40">
                      <span className="text-base leading-none">⏳</span>
                      <span className="mt-1 text-[9px] font-medium text-red-600 dark:text-red-400">
                        {tLanding("wait")}
                      </span>
                    </div>

                    <div className="flex h-[4.5rem] flex-[3] items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
                      <span className="text-[10px] text-muted-foreground">
                        {tLanding("restOfWork")}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-red-600/80 dark:text-red-400/80">
                    {tLanding("withoutDescription")}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                  <div className="h-px flex-1 bg-border" />
                  <span className="shrink-0">{tLanding("sameWork")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* With TokFresh */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {tLanding("withTokFresh")}
                  </div>

                  <div className="flex h-[4.5rem] items-stretch overflow-hidden rounded-xl border border-emerald-200 shadow-sm dark:border-emerald-500/20 dark:shadow-emerald-500/5">
                    <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        {tLanding("session1")}
                      </span>
                    </div>
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center bg-emerald-100 dark:bg-emerald-500/25 dark:shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                      <span className="text-sm font-bold leading-none text-emerald-700 dark:text-emerald-300">
                        ↻
                      </span>
                      <span className="mt-0.5 text-[8px] font-medium text-emerald-600/60 dark:text-emerald-400/60">
                        {tLanding("refresh")}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        {tLanding("session2")}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {tLanding("withHighlight")}
                    </span>{" "}
                    {tLanding("withDescription")}
                  </p>
                </div>
              </div>
            </>
          )}

          {onboardingStep === 3 && (
            <>
              <div className="space-y-4">
                {[t("onboardingStep3Point1"), t("onboardingStep3Point2"), t("onboardingStep3Point3")].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{point}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{t("onboardingStep3Safety")}</span>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleOnboardingNext}>
            {onboardingStep >= 3 ? t("onboardingStart") : t("onboardingNext")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t("stepOf", { step: Math.min(state.step, 4), total: 4 })}
        </span>
        <span>{stepTitles[Math.min(state.step, 4) - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= state.step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t("step1Title")}
        </CardTitle>
        <CardDescription>
          {t("step1Description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("step1RequiresTitle")}</AlertTitle>
          <AlertDescription>
            {t("step1RequiresDescription")}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button
            onClick={handleConnectClaude}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("step1Connect")}
          </Button>

          {oauthOpened && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                {t("step1AfterAuth")}
              </p>
              <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  {t("step1Privacy")}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-code">{t("step1CodeLabel")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="auth-code"
                    placeholder={t("step1CodePlaceholder")}
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                  <Button
                    onClick={handleExchangeCode}
                    disabled={!authCode.trim() || isExchanging}
                  >
                    {isExchanging ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("step1Verify")
                    )}
                  </Button>
                </div>
              </div>

              {exchangeError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{exchangeError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("step2Title")}
        </CardTitle>
        <CardDescription>
          {t("step2Description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("step2StartHour")}</Label>
            <Select
              value={state.startTime.split(":")[0]}
              onValueChange={(h) =>
                update({
                  startTime: `${h}:${state.startTime.split(":")[1]}`,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem
                    key={i}
                    value={i.toString().padStart(2, "0")}
                  >
                    {i.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("step2StartMinute")}</Label>
            <Select
              value={state.startTime.split(":")[1]}
              onValueChange={(m) =>
                update({
                  startTime: `${state.startTime.split(":")[0]}:${m}`,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">00</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>{t("step2Timezone", { timezone: state.timezone })}</span>
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-sm font-medium">{t("step2ScheduleTitle")}</h4>
          <div className="space-y-2">
            {schedule.map((time, i) => {
              const isInactive = i >= ACTIVE_TRIGGER_COUNT;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-mono ${
                    isInactive
                      ? "bg-muted/30 opacity-50"
                      : "bg-muted/50"
                  }`}
                >
                  {isInactive ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className={isInactive ? "text-muted-foreground line-through" : "font-semibold"}>{time}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("step2ResetAt", { time: getResetTime(time) })}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("step2SkipNote")}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => update({ step: 1 })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        <Button onClick={handleScheduleContinue}>
          {t("continue")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t("step3Title")}</CardTitle>
        <CardDescription>
          {t("step3Description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={state.notificationType}
          onValueChange={(v) =>
            update({
              notificationType: v as SetupState["notificationType"],
              notificationWebhook:
                v === "none" ? "" : state.notificationWebhook,
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none">{t("step3None")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="slack" id="slack" />
            <Label htmlFor="slack">{t("step3Slack")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="discord" id="discord" />
            <Label htmlFor="discord">{t("step3Discord")}</Label>
          </div>
        </RadioGroup>

        {state.notificationType !== "none" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">
                {t("step3WebhookLabel", { platform: state.notificationType === "slack" ? "Slack" : "Discord" })}
              </Label>
              <Input
                id="webhook-url"
                placeholder={
                  state.notificationType === "slack"
                    ? "https://hooks.slack.com/services/..."
                    : "https://discord.com/api/webhooks/..."
                }
                value={state.notificationWebhook}
                onChange={(e) =>
                  update({ notificationWebhook: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("step3WhenToNotify")}</Label>
              <RadioGroup
                value={state.notifyOnFailureOnly ? "failure" : "all"}
                onValueChange={(v) =>
                  update({ notifyOnFailureOnly: v === "failure" })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="notify-all" />
                  <Label htmlFor="notify-all">{t("step3NotifyAll")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="failure" id="notify-failure" />
                  <Label htmlFor="notify-failure">{t("step3NotifyFailure")}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => update({ step: 2 })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        <Button onClick={handleNotificationContinue}>
          {t("continue")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t("step4Title")}</CardTitle>
        <CardDescription>
          {t("step4Description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">{t("step4TokenTitle")}</h4>
            <p className="text-sm text-muted-foreground">{t("step4TokenDescription")}</p>
          </div>
          <a
            href={`https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=${encodeURIComponent(JSON.stringify([{key:"workers_scripts",type:"edit"},{key:"workers_kv_storage",type:"edit"},{key:"account_settings",type:"read"}]))}&name=TokFresh`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("step4CreateToken")}
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">{t("step4TokenAfter")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cf-token">{t("step4Label")}</Label>
          <Input
            id="cf-token"
            type="password"
            placeholder={t("step4Placeholder")}
            value={state.cloudflareApiToken}
            onChange={(e) =>
              update({ cloudflareApiToken: e.target.value })
            }
            disabled={state.deploymentStatus === "deploying"}
          />
          <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            <Shield className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              {t("step4Privacy")}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t("step4ObservabilityTitle")}</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-logs"
                checked={state.enableLogs}
                onCheckedChange={(checked) =>
                  update({ enableLogs: checked === true })
                }
                disabled={state.deploymentStatus === "deploying"}
              />
              <Label htmlFor="enable-logs" className="text-sm font-normal">
                {t("step4EnableLogs")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-traces"
                checked={state.enableTraces}
                onCheckedChange={(checked) =>
                  update({ enableTraces: checked === true })
                }
                disabled={state.deploymentStatus === "deploying"}
              />
              <Label htmlFor="enable-traces" className="text-sm font-normal">
                {t("step4EnableTraces")}
              </Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("step4ObservabilityDescription")}
          </p>
        </div>

        {state.deploymentStatus === "deploying" && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
            {deployProgress.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {i === deployProgress.length - 1 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {state.deploymentStatus === "error" && state.deploymentErrorCode === 10063 && (
          <Alert className="border-amber-500/50 text-amber-500 [&>svg]:text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("step4SubdomainTitle")}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p className="text-sm">
                {t("step4SubdomainDescription")}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="https://dash.cloudflare.com/?to=/:account/workers-and-pages"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    {t("step4OpenDashboard")}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <Button size="sm" onClick={handleDeploy}>
                  {t("step4Retry")}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {state.deploymentStatus === "error" && state.deploymentErrorCode !== 10063 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.deploymentError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => update({ step: 3 })}
          disabled={state.deploymentStatus === "deploying"}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        <Button
          onClick={handleDeploy}
          disabled={
            !state.cloudflareApiToken.trim() ||
            state.deploymentStatus === "deploying"
          }
        >
          {state.deploymentStatus === "deploying" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("step4Deploying")}
            </>
          ) : (
            t("step4Deploy")
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSuccess = () => {
    const nextTrigger = getNextTrigger(schedule, state.timezone);
    const cronExpression = timeToCron(schedule, state.timezone);

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
          <CardDescription>
            {t("successDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("successWorker")}</span>
                <span className="font-mono font-medium">
                  tokfresh-scheduler
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("successNextTrigger")}</span>
                <span className="font-medium">{nextTrigger.label}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("successCron")}</span>
                <span className="font-mono text-xs">{cronExpression}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium">{t("successScheduleTitle")}</h4>
            <div className="space-y-2">
              {schedule.map((time, i) => {
                const isInactive = i >= ACTIVE_TRIGGER_COUNT;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-mono ${
                      isInactive
                        ? "bg-muted/30 opacity-50"
                        : "bg-muted/50"
                    }`}
                  >
                    {isInactive ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className={isInactive ? "text-muted-foreground line-through" : "font-semibold"}>{time}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("step2ResetAt", { time: getResetTime(time) })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t("successOffNote")}
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertCircle className="h-4 w-4" />
              {t("subscribeTitle")}
            </h4>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("subscribeDescription")}
            </p>

            {subscribeStatus === "success" || subscribeStatus === "already" ? (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {subscribeStatus === "already"
                    ? t("subscribeAlready")
                    : t("subscribeSuccess")}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("subscribePlaceholder")}
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    disabled={subscribeStatus === "submitting"}
                  />
                  <Button
                    onClick={handleSubscribe}
                    disabled={!subscribeEmail.trim() || subscribeStatus === "submitting"}
                  >
                    {subscribeStatus === "submitting" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("subscribeButton")
                    )}
                  </Button>
                </div>
                {subscribeStatus === "error" && (
                  <p className="text-xs text-destructive">{t("subscribeError")}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <a
            href="https://dash.cloudflare.com/?to=/:account/workers/services/view/tokfresh-scheduler/production"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              {t("successViewDashboard")}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Link href="/" className="w-full">
            <Button className="w-full">{t("successBackHome")}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        {t("title")}
      </h1>

      {onboardingStep !== null ? (
        <div className="mt-6">{renderOnboarding()}</div>
      ) : (
        <>
          {state.step <= 4 && renderStepIndicator()}

          {state.step === 1 && renderStep1()}
          {state.step === 2 && renderStep2()}
          {state.step === 3 && renderStep3()}
          {state.step === 4 && renderStep4()}
          {state.step === 5 && renderSuccess()}
          {state.step === 5 && <GitHubStarNudge />}
        </>
      )}

      {onboardingStep === null && state.step <= 4 && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            {tFaq("title")}
          </h3>
          <Accordion type="single" collapsible defaultValue="what-problem" className="w-full">
            <AccordionItem value="what-problem">
              <AccordionTrigger className="text-sm">{tFaq("faq2Question")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {tFaq("faq2Answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ban">
              <AccordionTrigger className="text-sm">{tFaq("faq1Question")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {tFaq("faq1Answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cost">
              <AccordionTrigger className="text-sm">{tFaq("faq3Question")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {tFaq("faq3Answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="turn-off">
              <AccordionTrigger className="text-sm">{tFaq("faq4Question")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {tFaq("faq4Answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="verify-safety">
              <AccordionTrigger className="text-sm">{tFaq("faq5Question")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {tFaq("faq5Answer1")}
                <a
                  href="https://github.com/stevejkang/tokfresh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {tFaq("faq5Link")}
                </a>
                {tFaq("faq5Answer2")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="who-runs">
              <AccordionTrigger className="text-sm">{tFaq("faq6Question")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {tFaq("faq6Answer1")}
                <a
                  href="https://github.com/stevejkang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {tFaq("faq6DevLink")}
                </a>
                {tFaq("faq6Answer2")}
                <a
                  href="https://github.com/stevejkang/tokfresh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {tFaq("faq6Link")}
                </a>
                {tFaq("faq6Answer3")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupPageContent />
    </Suspense>
  );
}
