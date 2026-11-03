# Happy Diwali — Light & Luck

Complete source for the published office Diwali web app.

## Features
- Name entry and a personalized Diwali wish.
- A golden scratch card with an immediate win or no-prize result.
- A server-generated 1% chance while prizes remain; at most three winners across visitors. All three prizes are not guaranteed to be won.
- One saved result per browser using cookies, a browser ID, and a shared database. Clearing browser data or switching browsers can bypass this restriction.
- Persistent entries and results in Cloudflare D1.

## Included
All 122 tracked project files, including source, dependency lockfile, database schema and SQL migrations, assets, scripts, and original runtime documentation. Generated dependencies, build output, credentials, local database data, and Git history are excluded.

## Run locally
Install Node.js 22.13 or newer and the package manager specified in package.json (pnpm 11.25.0). From the extracted Happy-Diwali folder:

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wealthy_franklin_richards.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_massive_vermin.sql
pnpm dev
```

Open the local URL printed by the dev command. Apply each migration once to a new local database. Local data is separate from the live event.

## Important files
- app/page.tsx: name entry and Diwali wishes
- app/scratch-card.tsx: scratch card and reveal interaction
- app/api/event/route.ts: persistent entries, random results, and the global prize cap
- db/schema.ts and drizzle/: database schema and migrations
- app/organizer/page.tsx: event details and winners
- app/globals.css: responsive styling

## Hosting
This is a full-stack Vinext/React app with a Cloudflare Worker backend and D1 database; it cannot run as a static GitHub Pages site. The existing .openai/hosting.json preserves the current ChatGPT Site identity. For independent hosting, configure your own Worker and D1 deployment. See README.md for the retained runtime details. No organizer key is needed in this instant scratch-card version.

## Upload to GitHub manually
Extract the ZIP, open your empty Happy-Diwali repository, and use Upload files to add the contents of the Happy-Diwali folder. Preserve hidden files and folders such as .gitignore and .openai. For a full upload that includes hidden files, use GitHub Desktop or Git.
