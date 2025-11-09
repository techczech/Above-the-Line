import React from 'react';
import { SavedAnnotation } from '../types';
import FilmIcon from './icons/FilmIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import ArticleIcon from './icons/ArticleIcon';

interface RecentAnnotationsProps {
  annotations: SavedAnnotation[];
  onLoad: (annotation: SavedAnnotation) => void;
  annotationsWithAudio: Set<string>;
  onNavigateToSaved: () => void;
}

const RecentAnnotations: React.FC<RecentAnnotationsProps> = ({ annotations, onLoad, annotationsWithAudio, onNavigateToSaved }) => {
  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Recent Texts
        </h2>
        <button
            onClick={onNavigateToSaved}
            className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition flex items-center gap-2"
        >
            View All Saved Texts
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
      
      {annotations.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p>You have no saved texts yet.</p>
            <p className="text-sm">Annotate a new text to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {annotations.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {item.slideshowData && <FilmIcon className="text-xl text-gray-400" title="Video slideshow available" />}
                {annotationsWithAudio.has(item.id) && <SpeakerWaveIcon className="text-xl text-gray-400" title="Audio slideshow available" />}
                {!item.slideshowData && !annotationsWithAudio.has(item.id) && <ArticleIcon className="text-xl text-gray-400" title="Text only" />}
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Saved on {new Date(item.timestamp).toLocaleString()}
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
  );
};

export default RecentAnnotations;