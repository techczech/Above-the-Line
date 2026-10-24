---
title: Above the Line Cloudflare preview release checkpoint
date: 2026-10-24
status: awaiting-independent-review
---

# Scope and plan

Retain the checked visitor-key app, recordings, portable viewer and original language prompts. Bundle the remaining runtime styling/fonts and ZIP/PDF dependencies so the full static application can be verified. Add canonical readable landing metadata and Pages preview noindex headers. Test keyless samples, original recordings, provider mocks, local ZIP/JSON/HTML/PDF exports and portable distributions. Prepare an authorised non-production hosted preview and independent review. Public custom-domain changes, public package distribution, real paid provider calls and GCP deletion are separate later actions. MIT licensing was authorised and applied on 2026-10-24. Original checked app: 6b68c55. No existing app source is discarded.

## Verification

- Initial production gate correctly failed against the prior CDN-dependent build. The revised static build passes canonical landing, local resource, sitemap and preview-header gates.
- 27 focused tests and TypeScript pass. Production build verifies all 15 original sample recordings remain byte-identical. Existing isolated browser suite passes 19 checks with zero external asset requests or page errors.
- Additional browser export suite passes six checks: local styles/multilingual fonts, JSON annotation fidelity, ZIP with all 15 cached clips, real PDF and PNG downloads, fresh-context keyless ZIP import and zero failed resources. PDFs and images were checked by file signatures; original recording bytes were not modified.
- Early failures in the new export test were incorrect sample-card, PNG-button and My Texts selectors. They were corrected to the actual controls; no application PNG defect was established. The complete rerun passes. Desktop/mobile screenshots and machine-readable receipts are in docs/.
- ZIP and PDF runtime dependencies are npm modules; browser-native Blob download replaces the external file-saver import. The optional YouTube API loads only when opening a video slideshow. Live YouTube playback and provider/CORS/audio quality remain unverified; no paid calls.
- Cloudflare project above-the-line created for authorised preview preparation (assigned base host above-the-line-228.pages.dev). No custom domain changed; deployment pending below.
- MIT licensing for the app and portable skill was authorised and applied on 2026-10-24. Public skill publication remains a separate release step; this implementation did not stage or publish it.

- Screenshot inspection found mobile overflow in the existing header and long annotation title. Header, action groups and annotation toggles now wrap; titles wrap within the page. The export browser test asserts a 390-pixel document stays within its viewport. No controls, data or language logic changed.


## Audio export readiness repair — interrupted, local evidence recovered

Opus5.5 implemented per-annotation pending/failure tracking in utils/audioReadiness.ts; sample preload and generated-recording saves register before exporting, and single/bulk ZIP export waits. Missing recordings produce a visible notice. Four focused tests passed; typecheck/build and the delayed-audio export browser regression passed locally. Hosted preview remains000f0c2 and still has the old race. Full unit suite and final cross-review are outstanding.

The builder hit a Claude provider rate limit after a scratch failed-load check. That check used the wrong clip ID (`s1-l2` rather than Italian sample `s0-l2`), so its timeout does not establish an application warning failure. Correct the fixture and verify failed-load feedback and original bytes before acceptance. Parent requested a route choice (Muse Wonder Full or wait for Claude) and will not change the implementation while waiting. No licence was selected or applied.


## Audio export recovery and MIT licensing — local verification completed

Builder: OpenAI Codex `gpt-6.1-sol`, medium reasoning effort, through T3 Code. No model override or delegation was used. Service tier was not exposed in the runtime information. The supplied local starting receipt was `697f79f`; no Git commands or Git writes were performed. Hosted preview remains the previously reported `000f0c2`; no deployment was performed or checked in this parcel.

The existing readiness repair passed verification without further production-code changes. Extended `scripts/check-above-the-line-exports-browser.mjs` to compare recording bytes, test the corrected Italian missing-recording fixture (`s0-l2`), verify ZIP reimport with sample audio downloads blocked, and prove that text-only export does not wait for unrelated sample audio. IndexedDB schema and original recordings were preserved.

### Checks and results

Every command below exited 0:

