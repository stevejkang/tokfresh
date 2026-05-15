const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const FALLBACK_HEADERS = {
  "anthropic-version": "2023-06-01",
  "anthropic-beta":
    "claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,prompt-caching-scope-2026-01-05",
  "user-agent": "claude-cli/2.1.80 (external, cli)",
  "x-app": "cli",
  "x-anthropic-billing-header": `cc_version=2.1.80.${DEFAULT_MODEL}; cc_entrypoint=cli; cch=00000;`,
};

export function generateWorkerCode(): string {
  const fallbackHeadersJson = JSON.stringify(FALLBACK_HEADERS);

  return `export default {
  async scheduled(event, env, ctx) {
    const TOKFRESH_BASE = 'https://tokfresh.com';
    const FALLBACK_MODEL = '${DEFAULT_MODEL}';
    const FALLBACK_HEADERS = ${fallbackHeadersJson};

    async function fetchModel() {
      try {
        const res = await fetch(TOKFRESH_BASE + '/api/config/model');
        if (!res.ok) return FALLBACK_MODEL;
        const text = (await res.text()).trim();
        return text || FALLBACK_MODEL;
      } catch {
        return FALLBACK_MODEL;
      }
    }

    async function fetchHeaders() {
      try {
        const res = await fetch(TOKFRESH_BASE + '/api/config/headers');
        if (!res.ok) return FALLBACK_HEADERS;
        const data = await res.json();
        return Object.assign({}, FALLBACK_HEADERS, data);
      } catch {
        return FALLBACK_HEADERS;
      }
    }

    async function notify(message) {
      if (!env.NOTIFICATION_CONFIG) return;
      const config = JSON.parse(env.NOTIFICATION_CONFIG);

      if (config.slackWebhook) {
        await fetch(config.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        }).catch(() => {});
      }

      if (config.discordWebhook) {
        await fetch(config.discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message })
        }).catch(() => {});
      }
    }

    function shouldNotify(succeeded) {
      if (!env.NOTIFICATION_CONFIG) return false;
      const config = JSON.parse(env.NOTIFICATION_CONFIG);
      if (config.failureOnly) return !succeeded;
      return true;
    }

    try {
      const model = await fetchModel();
      const dynamicHeaders = await fetchHeaders();

      // Read refresh token from KV (fallback to env secret for initial run)
      let refreshToken = await env.TOKEN_STORE.get('refresh_token');
      if (!refreshToken) {
        refreshToken = env.REFRESH_TOKEN;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
      }

      let tokenRes;
      for (let attempt = 0; attempt < 3; attempt++) {
        tokenRes = await fetch('https://console.anthropic.com/v1/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
          })
        });
        if (tokenRes.ok) break;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }

      if (!tokenRes.ok) {
        const errorBody = await tokenRes.text().catch(() => '');
        throw new Error('Token refresh failed: ' + tokenRes.status + ' ' + errorBody);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Persist rotated refresh token for next invocation
      if (tokenData.refresh_token) {
        await env.TOKEN_STORE.put('refresh_token', tokenData.refresh_token);
      }

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'anthropic-version': dynamicHeaders['anthropic-version'],
          'anthropic-beta': dynamicHeaders['anthropic-beta'],
          'user-agent': dynamicHeaders['user-agent'],
          'x-app': dynamicHeaders['x-app'],
          'x-anthropic-billing-header': dynamicHeaders['x-anthropic-billing-header'],
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 128,
          system: [{ type: 'text', text: 'You are Claude Code, Anthropic\\u0027s official CLI for Claude.' }],
          messages: [{ role: 'user', content: 'ping' }]
        })
      });

      if (!apiRes.ok) {
        const errorBody = await apiRes.text().catch(() => '');
        throw new Error('Claude API call failed: ' + apiRes.status + ' ' + errorBody);
      }

      if (shouldNotify(true)) {
        const now = new Date().toLocaleString('en-US', { timeZone: env.TIMEZONE || 'UTC' });
        await notify('TokFresh: Successfully refreshed at ' + now);
      }

      try { await fetch(TOKFRESH_BASE + '/api/ping', { method: 'POST' }); } catch {}

      console.log('Token timer refreshed successfully');
    } catch (error) {
      console.error('Worker error:', error.message);

      if (shouldNotify(false)) {
        const now = new Date().toLocaleString('en-US', { timeZone: env.TIMEZONE || 'UTC' });
        await notify('TokFresh: Failed at ' + now + ': ' + error.message);
      }

      try { await fetch(TOKFRESH_BASE + '/api/ping', { method: 'POST' }); } catch {}

      throw error;
    }
  }
};`;
}
