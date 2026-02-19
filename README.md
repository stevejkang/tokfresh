# TokFresh

Automate your Claude token reset timing for maximum efficiency.

## What It Does

Claude Pro/Max usage resets every 5 hours from your first API call. TokFresh pre-triggers that cycle on a schedule you set, so resets align with your workday instead of interrupting it.

A Cloudflare Worker runs on **your** account, on cron, 24/7. Your computer can be off.

## Setup

1. **Connect Claude** — OAuth, no API keys.
2. **Set your schedule** — Pick a start time. 5-hour intervals auto-calculated.
3. **Deploy** — One click to your free Cloudflare account.

## Privacy

Fully stateless. Tokens are exchanged in your browser and sent directly to your Cloudflare account. We store nothing.
