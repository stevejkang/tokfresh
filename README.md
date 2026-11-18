English | [한국어](./README.ko.md)

# TokFresh

Automate your Claude token reset timing for maximum efficiency.

> [!NOTE]  
> You can use CLI instead of web UI. See [tokfresh-cli](https://github.com/stevejkang/tokfresh-cli)

## What It Does

Claude Pro/Max usage resets every 5 hours from your first API call. TokFresh pre-triggers that cycle on a schedule you set, so resets align with your workday instead of interrupting it.

A Cloudflare Worker runs on **your** account, on cron, 24/7. Your computer can be off.

## Setup

1. **Connect Claude** — OAuth, no API keys.
2. **Set your schedule** — Pick a start time. 5-hour intervals auto-calculated.
3. **Deploy** — One click to your free Cloudflare account.

## FAQ

**How do I change my schedule?**  
Run the setup again with the same Claude account. Each Claude account gets its own worker, so a new deployment replaces that account's existing one with your updated schedule. Alternatively, you can edit the cron expression(UTC) directly in the Trigger Events section of the worker in your [Cloudflare Workers dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages).

**How do I remove scheduler?**  
Go to your [Cloudflare Workers dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages) and delete the `tokfresh-<your-email>-xxxxxx` worker for that Claude account.

**Can I use multiple Claude accounts with one Cloudflare account?**  
Yes. Run the setup once per Claude account. Each account gets its own worker and KV namespace, named after its email.

## Privacy

Fully stateless. Tokens are exchanged in your browser and sent directly to your Cloudflare account. We store nothing.
