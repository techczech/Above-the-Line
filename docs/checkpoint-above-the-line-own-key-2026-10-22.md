---
title: Above the Line own-key migration checkpoint
date: 2026-10-22
status: checked
register: FOR AGENTS
---

# Scope and plan

- Clean main inspected; pulled fast-forward (already current); feature branch created.
- Preserve annotation prompts, language judgement, editing, study, video, cached audio and user records.
- Replace build-time Gemini key with memory-only visitor settings; explicit optional persistence; clear action. Browser-direct Gemini and OpenAI; fixed official API origins; no keys in URLs or result records.
- Keep translation and speaker analysis model-based. Validation and packaging are structural code.
- Validate imported/generated/exported annotation records, including nested optional slideshow/history data. Existing saved data remains in place.
- Add JSON export and self-contained HTML viewer with interlinear toggles, idiomatic translation and browser read-aloud. Standalone copy comes from Markdown/YAML; CSS and behaviour separate.
- Stable CLI: `node portable/render-above-the-line.mjs input.json output.html`. Parent owns canonical skill; no app-local SKILL.md.
- Run focused Node tests, TypeScript and static build with no credentials; browser-check viewer and app without paid API calls. Commit and push feature branch. No deployment, DNS, deletion, licence changes or ChatGPT sign-in.

# Initial evidence

- No repository or ancestor AGENTS.md found below gitrepos.
- No lockfile or local node_modules present. Existing README prescribes npm; retain npm and create package-lock.json.
- Existing Vite config embeds GEMINI_API_KEY in process.env replacements; remove it.
- Existing app imports samples by absolute URLs but Vite does not copy root samples into production; retain paths and explicitly copy samples during build.
- Existing external PDF/ZIP/font/style dependencies remain in web UI; portable viewer must have zero external asset requirements.

# Initial implementation checks (4ee5abf)

- `npm run typecheck`: exit 0.
- `npm test`: 15 passed, 0 failed. Includes memory-only/persistent/reset keys, malformed/blocked storage, missing-key no-network path, both provider origins and header-only keys, errors/truncation, both PCM speech routes, generated-result validation, all six shipped records, unknown-field/key stripping, HTML escaping, Markdown-copy propagation and standalone copied-folder CLI.
- `npm run build`: exit 0; static output built without credentials. Samples, sample audio and home screenshot copied into dist.
- Synthetic `API_KEY`, `GEMINI_API_KEY` and `OPENAI_API_KEY` build sentinels absent from every production JS/HTML asset. AI Studio importmap references absent.
- `npm audit --omit=dev`: 0 vulnerabilities.
- T3 preview opened; two snapshots failed with `Preview automation snapshot timed out after 15000ms.` Approved headless fallback used.
- Headless Chromium: 16 browser checks passed, 0 page errors. Exact receipt: `docs/evidence-above-the-line-browser-2026-10-22.json`. Includes keyless sample/import/export, memory-only reload, opt-in persistence/reset, study setup, both mocked annotation routes, both mocked slideshow TTS decoding routes, hostile HTML in all result views, disk-opened viewer, JSON round-trip and 390px viewport.
- Browser command: `node scripts/check-above-the-line-browser.mjs /opt/homebrew/lib/node_modules/playwright/index.mjs http://127.0.0.1:4307 /Users/dominiklukes/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`. The module/browser arguments are local test tooling, not portable renderer requirements.
- Portable example registered with ReportScout in place at `docs/example-above-the-line-offline.html`.
- `git diff --check`: exit 0 before checkpoint.

# Rendering and authentication review

- Searched every source rendering path for dangerouslySetInnerHTML, innerHTML, outerHTML, insertAdjacentHTML, DOMParser, document.write and srcDoc: no raw-HTML result insertion. Annotation editing, Deep Read/popovers, slideshow and study use React text. Study comparison summaries render numbers as JSX. No separate comparison view exists.
- Browser hostile-record regression placed image onerror and SVG onload payloads in words, translation, grammar, speakers and idiomatic translation. They remained text in annotation, Deep Read/popover, slideshow and active study views; no injected DOM or execution sentinel appeared.
- Portable renderer HTML-escapes all result strings and protects embedded JSON from script termination. Its CSP disables networking. Its canonical authored interface copy is Markdown/YAML; CSS/JS remain separate and are embedded at packaging time.
- No Google SDK construction, ADC lookup, Vertex routing or injected AI Studio globals. Direct fetch uses only the visitor key. Unused Google SDK dependency removed. Provider responses and network exceptions are converted to fixed messages; raw provider errors are not logged.
- Original translation/title/speaker prompts preserved. Language analysis remains model judgement. Validation, standard voice-locale metadata matching and packaging are deterministic structural operations.
- Existing storage keys for annotations, study sessions and audio were not reset or migrated. Sample result export now works without first copying the sample into the user library.
- No licence, deployment, DNS, GCP-resource or account changes. No app-local SKILL.md; parent owns canonical skill publication.

