import { NextRequest, NextResponse } from "next/server";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const WORKER_NAME = "tokfresh-scheduler";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    apiToken,
    accountId,
    workerCode,
    refreshToken,
    schedule,
    timezone,
    notificationConfig,
  } = body;

  if (!apiToken || !accountId || !workerCode || !refreshToken || !schedule) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  const headers = { Authorization: `Bearer ${apiToken}` };
  const workerUrl = `${CF_API_BASE}/accounts/${accountId}/workers/scripts/${WORKER_NAME}`;

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
    return NextResponse.json({
      success: false,
      error: `Worker upload failed (${uploadRes.status}): ${text}`,
    });
  }

  const cronRes = await fetch(`${workerUrl}/schedules`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify([{ cron: schedule }]),
  });

  if (!cronRes.ok) {
    const text = await cronRes.text();
    return NextResponse.json({
      success: false,
      error: `Cron setup failed (${cronRes.status}): ${text}`,
    });
  }

  const secrets: Record<string, string> = {
    REFRESH_TOKEN: refreshToken,
    TIMEZONE: timezone,
  };

  if (notificationConfig) {
    secrets.NOTIFICATION_CONFIG = notificationConfig;
  }

  for (const [name, text] of Object.entries(secrets)) {
    const secretRes = await fetch(`${workerUrl}/secrets`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name, text, type: "secret_text" }),
    });

    if (!secretRes.ok) {
      const errText = await secretRes.text();
      return NextResponse.json({
        success: false,
        error: `Secret "${name}" failed (${secretRes.status}): ${errText}`,
      });
    }
  }

  return NextResponse.json({ success: true });
}
