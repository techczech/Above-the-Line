---
title: "Above the Line browser and rendering safety checks"
kind: "evidence"
created: "2026-10-22T19:14:05Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/03_Google-AI-studio/Above-the-Line"
sources:
  - file: docs/evidence-above-the-line-browser-2026-10-22.json
---
Headless Chromium checked the credential-free static production build and the portable file opened directly from disk. Sixteen browser checks passed with zero page errors: keyless sample reading and JSON export, Deep Read, memory-only reload, explicit persistence/reset, JSON import, keyless HTML export without settings, study setup, missing-key no-request error, both mocked provider annotation routes, both mocked slideshow TTS decoding routes, hostile markup across all result views, offline layer toggles, JSON round-trip and mobile width. Provider requests were intercepted and fulfilled locally; no paid requests occurred. Existing full-app CDN assets were blocked and Tailwind's configuration namespace stubbed, so styling, PDF/ZIP and YouTube integrations were not verified. Browser speech audio was not auditioned. Source inspection found no raw-HTML result insertion. The portable renderer escapes result strings and embedded JSON; authored interface copy is compiled from Markdown/YAML. Live provider credentials, CORS and account availability remain unverified.
