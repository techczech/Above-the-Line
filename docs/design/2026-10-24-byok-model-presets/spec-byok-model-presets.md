---
title: "AI settings redesign: OpenAI or Gemini key, current low-cost model presets"
status: candidate, not locked; for DTC review before any production work
date: 2026-10-24
apps: Above the Line (text + speech), Metaphornik (text + image)
storyboard: storyboard-byok-model-presets.svg
---

# AI settings redesign (candidate spec)

**No action needed from this file alone.** Dominik's one choice for DTC: look at `storyboard-byok-model-presets.png` (source `storyboard-byok-model-presets.svg`) and pick shape A, B, or B with A's ordering. Provider scope and key checking are settled below. No app code has changed.

## Scope

- Two apps now: Above the Line and Metaphornik. The pattern may be reused later; nothing is rolled out estate-wide.
- One bounded settings surface inside each app's existing generation journey. No new onboarding, no new app-wide planning.
- Trigger: Dominik's DTC comment, "they all need a redesign of the byok to allow for gemini as well as OpenAI and also suggest current best cheap models not outdated ones."

## What exists today (read from source, 2026-10-24)

- Both apps already offer OpenAI and Gemini in a `<details>` form: provider select, password key field, free-text model fields, a remember checkbox, Apply, and "Clear key and reset settings".
- Above (`services/providerConfig.ts`): text model default `gpt-4.1-mini` / `gemini-2.5-flash`; speech default `gpt-4o-mini-tts` / `gemini-2.5-pro-preview-tts`.
- Metaphornik (`services/providerSettings.ts`): text default `gpt-4.1-mini` / `gemini-2.5-pro`; image default `gpt-image-1` / `gemini-2.5-flash-image`.
- So the gaps are the presets (old), the free-text model boxes (no shortlist, no recommendation), no key help, no show/hide, no visible connection state, and a provider switch that silently overwrites model fields with defaults.

## Journey sentence (one, per ux-journeys "Scale")

From opening the app with saved results and no key, the user can view, import and export freely, choose OpenAI or Gemini, paste a key that stays in this browser tab only, accept a recommended low-cost model, generate, and later return to the saved results, and is told at each step what is stored, what a request may cost, and whether the settings have actually worked yet.

**Right when (observable):**
1. With no key, saved results open, import and export work, and no dialog or wall blocks them.
2. After choosing a provider and applying a key, the settings summary line names the provider and model and reads "Applied, not yet used" (not "Working").
3. After one generation succeeds, the summary reads "Working" with the provider name; after a failure it names the cause (key rejected, model unavailable, quota or rate limit, offline).
4. Reloading the page with Remember off leaves the summary on "No key" and the saved results intact; with Remember on, the key is restored and the summary reads "Remembered key, not yet used".
5. After Clear, no key exists in memory or browser storage, and the model choices are reset to the recommended presets.
6. Switching provider always leaves the key field empty.

## Shared pattern (recommended for both apps)

1. **Summary line, always visible** (collapsed state): "AI settings · OpenAI · GPT 6 Luna · Working". Words, not colour alone.
2. **Provider:** two visible choices, OpenAI and Gemini (segmented control or two cards), not a hidden `<select>`.
3. **Key:** masked field, Show/Hide button, Remove button, and a "Where do I get a key?" link to the provider's own key page. Copy: "Use your own API key". Requests go from this browser directly to the provider and are billed to your account. A ChatGPT or Gemini app subscription is not an API key.
4. **Models:** each model slot (text, plus speech in Above, image in Metaphornik) is a dropdown shortlist with a current low-cost model preselected where one is verified. Under "Advanced", "Use another model ID" accepts any ID the existing validator allows. A media slot with no verified preselect shows "Set up when needed" and is not a required field. Each feature checks its own model when it is used: text generation never waits on the speech or image slot, and text plus key can be applied with the media slot left unconfigured. Using speech or image with that slot empty opens the slot with a plain prompt then.
5. **Remember:** off by default. Label: "Remember my key in this browser". Warning stays: other users and scripts on this device can read it.
6. **Apply** saves the draft. It sends no request, so Apply never costs money.
7. **Settings and validity are separate things.** "Applied" means the app holds the values. "Working" means a real generation has succeeded with them. No automatic paid test call and no "Check key" button (settled).
8. **Provider change:** the key field is emptied, a remembered key for the other provider is not offered, and the status reads "Switched to Gemini. Add your Gemini key." Model choices follow the new provider's presets; the only extra state kept is an in-memory draft of each provider's model choice for the current session, if the switch UX needs it. No second credential and no new storage schema.
9. **Custom model IDs survive.** An existing valid custom ID is kept until the user presses reset. The app never swaps a stored ID for a newer one. A newer recommendation appears as an inline note ("A newer low-cost option is listed: …") with a button; it changes nothing by itself.
10. **No wall:** nothing in the page blocks saved results or a sample. The first-run state is the collapsed summary line "AI settings · No key", with saved results below it.

## Per-app slots

| Slot | Above the Line | Metaphornik |
|---|---|---|
| Text | yes | yes |
| Second slot | Speech (read-aloud) | Image (generate and edit) |

Same panel, one extra dropdown whose label differs. Nothing else differs in the pattern.

