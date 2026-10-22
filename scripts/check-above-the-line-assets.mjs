import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function checkBundledAudio() {
  const samples = new URL('../samples/', import.meta.url);
  const clips = [];
  for (const name of readdirSync(samples).filter(name => name.endsWith('.json'))) {
    const sample = JSON.parse(readFileSync(new URL(name,samples),'utf8'));
    if (!sample.prepackagedAudio) continue;
    const base = name.slice(0,-5);
    sample.annotation.stanzas.forEach((stanza,s) => stanza.lines.forEach((_,l) => {
      const itemId = `s${s}-l${l}`;
      const path = `samples/audio/${base}/${itemId}.raw`;
      const source = readFileSync(new URL(`${base}/${itemId}`,samples));
      const built = readFileSync(new URL(`../dist/${path}`,import.meta.url));
      assert.ok(statSync(new URL(`../dist/${path}`,import.meta.url)).isFile());
      assert.ok(built.length > 0, `${path} is empty`);
      assert.deepEqual(built,source,`${path} must preserve the original recording bytes`);
      clips.push({path:`/${path}`,bytes:built.length});
    }));
  }
  assert.ok(clips.length > 0, 'No bundled audio references checked');
  return clips;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const clips = checkBundledAudio();
  console.log(`Verified ${clips.length} bundled audio references: every built file is nonempty and byte-identical to its original.`);
}
