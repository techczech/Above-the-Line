import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Annotation, SlideshowData } from '../types';
import * as htmlToImage from 'html-to-image';
import DownloadIcon from './icons/DownloadIcon';
import SlideshowIcon from './icons/SlideshowIcon';

// Add type declaration for jsPDF loaded from CDN
declare global {
    interface Window {
        jspdf: any;
    }
}

interface AnnotationOutputProps {
  annotation: Annotation;
  slideshowData?: SlideshowData;
  onSave: () => void;
  onStartNew: () => void;
  onSaveOnExport: () => void;
  onEnterSlideshow: () => void;
}

const AnnotationOutput: React.FC<AnnotationOutputProps> = ({ annotation, slideshowData, onSave, onStartNew, onSaveOnExport, onEnterSlideshow }) => {
  const [showTranslation, setShowTranslation] = useState(true);
  const [showGrammar, setShowGrammar] = useState(true);
  const stanzaRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ensure refs array is the correct size
  useEffect(() => {
    stanzaRefs.current = stanzaRefs.current.slice(0, annotation.stanzas.length);
  }, [annotation]);

  const getLineHeightClass = () => {
    if (showTranslation && showGrammar) return 'leading-[3.5]';
    if (!showTranslation && !showGrammar) return 'leading-normal';
    return 'leading-[2.5]';
  };
  
  const getImageOptions = () => ({
    cacheBust: true,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
  });

  const exportAsJson = useCallback(() => {
    onSaveOnExport();
    const exportData = {
        annotation,
        slideshowData,
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'annotation_with_slideshow.json';
    link.click();
  }, [annotation, slideshowData, onSaveOnExport]);
  
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
    onSaveOnExport();
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
    pdf.save('annotation.pdf');
  }, [onSaveOnExport]);


  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Generated Annotation
      </h2>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
        <div className="flex justify-center items-center space-x-6 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded bg-gray-200 dark:bg-gray-600 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500"
              checked={showTranslation}
              onChange={() => setShowTranslation(!showTranslation)}
            />
            <span>Show Translation</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded bg-gray-200 dark:bg-gray-600 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500"
              checked={showGrammar}
              onChange={() => setShowGrammar(!showGrammar)}
            />
            <span>Show Grammar</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 flex-wrap justify-center gap-2">
            <button onClick={onStartNew} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 transition">Start New</button>
            <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition">Save</button>
            <button onClick={onEnterSlideshow} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition flex items-center gap-2">
                <SlideshowIcon className="w-4 h-4" /> Slideshow
            </button>
            <button onClick={exportAsJson} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">Export JSON</button>
            <button onClick={exportAsPdf} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition">Export PDF</button>
        </div>
      </div>
      
      <div>
        {annotation.stanzas.map((stanza, sIndex) => (
          // FIX: The ref callback must have a void return type. An arrow function with a concise body `() => expression` returns the expression's result. By using a block body `{ ... }`, the function implicitly returns undefined, satisfying the `void` requirement.
          <div key={sIndex} ref={el => { stanzaRefs.current[sIndex] = el; }} className="relative mb-10 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button 
              onClick={() => exportStanzaAsImage(stanzaRefs.current[sIndex], `section-${sIndex + 1}.png`)}
              className="absolute top-2 right-2 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
              title="Export this section as PNG"
              aria-label="Export this section as PNG"
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
            {stanza.lines.map((line, lIndex) => (
              <p key={lIndex} className={`font-serif text-xl transition-all duration-200 ease-in-out ${getLineHeightClass()}`}>
                {line.words.map((word, wIndex) => (
                  <div key={wIndex} className="inline-block text-center align-top mx-1 px-1 py-2">
                    {showTranslation && <span className="block text-sm text-gray-600 dark:text-gray-400 font-sans font-medium">{word.translation || ' '}</span>}
                    <span className="block my-0.5">{word.original || ' '}</span>
                    {showGrammar && <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-sans italic">{word.grammar || ' '}</span>}
                  </div>
                ))}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationOutput;