import React, { useState } from 'react';
import { LANGUAGES, SAMPLE_TEXTS } from '../constants';
import GenerateIcon from './icons/GenerateIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import InfoIcon from './icons/InfoIcon';
import PromptInfoModal from './PromptInfoModal';

interface AnnotationFormProps {
  text: string;
  setText: (text: string) => void;
  sourceLang: string;
  setSourceLang: (lang: string) => void;
  targetLang: string;
  setTargetLang: (lang: string) => void;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onClear: () => void;
  annotationMode: 'text' | 'video';
  setAnnotationMode: (mode: 'text' | 'video') => void;
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  timecodeFormat: 'start' | 'end';
  setTimecodeFormat: (format: 'start' | 'end') => void;
}

const AnnotationForm: React.FC<AnnotationFormProps> = ({
  text,
  setText,
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  isLoading,
  error,
  onGenerate,
  onClear,
  annotationMode,
  setAnnotationMode,
  youtubeUrl,
  setYoutubeUrl,
  timecodeFormat,
  setTimecodeFormat,
}) => {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const handleSampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = e.target.value;
    if (selectedIndex) {
      setAnnotationMode('text'); // Switch to text mode when a sample is loaded
      const sample = SAMPLE_TEXTS[parseInt(selectedIndex)];
      setText(sample.text);
      setSourceLang(sample.lang);
    }
  };

  const activeTabClasses = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400";
  const inactiveTabClasses = "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600";

  return (
    <>
      <PromptInfoModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} />
      <main className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                  onClick={() => setAnnotationMode('text')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${annotationMode === 'text' ? activeTabClasses : inactiveTabClasses}`}
              >
                  Annotate Text
              </button>
              <button
                  onClick={() => setAnnotationMode('video')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${annotationMode === 'video' ? activeTabClasses : inactiveTabClasses}`}
              >
                  Annotate Video Transcript
              </button>
          </nav>
        </div>

        <div className="space-y-6">
          {annotationMode === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="youtube-url-input" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                      YouTube Video URL
                  </label>
                  <input
                      id="youtube-url-input"
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full p-3 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      placeholder="https://www.youtube.com/watch?v=..."
                  />
              </div>
              <div>
                  <label htmlFor="timecode-format-select" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                      Timecodes Represent
                  </label>
                  <select
                      id="timecode-format-select"
                      value={timecodeFormat}
                      onChange={(e) => setTimecodeFormat(e.target.value as 'start' | 'end')}
                      className="w-full p-3 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  >
                      <option value="start">Start of segment</option>
                      <option value="end">End of segment</option>
                  </select>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="text-input" className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              <span>{annotationMode === 'video' ? 'Timecoded Transcript' : 'Text to Annotate'}</span>
              {annotationMode === 'video' && (
                  <button onClick={() => setIsPromptModalOpen(true)} title="How to format your transcript">
                      <InfoIcon className="text-base text-gray-400 hover:text-blue-500 transition-colors" />
                  </button>
              )}
            </label>
            <textarea
              id="text-input"
              rows={8}
              className="w-full p-3 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              placeholder={annotationMode === 'video' 
                ? "Paste your timecoded transcript here, e.g.,\n[00:15.250] Text segment one...\n[00:18.500] Text segment two..." 
                : "Enter or paste text here..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="sample-text-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Or load a sample text:
            </label>
            <select
              id="sample-text-select"
              className="w-full p-2 text-sm rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              onChange={handleSampleChange}
              value=""
            >
              <option value="" disabled>-- Choose a sample --</option>
              {SAMPLE_TEXTS.map((sample, index) => (
                <option key={index} value={index}>
                  {sample.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lang-select" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                Original Language
              </label>
              <select
                id="lang-select"
                className="w-full p-3 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                {LANGUAGES.map(lang => <option key={lang}>{lang}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="target-lang-input" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                Target Language
              </label>
              <input
                id="target-lang-input"
                type="text"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-3 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={onClear}
              className="w-full flex justify-center items-center py-3 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold rounded-md shadow-lg transition duration-300 ease-in-out"
            >
              <span className="material-symbols-outlined mr-2">delete_sweep</span>
              Clear
            </button>
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="h-5 w-5 mr-3" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <GenerateIcon className="mr-2"/>
                  <span>Generate Annotation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default AnnotationForm;