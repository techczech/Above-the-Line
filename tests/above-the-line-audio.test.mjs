import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { decodeAudioData } from '../utils/audioUtils.ts';
const fakeContext = { createBuffer(channels, length, sampleRate) {
  const data = Array.from({length:channels}, () => new Float32Array(length));
  return {length,sampleRate,getChannelData:channel => data[channel]};
} };

test('every original bundled recording decodes complete PCM frames without altering bytes', async () => {
  const folder = new URL('../samples/italian-poem-sample/',import.meta.url);
  const names = readdirSync(folder);
  assert.equal(names.length,15);
  for (const name of names) {
    const bytes = new Uint8Array(readFileSync(new URL(name,folder)));
    const original = bytes.slice();
    const decoded = await decodeAudioData(bytes,fakeContext,24000,1);
    assert.equal(decoded.length,Math.floor(bytes.length/2),name);
    assert.deepEqual(bytes,original,`${name} source bytes must remain unchanged`);
  }
});
test('PCM decoding honours byte offsets, little-endian samples and trailing partial frames', async () => {
  const backing = new Uint8Array([99,0,128,255,127,42,99]);
  const view = backing.subarray(1,6);
  const decoded = await decodeAudioData(view,fakeContext,24000,1);
  assert.equal(decoded.length,2);
  assert.equal(decoded.getChannelData(0)[0],-1);
  assert.equal(decoded.getChannelData(0)[1],32767/32768);
  assert.deepEqual([...view],[0,128,255,127,42]);
});
