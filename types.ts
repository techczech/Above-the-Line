export interface Word {
  original: string;
  translation: string;
  grammar: string;
}

export interface Line {
  words: Word[];
}

export interface Stanza {
  lines: Line[];
}

export interface Annotation {
  stanzas: Stanza[];
}

export interface Timecode {
  itemId: string; // e.g., "s0-l1-w3" for word or "s0-l1" for line
  time: number; // in seconds
}

export interface SlideshowData {
  youtubeUrl: string;
  timecodes: Timecode[];
}

export interface SavedAnnotation {
  id: string;
  title: string;
  timestamp: string;
  annotation: Annotation;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  slideshowData?: SlideshowData;
}

export type Theme = 'light' | 'dark';