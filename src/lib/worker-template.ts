export function generateWorkerCode(): string {
  return `export default {
  async scheduled(event, env, ctx) {
    try {
      // Read refresh token from KV (fallback to env secret for initial run)
      let refreshToken = await env.TOKEN_STORE.get('refresh_token');
      if (!refreshToken) {
        refreshToken = env.REFRESH_TOKEN;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
      }

      const tokenRes = await fetch('https://console.anthropic.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
        })
      });

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

      const apiRes = await fetch('https://api.anthropic.com/v1/messages?beta=true', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'oauth-2025-04-20,interleaved-thinking-2025-05-14',
          'user-agent': 'claude-cli/2.1.2 (external, cli)',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });

      if (!apiRes.ok) {
        const errorBody = await apiRes.text().catch(() => '');
        throw new Error('Claude API call failed: ' + apiRes.status + ' ' + errorBody);
      }

      if (env.NOTIFICATION_CONFIG) {
        const config = JSON.parse(env.NOTIFICATION_CONFIG);
        const now = new Date().toLocaleString('en-US', {
          timeZone: env.TIMEZONE || 'UTC'
        });
        const message = 'TokFresh: Token timer triggered at ' + now;

        if (config.slackWebhook) {
          await fetch(config.slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message })
          });
        }

        if (config.discordWebhook) {
          await fetch(config.discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
          });
        }
      }

      console.log('Token timer triggered successfully');
    } catch (error) {
      console.error('Worker error:', error.message);
      throw error;
    }
  }
};`;
}
