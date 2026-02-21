export async function verifyCloudflareToken(
  apiToken: string,
): Promise<{ valid: boolean; accountId?: string; error?: string }> {
  try {
    const res = await fetch("/api/cloudflare/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiToken }),
    });

    return await res.json();
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
}): Promise<{ success: boolean; error?: string; errorCode?: number }> {
  const { onProgress, ...payload } = params;

  try {
    onProgress?.("Setting up token storage...");
    onProgress?.("Creating worker...");
    onProgress?.("Setting schedule...");
    onProgress?.("Storing secrets...");

    const res = await fetch("/api/cloudflare/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.success) {
      onProgress?.("Deployment complete!");
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