# Handoff

Copy the entire portable folder to the canonical skill. The module/CLI resolves adjacent assets relative to itself, so no personal path or app build is required. Independent review and future deployment belong to the parent session.

# Limits

No paid provider calls made. Provider transport and errors were tested with mocked responses; live credentials, account/model availability and CORS remain unverified. Browser tests deliberately blocked existing full-app CDN assets, so full-app styling, PDF/ZIP integrations and YouTube playback were not exercised. The portable viewer is self-contained; its read-aloud depends on installed voices and audible output was not auditioned. No production move is claimed.

# Stable portable contract for parent skill

Distribute the entire `portable/` folder, excluding generated output. No npm install or app build required. Runtime: Node 22.18+.

Command: `node portable/render-above-the-line.mjs input.json output.html`.
Module: `import { renderResultHTML } from './portable/render-above-the-line.mjs'`; `renderResultHTML(rawSavedAnnotation)` returns a self-contained HTML string, throws on invalid input. CLI exits nonzero on invalid JSON/records; writes only after successful validation.

Accepted input: exactly one legacy-compatible SavedAnnotation record. Required fields: `id`, `title`, `timestamp` (ISO date), `sourceText`, `sourceLang`, `targetLang`, `annotation: {textType: 'poem'|'prose'|'dialogue', stanzas: [{lines: [{words: [{original, translation, grammar}], idiomaticTranslation?, speaker?}]}]}`. Nonempty stanzas/lines/words, string word fields. Optional `slideshowData: {youtubeUrl, timecodes: [{itemId, startTime, endTime}]}` and `studyHistory` retain existing app format. Exact schema: `portable/schema-above-the-line-result.json`; complete example: `portable/example-above-the-line-result.json`.

The renderer validates and projects allowed fields. Provider settings/credentials and unknown properties are never serialised. Output renders original words, literal translation, grammar, idiomatic translation, speakers and source text; toggles and browser read-aloud require no network or key. Video, provider TTS and study-game UI remain in full app; viewer shows saved results independently. HTML is generated from adjacent Markdown/YAML copy, CSS and JS assets. Parent may copy this folder unchanged into the canonical skill.


# Independent specification review fixes — 2026-10-22

Review source: `/Users/dominiklukes/gitrepos/_COORDINATION/webapps-websites/_TASK-LOG/review-above-the-line-migration-spec-2026-10-22.md`. Baseline `4ee5abf`; clean branch inspected and pulled before writing. All three concrete findings reproduced using synthetic data and intercepted fetch only. Eight initial regression cases failed before the fixes; all pass after them.

- P1 saved sentence timing IDs: runtime validator and JSON Schema now accept `sent-<stanza>-<line>-<counter>` and `sent-final-<counter>` alongside existing stanza/line IDs. Regression retains complete slideshow records through validation, JSON serialisation and embedded portable-result export. Invalid identifiers remain rejected.
- P2 YouTube compatibility: permit the existing player's `ab_channel` and `pp` parameters, retaining HTTPS/host constraints, URL credential exclusion and rejection of key/api_key query fields. Browser regression imports, loads and downloads a record with both parameters and both sentence-ID forms, checking exact record equality.
- P2 stale credentials: each authorised provider configuration snapshot belongs to one abortable request generation, tracked outside serialised settings. Clear, successful settings apply and restore invalidate the old generation, including clearing then reapplying the identical key. Both provider transports check generation identity before every HTTP request and after the response; transport signals combine generation cancellation and the existing timeout. Speech explicitly rechecks its original generation after awaited speaker analysis before requesting audio.
- Cancellation regressions cover clear, key replacement, provider switch and clear/reapply for both Gemini and OpenAI. A deferred mocked speaker response deliberately ignores abort, then completes after settings change: no subsequent TTS request starts, and the original request signal is aborted.

Verification at the fix head, Node v26.12.0:

