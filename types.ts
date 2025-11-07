
export interface Word {
  original: string;
  translation: string;
  grammar: string;
}

export interface Line {
  words: Word[];
  idiomaticTranslation?: string;
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
  studyHistory?: StudySessionResult[];
}

export type Theme = 'light' | 'dark';

export interface StudySessionResult {
  score: number;
  totalWords: number;
  durationSeconds: number;
  completedAt: string; // ISO string
  gameMode: 'translation' | 'grammar';
  studyUnit: 'stanza' | 'line';
}

export interface StudySession {
  id: string; // unique id for this session
  annotationId: string; // FK to SavedAnnotation.id
  gameMode: 'translation' | 'grammar';
  playMode: 'points' | 'timed';
  studyUnit: 'stanza' | 'line';
  selectedStanzaIndices?: number[];

  status: 'in-progress' | 'completed';
  currentItemIndex: number;
  currentScore: number;
  timeElapsedSeconds: number;

  result?: StudySessionResult;
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}