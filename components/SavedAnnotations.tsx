import React from 'react';
import { SavedAnnotation } from '../types';
import FilmIcon from './icons/FilmIcon';

interface SavedAnnotationsProps {
  savedAnnotations: SavedAnnotation[];
  onLoad: (annotation: SavedAnnotation) => void;
  onDelete: (id: string) => void;
}

const SavedAnnotations: React.FC<SavedAnnotationsProps> = ({ savedAnnotations, onLoad, onDelete }) => {
  if (savedAnnotations.length === 0) {
    return (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-white">No Saved Annotations</h2>
            <p>Generate an annotation and click "Save" to keep it here.</p>
        </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Saved Annotations
      </h2>
      <div className="space-y-4 max-w-2xl mx-auto">
        {savedAnnotations.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {item.slideshowData && <FilmIcon className="w-5 h-5 text-gray-400" />}
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
                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
              >
                Load
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedAnnotations;