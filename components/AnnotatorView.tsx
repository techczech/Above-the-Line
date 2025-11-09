import React, { useEffect, useCallback } from 'react';
import { Annotation, SavedAnnotation, SlideshowData, StudySessionResult } from '../types';
import AnnotationForm from './AnnotationForm';
import AnnotationOutput from './AnnotationOutput';
import SlideshowPlayer from './SlideshowPlayer';
import DeepReadView from './DeepReadView';
import StudyModeView from './StudyModeView';
import { getAllAudioForAnnotation } from '../utils/db';

interface AnnotatorViewProps {
  // State
  annotation: Annotation | null;
  text: string;
  sourceLang: string;
  targetLang: string;
  isLoading: boolean;
  error: string | null;
  currentTitle: string;
  hasUnsavedChanges: boolean;
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
  onAudioGenerated: (itemId: string, data: ArrayBuffer) => void;
  onNavigateHome: () => void;
}

const AnnotatorView: React.FC<AnnotatorViewProps> = ({
  annotation, text, sourceLang, targetLang, isLoading, error, currentTitle,
  hasUnsavedChanges, currentSlideshowData, currentSavedAnnotation,
  currentAnnotationId, isSlideshowVisible, isDeepReadVisible, studyModeTarget,
  annotationMode, youtubeUrl, setYoutubeUrl, setAnnotationMode, timecodeFormat, setTimecodeFormat,
  setText, setSourceLang, setTargetLang, handleGenerate, handleClear, handleSave,
  handleSaveOnExport, setIsSlideshowVisible, setIsDeepReadVisible, handleEnterStudyMode,
  handleAnnotationUpdate, onTitleChange, setStudyModeTarget, onSessionComplete, handleSaveSlideshowData,
  onAudioGenerated, onNavigateHome
}) => {

  const handleExport = useCallback(async () => {
    const exportData = handleSaveOnExport();
    if (!exportData) {
      console.error("Could not get data for ZIP export.");
      return;
    }
  
    const JSZip = window.JSZip;
    if (!JSZip) {
      console.error("JSZip library not loaded.");
      return;
    }
  
    // Dynamically import saveAs, ensuring we get the default export
    const { default: saveAs } = await import('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm');
  
    const zip = new JSZip();
    zip.file("annotation.json", JSON.stringify(exportData, null, 2));
  
    const audioFiles = await getAllAudioForAnnotation(exportData.id);
    if (audioFiles.length > 0) {
      const audioFolder = zip.folder("audio");
      if (audioFolder) {
        audioFiles.forEach(file => {
          audioFolder.file(file.audioId, file.data);
        });
      }
    }
  
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${exportData.title.toLowerCase().replace(/\s+/g, '_')}.zip`);
  }, [handleSaveOnExport]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
    }
    
    let actionTaken = false;
    const key = e.key.toLowerCase();

    // Allow Cmd/Ctrl+S for saving
    if ((e.ctrlKey || e.metaKey) && key === 's') {
      if (annotation) {
        handleSave();
        actionTaken = true;
      }
    } else {
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
                handleExport();
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
    }

    if (actionTaken) {
      e.preventDefault();
    }
  }, [annotation, setIsDeepReadVisible, setIsSlideshowVisible, setStudyModeTarget, handleEnterStudyMode, handleClear, handleSave, handleExport]);

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
      annotationId={currentAnnotationId}
      initialData={currentSlideshowData}
      onExit={() => setIsSlideshowVisible(false)}
      onSave={handleSaveSlideshowData}
      onAudioGenerated={onAudioGenerated}
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
            isSaved={!hasUnsavedChanges}
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
            onExport={handleExport}
            onNavigateHome={onNavigateHome}
          />
          <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
            Shortcuts: (s) Study | (r) Read | (h) Slideshow | (n) New | (u) Update/Save (or Cmd/Ctrl+S) | (e) Export | (p) Export PDF | (a) Annotation View
          </div>
        </>
      )}
    </>
  );
};

export default AnnotatorView;