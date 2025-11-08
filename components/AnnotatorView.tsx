import React, { useEffect, useCallback } from 'react';
import { Annotation, SavedAnnotation, SlideshowData, StudySessionResult } from '../types';
import AnnotationForm from './AnnotationForm';
import AnnotationOutput from './AnnotationOutput';
import SlideshowPlayer from './SlideshowPlayer';
import DeepReadView from './DeepReadView';
import StudyModeView from './StudyModeView';

interface AnnotatorViewProps {
  // State
  annotation: Annotation | null;
  text: string;
  sourceLang: string;
  targetLang: string;
  isLoading: boolean;
  error: string | null;
  currentTitle: string;
  isCurrentAnnotationSaved: boolean;
  currentSlideshowData: SlideshowData;
  currentSavedAnnotation?: SavedAnnotation;
  currentAnnotationId: string | null;
  isSlideshowVisible: boolean;
  isDeepReadVisible: boolean;
  studyModeTarget: SavedAnnotation | null;
  annotationMode: 'text' | 'video';
  youtubeUrl: string;
  timecodeFormat: 'start' | 'end';

  // Handlers
  setText: (text: string) => void;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  setAnnotationMode: (mode: 'text' | 'video') => void;
  setYoutubeUrl: (url: string) => void;
  setTimecodeFormat: (format: 'start' | 'end') => void;
  handleGenerate: () => void;
  handleClear: () => void;
  handleSave: () => SavedAnnotation | null;
  handleSaveOnExport: () => SavedAnnotation | null;
  setIsSlideshowVisible: (visible: boolean) => void;
  setIsDeepReadVisible: (visible: boolean) => void;
  handleEnterStudyMode: () => void;
  handleAnnotationUpdate: (updatedAnnotation: Annotation) => void;
  onTitleChange: (newTitle: string) => void;
  setStudyModeTarget: (target: SavedAnnotation | null) => void;
  onSessionComplete: (annotationId: string, result: StudySessionResult) => void;
  handleSaveSlideshowData: (data: SlideshowData) => void;
}

const AnnotatorView: React.FC<AnnotatorViewProps> = ({
  annotation, text, sourceLang, targetLang, isLoading, error, currentTitle,
  isCurrentAnnotationSaved, currentSlideshowData, currentSavedAnnotation,
  currentAnnotationId, isSlideshowVisible, isDeepReadVisible, studyModeTarget,
  annotationMode, youtubeUrl, setYoutubeUrl, setAnnotationMode, timecodeFormat, setTimecodeFormat,
  setText, setSourceLang, setTargetLang, handleGenerate, handleClear, handleSave,
  handleSaveOnExport, setIsSlideshowVisible, setIsDeepReadVisible, handleEnterStudyMode,
  handleAnnotationUpdate, onTitleChange, setStudyModeTarget, onSessionComplete, handleSaveSlideshowData
}) => {

  const exportAsJson = useCallback(() => {
    const exportData = handleSaveOnExport();
    if (!exportData) {
      console.error("Could not get data for JSON export.");
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${exportData.title.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
  }, [handleSaveOnExport]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
    }
    
    let actionTaken = false;
    const key = e.key.toLowerCase();

    switch (key) {
      case 'a':
        setStudyModeTarget(null);
        setIsDeepReadVisible(false);
        setIsSlideshowVisible(false);
        actionTaken = true;
        break;
      case 'r':
        if (annotation) {
            setIsDeepReadVisible(true);
            setIsSlideshowVisible(false);
            setStudyModeTarget(null);
            actionTaken = true;
        }
        break;
      case 'h':
        if (annotation) {
            setIsSlideshowVisible(true);
            setIsDeepReadVisible(false);
            setStudyModeTarget(null);
            actionTaken = true;
        }
        break;
      case 's':
        if (annotation) {
            handleEnterStudyMode();
            setIsSlideshowVisible(false);
            setIsDeepReadVisible(false);
            actionTaken = true;
        }
        break;
       case 'n':
        if (annotation) {
            handleClear();
            actionTaken = true;
        }
        break;
      case 'u':
         if (annotation) {
            handleSave();
            actionTaken = true;
        }
        break;
      case 'e':
        if (annotation) {
            exportAsJson();
            actionTaken = true;
        }
        break;
      case 'p':
        if (annotation) {
            window.dispatchEvent(new CustomEvent('exportPdf'));
            actionTaken = true;
        }
        break;
      default:
        return;
    }

    if (actionTaken) {
      e.preventDefault();
    }
  }, [annotation, setIsDeepReadVisible, setIsSlideshowVisible, setStudyModeTarget, handleEnterStudyMode, handleClear, handleSave, exportAsJson]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (studyModeTarget) {
    return <StudyModeView 
      savedAnnotation={studyModeTarget}
      onExit={() => {
        setStudyModeTarget(null);
      }}
      onSessionComplete={onSessionComplete}
    />
  }

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
    <>
      {!annotation ? (
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
          annotationMode={annotationMode}
          setAnnotationMode={setAnnotationMode}
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          timecodeFormat={timecodeFormat}
          setTimecodeFormat={setTimecodeFormat}
        />
      ) : (
        <>
          <AnnotationOutput
            annotation={annotation}
            title={currentTitle}
            isSaved={isCurrentAnnotationSaved}
            slideshowData={currentSlideshowData}
            studyHistory={currentSavedAnnotation?.studyHistory}
            onSave={handleSave}
            onStartNew={handleClear}
            onSaveOnExport={handleSaveOnExport}
            onEnterSlideshow={() => setIsSlideshowVisible(true)}
            onEnterDeepRead={() => setIsDeepReadVisible(true)}
            onEnterStudyMode={handleEnterStudyMode}
            onAnnotationUpdate={handleAnnotationUpdate}
            onTitleChange={onTitleChange}
            currentAnnotationId={currentAnnotationId}
            onExportJson={exportAsJson}
          />
          <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
            Shortcuts: (s) Study | (r) Read | (h) Slideshow | (n) New | (u) Update | (e) Export | (p) Export PDF | (a) Annotation View
          </div>
        </>
      )}
    </>
  );
};

export default AnnotatorView;