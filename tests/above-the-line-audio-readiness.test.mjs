import test from 'node:test';
import assert from 'node:assert/strict';
import { trackAudioWork, whenAudioReady, describeMissingAudio } from '../utils/audioReadiness.ts';

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const quietly = async (fn) => { const original = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = original; } };

test('export readiness waits for every pending clip of that annotation, including clips added while waiting', async () => {
  const first = deferred(), second = deferred(), late = deferred();
  trackAudioWork('sample', 's0-l0', first.promise);
  trackAudioWork('sample', 's0-l1', second.promise);
  let ready = false;
  const waiting = whenAudioReady('sample').then(failed => { ready = true; return failed; });
  first.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
  trackAudioWork('sample', 's0-l2', late.promise);
  second.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(ready, false, 'a clip still writing must hold the export');
  late.resolve();
  assert.deepEqual(await waiting, []);
});

test('text-only and unrelated annotations are ready at once', async () => {
  const other = deferred();
  trackAudioWork('busy', 's0-l0', other.promise);
  let ready = false;
  const waiting = whenAudioReady('text-only').then(() => { ready = true; });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(ready, true);
  await waiting;
  other.resolve();
});

test('failed loads are reported, never thrown, and clear when the clip is later stored', async () => {
  await quietly(async () => {
    const tracked = trackAudioWork('broken', 's1-l0', Promise.reject(new Error('404')));
    trackAudioWork('broken', 's0-l0', Promise.resolve());
    await tracked;
    assert.deepEqual(await whenAudioReady('broken'), ['s1-l0']);
    await trackAudioWork('broken', 's1-l0', Promise.resolve());
    assert.deepEqual(await whenAudioReady('broken'), []);
  });
});

test('missing-audio notice names the count', () => {
  assert.equal(describeMissingAudio(1), 'Exported, but 1 recording could not be loaded and is missing from the ZIP.');
  assert.equal(describeMissingAudio(3), 'Exported, but 3 recordings could not be loaded and are missing from the ZIP.');
});
