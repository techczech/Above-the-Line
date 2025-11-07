import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Annotation, SavedAnnotation, Theme, SlideshowData, Timecode } from './types';
import Header from './components/Header';
import AnnotationForm from './components/AnnotationForm';
import AnnotationOutput from './components/AnnotationOutput';
import SavedAnnotations from './components/SavedAnnotations';
import SlideshowPlayer from './components/SlideshowPlayer';
import DeepReadView from './components/DeepReadView';
import { generateAnnotation } from './services/geminiService';

const defaultSlideshowData: SlideshowData = { youtubeUrl: '', timecodes: [] };

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('Autodetect Language');
  const [targetLang, setTargetLang] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [savedAnnotations, setSavedAnnotations] = useLocalStorage<SavedAnnotation[]>('saved-annotations', []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCurrentAnnotationSaved, setIsCurrentAnnotationSaved] = useState(false);
  const [isSlideshowVisible, setIsSlideshowVisible] = useState(false);
  const [isDeepReadVisible, setIsDeepReadVisible] = useState(false);
  const [currentSlideshowData, setCurrentSlideshowData] = useState<SlideshowData>(defaultSlideshowData);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      setError("Please enter some text to annotate.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAnnotation(text, sourceLang, targetLang);
      if (!result || !result.stanzas || result.stanzas.length === 0) {
        throw new Error("The model returned an empty or invalid annotation. The input might be too short or unsupported.");
      }
      setAnnotation(result);
      setIsCurrentAnnotationSaved(false);
      setCurrentSlideshowData(defaultSlideshowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [text, sourceLang, targetLang]);

  const handleClear = useCallback(() => {
    setText('');
    setSourceLang('Autodetect Language');
    setTargetLang('English');
    setAnnotation(null);
    setError(null);
    setIsCurrentAnnotationSaved(false);
    setCurrentSlideshowData(defaultSlideshowData);
  }, []);

  const performSave = useCallback(() => {
    if (!annotation || isCurrentAnnotationSaved) return;
    
    const newSave: SavedAnnotation = {
      id: crypto.randomUUID(),
      title: text.substring(0, 40).replace(/\n/g, ' ') + '...',
      timestamp: new Date().toISOString(),
      annotation,
      sourceText: text,
      sourceLang,
      targetLang,
      slideshowData: currentSlideshowData.youtubeUrl ? currentSlideshowData : undefined,
    };

    setSavedAnnotations(prev => [newSave, ...prev]);
    setIsCurrentAnnotationSaved(true);
    showToast("Annotation saved successfully!");
  }, [annotation, isCurrentAnnotationSaved, text, sourceLang, targetLang, setSavedAnnotations, currentSlideshowData]);

  const handleSave = useCallback(() => {
    if (!annotation) return;
    performSave();
    handleClear();
  }, [annotation, performSave, handleClear]);

  const handleSaveOnExport = useCallback(() => {
      if (!annotation) return;
      performSave();
  }, [annotation, performSave]);

  const handleLoad = useCallback((item: SavedAnnotation) => {
    setText(item.sourceText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setAnnotation(item.annotation);
    setCurrentSlideshowData(item.slideshowData || defaultSlideshowData);
    setError(null);
    setIsCurrentAnnotationSaved(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Loaded saved annotation.");
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSavedAnnotations(prev => prev.filter(item => item.id !== id));
    showToast("Annotation deleted.");
  }, [setSavedAnnotations]);

  const handleSaveSlideshowData = (data: SlideshowData) => {
    setCurrentSlideshowData(data);
    setIsCurrentAnnotationSaved(false); // Mark as unsaved due to changes
    showToast("Slideshow data updated. Save the annotation to keep changes.");
  }

  const handleAnnotationUpdate = useCallback((updatedAnnotation: Annotation) => {
    setAnnotation(updatedAnnotation);
    setIsCurrentAnnotationSaved(false);
    showToast("Annotation updated. Save to keep changes.");
  }, []);

  if (isDeepReadVisible && annotation) {
    return <DeepReadView 
      annotation={annotation}
      onExit={() => setIsDeepReadVisible(false)}
    />
  }

  if (isSlideshowVisible && annotation) {
    return <SlideshowPlayer 
      annotation={annotation}
      initialData={currentSlideshowData}
      onExit={() => setIsSlideshowVisible(false)}
      onSave={handleSaveSlideshowData}
    />
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Header theme={theme} setTheme={setTheme} />
      
      {!annotation ? (
        <>
          <AnnotationForm
            text={text}
            setText={setText}
            sourceLang={sourceLang}
            setSourceLang={setSourceLang}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
            isLoading={isLoading}
            error={error}
            onGenerate={handleGenerate}
            onClear={handleClear}
          />
          <SavedAnnotations 
            savedAnnotations={savedAnnotations} 
            onLoad={handleLoad}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <AnnotationOutput
          annotation={annotation}
          slideshowData={currentSlideshowData}
          onSave={handleSave}
          onStartNew={handleClear}
          onSaveOnExport={handleSaveOnExport}
          onEnterSlideshow={() => setIsSlideshowVisible(true)}
          onEnterDeepRead={() => setIsDeepReadVisible(true)}
          onAnnotationUpdate={handleAnnotationUpdate}
        />
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
