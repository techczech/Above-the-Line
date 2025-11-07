import React from 'react';
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

  // Handlers
  setText: (text: string) => void;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
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
  setText, setSourceLang, setTargetLang, handleGenerate, handleClear, handleSave,
  handleSaveOnExport, setIsSlideshowVisible, setIsDeepReadVisible, handleEnterStudyMode,
  handleAnnotationUpdate, onTitleChange, setStudyModeTarget, onSessionComplete, handleSaveSlideshowData
}) => {

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
        />
      ) : (
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
        />
      )}
    </>
  );
};

export default AnnotatorView;
