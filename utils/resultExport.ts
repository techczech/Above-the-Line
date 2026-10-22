import { renderResult } from '../portable/render-core-above-the-line.mjs';
import { validateResult } from '../portable/validate-above-the-line.mjs';
import copy from '../portable/copy-above-the-line-viewer.md?raw';
import style from '../portable/viewer-above-the-line.css?raw';
import script from '../portable/viewer-above-the-line.js?raw';
import type { SavedAnnotation } from '../types';
export function downloadResult(result: SavedAnnotation, format: 'json' | 'html') {
  const safeResult = validateResult(result);
  const data = format === 'html' ? renderResult(safeResult, { copy, style, script }) : JSON.stringify(safeResult, null, 2);
  const url = URL.createObjectURL(new Blob([data], {type: format === 'html' ? 'text/html' : 'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = `above-the-line-result.${format}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