- `npm test`: 25 passed, 0 failed, including all original tests and 10 added review regressions.
- `node --test --test-name-pattern='portable folder' tests/above-the-line-boundaries.test.mjs`: 1 passed. The temporary copied distribution was created inside this app repository's `tests/` directory, executed from its own folder with no app build/dependencies, and removed in the test's finally block. The test used the authorised write escalation for this app repository, resolving the independent reviewer's sandbox EPERM limitation; no outside-repo scratch path was used.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0; `dist/assets/index-DTN68ZYA.js` generated.
- Approved headless browser command documented above: 17 checks passed, 0 page errors; updated receipt remains `docs/evidence-above-the-line-browser-2026-10-22.json`. New check covers keyless saved-video import/load/export and exact sentence timing/URL retention.
- `git diff --check`: exit 0.

Remaining limits: no live provider/CORS calls or YouTube playback; no audible speech audition; full-app CDN styling and PDF/ZIP integrations remain outside these mocked browser checks. Browser abort prevents follow-up requests and signals cancellation to requests already sent; it cannot guarantee that a provider discards already-accepted work or reverses billing. No deployment, account operations, licence changes or edits outside this app repository.

Parent skill action: refresh the copied `portable/validate-above-the-line.mjs`, `portable/schema-above-the-line-result.json` and `portable/README.md` from this checked fix. CLI/module/copy-asset paths are unchanged.


# Independent standards packaging fix — 2026-10-22

Review source: `/Users/dominiklukes/gitrepos/_COORDINATION/webapps-websites/_TASK-LOG/review-above-the-line-migration-standards-2026-10-22.md`. Baseline `b9861ea99ced0391fa894c0dccfb8c464e4e2768`; branch clean and pulled before writing. Earlier specification fixes independently closed; this change addresses the bundled-recording acceptance gap only. No portable files changed.

- Reproduced P2 with the new integrity check: requested `dist/samples/audio/italian-poem-sample/s0-l0.raw` was absent (`ENOENT`). The build now publishes byte-for-byte copies of all flagged sample line recordings at the exact `/samples/audio/<sample>/<itemId>.raw` paths already requested by the app. Original recordings, existing copied paths, cache identifiers and cache-preload skip behaviour remain unchanged. No recording was regenerated, transcoded, trimmed or replaced.
- Added `scripts/check-above-the-line-assets.mjs` to every production build. It independently enumerates all sample records flagged for packaged audio, checks every referenced built file exists and is nonempty, and compares its complete bytes with the original recording. A missing or changed clip fails the build. Current coverage: 15 of 15 referenced clips.
- Playback verification exposed seven original files with an incomplete final 16-bit PCM sample. The previous decoder threw RangeError when it tried to construct Int16Array over an odd-length buffer, preventing the cached sample collection from loading. Two regressions failed before the decoder change. The decoder now reads complete interleaved little-endian PCM frames through DataView, respecting the supplied byte offset and leaving the original bytes/cache untouched. Only the incomplete final frame is excluded from playback interpretation, without changing the recording.

Verification at the packaging-fix head, Node v26.12.0:

- `npm test`: 27 passed, 0 failed, including the prior 25 regressions plus all-original-recording decode integrity and offset/partial-frame PCM tests. The copied portable-folder CLI test remains included and passes.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0; Vite produced `dist/assets/index-YpiN6hbg.js`; the new asset verifier confirmed 15 nonempty byte-identical built recordings.
- Approved headless browser command documented above: 19 checks passed, 0 page errors. Fresh context requested all 15 bundled URLs and received HTTP 200 for each. IndexedDB contained all 15 clips with exact original lengths and SHA-256 hashes. The Italian slideshow decoded the cached collection and a representative Play click invoked native AudioBufferSourceNode.start with zero provider requests. Reload retained the same cached bytes/hashes.
- Updated browser receipt: `docs/evidence-above-the-line-browser-2026-10-22.json`, now including every audio resource path/status and all 15 recording hashes/lengths. Every external provider request in the remainder of the full browser suite was intercepted with synthetic credentials.
- `git diff --check`: exit 0. All modifications belong to Above the Line; no recorded audio files or portable distribution assets changed.

Limits: headless playback scheduling and decoding were verified, not human listening or recording quality. Existing live-provider/CORS, full-app CDN styling/PDF/ZIP and YouTube-playback limits remain. No paid calls, deployments, account operations, licence changes or other-repository edits.
