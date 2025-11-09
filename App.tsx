

import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Annotation, SavedAnnotation, Theme, SlideshowData, StudySessionResult, Timecode } from './types';
import Header from './components/Header';
import { generateAnnotation, generateTitle } from './services/geminiService';
import HomePage from './components/HomePage';
import AnnotatorView from './components/AnnotatorView';
import AboutPage from './components/AboutPage';
import { parseTimecodedText } from './utils/textProcessing';
import * as db from './utils/db';

const defaultSlideshowData: SlideshowData = { youtubeUrl: '', timecodes: [] };

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [view, setView] = useState<'home' | 'annotator' | 'about'>('home');
  const [savedAnnotations, setSavedAnnotations] = useLocalStorage<SavedAnnotation[]>('saved-annotations', []);
  const [sampleAnnotations, setSampleAnnotations] = useState<SavedAnnotation[]>([]);
  
  // Annotator State
  const [annotationMode, setAnnotationMode] = useState<'text' | 'video'>('text');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [timecodeFormat, setTimecodeFormat] = useState<'start' | 'end'>('start');
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('Autodetect Language');
  const [targetLang, setTargetLang] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentAnnotationId, setCurrentAnnotationId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [unsavedAudio, setUnsavedAudio] = useState<Map<string, ArrayBuffer>>(new Map());
  
  const [isSlideshowVisible, setIsSlideshowVisible] = useState(false);
  const [isDeepReadVisible, setIsDeepReadVisible] = useState(false);
  const [studyModeTarget, setStudyModeTarget] = useState<SavedAnnotation | null>(null);
  const [currentSlideshowData, setCurrentSlideshowData] = useState<SlideshowData>(defaultSlideshowData);
  const [annotationsWithAudio, setAnnotationsWithAudio] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Unsaved changes prompt
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        // Modern browsers show a generic message. This is for older ones.
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  useEffect(() => {
    const sampleFiles = [
      '/samples/o_tannenbaum.json', 
      '/samples/cicero_de_re_publica.json',
      '/samples/dialogue_in_spanish_about_basic_spanish_conversation.json',
      '/samples/prose_in_french_about_an_episcopal_palace_and_a_ceremonial_dinner.json',
      "/samples/poem_in_russian_about_life's_purpose,_love,_and_nature's_beauty.json"
    ];
    const fetchSamples = async () => {
        try {
            const samples = await Promise.all(
                sampleFiles.map(file => fetch(file).then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch ${file}`);
                    }
                    return res.json();
                }))
            );
            const validSamples = samples.filter(s => s.id && s.title && s.annotation);
            setSampleAnnotations(validSamples as SavedAnnotation[]);
        } catch (error) {
            console.error("Failed to load sample annotations:", error);
        }
    };
    fetchSamples();
  }, []);

  useEffect(() => {
    const checkAllAnnotationsForAudio = async () => {
      if (savedAnnotations.length === 0 && sampleAnnotations.length === 0) {
        setAnnotationsWithAudio(new Set());
        return;
      }
      const allAnnotations = [...savedAnnotations, ...sampleAnnotations];
      const newAnnotationsWithAudio = new Set<string>();

      const promises = allAnnotations.map(async (annotation) => {
        try {
          if (annotation.id) { // Ensure annotation.id is not null/undefined
            const audioFiles = await db.getAllAudioForAnnotation(annotation.id);
            if (audioFiles.length > 0) {
              newAnnotationsWithAudio.add(annotation.id);
            }
          }
        } catch (e) {
          console.error(`Could not check audio for annotation ${annotation.id}`, e);
        }
      });

      await Promise.all(promises);
      setAnnotationsWithAudio(newAnnotationsWithAudio);
    };

    checkAllAnnotationsForAudio();
  }, [savedAnnotations, sampleAnnotations]);

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
    setHasUnsavedChanges(false);
    setCurrentAnnotationId(null);
    setCurrentSlideshowData(defaultSlideshowData);
    setYoutubeUrl('');
    setAnnotationMode('text');
    setUnsavedAudio(new Map());
  }, []);

  const handleNavigateToAnnotator = useCallback(() => {
    handleClear();
    setAnnotationMode('text');
    setView('annotator');
  }, [handleClear]);

  const handleNavigateToVideoAnnotator = useCallback(() => {
    handleClear();
    setAnnotationMode('video');
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
    if (annotationMode === 'video' && !youtubeUrl.trim()) {
        setError("Please enter a YouTube URL for video annotation.");
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let textToAnnotate = text;
      let timecodesFromText: Array<number | null> = [];

      if (annotationMode === 'video') {
        const { cleanedText, timecodes } = parseTimecodedText(text);
        textToAnnotate = cleanedText;
        timecodesFromText = timecodes;
      }

      const [result, titleResult] = await Promise.all([
        generateAnnotation(textToAnnotate, sourceLang, targetLang),
        generateTitle(textToAnnotate)
      ]);

      if (!result || !result.stanzas || result.stanzas.length === 0) {
        throw new Error("The model returned an empty or invalid annotation. The input might be too short or unsupported.");
      }
      
      let newSlideshowData = defaultSlideshowData;
      if (annotationMode === 'video') {
          const lineTimecodes: { itemId: string; time: number }[] = [];
          let lineCounter = 0;
          result.stanzas.forEach((stanza, sIndex) => {
              stanza.lines.forEach((_, lIndex) => {
                  if (lineCounter < timecodesFromText.length && timecodesFromText[lineCounter] !== null) {
                      lineTimecodes.push({
                          itemId: `s${sIndex}-l${lIndex}`,
                          time: timecodesFromText[lineCounter] as number
                      });
                  }
                  lineCounter++;
              });
          });
          
          const generatedTimecodes: Timecode[] = [];
          if (timecodeFormat === 'start') {
              lineTimecodes.forEach((tc, index) => {
                  generatedTimecodes.push({
                      itemId: tc.itemId,
                      startTime: tc.time,
                      endTime: index + 1 < lineTimecodes.length ? lineTimecodes[index + 1].time : null
                  });
              });
          } else { // 'end' format
              lineTimecodes.forEach((tc, index) => {
                  generatedTimecodes.push({
                      itemId: tc.itemId,
                      startTime: index > 0 ? lineTimecodes[index - 1].time : 0,
                      endTime: tc.time
                  });
              });
          }
          newSlideshowData = { youtubeUrl, timecodes: generatedTimecodes };
      }

      setAnnotation(result);
      setCurrentTitle(titleResult);
      setCurrentSlideshowData(newSlideshowData);
      setHasUnsavedChanges(true);
      setCurrentAnnotationId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [text, sourceLang, targetLang, annotationMode, youtubeUrl, timecodeFormat]);

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

    if (unsavedAudio.size > 0) {
      unsavedAudio.forEach(async (data, itemId) => {
          await db.saveAudio(id, itemId, data);
      });
      setUnsavedAudio(new Map());
    }

    setCurrentAnnotationId(id);
    setHasUnsavedChanges(false);
    showToast(currentAnnotationId ? "Annotation updated!" : "Annotation saved!");
    return savedOrUpdatedAnnotation;
  }, [annotation, currentAnnotationId, text, sourceLang, targetLang, currentSlideshowData, setSavedAnnotations, showToast, savedAnnotations, currentTitle, unsavedAudio]);

  const handleSaveOnExport = useCallback((): SavedAnnotation | null => {
    if (hasUnsavedChanges) {
        return handleSave();
    }
    return savedAnnotations.find(a => a.id === currentAnnotationId) ?? null;
  }, [hasUnsavedChanges, handleSave, savedAnnotations, currentAnnotationId]);

  const handleLoad = useCallback((item: SavedAnnotation) => {
    setText(item.sourceText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setAnnotation(item.annotation);
    setCurrentTitle(item.title);
    setCurrentSlideshowData(item.slideshowData || defaultSlideshowData);
    setError(null);
    setCurrentAnnotationId(item.id);
    setHasUnsavedChanges(false);
    setUnsavedAudio(new Map());
    // If loaded item has slideshow data, switch to video mode
    if (item.slideshowData?.youtubeUrl) {
      setAnnotationMode('video');
      setYoutubeUrl(item.slideshowData.youtubeUrl);
    } else {
      setAnnotationMode('text');
      setYoutubeUrl('');
    }
    setView('annotator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Loaded saved annotation.");
  }, [showToast]);

  const handleDelete = useCallback(async (id: string) => {
    setSavedAnnotations(prev => prev.filter(item => item.id !== id));
    await db.deleteAudioForAnnotation(id);
    showToast("Annotation and associated audio deleted.");
  }, [setSavedAnnotations, showToast]);
  
  const handleExportAll = useCallback(async () => {
    if (savedAnnotations.length === 0) {
      showToast("No saved texts to export.");
      return;
    }

    try {
      const JSZip = window.JSZip;
      if (!JSZip) {
        throw new Error("JSZip library not loaded.");
      }
      
      const { default: saveAs } = await import('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm');
      
      const zip = new JSZip();
      showToast("Preparing export... this may take a moment.");

      // Use a for...of loop to handle async operations sequentially and avoid race conditions with file naming
      for (const annotation of savedAnnotations) {
        // Sanitize title for filename, fallback to a portion of the ID
        const baseName = annotation.title.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_-]/g, '') || `annotation_${annotation.id.substring(0,8)}`;
        
        let jsonFileName = `${baseName}.json`;
        let i = 1;
        // Handle potential duplicate filenames
        while(zip.file(jsonFileName)) {
            jsonFileName = `${baseName}_${i++}.json`;
        }

        // Add the JSON file for the annotation
        zip.file(jsonFileName, JSON.stringify(annotation, null, 2));

        // Check for and add associated audio files
        const audioFiles = await db.getAllAudioForAnnotation(annotation.id);
        if (audioFiles.length > 0) {
          const audioFolderName = jsonFileName.replace(/\.json$/, '_audio');
          const audioFolder = zip.folder(audioFolderName);
          if (audioFolder) {
            audioFiles.forEach(file => {
              // Save as .raw since it's raw PCM data, which is more descriptive.
              audioFolder.file(`${file.audioId}.raw`, file.data);
            });
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `above_the_line_export_all.zip`);
      
    } catch (error) {
      console.error("Failed to export all annotations:", error);
      showToast(error instanceof Error ? `Export failed: ${error.message}` : "Export failed.");
    }

  }, [savedAnnotations, showToast]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const resetInput = () => { if (event.target) event.target.value = ''; };

    try {
      if (file.name.endsWith('.zip')) {
        const JSZip = window.JSZip;
        if (!JSZip) throw new Error("ZIP library not loaded.");
        
        const zip = await JSZip.loadAsync(file);
        const jsonFile = zip.file('annotation.json');
        if (!jsonFile) throw new Error("ZIP file does not contain 'annotation.json'.");
        
        const jsonText = await jsonFile.async('string');
        const importedAnnotation = JSON.parse(jsonText) as SavedAnnotation;
        
        if (!importedAnnotation.id || !importedAnnotation.title || !importedAnnotation.annotation) {
          throw new Error("Invalid 'annotation.json' format inside ZIP.");
        }
        
        const audioFolder = zip.folder('audio');
        if (audioFolder) {
            const audioPromises: Promise<void>[] = [];
            audioFolder.forEach((relativePath, file) => {
                const promise = file.async('arraybuffer').then(data => {
                    return db.saveAudio(importedAnnotation.id, relativePath, data);
                });
                audioPromises.push(promise);
            });
            await Promise.all(audioPromises);
        }

        setSavedAnnotations(prev => {
            const existingIndex = prev.findIndex(p => p.id === importedAnnotation.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = importedAnnotation;
                return updated;
            }
            return [importedAnnotation, ...prev];
        });
        showToast(`Imported "${importedAnnotation.title}" from ZIP.`);

      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsedJson = JSON.parse(text);
        const dataToImport: SavedAnnotation[] = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

        if (dataToImport.some(item => !item.id || !item.title || !item.annotation)) {
          throw new Error("Invalid file format. Each item must be a valid annotation.");
        }
        
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
        showToast(`Imported ${dataToImport.length} text(s) from JSON.`);
      } else {
        throw new Error("Unsupported file type. Please select a .json or .zip file.");
      }
    } catch (error) {
      showToast(error instanceof Error ? `Import failed: ${error.message}` : "Import failed.");
    } finally {
      resetInput();
    }
  }, [setSavedAnnotations, showToast]);

  const handleAnnotationUpdate = useCallback((updatedAnnotation: Annotation) => {
    setAnnotation(updatedAnnotation);
    setHasUnsavedChanges(true);
  }, []);

  const handleTitleChange = useCallback((newTitle: string) => {
    setCurrentTitle(newTitle);
    setHasUnsavedChanges(true);
  }, []);

  const handleAudioGenerated = useCallback((itemId: string, data: ArrayBuffer) => {
    setHasUnsavedChanges(true);
    setUnsavedAudio(prev => new Map(prev).set(itemId, data));
  }, []);

  const handleEnterStudyMode = useCallback(() => {
    if (!annotation) {
      showToast("Cannot start study session. No annotation available.");
      return;
    }
  
    let annotationToStudy: SavedAnnotation | null = null;

    if (!hasUnsavedChanges && currentAnnotationId) {
      annotationToStudy = savedAnnotations.find(a => a.id === currentAnnotationId) ?? null;
      if (!annotationToStudy) {
        annotationToStudy = sampleAnnotations.find(a => a.id === currentAnnotationId) ?? null;
      }
    } else {
      annotationToStudy = handleSave();
    }
  
    if (!annotationToStudy) {
      showToast("Failed to save annotation before starting study session.");
      return;
    }
  
    setStudyModeTarget(annotationToStudy);
  
  }, [annotation, hasUnsavedChanges, currentAnnotationId, savedAnnotations, sampleAnnotations, handleSave, showToast]);

  const handleSessionComplete = useCallback((annotationId: string, result: StudySessionResult) => {
    setSavedAnnotations(prev => {
        const userSavedAnnotations = [...prev];
        const annotationIndex = userSavedAnnotations.findIndex(a => a.id === annotationId);

        if (annotationIndex !== -1) {
            const targetAnnotation = { ...userSavedAnnotations[annotationIndex] };
            const newHistory = [...(targetAnnotation.studyHistory || []), result];
            targetAnnotation.studyHistory = newHistory;
            userSavedAnnotations[annotationIndex] = targetAnnotation;
            return userSavedAnnotations;
        } else {
            const sampleAnnotation = sampleAnnotations.find(a => a.id === annotationId);
            if (sampleAnnotation) {
                const newSavedItem: SavedAnnotation = {
                    ...sampleAnnotation,
                    studyHistory: [result],
                    timestamp: new Date().toISOString(),
                };
                return [newSavedItem, ...userSavedAnnotations];
            }
        }
        return prev;
    });
    showToast("Study session results saved!");
  }, [setSavedAnnotations, sampleAnnotations, showToast]);

  const currentSavedAnnotation = savedAnnotations.find(a => a.id === currentAnnotationId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-6">
      <Header theme={theme} setTheme={setTheme} onNavigateHome={handleNavigateHome} onNavigateToAbout={handleNavigateToAbout} />
      
      {view === 'home' && (
        <HomePage 
          onNavigateToAnnotator={handleNavigateToAnnotator}
          onNavigateToVideoAnnotator={handleNavigateToVideoAnnotator}
          sampleAnnotations={sampleAnnotations}
          savedAnnotations={savedAnnotations}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onImport={handleImport}
          onExport={handleExportAll}
          annotationsWithAudio={annotationsWithAudio}
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
          hasUnsavedChanges={hasUnsavedChanges}
          currentSlideshowData={currentSlideshowData}
          currentSavedAnnotation={currentSavedAnnotation}
          currentAnnotationId={currentAnnotationId}
          isSlideshowVisible={isSlideshowVisible}
          isDeepReadVisible={isDeepReadVisible}
          studyModeTarget={studyModeTarget}
          annotationMode={annotationMode}
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          setAnnotationMode={setAnnotationMode}
          timecodeFormat={timecodeFormat}
          setTimecodeFormat={setTimecodeFormat}
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
          onTitleChange={handleTitleChange}
          setStudyModeTarget={setStudyModeTarget}
          onSessionComplete={handleSessionComplete}
          onAudioGenerated={handleAudioGenerated}
          onNavigateHome={handleNavigateHome}
          handleSaveSlideshowData={(data) => {
            setCurrentSlideshowData(data);
            setHasUnsavedChanges(true);
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