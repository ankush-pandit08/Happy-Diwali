# Happy Diwali

A static Diwali greeting: enter your name to hear a personal voice wish, then scratch a golden card to reveal a funny Diwali joke. Every visitor gets a joke, with a tap-to-reveal alternative.

The app runs in the browser with no database, Redis, API routes, or environment variables. Your name and card are saved only in this browser's local storage; if storage is blocked, the card still works for the current visit.

Voice wishes use the browser's built-in speech synthesis after form submission. A replay button is available. Voices and pronunciation depend on the browser/device; unsupported browsers still show the written wish.

## Local development

Run `npm ci` and `npm run dev`, then open http://localhost:3000.

## Build and deploy

Run `npm run lint` and `npm run build`. Next.js exports the static website to `out/`. Upload that folder to any static host, or import the repository into Vercel with the checked-in configuration.

On Vercel, keep the framework preset set to **Next.js** and disable the **Output Directory** override. The Next.js integration reads build metadata from `.next/` and handles the static export automatically. Setting Vercel's output directory to `out` makes it look for `routes-manifest.json` in the wrong folder. The `out/` folder is for uploading directly to a generic static host.

Legacy starter folders remain for reference and are excluded from the Next.js build.
