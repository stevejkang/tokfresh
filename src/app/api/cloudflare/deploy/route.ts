import { NextRequest, NextResponse } from "next/server";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const WORKER_NAME = "tokfresh-scheduler";
const KV_NAMESPACE_TITLE = "tokfresh-tokens";

async function findOrCreateKVNamespace(
  accountId: string,
  headers: Record<string, string>,
): Promise<{ id: string | null; error?: string }> {
  const listRes = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces?per_page=100`,
    { headers },
  );

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.result?.find(
      (ns: { title: string }) => ns.title === KV_NAMESPACE_TITLE,
    );
    if (existing) {
      return { id: existing.id };
    }
  }

  const createRes = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces`,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ title: KV_NAMESPACE_TITLE }),
    },
  );

  if (!createRes.ok) {
    const text = await createRes.text();
    return { id: null, error: `KV namespace creation failed (${createRes.status}): ${text}` };
  }

  const createData = await createRes.json();
  return { id: createData.result?.id ?? null };
}

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

  const kvResult = await findOrCreateKVNamespace(accountId, headers);
  if (!kvResult.id) {
    return NextResponse.json({
      success: false,
      error: kvResult.error ?? "Failed to set up KV namespace",
    });
  }

  const kvNamespaceId = kvResult.id;

  const kvWriteRes = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/refresh_token`,
    {
      method: "PUT",
      headers,
      body: refreshToken,
    },
  );

  if (!kvWriteRes.ok) {
    const text = await kvWriteRes.text();
    return NextResponse.json({
      success: false,
      error: `KV token write failed (${kvWriteRes.status}): ${text}`,
    });
  }

  const metadata = {
    main_module: "worker.js",
    compatibility_date: "2024-01-01",
    bindings: [
      {
        type: "kv_namespace",
        name: "TOKEN_STORE",
        namespace_id: kvNamespaceId,
      },
    ],
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
