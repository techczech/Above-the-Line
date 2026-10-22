---
title: Above the Line static hosting preparation
updated: 2026-10-22
status: prepared-not-deployed
---

# Static hosting preparation

Run `npm ci` with Node 22.18 or later, then `npm run build`. Publish the generated `dist/` folder with a static host. For Cloudflare Pages, use build command `npm run build` and output directory `dist`. No build secrets, Worker, Cloud Run service or AI Studio proxy is required. The build copies the existing samples into `dist/samples/` and publishes bundled recordings at `dist/samples/audio/<sample>/<itemId>.raw`, matching the app's preload URLs. Every build verifies that all referenced recordings are nonempty and byte-identical to their originals.

Visitors open AI settings, choose OpenAI or Gemini and enter their own key. Keys stay in memory by default. Remember on this device explicitly enables browser storage; Apply settings commits the choice. Clear key and reset settings removes both the in-memory and stored configuration. Existing annotation and audio stores are preserved. Reloading after a memory-only setup requires entering the key again. Provider model IDs are editable to accommodate account access and model retirement.

Text generation, title generation, speaker analysis and speech use the selected provider. Gemini requests go directly to `generativelanguage.googleapis.com`; OpenAI requests go directly to `api.openai.com`. Keys travel in headers, not URLs, exported records or build output. The existing Gemini speaker voice labels map to OpenAI voices when OpenAI is selected. Both speech routes return 24 kHz signed 16-bit PCM for the existing audio cache and player.

Saved results, sample reading, JSON imports and exports work without credentials. The portable result renderer is documented in [the portable folder](../portable/README.md). The full app retains its existing CDN styling/fonts and PDF/ZIP/YouTube integrations; it is a static website, while the portable result HTML is self-contained.

No hosting, DNS, GCP resources or production service has been changed by this implementation. Hosted ChatGPT sign-in is not implemented. Live provider calls are deliberately excluded from verification.
