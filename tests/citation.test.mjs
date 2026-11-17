import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { citationTags } from '../citation/kit/citation.ts';
import { citationPage } from '../citation/page.ts';

test('the server HTML has one complete citation matching the visible citation record', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => tag);
  for (const [attribute, field, expected] of citationTags(citationPage)) {
    const tags = metas.filter(tag => tag.includes(`${attribute}="${field}"`));
    assert.equal(tags.length, 1, field);
    assert.ok(tags[0].includes(`content="${expected}"`), field);
  }
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(html.includes(`href="${citationPage.url}"`));
  assert.ok(!html.includes('Z3988'));
  assert.ok(!html.includes('citation_journal_title'));
});
