#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderResult } from './render-core-above-the-line.mjs';
const asset = name => readFileSync(new URL(name, import.meta.url), 'utf8');
export function renderResultHTML(rawSavedAnnotation) {
  return renderResult(rawSavedAnnotation, {
    copy: asset('copy-above-the-line-viewer.md'), style: asset('viewer-above-the-line.css'), script: asset('viewer-above-the-line.js'),
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [, , input, output] = process.argv;
    if (!input || !output) throw new Error('Usage: node render-above-the-line.mjs input.json output.html');
    const html = renderResultHTML(JSON.parse(readFileSync(input, 'utf8')));
    writeFileSync(output, html, 'utf8');
    console.log(`Wrote ${output}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
