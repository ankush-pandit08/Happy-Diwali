# Happy Diwali

A minimal Next.js app: enter your name, receive a personal Diwali wish, scratch one card. Three winners receive gift cards from the organizer.

## Deploy on Vercel

1. Import this repository into Vercel. Framework: **Next.js**, Node.js: **22.x**. The checked-in `vercel.json` sets `npm ci`, `npm run build`, and `.next` output. Remove any old `dist`/Cloudflare project overrides.
2. Create/connect an **Upstash Redis** database in Vercel Marketplace. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the Vercel project's environment variables. These are server-only secrets; never prefix them with `NEXT_PUBLIC_`.
3. Optionally set `DIWALI_CARD_POOL` to your expected number of participants (default **30**, minimum 3) and `DIWALI_EVENT_ID` (default `diwali-2026`). Use a separate event ID or separate database for preview/development, so testing cannot use live prizes.
4. Deploy/redeploy after adding variables. No database migrations are needed.

The Marketplace names `KV_REST_API_URL` and `KV_REST_API_TOKEN` are also supported automatically.

The old app targeted Cloudflare Workers using Vinext and D1. Vercel cannot supply the `cloudflare:workers` database binding. This version uses standard Next.js and persistent Redis over HTTPS instead; it never stores giveaway results in temporary server memory.

## How the three winners work

The first scratch randomly chooses three distinct winning positions within the configured card pool and saves them privately. Exactly three cards win once all those positions have been reached. For example, the default guarantees all three prizes within the first 30 unique scratches. Fewer scratches may mean fewer winners. Additional visitors still get a wish and a non-winning card. Changing the pool after the first scratch does not change existing positions.

All entry/reveal changes are atomic in Redis. Refreshing, double tapping, concurrent requests, and server restarts preserve each result and cannot create a fourth winner. No expiring keys are used. Do not clear the event database during a live giveaway.

Winners show their full winning card ID to the organizer. You can verify it against the entries hash `diwali:{EVENT_ID}:entries` in the private Upstash console (`win: 1`). Gift cards are delivered personally, outside the app.

Name-only entry uses a browser cookie; clearing cookies or switching browsers allows another entry. It does not verify a unique person. For a small trusted gathering, verify winners personally before handing out gifts.

## Local development

Copy `.env.example` to `.env.local`, fill in Redis credentials, and use a development event ID. Then run `npm ci` and `npm run dev`. Open http://localhost:3000.

`npm run build` verifies production compilation without requiring credentials at build time. Redis credentials are required at runtime to enter and scratch. `npm run lint` checks application code. `npm test` checks prize selection and storage error handling.

Legacy starter folders remain for reference but are not part of the Next.js build or runtime.