## Provisional model presets

Status: **provisional pending compatibility checks.** Sources the parent read on 2026-10-24: developers.openai.com model and pricing pages; ai.google.dev model and pricing pages. No model is labelled "best quality": nobody has compared them on these apps' tasks. The label is "Recommended low-cost option", meaning currently listed, stable where stated, and cheap. No audits or paid requests were run for this document.

| Slot | OpenAI preselect | Gemini preselect | Evidence and open check |
|---|---|---|---|
| Text, both apps | `gpt-6-luna` ($0.10 in / $0.50 out per 1M tokens, standard) | `gemini-3.5-flash-lite` (stable; $0.30 in / $2.50 out per 1M, standard); label "Newer low-cost option" | Check each works with the apps' current request shape and structured-output use. |
| Speech, Above | none chosen. `gpt-4o-mini-tts` (today's default) is listed deprecated; replacement unknown | `gemini-3.8-flash-lite-tts` (stable, low cost; price not recorded here) | Verify OpenAI replacement and that the app's speech call fits it. The Gemini TTS model needs the same check; today's default is a preview TTS model. |
| Image, Metaphornik | none chosen. `gpt-image-1` (today's default) is old; newer options need a compatible generate and edit endpoint | `gemini-3.1-flash-lite-image` (cost-efficient generate and edit; price not recorded here) | Verify generate and edit both work through the app's current calls before preselecting. |

Shortlist extras (shown below the preselect): `gemini-3.1-flash-lite` (Gemini text; current stable, official standard price $0.25 in / $1.50 out per 1M, cheaper than 3.5 Flash-Lite; label "Lower cost"); `gpt-4.1-mini` (OpenAI text; label "Older"). Labels describe price and release only; none claims quality. Image and speech prices are deliberately absent: not captured, not invented. A media slot without a verified preselect reads "Set up when needed" and never blocks Apply.

## States (named once, used by both shapes)

| State | What the user sees | Notes |
|---|---|---|
| No key | "AI settings · No key. Saved results still open." | Default first run. |
| Drafted settings | Fields edited, Apply enabled, "Not applied yet" | Leaving the page loses the draft; the key was never stored. |
| Applied (unverified) | "Applied, not yet used" | Nothing sent to any provider. |
| Request in progress | "Waiting for OpenAI…" with Cancel | Existing abort behaviour on settings change stays. |
| Working | "Working · last request OK" | Set only by a real success. |
| Rejected key | "OpenAI did not accept this key. Check it or paste a new one." | Key field focused; model unchanged. |
| Model unavailable | "This account cannot use <model ID>. Choose another model." | Dropdown opened; key unchanged. |
| Quota or rate limit | "OpenAI says you are over a limit or out of credit. Try later, or check your account." | Not a key fault; no settings change offered. |
| Switched provider | "Switched to Gemini. Add your Gemini key." | Key empty, models set from Gemini presets or the session choice for Gemini. |
| Remembered key | "Key remembered in this browser" with Forget button | Restored on reload, still unverified. |
| Cleared key | "Key removed from memory and this browser." | Models reset to presets. |
| Offline or keyless | Generate buttons disabled with reason; saved results, import and export open | Same copy as No key plus "You are offline" when applicable. |

Hard rules: the key never goes to a log, an export, a file, an `.env`, or an application server. It is sent directly from the browser to the selected provider for authentication. Demos and the storyboard use a mask only, never a real key request.

## Two journey shapes (see storyboard)

- **A. Provider-first guided setup.** A three-step sequence (provider, key, model), one question per screen, ending in a summary line. Strength: a first-timer is never faced with fields they do not understand. Cost: three taps for a returning user to change one model; needs a way back to a single step.
- **B. Compact inline panel.** One panel, every field visible, with a live status chip and inline problem fixes. Strength: changing a model, key or provider is one place, one glance. Cost: a first-timer sees all fields at once, and "which field do I touch first?" depends on the order and copy.

**Recommendation:** B as the default panel, with A's step logic used only as a first-visit ordering inside it (provider, then key, then model, the rest collapsed under Advanced). Reason: both apps already use a single `<details>` form; this keeps later changes to a model, key or provider in one place. Dominik decides.

## Decision for Dominik

1. **Shape A, B, or B with A's ordering?** (recommendation above). This is the only visual choice left for DTC.

## Settled technical decisions (parent, 2026-10-24)

- One provider per app. Speech and image use the same provider and key as text; no separate provider per feature.
- No "Check key" button and no paid test request. "Working" appears after the first real success.
- Existing custom settings are kept until the user presses reset; the app never upgrades a model silently.

## Unsettled / provisional

- Every model ID and price above is a candidate from the parent's 2026-10-24 reading of official pages, to be re-checked at build time. OpenAI speech and image, and Gemini speech and image prices, have no verified preselect or price.
- Compatibility of each preselected model with each app's current API calls is unchecked.
- Today's code replaces model fields with defaults when the provider changes, and Metaphornik's provider change also clears a remembered key. The rule "keep a valid custom ID until the user resets" is a change from that.
- Exact wording of key-page links per provider is unwritten.
- Visual design (colour, type, spacing) belongs to the app's existing styling; the storyboard is wireframe only.
