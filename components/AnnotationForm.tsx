
import React from 'react';
import { LANGUAGES, SAMPLE_TEXTS } from '../constants';
import GenerateIcon from './icons/GenerateIcon';
import SpinnerIcon from './icons/SpinnerIcon';

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
}) => {

  const handleSampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = e.target.value;
    if (selectedIndex) {
      const sample = SAMPLE_TEXTS[parseInt(selectedIndex)];
      setText(sample.text);
      setSourceLang(sample.lang);
    }
  };

  return (
    <main className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
      <div className="space-y-6">
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
            Text to Annotate
          </label>
          <textarea
            id="text-input"
            rows={8}
            className="w-full p-3 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            placeholder="Enter or paste text here..."
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
            defaultValue=""
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
  );
};

export default AnnotationForm;
