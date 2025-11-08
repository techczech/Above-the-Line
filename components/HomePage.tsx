import React from 'react';
import SavedAnnotations from './SavedAnnotations';
import { SavedAnnotation } from '../types';
import FilmIcon from './icons/FilmIcon';
import SampleAnnotations from './SampleAnnotations';

interface HomePageProps {
  onNavigateToAnnotator: () => void;
  onNavigateToVideoAnnotator: () => void;
  sampleAnnotations: SavedAnnotation[];
  savedAnnotations: SavedAnnotation[];
  onLoad: (annotation: SavedAnnotation) => void;
  onDelete: (id: string) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onNavigateToAnnotator,
  onNavigateToVideoAnnotator,
  sampleAnnotations,
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
            Transform Any Text into an Interactive Learning Experience
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Instantly generate line-by-line translations and grammatical breakdowns for texts or video transcripts. Turn your annotations into a synced video slideshow, an interactive study game, or export them as PDFs and images.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
            <button 
              onClick={onNavigateToAnnotator}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out"
            >
              Annotate Text
            </button>
            <button 
              onClick={onNavigateToVideoAnnotator}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-md shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out flex items-center gap-2"
            >
              <FilmIcon className="w-5 h-5" />
              Annotate Video Transcript
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
        title="My Saved Texts"
        savedAnnotations={savedAnnotations}
        onLoad={onLoad}
        onDelete={onDelete}
        onImport={onImport}
        onExport={onExport}
      />

      <SampleAnnotations
        samples={sampleAnnotations}
        onLoad={onLoad}
      />
    </main>
  );
};

export default HomePage;