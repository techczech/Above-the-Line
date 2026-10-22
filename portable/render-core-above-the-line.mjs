import { validateResult } from './validate-above-the-line.mjs';
export const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const jsonForHTML = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
// Deliberately limited YAML: flat keys with JSON-quoted string values; no YAML dependency.
export function parseCopy(source) {
  const frontmatter = source.split('---')[1];
  if (!frontmatter) throw new Error('Viewer copy needs YAML frontmatter.');
  return Object.fromEntries(frontmatter.trim().split('\n').filter(Boolean).map(line => {
    const match = line.match(/^([a-zA-Z]+):\s*(".*")$/);
    if (!match) throw new Error('Viewer copy must use flat JSON-quoted YAML strings.');
    return [match[1], JSON.parse(match[2])];
  }));
}
export function renderResult(raw, assets) {
  const result = validateResult(raw);
  const copy = parseCopy(assets.copy);
  const e = escapeHTML;
  const body = result.annotation.stanzas.map(stanza => `<article>${stanza.lines.map(line => `<div class="line">${line.speaker ? `<p class="speaker">${e(line.speaker)}</p>` : ''}<div class="words">${line.words.map(word => `<span class="word"><span class="translation">${e(word.translation)}</span><span class="original">${e(word.original)}</span><span class="grammar">${e(word.grammar)}</span></span>`).join('')}</div>${line.idiomaticTranslation ? `<p class="idiomatic">${e(line.idiomaticTranslation)}</p>` : ''}</div>`).join('')}</article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; img-src data:; base-uri 'none'; form-action 'none'"><title>${e(result.title)} · ${e(copy.title)}</title><style>${assets.style}</style></head><body><main><header><p class="brand">${e(copy.brand)}</p><p class="subtitle">${e(copy.subtitle)}</p></header><h1>${e(result.title)}</h1><p class="meta">${e(result.sourceLang)} → ${e(result.targetLang)} · ${e(result.annotation.textType)}</p><nav>${['translation','grammar','idiomatic'].map(name => `<label><input id="show-${name}" type="checkbox" checked> ${e(copy[name])}</label>`).join('')}<label>${e(copy.voice)} <select id="voice"><option value="">${e(copy.defaultVoice)}</option></select></label>${['read','stop','download','print'].map(name => `<button id="${name}">${e(copy[name])}</button>`).join('')}</nav><p id="speech-error" role="alert"></p><section id="annotation">${body}</section><details><summary>${e(copy.source)}</summary><pre>${e(result.sourceText)}</pre></details><p class="local">${e(copy.local)}</p></main><script type="application/json" id="above-the-line-result">${jsonForHTML(result)}</script><script type="application/json" id="above-the-line-copy">${jsonForHTML(copy)}</script><script>${assets.script.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
}
