"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
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

export default function SetupPage() {
  const t = useTranslations("Setup");
  const stepTitles = [t("stepConnect"), t("stepSchedule"), t("stepNotifications"), t("stepDeploy")];

  const [state, setState] = useState<SetupState>(INITIAL_SETUP_STATE);
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

  useEffect(() => {
    setState((prev) => ({ ...prev, timezone: detectTimezone() }));
    trackEvent({ action: "setup_started" });
  }, []);

  useEffect(() => {
    if (trackedSteps.current.has(state.step)) return;
    trackedSteps.current.add(state.step);

    if (state.step <= 4) {
      trackEvent({
        action: "setup_step_viewed",
        params: { step: state.step, step_name: STEP_TITLES_EN[state.step - 1] },
      });
    }

    if (state.step === 5) {
      trackEvent({ action: "setup_completed" });
    }
  }, [state.step]);

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
    trackEvent({ action: "setup_oauth_window_opened" });
  };

  const handleExchangeCode = async () => {
    trackEvent({ action: "setup_oauth_code_submitted" });

    const verifier = sessionStorage.getItem("tokfresh_verifier");
    if (!verifier) {
      setExchangeError("Session expired. Please connect Claude again.");
      trackEvent({ action: "setup_oauth_exchange_error", params: { error_type: "session_expired" } });
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
      trackEvent({ action: "setup_oauth_exchange_success" });
    } else {
      setExchangeError(result.error ?? "Failed to verify code");
      trackEvent({ action: "setup_oauth_exchange_error", params: { error_type: "exchange_failed" } });
    }

    setIsExchanging(false);
  };

  const handleScheduleContinue = () => {
    if (!trackedActions.current.has("schedule_configured")) {
      trackedActions.current.add("schedule_configured");
      trackEvent({ action: "setup_schedule_configured", params: { start_time: state.startTime, timezone: state.timezone } });
    }
    update({ step: 3 });
  };

  const handleNotificationContinue = () => {
    if (!trackedActions.current.has("notification_configured")) {
      trackedActions.current.add("notification_configured");
      trackEvent({
        action: "setup_notification_configured",
        params: { type: state.notificationType, failure_only: state.notifyOnFailureOnly ? "true" : "false" },
      });
    }
    update({ step: 4 });
  };

  const handleDeploy = async () => {
    if (!state.cloudflareApiToken || !state.claudeRefreshToken) return;

    deployAttemptRef.current += 1;
    const attempt = deployAttemptRef.current;

    trackEvent({ action: "setup_deploy_initiated", params: { attempt } });
    update({ deploymentStatus: "deploying", deploymentError: null, deploymentErrorCode: null });
    setDeployProgress(["Verifying Cloudflare token..."]);

    const verification = await verifyCloudflareToken(state.cloudflareApiToken);

    if (!verification.valid) {
      const error = verification.error ?? "Token verification failed";
      update({
        deploymentStatus: "error",
        deploymentError: error,
      });
      trackEvent({ action: "setup_cf_verify_error", params: { error_type: categorizeError(error), attempt } });
      return;
    }

    const accountId = verification.accountId!;
    update({ cloudflareAccountId: accountId });
    setDeployProgress((prev) => [...prev, "Token verified"]);
    trackEvent({ action: "setup_cf_verify_success", params: { attempt } });

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
      onProgress: (step) => setDeployProgress((prev) => [...prev, step]),
    });

    if (result.success) {
      update({ deploymentStatus: "success", step: 5 });
      trackEvent({ action: "setup_deploy_success", params: { attempt } });
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
      trackEvent({ action: "setup_deploy_error", params });
    }
  };

  const handleSubscribe = async () => {
    if (!subscribeEmail.trim()) return;

    trackEvent({ action: "setup_subscribe_submitted" });
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
        trackEvent({ action: "setup_subscribe_result", params: { result: status } });
      } else {
        setSubscribeStatus("error");
        trackEvent({ action: "setup_subscribe_result", params: { result: "error" } });
      }
    } catch {
      setSubscribeStatus("error");
      trackEvent({ action: "setup_subscribe_result", params: { result: "error" } });
    }
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
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

      {state.step <= 4 && renderStepIndicator()}

      {state.step === 1 && renderStep1()}
      {state.step === 2 && renderStep2()}
      {state.step === 3 && renderStep3()}
      {state.step === 4 && renderStep4()}
      {state.step === 5 && renderSuccess()}
    </>
  );
}
