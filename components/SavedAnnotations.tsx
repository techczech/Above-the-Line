import React, { useRef } from 'react';
import { SavedAnnotation } from '../types';
import FilmIcon from './icons/FilmIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import ArticleIcon from './icons/ArticleIcon';

interface SavedAnnotationsProps {
  title: string;
  savedAnnotations: SavedAnnotation[];
  onLoad: (annotation: SavedAnnotation) => void;
  onDelete: (id: string) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  annotationsWithAudio: Set<string>;
}

const SavedAnnotations: React.FC<SavedAnnotationsProps> = ({ title, savedAnnotations, onLoad, onDelete, onImport, onExport, annotationsWithAudio }) => {
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={importInputRef}
            onChange={onImport}
            className="hidden"
            accept=".json,.zip"
          />
          <button
            onClick={handleImportClick}
            className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Import
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">archive</span>
            Export All
          </button>
        </div>
      </div>
      
      {savedAnnotations.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p>No saved texts found.</p>
            <p className="text-sm">Use the "Import" button to load texts from a file.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedAnnotations.map((item) => (
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
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedAnnotations;