---
title: "Above the Line bundled recording packaging and cache preservation"
kind: "evidence"
created: "2026-10-22T19:31:21Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/03_Google-AI-studio/Above-the-Line"
sources:
  - file: docs/evidence-above-the-line-browser-2026-10-22.json
---
Bundled sample-audio packaging gap reproduced with a missing requested static path, then fixed by publishing exact original recording bytes at the app's existing /samples/audio/<sample>/<itemId>.raw URLs. The production build now checks all 15 references for nonempty, byte-identical files. Seven original recordings have an incomplete final 16-bit PCM sample; the previous Int16Array decoder threw RangeError. Complete-frame DataView decoding now preserves all original/cache bytes and honours view offsets. Both decoder regressions failed before the fix. Afterward: 27 Node tests, typecheck and production build passed. Headless browser: 19 checks, zero page errors; all 15 resources returned HTTP 200; fresh IndexedDB cache hashes matched originals and remained unchanged after reload; representative cached playback reached native Web Audio start with zero provider requests. No paid model calls, recording regeneration, portable-folder changes or deployment. Audible recording quality and existing live-provider/CDN/YouTube integration limits remain unverified.
