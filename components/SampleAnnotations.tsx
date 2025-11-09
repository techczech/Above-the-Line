import React, { useState } from 'react';
import { SavedAnnotation } from '../types';
import FilmIcon from './icons/FilmIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import ArticleIcon from './icons/ArticleIcon';

interface SampleAnnotationsProps {
  samples: SavedAnnotation[];
  onLoad: (annotation: SavedAnnotation) => void;
  annotationsWithAudio: Set<string>;
}

const SampleAnnotations: React.FC<SampleAnnotationsProps> = ({ samples, onLoad, annotationsWithAudio }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="mt-12">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex justify-between items-center text-left text-3xl font-bold text-gray-900 dark:text-white mb-6"
        aria-expanded={!isCollapsed}
        aria-controls="sample-annotations-content"
      >
        <span>Sample Texts</span>
        <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>

      {!isCollapsed && (
        <div id="sample-annotations-content">
          {samples.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p>Loading samples...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {samples.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {item.slideshowData && <FilmIcon className="w-5 h-5 text-gray-400" title="Video slideshow available" />}
                    {annotationsWithAudio.has(item.id) && <SpeakerWaveIcon className="w-5 h-5 text-gray-400" title="Audio slideshow available" />}
                    {!item.slideshowData && !annotationsWithAudio.has(item.id) && <ArticleIcon className="w-5 h-5 text-gray-400" title="Text only" />}
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Pre-annotated sample
                      </p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => onLoad(item)}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">folder_open</span>
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SampleAnnotations;
