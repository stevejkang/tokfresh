"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { type SetupState, INITIAL_SETUP_STATE } from "@/lib/types";
import { generateAuthUrl, exchangeCode } from "@/lib/claude-oauth";
import {
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

const STEP_TITLES = [
  "Connect Claude",
  "Configure Schedule",
  "Notifications",
  "Deploy",
];

export default function SetupPage() {
  const [state, setState] = useState<SetupState>(INITIAL_SETUP_STATE);
  const [authCode, setAuthCode] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [oauthOpened, setOauthOpened] = useState(false);
  const [deployProgress, setDeployProgress] = useState<string[]>([]);

  useEffect(() => {
    setState((prev) => ({ ...prev, timezone: detectTimezone() }));
  }, []);

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
  };

  const handleExchangeCode = async () => {
    const verifier = sessionStorage.getItem("tokfresh_verifier");
    if (!verifier) {
      setExchangeError("Session expired. Please connect Claude again.");
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
    } else {
      setExchangeError(result.error ?? "Failed to verify code");
    }

    setIsExchanging(false);
  };

  const handleDeploy = async () => {
    if (!state.cloudflareApiToken || !state.claudeRefreshToken) return;

    update({ deploymentStatus: "deploying", deploymentError: null });
    setDeployProgress(["Verifying Cloudflare token..."]);

    const verification = await verifyCloudflareToken(state.cloudflareApiToken);

    if (!verification.valid) {
      update({
        deploymentStatus: "error",
        deploymentError: verification.error ?? "Token verification failed",
      });
      return;
    }

    const accountId = verification.accountId!;
    update({ cloudflareAccountId: accountId });
    setDeployProgress((prev) => [...prev, "Token verified"]);

    const cronExpression = timeToCron(schedule);
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
    } else {
      update({
        deploymentStatus: "error",
        deploymentError: result.error ?? "Deployment failed",
      });
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Step {Math.min(state.step, 4)} of 4
        </span>
        <span>{STEP_TITLES[Math.min(state.step, 4) - 1]}</span>
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
          Connect Claude Account
        </CardTitle>
        <CardDescription>
          Authorize TokFresh to trigger API calls with your Claude subscription.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Requires Claude Pro or Max</AlertTitle>
          <AlertDescription>
            You need an active Claude Pro or Max subscription to use this
            service.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button
            onClick={handleConnectClaude}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Claude Account
          </Button>

          {oauthOpened && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                After authorizing on claude.ai, you&apos;ll see an authorization
                code. Copy and paste it below.
              </p>
              <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Your token is exchanged in your browser only and sent directly
                  to your Cloudflare account. TokFresh never collects or stores
                  it.
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-code">Authorization Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="auth-code"
                    placeholder="Paste the authorization code here..."
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
                      "Verify"
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
          Configure Schedule
        </CardTitle>
        <CardDescription>
          Choose when your 5-hour token cycles should start.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Start Hour</Label>
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
            <Label>Start Minute</Label>
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
          <span>Timezone: {state.timezone}</span>
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-sm font-medium">Your 5-Hour Schedule</h4>
          <div className="space-y-2">
            {schedule.map((time, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm font-mono"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-semibold">{time}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Reset at {getResetTime(time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => update({ step: 1 })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => update({ step: 3 })}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notifications (Optional)</CardTitle>
        <CardDescription>
          Get notified when the token timer is triggered.
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
            <Label htmlFor="none">None</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="slack" id="slack" />
            <Label htmlFor="slack">Slack Webhook</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="discord" id="discord" />
            <Label htmlFor="discord">Discord Webhook</Label>
          </div>
        </RadioGroup>

        {state.notificationType !== "none" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">
                {state.notificationType === "slack" ? "Slack" : "Discord"}{" "}
                Webhook URL
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
              <Label>When to notify</Label>
              <RadioGroup
                value={state.notifyOnFailureOnly ? "failure" : "all"}
                onValueChange={(v) =>
                  update({ notifyOnFailureOnly: v === "failure" })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="notify-all" />
                  <Label htmlFor="notify-all">Every trigger</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="failure" id="notify-failure" />
                  <Label htmlFor="notify-failure">Failures only</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => update({ step: 2 })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => update({ step: 4 })}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Deploy to Cloudflare</CardTitle>
        <CardDescription>
          Deploy a worker to your Cloudflare account that runs automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Create a Cloudflare API Token</AlertTitle>
          <AlertDescription className="space-y-2">
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline"
                >
                  Cloudflare API Tokens
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Click &quot;Create Token&quot;</li>
              <li>
                Use the &quot;Edit Cloudflare Workers&quot; template
              </li>
              <li>Set Account Resources to your account</li>
              <li>Create and copy the token</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="cf-token">Cloudflare API Token</Label>
          <Input
            id="cf-token"
            type="password"
            placeholder="Paste your Cloudflare API token..."
            value={state.cloudflareApiToken}
            onChange={(e) =>
              update({ cloudflareApiToken: e.target.value })
            }
            disabled={state.deploymentStatus === "deploying"}
          />
          <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            <Shield className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              This token is used once to deploy the worker, then discarded.
              TokFresh never stores your Cloudflare credentials.
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

        {state.deploymentStatus === "error" && (
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
          Back
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
              Deploying...
            </>
          ) : (
            "Deploy"
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSuccess = () => {
    const nextTrigger = getNextTrigger(schedule, state.timezone);
    const cronExpression = timeToCron(schedule);

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">All Done!</CardTitle>
          <CardDescription>
            Your token scheduler is deployed and running.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worker</span>
                <span className="font-mono font-medium">
                  tokfresh-scheduler
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next trigger</span>
                <span className="font-medium">{nextTrigger.label}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cron</span>
                <span className="font-mono text-xs">{cronExpression}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium">Trigger Schedule</h4>
            <div className="space-y-2">
              {schedule.map((time, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm font-mono"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-semibold">{time}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Reset at {getResetTime(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your computer can be off &mdash; the worker runs automatically on
              Cloudflare&apos;s edge network!
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              View in Cloudflare Dashboard
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Link href="/" className="w-full">
            <Button className="w-full">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Set Up TokFresh
        </h1>

        {state.step <= 4 && renderStepIndicator()}

        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
        {state.step === 4 && renderStep4()}
        {state.step === 5 && renderSuccess()}
      </div>
    </div>
  );
}