- `node --test tests/above-the-line-audio-readiness.test.mjs`: 4 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run build`: passed; built 356 modules, verified all 15 built sample audio files against their original bytes, and passed canonical landing, local resource and preview noindex gates.
- `node scripts/check-above-the-line-exports-browser.mjs /opt/homebrew/lib/node_modules/playwright/index.mjs http://127.0.0.1:4412`: 8 checks passed. Download stayed pending during the 200 ms artificial audio hold; releasing it produced all 15 original recordings, compared byte-for-byte. A fresh keyless context imported all 15 byte-identical recordings while bundled sample audio requests were blocked. A deliberate HTTP 404 for `s0-l2.raw` produced the visible one-recording warning and a ZIP containing the other 14 byte-identical originals. Text-only ZIP export finished within 1500 ms while unrelated sample audio remained blocked. JSON, PDF, PNG and mobile-width checks also passed.
- `node scripts/check-above-the-line-browser.mjs /opt/homebrew/lib/node_modules/playwright/index.mjs http://127.0.0.1:4412`: 19 existing browser checks passed, including keyless sample playback, retained cache hashes, mocked provider audio, import/export, hostile content handling and the offline viewer.
- `npm test`: full unit suite run once after the final test-code change; 31 passed, 0 failed.
- Direct recursive byte comparison: all 10 app/skill portable files match, including README and MIT notice. App root, skill root and portable MIT notices match. Licence SHA-256: `cba47406ce9b261fa360a465732d97af80719a639cb78bec7e14cfe51130d4a4`.

Machine-readable browser receipts: `docs/evidence-above-the-line-exports-release.json` and `docs/evidence-above-the-line-browser-2026-10-22.json` (existing filename, refreshed in this run). Exact full unit output: `docs/evidence-above-the-line-release-tests.txt`. Existing desktop/mobile screenshots were refreshed. Browser contexts and the local preview process were closed after verification; no scratch files were created.

### Licensing files

Added `LICENSE.txt` at the app root, app `portable/`, canonical skill root and skill `assets/portable/`. The notice matches Metaphornik's existing MIT text and `Copyright (c) 2025 Dominik Lukeš`. Added licence links to matching portable READMEs; updated the skill's public-safe `references/provenance.md` and private `PROVENANCE.md` to record the owner's approval. Existing skill author and linguistic instructions were preserved. Dependencies retain their existing licences.

### Decisions and assumptions

- Reused the existing readiness repair because the corrected regressions established the required behaviour; no production change was justified.
- Injected the failure at `s0-l2.raw` because Italian sample lines belong to stanza zero; the earlier `s1-l2.raw` fixture did not address a real request.
- Blocked sample audio in the fresh import context so successful cache-byte checks establish ZIP import rather than background preloading.
- Kept the existing browser runner and bundled headless Chromium because this is the authorised repository fallback; no browser or dependency installation was needed.
- Used 2025 in the MIT copyright notice to match the explicitly named sibling notice, as requested.
- Interpreted immediate text-only export as completing within 1500 ms despite indefinitely blocked unrelated audio; no exact user-interface latency requirement was specified.

Spec conflicts: none encountered. No pre-existing application bug was established. Independent review remains with the parent; the builder has not reviewed its own build. Live provider/CORS behaviour, audible quality and YouTube playback remain unverified. No paid provider request, commit, deployment, public push, skill staging or publisher run occurred.


## Hosted preview verification — build 6c6e336 (2026-10-24)

Tester: Claude `claude-sonnet-5-5` (test sub-agent; no application code, Git, deploy or paid call). Target: immutable https://80524e4f.above-the-line-228.pages.dev, alias https://release-preview.above-the-line-228.pages.dev. Bundled headless Chromium via `/opt/homebrew/lib/node_modules/playwright/index.mjs`; no real Chrome. The earlier T3 preview snapshot twice failed with "Preview automation snapshot timed out after 15000ms."; the documented headless fallback was used.

- Both URLs return HTTP/2 200 with `x-robots-tag: noindex`; the served page has `<link rel="canonical" href="https://abovetheline.edutools.fyi/" />`.
- `node scripts/check-above-the-line-exports-browser.mjs <playwright> <immutable URL>` passed all 9 checks (8 existing plus new bulk check), with zero external requests, failed resources and page errors. Receipt `docs/evidence-above-the-line-exports-release.json` and the desktop/mobile screenshots were replaced by this run.
- Gap 1 (bulk Export All waits per annotation): new check in the existing script. Sample audio held at the network; Italian sample loaded and saved to My Texts without waiting for loads (cache held 0 clips); Export All held for 400 ms, did not download; after release the ZIP contained `<title>.json` plus `<title>_audio/` with all 15 `.raw` clips, each byte-identical to `samples/italian-poem-sample/`.
- Gap 2 (generated-audio save registers before the ZIP wait): new `scripts/check-above-the-line-generated-save-browser.mjs`. Mocked OpenAI routes only (synthetic key, no real call); the test instrumentation holds the IndexedDB readwrite so the save is genuinely pending. Held write count 1, cache empty while held, ZIP export did not finish within 500 ms, and after release the ZIP held the generated clip bytes `[1,0,2,0]`. Passed.
- Limits: the generated probe covers one generated clip (the mock example annotation has one line); only the single-annotation ZIP path was probed for generated audio, not Export All. Neither probe was run against the pre-fix build 000f0c2, so neither is shown to fail without the fix. No live provider, audible speech or YouTube check. This records the hosted preview only; no public-domain cutover or GCP retirement is claimed.
- Scratch probe folder removed; no application source changed.
