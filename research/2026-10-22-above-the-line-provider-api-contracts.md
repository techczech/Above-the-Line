---
title: "Above the Line provider API contracts"
kind: "evidence"
created: "2026-10-22T19:07:53Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/03_Google-AI-studio/Above-the-Line"
sources:
  - url: "https://developers.openai.com/api/docs/guides/text-to-speech"
  - url: "https://developers.openai.com/api/docs/models/gpt-4.1-mini"
  - url: "https://ai.google.dev/gemini-api/docs/speech-generation"
  - url: "https://ai.google.dev/gemini-api/docs/api-key"
---
Official documentation inspected on 2026-10-22 for the own-key migration. OpenAI's speech guide documents gpt-4o-mini-tts, built-in voices and PCM output as 24 kHz signed 16-bit little-endian without a header. Its model page documents gpt-4.1-mini. Gemini's speech guide lists Gemini 2.5 Pro Preview TTS; its API-key guide demonstrates the x-goog-api-key header. Implementation keeps Gemini 2.5 Flash for text and switches the speech default from the old Flash preview to the documented Pro preview; model IDs remain editable. No paid calls were made. Mock transport tests verify request origins, header-only credentials, text/error parsing and PCM routing. Live provider permissions, availability and CORS are unverified.
