---
title: "Above the Line review fix regressions"
kind: "evidence"
created: "2026-10-22T19:21:52Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/03_Google-AI-studio/Above-the-Line"
sources:
  - file: tests/above-the-line-boundaries.test.mjs
---
Independent specification review findings reproduced and fixed in Above the Line on 2026-10-22: sentence slideshow IDs now round-trip through validator, schema, JSON and portable HTML; supported YouTube ab_channel/pp parameters survive while credential-bearing URLs remain rejected. Provider configurations have abortable generation identities, so clearing, changing key/provider or clearing and reapplying identical credentials blocks later TTS after pending speaker analysis, for both Gemini and OpenAI. The first eight regressions failed before fixes. Final focused suite: 25 passed; copied portable-folder CLI test separately passed within the app repo's tests directory; typecheck and production build exited 0. Headless browser: 17 checks, zero page errors, including a saved sentence-timed video import/load/export equality check. All provider HTTP was intercepted with synthetic credentials. Live CORS, provider acceptance, actual video playback, audible speech and existing full-app CDN integrations remain unverified. Abort signals cannot recall work already accepted by a provider.
