import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Annotation, SavedAnnotation, Theme, SlideshowData, StudySessionResult } from './types';
import Header from './components/Header';
import { generateAnnotation, generateTitle } from './services/geminiService';
import HomePage from './components/HomePage';
import AnnotatorView from './components/AnnotatorView';
import AboutPage from './components/AboutPage';

const defaultSlideshowData: SlideshowData = { youtubeUrl: '', timecodes: [] };

const SAMPLE_ANNOTATION: SavedAnnotation = {
  id: 'sample-baudelaire',
  title: "L'Albatros by Charles Baudelaire (Sample)",
  timestamp: "2024-01-01T12:00:00.000Z",
  sourceText: "Souvent, pour s'amuser, les hommes d'équipage\nPrennent des albatros, vastes oiseaux des mers,\nQui suivent, indolents compagnons de voyage,\nLe navire glissant sur les gouffres amers.",
  sourceLang: 'French',
  targetLang: 'English',
  annotation: {
    stanzas: [{
      lines: [
        {
          idiomaticTranslation: "Often, to amuse themselves, the men of the crew",
          words: [
            { original: 'Souvent', translation: 'Often', grammar: 'Adv' }, { original: ',', translation: ',', grammar: 'Punct' },
            { original: 'pour', translation: 'for', grammar: 'Prep' }, { original: 's\'amuser', translation: 'to amuse oneself', grammar: 'V: Inf, Pr' },
            { original: ',', translation: ',', grammar: 'Punct' }, { original: 'les', translation: 'the', grammar: 'Art: Def, M, Pl' },
            { original: 'hommes', translation: 'men', grammar: 'N: M, Pl' }, { original: 'd\'équipage', translation: 'of crew', grammar: 'Prep+N' },
          ],
        },
        {
          idiomaticTranslation: "Catch albatrosses, vast birds of the seas,",
          words: [
            { original: 'Prennent', translation: 'Take', grammar: 'V: Pres, Ind, 3, Pl' }, { original: 'des', translation: 'some', grammar: 'Art: Ind, M, Pl' },
            { original: 'albatros', translation: 'albatrosses', grammar: 'N: M, Pl' }, { original: ',', translation: ',', grammar: 'Punct' },
            { original: 'vastes', translation: 'vast', grammar: 'Adj: M, Pl' }, { original: 'oiseaux', translation: 'birds', grammar: 'N: M, Pl' },
            { original: 'des', translation: 'of the', grammar: 'Art: Contr, Pl' }, { original: 'mers', translation: 'seas', grammar: 'N: F, Pl' },
          ],
        },
        {
          idiomaticTranslation: "Who follow, indolent companions of voyage,",
          words: [
            { original: 'Qui', translation: 'Who', grammar: 'Pron: Rel' }, { original: 'suivent', translation: 'follow', grammar: 'V: Pres, Ind, 3, Pl' },
            { original: ',', translation: ',', grammar: 'Punct' }, { original: 'indolents', translation: 'indolent', grammar: 'Adj: M, Pl' },
            { original: 'compagnons', translation: 'companions', grammar: 'N: M, Pl' }, { original: 'de', translation: 'of', grammar: 'Prep' },
            { original: 'voyage', translation: 'voyage', grammar: 'N: M, Sg' },
          ],
        },
        {
          idiomaticTranslation: "The ship gliding on the bitter abysses.",
          words: [
            { original: 'Le', translation: 'The', grammar: 'Art: Def, M, Sg' }, { original: 'navire', translation: 'ship', grammar: 'N: M, Sg' },
            { original: 'glissant', translation: 'gliding', grammar: 'V: Part, Pres' }, { original: 'sur', translation: 'on', grammar: 'Prep' },
            { original: 'les', translation: 'the', grammar: 'Art: Def, M, Pl' }, { original: 'gouffres', translation: 'abysses', grammar: 'N: M, Pl' },
            { original: 'amers', translation: 'bitter', grammar: 'Adj: M, Pl' }, { original: '.', translation: '.', grammar: 'Punct' },
          ],
        },
      ],
    }],
  },
};

