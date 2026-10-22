import { cpSync, copyFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
const samples = new URL('../samples/',import.meta.url);
cpSync(samples,new URL('../dist/samples/',import.meta.url),{recursive:true});

// Preserve the original files while publishing the URLs the app uses for cache preload.
for (const name of readdirSync(samples).filter(name => name.endsWith('.json'))) {
  const sample = JSON.parse(readFileSync(new URL(name,samples),'utf8'));
  if (!sample.prepackagedAudio) continue;
  const base = name.slice(0,-5);
  const destination = new URL(`../dist/samples/audio/${base}/`,import.meta.url);
  mkdirSync(destination,{recursive:true});
  sample.annotation.stanzas.forEach((stanza,s) => stanza.lines.forEach((_,l) => {
    const itemId = `s${s}-l${l}`;
    copyFileSync(new URL(`${base}/${itemId}`,samples),new URL(`${itemId}.raw`,destination));
  }));
}
cpSync(new URL('../assets/screenshot.png',import.meta.url),new URL('../dist/assets/screenshot.png',import.meta.url));
