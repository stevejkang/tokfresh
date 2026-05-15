"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Copy,
  Check,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { generateAuthUrl, exchangeCode } from "@/lib/claude-oauth";

interface TriggerStep {
  name: string;
  status: "success" | "error";
  statusCode?: number;
  response?: unknown;
  error?: string;
  durationMs: number;
}

interface TriggerResult {
  steps: TriggerStep[];
  newRefreshToken: string | null;
}

function TokenDisplay({
  label,
  value,
  copiedField,
  fieldKey,
  onCopy,
}: {
  label: string;
  value: string;
  copiedField: string | null;
  fieldKey: string;
  onCopy: (value: string, key: string) => void;
}) {
  const masked =
    value.length > 20
      ? `${value.slice(0, 16)}...${value.slice(-4)}`
      : value;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1.5">
        <code className="font-mono">{masked}</code>
        <button
          onClick={() => onCopy(value, fieldKey)}
          className="rounded p-0.5 hover:bg-muted"
        >
          {copiedField === fieldKey ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function StepResult({ step }: { step: TriggerStep }) {
  const isSuccess = step.status === "success";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          {step.name}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {step.statusCode && (
            <span
              className={
                step.statusCode >= 400 ? "text-destructive font-medium" : ""
              }
            >
              HTTP {step.statusCode}
            </span>
          )}
          <span>{step.durationMs}ms</span>
        </div>
      </div>
      {(step.response || step.error) && (
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/30 p-2 text-xs leading-relaxed whitespace-pre-wrap break-all">
          {step.error ?? JSON.stringify(step.response, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function TestPage() {
  const [oauthOpened, setOauthOpened] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(
    null,
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConnect = async () => {
    const { url, verifier } = await generateAuthUrl();
    sessionStorage.setItem("tokfresh_test_verifier", verifier);
    window.open(url, "_blank", "noopener");
    setOauthOpened(true);
  };

  const handleExchange = async () => {
    const verifier = sessionStorage.getItem("tokfresh_test_verifier");
    if (!verifier) {
      setExchangeError("Session expired. Click 'Connect Claude' again.");
      return;
    }

    setIsExchanging(true);
    setExchangeError(null);

    const result = await exchangeCode(authCode, verifier);

    if (result.success) {
      sessionStorage.removeItem("tokfresh_test_verifier");
      setAccessToken(result.accessToken ?? "");
      setRefreshToken(result.refreshToken ?? "");
    } else {
      setExchangeError(result.error ?? "Exchange failed");
    }

    setIsExchanging(false);
  };

  const handleTrigger = async (mode: "full" | "api-only") => {
    setIsTriggering(true);
    setTriggerResult(null);

    try {
      const payload =
        mode === "full" ? { refreshToken } : { accessToken };

      const res = await fetch("/api/debug/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: TriggerResult = await res.json();
      setTriggerResult(data);

      if (data.newRefreshToken) {
        setRefreshToken(data.newRefreshToken);
      }
    } catch (err) {
      setTriggerResult({
        steps: [
          {
            name: "Request",
            status: "error",
            error: err instanceof Error ? err.message : String(err),
            durationMs: 0,
          },
        ],
        newRefreshToken: null,
      });
    }

    setIsTriggering(false);
  };

  const hasTokens = !!accessToken && !!refreshToken;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          TokFresh Debug Tool
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Test OAuth authentication and trigger without Cloudflare deployment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-4 w-4" />
            1. OAuth Authentication
          </CardTitle>
          <CardDescription>
            Connect your Claude account to obtain tokens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleConnect} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Claude
          </Button>

          {oauthOpened && !hasTokens && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Authorize on the opened page, then paste the code below.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste auth code here..."
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                />
                <Button
                  onClick={handleExchange}
                  disabled={!authCode.trim() || isExchanging}
                >
                  {isExchanging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {exchangeError && (
                <p className="text-sm text-destructive">{exchangeError}</p>
              )}
            </div>
          )}

          {hasTokens && (
            <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Tokens obtained
              </div>
              <div className="space-y-1.5">
                <TokenDisplay
                  label="Access Token"
                  value={accessToken}
                  copiedField={copiedField}
                  fieldKey="access"
                  onCopy={copyToClipboard}
                />
                <TokenDisplay
                  label="Refresh Token"
                  value={refreshToken}
                  copiedField={copiedField}
                  fieldKey="refresh"
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-4 w-4" />
            2. Test Trigger
          </CardTitle>
          <CardDescription>
            Run the same refresh + API call that the Cloudflare Worker executes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Refresh Token</Label>
            <Input
              placeholder="Auto-filled from step 1, or paste manually..."
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleTrigger("full")}
              disabled={!refreshToken.trim() || isTriggering}
              className="flex-1"
            >
              {isTriggering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Test Full Trigger
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTrigger("api-only")}
              disabled={!accessToken.trim() || isTriggering}
            >
              API Only
            </Button>
          </div>

          {triggerResult && (
            <div className="space-y-3">
              <Separator />
              <h4 className="text-sm font-medium">Results</h4>
              {triggerResult.steps.map((step, i) => (
                <StepResult key={i} step={step} />
              ))}

              {triggerResult.newRefreshToken && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs text-amber-400">
                    Refresh token rotated — new token auto-applied above.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