const SAMPLE_ANNOTATION_TANNENBAUM: SavedAnnotation = {
  id: "sample-tannenbaum",
  title: "O Tannenbaum: German song with video slideshow",
  timestamp: "2024-01-02T12:00:00.000Z",
  sourceText: `O Tannenbaum, o Tannenbaum,
wie treu sind deine Blätter!
Du grünst nicht nur zur Sommerzeit,
nein, auch im Winter, wenn es schneit.
O Tannenbaum, o Tannenbaum,
wie treu sind deine Blätter!

O Tannenbaum, o Tannenbaum,
du kannst mir sehr gefallen!
Wie oft hat nicht zur Weihnachtszeit
ein Baum von dir mich hoch erfreut!
O Tannenbaum, o Tannenbaum,
du kannst mir sehr gefallen!

O Tannenbaum, o Tannenbaum,
dein Kleid will mich was lehren:
Die Hoffnung und Beständigkeit
gibt Trost und Kraft zu jeder Zeit.
O Tannenbaum, o Tannenbaum,
dein Kleid will mich was lehren.`,
  sourceLang: "German",
  targetLang: "English",
  annotation: {
    "stanzas": [
      {
        "lines": [
          {
            "words": [
              { "original": "O", "translation": "Oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "o", "translation": "oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" }
            ], "idiomaticTranslation": "Oh fir tree, oh fir tree,"
          },
          {
            "words": [
              { "original": "wie", "translation": "how", "grammar": "Adverb" },
              { "original": "treu", "translation": "faithful", "grammar": "Adjective" },
              { "original": "sind", "translation": "are", "grammar": "V: Pres, Ind, Act, 3rd, Pl" },
              { "original": "deine", "translation": "your", "grammar": "Poss Det: Nom, Pl" },
              { "original": "Blätter!", "translation": "leaves!", "grammar": "Noun: Nom, Neut, Pl" }
            ], "idiomaticTranslation": "how faithful are your leaves!"
          },
          {
            "words": [
              { "original": "Du", "translation": "You", "grammar": "Pron: Nom, 2nd, Sg" },
              { "original": "grünst", "translation": "are green", "grammar": "V: Pres, Ind, Act, 2nd, Sg" },
              { "original": "nicht", "translation": "not", "grammar": "Adverb" },
              { "original": "nur", "translation": "only", "grammar": "Adverb" },
              { "original": "zur", "translation": "to the (at the)", "grammar": "Prep + Art: zu + der, Dat" },
              { "original": "Sommerzeit,", "translation": "summer time,", "grammar": "Noun: Dat, Fem, Sg" }
            ], "idiomaticTranslation": "You are green not only in summer,"
          },
          {
            "words": [
              { "original": "nein,", "translation": "no,", "grammar": "Interjection" },
              { "original": "auch", "translation": "also", "grammar": "Adverb" },
              { "original": "im", "translation": "in the", "grammar": "Prep + Art: in + dem, Dat" },
              { "original": "Winter,", "translation": "winter,", "grammar": "Noun: Dat, Masc, Sg" },
              { "original": "wenn", "translation": "when", "grammar": "Conjunction" },
              { "original": "es", "translation": "it", "grammar": "Pron: Nom, Neut, Sg" },
              { "original": "schneit.", "translation": "snows.", "grammar": "V: Pres, Ind, Act, 3rd, Sg (impersonal)" }
            ], "idiomaticTranslation": "no, also in winter, when it snows."
          },
          {
            "words": [
              { "original": "O", "translation": "Oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "o", "translation": "oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" }
            ], "idiomaticTranslation": "Oh fir tree, oh fir tree,"
          },
          {
            "words": [
              { "original": "wie", "translation": "how", "grammar": "Adverb" },
              { "original": "treu", "translation": "faithful", "grammar": "Adjective" },
              { "original": "sind", "translation": "are", "grammar": "V: Pres, Ind, Act, 3rd, Pl" },
              { "original": "deine", "translation": "your", "grammar": "Poss Det: Nom, Pl" },
              { "original": "Blätter!", "translation": "leaves!", "grammar": "Noun: Nom, Neut, Pl" }
            ], "idiomaticTranslation": "how faithful are your leaves!"
          }
        ]
      },
      {
        "lines": [
          {
            "words": [
              { "original": "O", "translation": "Oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "o", "translation": "oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" }
            ], "idiomaticTranslation": "Oh fir tree, oh fir tree,"
          },
          {
            "words": [
              { "original": "du", "translation": "you", "grammar": "Pron: Nom, 2nd, Sg" },
              { "original": "kannst", "translation": "can", "grammar": "V: Pres, Ind, Act, 2nd, Sg (modal)" },
              { "original": "mir", "translation": "me (to me)", "grammar": "Pron: Dat, 1st, Sg" },
              { "original": "sehr", "translation": "very", "grammar": "Adverb" },
              { "original": "gefallen!", "translation": "please!", "grammar": "V: Inf" }
            ], "idiomaticTranslation": "you can please me greatly!"
          },
          {
            "words": [
              { "original": "Wie", "translation": "How", "grammar": "Adverb" },
              { "original": "oft", "translation": "often", "grammar": "Adverb" },
              { "original": "hat", "translation": "has", "grammar": "Aux V: Pres, Ind, Act, 3rd, Sg" },
              { "original": "nicht", "translation": "not", "grammar": "Adverb" },
              { "original": "zur", "translation": "to the (at the)", "grammar": "Prep + Art: zu + der, Dat" },
              { "original": "Weihnachtszeit", "translation": "Christmas time", "grammar": "Noun: Dat, Fem, Sg" }
            ], "idiomaticTranslation": "How often, not at Christmas time,"
          },
          {
            "words": [
              { "original": "ein", "translation": "a", "grammar": "Art: Nom, Masc, Sg" },
              { "original": "Baum", "translation": "tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "von", "translation": "from", "grammar": "Prep: Dat" },
              { "original": "dir", "translation": "you", "grammar": "Pron: Dat, 2nd, Sg" },
              { "original": "mich", "translation": "me", "grammar": "Pron: Acc, 1st, Sg" },
              { "original": "hoch", "translation": "highly", "grammar": "Adverb" },
              { "original": "erfreut!", "translation": "delighted!", "grammar": "V: Past Participle" }
            ], "idiomaticTranslation": "a tree like you delighted me highly!"
          },
          {
            "words": [
              { "original": "O", "translation": "Oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "o", "translation": "oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" }
            ], "idiomaticTranslation": "Oh fir tree, oh fir tree,"
          },
          {
            "words": [
              { "original": "du", "translation": "you", "grammar": "Pron: Nom, 2nd, Sg" },
              { "original": "kannst", "translation": "can", "grammar": "V: Pres, Ind, Act, 2nd, Sg (modal)" },
              { "original": "mir", "translation": "me (to me)", "grammar": "Pron: Dat, 1st, Sg" },
              { "original": "sehr", "translation": "very", "grammar": "Adverb" },
              { "original": "gefallen!", "translation": "please!", "grammar": "V: Inf" }
            ], "idiomaticTranslation": "you can please me greatly!"
          }
        ]
      },
      {
        "lines": [
          {
            "words": [
              { "original": "O", "translation": "Oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "o", "translation": "oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" }
            ], "idiomaticTranslation": "Oh fir tree, oh fir tree,"
          },
          {
            "words": [
              { "original": "dein", "translation": "your", "grammar": "Poss Det: Nom, Neut, Sg" },
              { "original": "Kleid", "translation": "garment/dress", "grammar": "Noun: Nom, Neut, Sg" },
              { "original": "will", "translation": "wants", "grammar": "V: Pres, Ind, Act, 3rd, Sg (modal)" },
              { "original": "mich", "translation": "me", "grammar": "Pron: Acc, 1st, Sg" },
              { "original": "was", "translation": "something", "grammar": "Pron: Indef, Acc, Neut, Sg" },
              { "original": "lehren:", "translation": "teach:", "grammar": "V: Inf" }
            ], "idiomaticTranslation": "your garment wants to teach me something:"
          },
          {
            "words": [
              { "original": "Die", "translation": "The", "grammar": "Art: Nom, Fem, Sg" },
              { "original": "Hoffnung", "translation": "hope", "grammar": "Noun: Nom, Fem, Sg" },
              { "original": "und", "translation": "and", "grammar": "Conjunction" },
              { "original": "Beständigkeit", "translation": "constancy", "grammar": "Noun: Nom, Fem, Sg" }
            ], "idiomaticTranslation": "Hope and constancy"
          },
          {
            "words": [
              { "original": "gibt", "translation": "gives", "grammar": "V: Pres, Ind, Act, 3rd, Sg" },
              { "original": "Trost", "translation": "comfort", "grammar": "Noun: Acc, Masc, Sg" },
              { "original": "und", "translation": "and", "grammar": "Conjunction" },
              { "original": "Kraft", "translation": "strength", "grammar": "Noun: Acc, Fem, Sg" },
              { "original": "zu", "translation": "at", "grammar": "Prep: Dat" },
              { "original": "jeder", "translation": "every", "grammar": "Det/Adj: Dat, Fem, Sg" },
              { "original": "Zeit.", "translation": "time.", "grammar": "Noun: Dat, Fem, Sg" }
            ], "idiomaticTranslation": "give comfort and strength at all times."
          },
          {
            "words": [
              { "original": "O", "translation": "Oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" },
              { "original": "o", "translation": "oh", "grammar": "Interjection" },
              { "original": "Tannenbaum,", "translation": "fir tree", "grammar": "Noun: Nom, Masc, Sg" }
            ], "idiomaticTranslation": "Oh fir tree, oh fir tree,"
          },
          {
            "words": [
              { "original": "dein", "translation": "your", "grammar": "Poss Det: Nom, Neut, Sg" },
              { "original": "Kleid", "translation": "garment/dress", "grammar": "Noun: Nom, Neut, Sg" },
              { "original": "will", "translation": "wants", "grammar": "V: Pres, Ind, Act, 3rd, Sg (modal)" },
              { "original": "mich", "translation": "me", "grammar": "Pron: Acc, 1st, Sg" },
              { "original": "was", "translation": "something", "grammar": "Pron: Indef, Acc, Neut, Sg" },
              { "original": "lehren.", "translation": "teach.", "grammar": "V: Inf" }
            ], "idiomaticTranslation": "your garment wants to teach me something."
          }
        ]
      }
    ]
  },
  "slideshowData": {
    "youtubeUrl": "https://www.youtube.com/watch?v=j9U1gJy8AvE",
    "timecodes": [
      { "itemId": "s0-l0", "time": 5.179195912261963 },
      { "itemId": "s0-l1", "time": 10.317132992370606 },
      { "itemId": "s0-l2", "time": 15.996705062942505 },
      { "itemId": "s0-l3", "time": 20.485098801635743 },
      { "itemId": "s0-l4", "time": 25.426029093460084 },
      { "itemId": "s0-l5", "time": 31.562510938964845 },
      { "itemId": "s1-l0", "time": 36.017532005722046 },
      { "itemId": "s1-l1", "time": 41.0659169961853 },
      { "itemId": "s1-l2", "time": 45.50514619836426 },
      { "itemId": "s1-l3", "time": 49.82487311825562 },
      { "itemId": "s1-l4", "time": 54.431015908447264 },
      { "itemId": "s1-l5", "time": 59.1042151373291 },
      { "itemId": "s2-l0", "time": 65.27226604959107 },
      { "itemId": "s2-l1", "time": 70.27705397329711 },
      { "itemId": "s2-l2", "time": 74.47987704196167 },
      { "itemId": "s2-l3", "time": 78.71262704196167 },
      { "itemId": "s2-l4", "time": 83.27222815830994 },
      { "itemId": "s2-l5", "time": 88.41503087602234 }
    ]
  }
};

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [view, setView] = useState<'home' | 'annotator' | 'about'>('home');
  const [savedAnnotations, setSavedAnnotations] = useLocalStorage<SavedAnnotation[]>('saved-annotations', [SAMPLE_ANNOTATION_TANNENBAUM, SAMPLE_ANNOTATION]);
  
  // Annotator State
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('Autodetect Language');
  const [targetLang, setTargetLang] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCurrentAnnotationSaved, setIsCurrentAnnotationSaved] = useState(false);
  const [currentAnnotationId, setCurrentAnnotationId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  
  const [isSlideshowVisible, setIsSlideshowVisible] = useState(false);
  const [isDeepReadVisible, setIsDeepReadVisible] = useState(false);
  const [studyModeTarget, setStudyModeTarget] = useState<SavedAnnotation | null>(null);
  const [currentSlideshowData, setCurrentSlideshowData] = useState<SlideshowData>(defaultSlideshowData);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const handleClear = useCallback(() => {
    setText('');
    setSourceLang('Autodetect Language');
    setTargetLang('English');
    setAnnotation(null);
    setError(null);
    setCurrentTitle('');
    setIsCurrentAnnotationSaved(false);
    setCurrentAnnotationId(null);
    setCurrentSlideshowData(defaultSlideshowData);
  }, []);

  const handleNavigateToAnnotator = useCallback(() => {
    handleClear();
    setView('annotator');
  }, [handleClear]);
  
  const handleNavigateHome = useCallback(() => {
    setView('home');
  }, []);
  
  const handleNavigateToAbout = useCallback(() => {
    setView('about');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      setError("Please enter some text to annotate.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const [result, titleResult] = await Promise.all([
        generateAnnotation(text, sourceLang, targetLang),
        generateTitle(text)
      ]);

      if (!result || !result.stanzas || result.stanzas.length === 0) {
        throw new Error("The model returned an empty or invalid annotation. The input might be too short or unsupported.");
      }
      setAnnotation(result);
      setCurrentTitle(titleResult);
      setIsCurrentAnnotationSaved(false);
      setCurrentAnnotationId(null);
      setCurrentSlideshowData(defaultSlideshowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [text, sourceLang, targetLang]);

  const handleSave = useCallback((): SavedAnnotation | null => {
    if (!annotation) return null;

    const id = currentAnnotationId || crypto.randomUUID();
    const existingAnnotation = savedAnnotations.find(item => item.id === id);
    
    const savedOrUpdatedAnnotation: SavedAnnotation = {
      id,
      title: currentTitle || 'Untitled Text',
      timestamp: new Date().toISOString(),
      annotation,
      sourceText: text,
      sourceLang,
      targetLang,
      slideshowData: currentSlideshowData.youtubeUrl ? currentSlideshowData : undefined,
      studyHistory: existingAnnotation?.studyHistory || [],
    };

    setSavedAnnotations(prev => {
      const existingIndex = prev.findIndex(item => item.id === id);
      if (existingIndex !== -1) {
        const updatedAnnotations = [...prev];
        updatedAnnotations[existingIndex] = savedOrUpdatedAnnotation;
        return updatedAnnotations;
      }
      return [savedOrUpdatedAnnotation, ...prev];
    });

    setCurrentAnnotationId(id);
    setIsCurrentAnnotationSaved(true);
    showToast(currentAnnotationId ? "Annotation updated!" : "Annotation saved!");
    return savedOrUpdatedAnnotation;
  }, [annotation, currentAnnotationId, text, sourceLang, targetLang, currentSlideshowData, setSavedAnnotations, showToast, savedAnnotations, currentTitle]);

  const handleSaveOnExport = useCallback((): SavedAnnotation | null => {
    if (!isCurrentAnnotationSaved) {
        return handleSave();
    }
    return savedAnnotations.find(a => a.id === currentAnnotationId) ?? null;
  }, [isCurrentAnnotationSaved, handleSave, savedAnnotations, currentAnnotationId]);

  const handleLoad = useCallback((item: SavedAnnotation) => {
    setText(item.sourceText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setAnnotation(item.annotation);
    setCurrentTitle(item.title);
    setCurrentSlideshowData(item.slideshowData || defaultSlideshowData);
    setError(null);
    setCurrentAnnotationId(item.id);
    setIsCurrentAnnotationSaved(true);
    setView('annotator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Loaded saved annotation.");
  }, [showToast]);

  const handleDelete = useCallback((id: string) => {
    setSavedAnnotations(prev => prev.filter(item => item.id !== id));
    showToast("Annotation deleted.");
  }, [setSavedAnnotations, showToast]);
  
  const handleExportAll = useCallback(() => {
    if (savedAnnotations.length === 0) {
      showToast("No saved texts to export.");
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(savedAnnotations, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `above_the_line_export.json`;
    link.click();
  }, [savedAnnotations, showToast]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read");
        const parsedJson = JSON.parse(text);
        
        const dataToImport: SavedAnnotation[] = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

        if (dataToImport.some(item => !item.id || !item.title || !item.annotation)) {
          throw new Error("Invalid file format. Each item must be a valid annotation.");
        }
        
        // Merge with existing, overwriting duplicates
        setSavedAnnotations(prev => {
          const combined = [...prev];
          const prevIds = new Set(prev.map(p => p.id));

          dataToImport.forEach(importedItem => {
            if (prevIds.has(importedItem.id)) {
              const index = combined.findIndex(p => p.id === importedItem.id);
              if (index !== -1) combined[index] = importedItem;
            } else {
              combined.push(importedItem);
            }
          });
          return combined;
        });
        showToast(`Imported ${dataToImport.length} text(s).`);
      } catch (error) {
        showToast(error instanceof Error ? `Import failed: ${error.message}` : "Import failed.");
      } finally {
        // Reset file input
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  }, [setSavedAnnotations, showToast]);

  const handleAnnotationUpdate = useCallback((updatedAnnotation: Annotation) => {
    setAnnotation(updatedAnnotation);
    setIsCurrentAnnotationSaved(false);
    showToast("Annotation updated. Save to keep changes.");
  }, [showToast]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setCurrentTitle(newTitle);
    setIsCurrentAnnotationSaved(false);
    showToast("Title updated. Save to keep changes.");
  }, [showToast]);

  const handleEnterStudyMode = useCallback(() => {
    if (!annotation) {
      showToast("Cannot start study session. No annotation available.");
      return;
    }
  
    let annotationToStudy: SavedAnnotation | null;

    if (isCurrentAnnotationSaved && currentAnnotationId) {
      annotationToStudy = savedAnnotations.find(a => a.id === currentAnnotationId) ?? null;
    } else {
      annotationToStudy = handleSave();
    }
  
    if (!annotationToStudy) {
      showToast("Failed to save annotation before starting study session.");
      return;
    }
  
    setStudyModeTarget(annotationToStudy);
  
  }, [annotation, isCurrentAnnotationSaved, currentAnnotationId, savedAnnotations, handleSave, showToast]);

  const handleSessionComplete = useCallback((annotationId: string, result: StudySessionResult) => {
    setSavedAnnotations(prev => {
        const annotationIndex = prev.findIndex(a => a.id === annotationId);
        if (annotationIndex === -1) return prev;

        const updatedAnnotations = [...prev];
        const targetAnnotation = { ...updatedAnnotations[annotationIndex] };
        
        const newHistory = [...(targetAnnotation.studyHistory || []), result];
        targetAnnotation.studyHistory = newHistory;

        updatedAnnotations[annotationIndex] = targetAnnotation;
        return updatedAnnotations;
    });
    showToast("Study session results saved!");
  }, [setSavedAnnotations, showToast]);

  const currentSavedAnnotation = savedAnnotations.find(a => a.id === currentAnnotationId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-6">
      <Header theme={theme} setTheme={setTheme} onNavigateHome={handleNavigateHome} onNavigateToAbout={handleNavigateToAbout} />
      
      {view === 'home' && (
        <HomePage 
          onNavigateToAnnotator={handleNavigateToAnnotator}
          onNavigateToAbout={handleNavigateToAbout}
          savedAnnotations={savedAnnotations}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onImport={handleImport}
          onExport={handleExportAll}
        />
      )}

      {view === 'annotator' && (
        <AnnotatorView
          annotation={annotation}
          text={text}
          sourceLang={sourceLang}
          targetLang={targetLang}
          isLoading={isLoading}
          error={error}
          currentTitle={currentTitle}
          isCurrentAnnotationSaved={isCurrentAnnotationSaved}
          currentSlideshowData={currentSlideshowData}
          currentSavedAnnotation={currentSavedAnnotation}
          currentAnnotationId={currentAnnotationId}
          setText={setText}
          setSourceLang={setSourceLang}
          setTargetLang={setTargetLang}
          handleGenerate={handleGenerate}
          handleClear={handleClear}
          handleSave={handleSave}
          handleSaveOnExport={handleSaveOnExport}
          setIsSlideshowVisible={setIsSlideshowVisible}
          setIsDeepReadVisible={setIsDeepReadVisible}
          handleEnterStudyMode={handleEnterStudyMode}
          handleAnnotationUpdate={handleAnnotationUpdate}
          // FIX: The prop `onTitleChange` was passed an undefined variable `onTitleChange`. It should be passed the `handleTitleChange` function instead.
          onTitleChange={handleTitleChange}
          isSlideshowVisible={isSlideshowVisible}
          isDeepReadVisible={isDeepReadVisible}
          studyModeTarget={studyModeTarget}
          setStudyModeTarget={setStudyModeTarget}
          // FIX: The prop `onSessionComplete` was passed an undefined variable `onSessionComplete`. It should be passed the `handleSessionComplete` function instead.
          onSessionComplete={handleSessionComplete}
          handleSaveSlideshowData={(data) => {
            setCurrentSlideshowData(data);
            setIsCurrentAnnotationSaved(false);
            showToast("Slideshow data updated. Save the annotation to keep changes.");
          }}
        />
      )}

      {view === 'about' && (
        <AboutPage onNavigateHome={handleNavigateHome} />
      )}

      <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by Google Gemini</p>
      </footer>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out z-50">
            {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
