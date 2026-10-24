---
title: Above the Line portable result renderer
updated: 2026-10-22
---

# Above the Line portable result renderer

Copy this whole folder to distribute the renderer. It has no npm dependencies, API calls, absolute repository paths or app-build requirement. Node 22.18 or later is required for the CLI. The generated HTML needs only a browser.

```sh
node portable/render-above-the-line.mjs input.json output.html
```

If this folder is the current directory:

```sh
node render-above-the-line.mjs example-above-the-line-result.json result.html
```

The CLI accepts one JSON result and writes UTF-8 HTML after validation succeeds. Missing arguments, malformed JSON or invalid records produce a concise stderr message and exit code 1, without writing the output. A successful command exits 0. The output file is replaced if it already exists.

For an agent or another Node program:

```js
import { renderResultHTML } from './portable/render-above-the-line.mjs';
const html = renderResultHTML(result);
```

`renderResultHTML(result)` is synchronous, returns an HTML string and throws on invalid input. It reads its adjacent assets relative to its own module, so the caller's current directory does not matter. `validateResult` and `validateResults` are exported from `validate-above-the-line.mjs`; the latter accepts one result or a nonempty array for app imports. The renderer itself accepts one result.

## Accepted JSON

The machine-readable format is [schema-above-the-line-result.json](schema-above-the-line-result.json). A complete small result is [example-above-the-line-result.json](example-above-the-line-result.json). It follows the app's existing `SavedAnnotation` format; there is no new wrapper.

Required fields are `id`, `title`, `timestamp`, `sourceText`, `sourceLang`, `targetLang` and `annotation`. Use an ISO timestamp with a time component. IDs and language labels must be nonempty strings. Source text can be empty. `annotation.textType` is `poem`, `prose` or `dialogue`. `annotation.stanzas` contains nonempty `lines`; each line contains nonempty `words`. Every word has string `original`, `translation` and `grammar` fields. Keep punctuation as its own word item with grammar `Punct`. A line may also have `speaker` and `idiomaticTranslation` strings. Do not place the speaker label in the words array. The producing model performs translation and grammatical analysis; the renderer only validates and displays the result.

Optional `slideshowData` and `studyHistory` follow the schema and are retained in JSON downloads. Slideshow URLs must be empty or HTTPS YouTube/youtu.be URLs without credentials; only ordinary video query fields (`v`, `t`, `start`, `end`, `si`, `list`, `index`, `feature`, `ab_channel`, `pp`) are accepted. Timecodes use line (`s0-l0`), stanza (`s0`) or sentence (`sent-0-0-0`, `sent-final-0`) item IDs, finite nonnegative seconds and an end time that is null or at least the start time. History numbers must be finite and nonnegative. Arrays are limited to 100,000 entries and strings to 2,000,000 characters. The runtime validator enforces these extra structural constraints. Unknown properties are discarded at every object level, including provider settings and key properties. Never supply credentials in content fields.

The self-contained viewer preserves the interlinear original, literal translation, grammar, idiomatic translation, speaker labels and source text. Readers can toggle the annotation layers, save the validated JSON, print, or read aloud with browser speech synthesis. A voice selector lists installed voices and matches language labels against browser locale metadata when available. The viewer makes no network requests; installed voices depend on the reader's browser and OS, and some browser voices may need a connection. Full study games, editable annotations, YouTube playback and provider-generated/cached audio remain available in the full app. The viewer retains slideshow/history metadata without loading video or embedding audio.

## Editable interface copy

All authored viewer copy lives in `copy-above-the-line-viewer.md`, using flat YAML frontmatter with JSON-quoted string values. Edit those values, then rerun the CLI. The Markdown drives the output; it is not a detached companion export. Styling lives in `viewer-above-the-line.css`, behaviour in `viewer-above-the-line.js`, and packaging in `render-core-above-the-line.mjs`. These assets are embedded in the HTML; adjacent files are never fetched by the viewer.

The app's Save offline HTML action uses these same assets and renderer. Copy this entire folder into a skill distribution; no canonical skill is authored or published here.

## Licence

The portable renderer is distributed under the [MIT licence](LICENSE.txt), copyright (c) 2025 Dominik Lukeš. Third-party dependencies retain their own licences.
