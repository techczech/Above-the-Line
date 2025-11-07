import React from 'react';

interface AboutPageProps {
  onNavigateHome: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome }) => {
  return (
    <main>
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-4">About Above The Line</h2>
            <p>
                <strong>Above The Line</strong> was created by Dominik Lukeš in Google AI Studio and is powered by the Gemini API. It is designed as a powerful companion for students, educators, and language enthusiasts to explore texts in depth.
            </p>

            <h3 className="text-2xl font-bold mt-6 mb-2">Core Functionality</h3>
            <p>
                The primary function of the app is to take a piece of text and generate a detailed, interactive annotation. You can:
            </p>
            <ul>
                <li><strong>Enter Any Text:</strong> Paste or type any text into the text area.</li>
                <li><strong>Select Languages:</strong> Choose the source language of your text (or let the app autodetect it) and specify the target language for translations.</li>
                <li><strong>Generate Annotation:</strong> With a single click, Gemini analyzes the text, providing stanza-by-stanza and line-by-line analysis.</li>
            </ul>

            <h3 className="text-2xl font-bold mt-6 mb-2">The Annotation View</h3>
            <p>
                Once an annotation is generated, you have multiple ways to view and interact with the information:
            </p>
            <ul>
                <li><strong>Word Translation:</strong> Toggle to see a literal, word-for-word translation above each original word.</li>
                <li><strong>Grammar Analysis:</strong> Toggle to view a concise grammatical breakdown below each word (e.g., part of speech, tense, case, etc.).</li>
                <li><strong>Line Translation:</strong> See an idiomatic, natural-sounding translation of each complete line.</li>
                <li><strong>Editable Translations:</strong> You can click on any word's translation to edit it, allowing you to refine the output for your specific needs.</li>
            </ul>

            <h3 className="text-2xl font-bold mt-6 mb-2">Advanced Interaction Modes</h3>
            <p>
                Go beyond simple reading with three specialized modes:
            </p>
            <ul>
                <li><strong>Deep Read:</strong> A focused reading environment. Click on any word to see a pop-up with its translation, grammar, or line translation, minimizing distraction.</li>
                <li><strong>Slideshow:</strong> Sync your annotation with a YouTube video. You can create timecodes for each line, sentence, or stanza, turning your text into a karaoke-style presentation. This is perfect for lectures, language classes, or poetry readings.</li>
                <li><strong>Study Mode:</strong> Turn your annotation into an interactive learning game. Test your knowledge by dragging and dropping translations or grammar tags to their corresponding words. Choose between practice mode or a timed challenge to track your progress over time.</li>
            </ul>

            <h3 className="text-2xl font-bold mt-6 mb-2">Saving & Sharing</h3>
            <ul>
                <li><strong>Save Your Work:</strong> Save your generated annotations, including any edits and slideshow data, to your browser's local storage.</li>
                <li><strong>Import & Export:</strong> Export your saved texts as a JSON file to back them up or share with others. You can easily import files to load annotations from another device or user.</li>
            </ul>

            <h3 className="text-2xl font-bold mt-6 mb-2">Keyboard Shortcuts</h3>
            <p>
                For faster navigation, you can use the following keyboard shortcuts when viewing an annotation:
            </p>
            <ul>
                <li><strong>a:</strong> Return to the main <strong>A</strong>nnotation Output view.</li>
                <li><strong>r:</strong> Enter Deep <strong>R</strong>ead mode.</li>
                <li><strong>h:</strong> Enter Slides<strong>h</strong>ow mode.</li>
                <li><strong>s:</strong> Enter <strong>S</strong>tudy Mode.</li>
                <li><strong>n:</strong> Start a <strong>N</strong>ew annotation.</li>
                <li><strong>u:</strong> <strong>U</strong>pdate the current annotation.</li>
                <li><strong>e:</strong> <strong>E</strong>xport the current annotation as a JSON file.</li>
                <li><strong>p:</strong> Ex<strong>p</strong>ort the current annotation as a <strong>P</strong>DF file.</li>
            </ul>

            <div className="text-center mt-8 not-prose">
                <button 
                onClick={onNavigateHome}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out"
                >
                Back to Home
                </button>
            </div>
        </div>
    </main>
  );
};

export default AboutPage;