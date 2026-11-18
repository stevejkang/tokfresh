import { NextRequest, NextResponse } from "next/server";
import { getWorkerName } from "@/lib/worker-name";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function parseCfErrorCode(body: string): number | undefined {
  try {
    const json = JSON.parse(body);
    return json.errors?.[0]?.code;
  } catch {
    return undefined;
  }
}

async function findOrCreateKVNamespace(
  accountId: string,
  title: string,
  headers: Record<string, string>,
): Promise<{ id: string | null; error?: string }> {
  const listRes = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces?per_page=100`,
    { headers },
  );

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.result?.find(
      (ns: { title: string }) => ns.title === title,
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
      body: JSON.stringify({ title }),
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
    claudeEmail,
    schedule,
    timezone,
    notificationConfig,
    enableLogs,
    enableTraces,
  } = body;

  if (
    !apiToken ||
    !accountId ||
    !workerCode ||
    !refreshToken ||
    !claudeEmail ||
    !schedule
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  const workerName = await getWorkerName(claudeEmail);
  const headers = { Authorization: `Bearer ${apiToken}` };
  const workerUrl = `${CF_API_BASE}/accounts/${accountId}/workers/scripts/${workerName}`;

  const kvResult = await findOrCreateKVNamespace(accountId, workerName, headers);
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

  const metadata: Record<string, unknown> = {
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

  if (enableLogs || enableTraces) {
    metadata.observability = {
      enabled: true,
      ...(enableLogs && { logs: { enabled: true, invocation_logs: true } }),
      ...(enableTraces && { traces: { enabled: true } }),
    };
  }

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
      errorCode: parseCfErrorCode(text),
    });
  }

  // The worker has no fetch handler, and its name contains the account email,
  // so keep it off the public workers.dev hostname.
  const subdomainRes = await fetch(`${workerUrl}/subdomain`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: false, previews_enabled: false }),
  });

  if (!subdomainRes.ok) {
    const text = await subdomainRes.text();
    return NextResponse.json({
      success: false,
      error: `workers.dev disable failed (${subdomainRes.status}): ${text}`,
      errorCode: parseCfErrorCode(text),
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
      errorCode: parseCfErrorCode(text),
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

  return NextResponse.json({ success: true, workerName });
}
