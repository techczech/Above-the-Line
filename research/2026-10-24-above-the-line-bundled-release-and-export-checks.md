---
date: "2026-10-24"
status: "implementing"
title: "Above the Line bundled release and export checks"
kind: "evidence"
created: "2026-10-24T01:51:19Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/03_Google-AI-studio/Above-the-Line"
sources:
  - file: docs/checkpoint-above-the-line-cloudflare-release.md
  - file: docs/evidence-above-the-line-exports-release.json
---

# Scope and plan

Retain the checked visitor-key app, recordings, portable viewer and original language prompts. Bundle the remaining runtime styling/fonts and ZIP/PDF dependencies so the full static application can be verified. Add canonical readable landing metadata and Pages preview noindex headers. Test keyless samples, original recordings, provider mocks, local ZIP/JSON/HTML/PDF exports and portable distributions. Prepare an authorised non-production hosted preview and independent review. Public custom-domain changes, licence choice/public package distribution, real paid provider calls and GCP deletion are separate later actions. Original checked app: 6b68c55. No existing app source is discarded.

## Verification

- Initial production gate correctly failed against the prior CDN-dependent build. The revised static build passes canonical landing, local resource, sitemap and preview-header gates.
- 27 focused tests and TypeScript pass. Production build verifies all 15 original sample recordings remain byte-identical. Existing isolated browser suite passes 19 checks with zero external asset requests or page errors.
- Additional browser export suite passes six checks: local styles/multilingual fonts, JSON annotation fidelity, ZIP with all 15 cached clips, real PDF and PNG downloads, fresh-context keyless ZIP import and zero failed resources. PDFs and images were checked by file signatures; original recording bytes were not modified.
- Early failures in the new export test were incorrect sample-card, PNG-button and My Texts selectors. They were corrected to the actual controls; no application PNG defect was established. The complete rerun passes. Desktop/mobile screenshots and machine-readable receipts are in docs/.
- ZIP and PDF runtime dependencies are npm modules; browser-native Blob download replaces the external file-saver import. The optional YouTube API loads only when opening a video slideshow. Live YouTube playback and provider/CORS/audio quality remain unverified; no paid calls.
- Cloudflare project above-the-line created for authorised preview preparation (assigned base host above-the-line-228.pages.dev). No custom domain changed; deployment pending below.
- Licence is unchanged. Public skill publication waits on the concrete user licence/diff decision; local staging is permitted preparation.
