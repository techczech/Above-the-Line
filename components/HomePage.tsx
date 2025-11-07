import React from 'react';
import SavedAnnotations from './SavedAnnotations';
import { SavedAnnotation } from '../types';

interface HomePageProps {
  onNavigateToAnnotator: () => void;
  onNavigateToAbout: () => void;
  savedAnnotations: SavedAnnotation[];
  onLoad: (annotation: SavedAnnotation) => void;
  onDelete: (id: string) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onNavigateToAnnotator,
  onNavigateToAbout,
  savedAnnotations,
  onLoad,
  onDelete,
  onImport,
  onExport
}) => {
  return (
    <main>
      <section className="text-center md:text-left bg-gray-100 dark:bg-gray-800 p-8 rounded-lg grid md:grid-cols-2 gap-8 items-center border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
            Your Companion for Exploring Texts in Any Language
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Generate detailed line-by-line translations and grammatical annotations for any text. Deepen your understanding and accelerate your learning.
          </p>
          <div className="flex gap-4 justify-center md:justify-start pt-2">
            <button 
              onClick={onNavigateToAnnotator}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out"
            >
              Annotate New Text
            </button>
            <button 
              onClick={onNavigateToAbout}
              className="px-6 py-3 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-md transition"
            >
              Learn More
            </button>
          </div>
        </div>
        <div className="hidden md:block">
          <img 
            src="/assets/screenshot.png" 
            alt="Screenshot of the Above The Line annotation interface"
            className="rounded-lg shadow-2xl"
          />
        </div>
      </section>

      <SavedAnnotations
        title="Saved Texts"
        savedAnnotations={savedAnnotations}
        onLoad={onLoad}
        onDelete={onDelete}
        onImport={onImport}
        onExport={onExport}
      />
    </main>
  );
};

export default HomePage;