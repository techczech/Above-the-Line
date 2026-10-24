// Tracks audio cache work (bundled-sample preloads and saves of generated audio)
// per annotation, so ZIP exports can wait for pending writes before reading the cache.

const pending = new Map<string, Set<Promise<void>>>();
const failed = new Map<string, Set<string>>();

export const trackAudioWork = (annotationId: string, audioId: string, work: Promise<unknown>): Promise<void> => {
  const tracked: Promise<void> = work.then(
    () => { failed.get(annotationId)?.delete(audioId); },
    (error) => {
      console.error(`Audio ${audioId} for annotation ${annotationId} could not be stored`, error);
      if (!failed.has(annotationId)) failed.set(annotationId, new Set());
      failed.get(annotationId)!.add(audioId);
    },
  ).finally(() => {
    const set = pending.get(annotationId);
    set?.delete(tracked);
    if (set?.size === 0) pending.delete(annotationId);
  });
  if (!pending.has(annotationId)) pending.set(annotationId, new Set());
  pending.get(annotationId)!.add(tracked);
  return tracked;
};

// Resolves once no audio work is pending for the annotation; returns the audio IDs
// whose most recent load or save failed. Returns at once when nothing is pending.
export const whenAudioReady = async (annotationId: string): Promise<string[]> => {
  let set = pending.get(annotationId);
  while (set && set.size > 0) {
    await Promise.all(set);
    set = pending.get(annotationId);
  }
  return [...(failed.get(annotationId) ?? [])].sort();
};

export const describeMissingAudio = (count: number): string =>
  `Exported, but ${count} recording${count === 1 ? '' : 's'} could not be loaded and ${count === 1 ? 'is' : 'are'} missing from the ZIP.`;
