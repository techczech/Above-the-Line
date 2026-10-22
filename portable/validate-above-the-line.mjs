// Shared structural boundary for generated, imported and exported results.
const fail = () => { throw new Error('Invalid Above the Line result. Check the result schema and nested annotation fields.'); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : fail();
const string = (value, nonempty = false) => typeof value === 'string' && value.length <= 2_000_000 && (!nonempty || value.trim()) ? value : fail();
const array = (value, nonempty = false) => Array.isArray(value) && value.length <= 100_000 && (!nonempty || value.length) ? value : fail();
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fail();
const date = value => { string(value, true); if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) fail(); return value; };
const choice = (value, choices) => choices.includes(value) ? value : fail();

export function validateAnnotation(raw) {
  const value = object(raw);
  return {
    textType: choice(value.textType, ['poem', 'prose', 'dialogue']),
    stanzas: array(value.stanzas, true).map(rawStanza => {
      const stanza = object(rawStanza);
      return { lines: array(stanza.lines, true).map(rawLine => {
        const line = object(rawLine);
        return {
          ...(line.speaker !== undefined ? { speaker: string(line.speaker) } : {}),
          ...(line.idiomaticTranslation !== undefined ? { idiomaticTranslation: string(line.idiomaticTranslation) } : {}),
          words: array(line.words, true).map(rawWord => {
            const word = object(rawWord);
            return { original: string(word.original, true), translation: string(word.translation), grammar: string(word.grammar) };
          }),
        };
      }) };
    }),
  };
}

export function validateResult(raw) {
  const value = object(raw);
  const result = {
    id: string(value.id, true), title: string(value.title, true), timestamp: date(value.timestamp),
    sourceText: string(value.sourceText), sourceLang: string(value.sourceLang, true), targetLang: string(value.targetLang, true),
    annotation: validateAnnotation(value.annotation),
  };
  if (value.slideshowData !== undefined) {
    const data = object(value.slideshowData);
    const youtubeUrl = string(data.youtubeUrl);
    if (youtubeUrl) {
      let url;
      try { url = new URL(youtubeUrl); } catch { fail(); }
      if (url.protocol !== 'https:' || url.username || url.password ||
          !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname) ||
          [...url.searchParams.keys()].some(key => !['v', 't', 'start', 'end', 'si', 'list', 'index', 'feature', 'ab_channel', 'pp'].includes(key))) fail();
    }
    result.slideshowData = { youtubeUrl, timecodes: array(data.timecodes).map(rawTimecode => {
      const tc = object(rawTimecode);
      const itemId = string(tc.itemId, true);
      if (!/^(?:s\d+(?:-l\d+)?|sent-\d+-\d+-\d+|sent-final-\d+)$/.test(itemId)) fail();
      const startTime = number(tc.startTime);
      const endTime = tc.endTime === null ? null : number(tc.endTime);
      if (endTime !== null && endTime < startTime) fail();
      return { itemId, startTime, endTime };
    }) };
  }
  if (value.studyHistory !== undefined) {
    result.studyHistory = array(value.studyHistory).map(rawSession => {
      const session = object(rawSession);
      return { score: number(session.score), totalWords: number(session.totalWords), durationSeconds: number(session.durationSeconds),
        completedAt: date(session.completedAt), gameMode: choice(session.gameMode, ['translation', 'grammar']), studyUnit: choice(session.studyUnit, ['stanza', 'line']) };
    });
  }
  return result;
}

export function validateResults(raw) {
  return (Array.isArray(raw) ? array(raw, true) : [raw]).map(validateResult);
}
