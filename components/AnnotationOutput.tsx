import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Annotation, SlideshowData, StudySessionResult, SavedAnnotation } from '../types';
import * as htmlToImage from 'html-to-image';
import DownloadIcon from './icons/DownloadIcon';
import SlideshowIcon from './icons/SlideshowIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import StudyHistory from './StudyHistory';
import CheckCircleIcon from './icons/CheckCircleIcon';
import FilmIcon from './icons/FilmIcon';
import PencilIcon from './icons/PencilIcon';

// Add type declaration for jsPDF loaded from CDN
declare global {
    interface Window {
        jspdf: any;
    }
}

interface AnnotationOutputProps {
  annotation: Annotation;
  title: string;
  isSaved: boolean;
  slideshowData?: SlideshowData;
  studyHistory?: StudySessionResult[];
  onSave: () => void;
  onStartNew: () => void;
  onSaveOnExport: () => SavedAnnotation | null;
  onEnterSlideshow: () => void;
  onEnterDeepRead: () => void;
  onEnterStudyMode: () => void;
  onAnnotationUpdate: (annotation: Annotation) => void;
  onTitleChange: (newTitle: string) => void;
  currentAnnotationId: string | null;
  onExportJson: () => void;
}

const AnnotationOutput: React.FC<AnnotationOutputProps> = ({ annotation, title, isSaved, slideshowData, studyHistory, onSave, onStartNew, onSaveOnExport, onEnterSlideshow, onEnterDeepRead, onEnterStudyMode, onAnnotationUpdate, onTitleChange, currentAnnotationId, onExportJson }) => {
  const [showTranslation, setShowTranslation] = useState(true);
  const [showGrammar, setShowGrammar] = useState(false);
  const [showLineTranslation, setShowLineTranslation] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title);
  const stanzaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { textType } = annotation;
  const unitName = textType === 'prose' ? 'Paragraph' : 'Stanza';
  const unitNamePlural = textType === 'prose' ? 'Paragraphs' : 'Stanzas';

  // Calculate stats
  const stanzaCount = annotation.stanzas.length;
  const lineCount = annotation.stanzas.reduce((sum, s) => sum + s.lines.length, 0);
  const wordCount = annotation.stanzas.reduce((sum, s) => sum + s.lines.reduce((lSum, l) => lSum + l.words.length, 0), 0);

  // Sync local title state with prop
  useEffect(() => {
    setEditableTitle(title);
  }, [title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editableTitle.trim() && editableTitle !== title) {
      onTitleChange(editableTitle.trim());
    } else {
      setEditableTitle(title); // Revert if empty or unchanged
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditableTitle(title);
      setIsEditingTitle(false);
    }
  };

  // Ensure refs array is the correct size
  useEffect(() => {
    stanzaRefs.current = stanzaRefs.current.slice(0, annotation.stanzas.length);
  }, [annotation]);

  const handleTranslationChange = useCallback((
    e: React.FocusEvent<HTMLSpanElement>,
    sIndex: number,
    lIndex: number,
    wIndex: number
  ) => {
    const newTranslation = e.currentTarget.textContent || '';
    if (annotation.stanzas[sIndex].lines[lIndex].words[wIndex].translation === newTranslation) {
      return;
    }

    const newAnnotation = JSON.parse(JSON.stringify(annotation));
    newAnnotation.stanzas[sIndex].lines[lIndex].words[wIndex].translation = newTranslation;
    onAnnotationUpdate(newAnnotation);
  }, [annotation, onAnnotationUpdate]);

  const getLineHeightClass = () => {
    if (showTranslation && showGrammar) return 'leading-[3.5]';
    if (!showTranslation && !showGrammar) return 'leading-normal';
    return 'leading-[2.5]';
  };
  
  const getImageOptions = () => ({
    cacheBust: true,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
  });
  
  const exportStanzaAsImage = useCallback((element: HTMLDivElement | null, fileName: string) => {
    if (element === null) {
      return;
    }
    onSaveOnExport();
    htmlToImage.toPng(element, getImageOptions())
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Oops, something went wrong!', err);
      });
  }, [onSaveOnExport]);

  const exportAsPdf = useCallback(async () => {
    const savedAnnotation = onSaveOnExport();
    if (!savedAnnotation) return;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const padding = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth() - padding * 2;
    const pdfHeight = pdf.internal.pageSize.getHeight() - padding * 2;

    for (let i = 0; i < stanzaRefs.current.length; i++) {
        const element = stanzaRefs.current[i];
        if (element) {
            const dataUrl = await htmlToImage.toPng(element, getImageOptions());

            const imgProps= pdf.getImageProperties(dataUrl);
            const ratio = imgProps.width / imgProps.height;
            
            let finalImgWidth = pdfWidth;
            let finalImgHeight = finalImgWidth / ratio;
            
            if (finalImgHeight > pdfHeight) {
                finalImgHeight = pdfHeight;
                finalImgWidth = finalImgHeight * ratio;
            }

            if (i > 0) {
                pdf.addPage();
            }

            const x = (pdf.internal.pageSize.getWidth() - finalImgWidth) / 2;
            const y = (pdf.internal.pageSize.getHeight() - finalImgHeight) / 2;
            
            pdf.addImage(dataUrl, 'PNG', x, y, finalImgWidth, finalImgHeight);
        }
    }
    pdf.save(`${savedAnnotation.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  }, [onSaveOnExport]);

  useEffect(() => {
    const handler = () => exportAsPdf();
    window.addEventListener('exportPdf', handler);
    return () => {
      window.removeEventListener('exportPdf', handler);
    };
  }, [exportAsPdf]);


  return (
    <div className="mt-8">
      <div className="text-center mb-8">
        <div className="group relative inline-flex justify-center items-center">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md text-gray-900 dark:text-white px-2"
                aria-label="Edit title"
              />
            ) : (
              <h2
                className="text-3xl font-bold text-gray-900 dark:text-white truncate py-1 px-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title="Click to edit title"
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
                <PencilIcon className="inline-block w-5 h-5 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            )}
        </div>
        <div className="flex justify-center items-center gap-6 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{stanzaCount} {stanzaCount === 1 ? unitName : unitNamePlural}</span>
          <span>{lineCount} {lineCount === 1 ? 'Line' : 'Lines'}</span>
          <span>{wordCount} {wordCount === 1 ? 'Word' : 'Words'}</span>
        </div>
        <div className="flex justify-center items-center gap-4 mt-3 text-xs">
          {isSaved && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-medium">
              <CheckCircleIcon className="w-4 h-4" /> Saved
            </span>
          )}
          {slideshowData?.youtubeUrl && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 font-medium">
              <FilmIcon className="w-4 h-4" /> Slideshow
            </span>
          )}
          {studyHistory && studyHistory.length > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium">
              <GraduationCapIcon className="w-4 h-4" /> Study History
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 mb-6">
        {/* Left-aligned interaction modes */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button onClick={onEnterStudyMode} title="Switch to Study Mode (s)" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition flex items-center gap-2">
                <GraduationCapIcon className="w-4 h-4" /> Study Mode
            </button>
            <button onClick={onEnterDeepRead} title="Switch to Deep Read (r)" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4" /> Deep Read
            </button>
            <button onClick={onEnterSlideshow} title="Switch to Slideshow (h)" className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition flex items-center gap-2">
                <SlideshowIcon className="w-4 h-4" /> Slideshow
            </button>
        </div>

        {/* Right-aligned file actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button onClick={onStartNew} title="Start a New Annotation (n)" className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 transition">New Annotation</button>
            <button onClick={onSave} title="Save or Update Annotation (u)" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition">{isSaved ? 'Update' : 'Save'}</button>
            <button onClick={onExportJson} title="Export as JSON (e)" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">Export JSON</button>
            <button onClick={exportAsPdf} title="Export as PDF (p)" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition">Export PDF</button>
        </div>
      </div>
      
      <div>
        <div className="flex justify-center items-center space-x-6 p-3 mb-6 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded bg-gray-200 dark:bg-gray-600 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500"
              checked={showTranslation}
              onChange={() => setShowTranslation(!showTranslation)}
            />
            <span>Word Translation</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded bg-gray-200 dark:bg-gray-600 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500"
              checked={showLineTranslation}
              onChange={() => setShowLineTranslation(!showLineTranslation)}
            />
            <span>Line Translation</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded bg-gray-200 dark:bg-gray-600 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500"
              checked={showGrammar}
              onChange={() => setShowGrammar(!showGrammar)}
            />
            <span>Grammar</span>
          </label>
        </div>

        {annotation.stanzas.map((stanza, sIndex) => (
          <div key={sIndex} ref={el => { stanzaRefs.current[sIndex] = el; }} className="relative mb-10 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button 
              onClick={() => exportStanzaAsImage(stanzaRefs.current[sIndex], `${unitName.toLowerCase()}-${sIndex + 1}.png`)}
              className="absolute top-2 right-2 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
              title={`Export this ${unitName.toLowerCase()} as PNG`}
              aria-label={`Export this ${unitName.toLowerCase()} as PNG`}
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
            {stanza.lines.map((line, lIndex) => (
              <div key={lIndex} className={textType === 'dialogue' ? 'mb-4' : 'mb-2'}>
                {textType === 'dialogue' && line.speaker && (
                  <p className="font-sans font-bold text-gray-800 dark:text-gray-200">{line.speaker}</p>
                )}
                <p className={`font-serif text-xl transition-all duration-200 ease-in-out ${getLineHeightClass()} ${textType === 'dialogue' ? 'pl-4' : ''}`}>
                  {line.words.map((word, wIndex) => (
                    <div key={wIndex} className="inline-block text-center align-top mx-1 px-1 py-2">
                      {showTranslation && (
                        <span
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleTranslationChange(e, sIndex, lIndex, wIndex)}
                          className="block text-sm text-gray-600 dark:text-gray-400 font-sans font-medium rounded-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:bg-gray-700 focus:bg-gray-100 cursor-text"
                        >
                          {word.translation || ' '}
                        </span>
                      )}
                      <span className="block my-0.5">{word.original || ' '}</span>
                      {showGrammar && <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-sans italic">{word.grammar || ' '}</span>}
                    </div>
                  ))}
                </p>
                {showLineTranslation && line.idiomaticTranslation && (
                    <p className={`font-sans text-md italic text-gray-600 dark:text-gray-400 mt-2 pl-2 border-l-2 border-blue-500 ${textType === 'dialogue' ? 'ml-4' : ''}`}>
                        {line.idiomaticTranslation}
                    </p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <StudyHistory history={studyHistory} />

    </div>
  );
};

export default AnnotationOutput;