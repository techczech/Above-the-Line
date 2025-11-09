
export type TextType = 'poem' | 'prose' | 'dialogue';

export interface Word {
  original: string;
  translation: string;
  grammar: string;
}

export interface Line {
  words: Word[];
  idiomaticTranslation?: string;
  speaker?: string;
}

export interface Stanza {
  lines: Line[];
}

export interface Annotation {
  stanzas: Stanza[];
  textType: TextType;
}

export interface Timecode {
  itemId: string; // e.g., "s0-l1" for line
  startTime: number; // in seconds
  endTime: number | null; // in seconds, can be null for the last item
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

declare global {
    interface Window {
        jspdf: any;
        JSZip: any;
    }
}