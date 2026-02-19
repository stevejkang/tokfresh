const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const WORKER_NAME = "tokfresh-scheduler";

export async function verifyCloudflareToken(
  apiToken: string,
): Promise<{ valid: boolean; accountId?: string; error?: string }> {
  try {
    const verifyRes = await fetch(`${CF_API_BASE}/user/tokens/verify`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!verifyRes.ok) {
      return { valid: false, error: `Invalid token (${verifyRes.status})` };
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return { valid: false, error: "Token verification failed" };
    }

    const accountsRes = await fetch(`${CF_API_BASE}/accounts?per_page=1`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!accountsRes.ok) {
      return {
        valid: false,
        error: `Failed to fetch accounts (${accountsRes.status})`,
      };
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.result;

    if (!accounts || accounts.length === 0) {
      return { valid: false, error: "No Cloudflare accounts found" };
    }

    return { valid: true, accountId: accounts[0].id };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deployWorker(params: {
  apiToken: string;
  accountId: string;
  workerCode: string;
  refreshToken: string;
  schedule: string;
  timezone: string;
  notificationConfig?: string;
  onProgress?: (step: string) => void;
}): Promise<{ success: boolean; error?: string }> {
  const {
    apiToken,
    accountId,
    workerCode,
    refreshToken,
    schedule,
    timezone,
    notificationConfig,
    onProgress,
  } = params;

  const headers = { Authorization: `Bearer ${apiToken}` };
  const workerUrl = `${CF_API_BASE}/accounts/${accountId}/workers/scripts/${WORKER_NAME}`;

  try {
    onProgress?.("Creating worker...");

    const metadata = {
      main_module: "worker.js",
      compatibility_date: "2024-01-01",
      bindings: [],
    };

    const formData = new FormData();
    formData.append(
      "worker.js",
      new Blob([workerCode], { type: "application/javascript+module" }),
      "worker.js",
    );
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );

    const uploadRes = await fetch(workerUrl, {
      method: "PUT",
      headers,
      body: formData,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      return {
        success: false,
        error: `Worker upload failed (${uploadRes.status}): ${text}`,
      };
    }

    onProgress?.("Setting schedule...");

    const cronRes = await fetch(`${workerUrl}/schedules`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify([{ cron: schedule }]),
    });

    if (!cronRes.ok) {
      const text = await cronRes.text();
      return {
        success: false,
        error: `Cron setup failed (${cronRes.status}): ${text}`,
      };
    }

    onProgress?.("Storing secrets...");

    const secrets: Record<string, string> = {
      REFRESH_TOKEN: refreshToken,
      TIMEZONE: timezone,
    };

    if (notificationConfig) {
      secrets.NOTIFICATION_CONFIG = notificationConfig;
    }

    for (const [name, text] of Object.entries(secrets)) {
      const secretRes = await fetch(
        `${workerUrl}/secrets`,
        {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ name, text, type: "secret_text" }),
        },
      );

      if (!secretRes.ok) {
        const errText = await secretRes.text();
        return {
          success: false,
          error: `Secret "${name}" failed (${secretRes.status}): ${errText}`,
        };
      }
    }

    onProgress?.("Deployment complete!");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
