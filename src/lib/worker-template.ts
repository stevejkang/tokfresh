export function generateWorkerCode(): string {
  return `export default {
  async scheduled(event, env, ctx) {
    try {
      const tokenRes = await fetch('https://console.anthropic.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: env.REFRESH_TOKEN,
          client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
        })
      });

      if (!tokenRes.ok) {
        throw new Error('Token refresh failed: ' + tokenRes.status);
      }

      const { access_token } = await tokenRes.json();

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + access_token,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'oauth-2025-04-20',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });

      if (!apiRes.ok) {
        throw new Error('Claude API call failed: ' + apiRes.status);
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
