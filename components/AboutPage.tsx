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
                <strong>Above The Line</strong> was created by Dominik Lukeš in Google AI Studio and is powered by the Gemini API. It is designed as a comprehensive suite of tools for students, educators, and language enthusiasts to explore texts and video transcripts in depth.
            </p>

            <h3 className="text-2xl font-bold mt-8 mb-2">Core Features</h3>
            <ul>
                <li><strong>Detailed Text & Video Annotation:</strong> Paste any text or a timecoded video transcript to generate line-by-line analysis. The app provides word-for-word translations, detailed grammatical information, and natural-sounding idiomatic translations for each line.</li>
                <li><strong>Multiple Interaction Modes:</strong> Go beyond static text with three dynamic modes designed for different learning styles: a focused <strong>Deep Read</strong> view, a multimedia <strong>Slideshow</strong> mode for syncing text with video, and an interactive <strong>Study Mode</strong> to gamify your learning.</li>
                <li><strong>Progress Tracking & Gamification:</strong> Turn your annotations into practice sessions. Study Mode tracks your score, time, and progress, helping you identify areas for improvement.</li>
                <li><strong>Flexible Data Management:</strong> Save your work to your browser, export everything for backup, or share with others. You can export individual annotations as JSON or PDF, and even export stanzas as PNG images.</li>
            </ul>
            
            <h3 className="text-2xl font-bold mt-8 mb-2">How It Works: Annotation</h3>
            <p>
                The annotation process is simple but powerful:
            </p>
            <ol>
                <li><strong>Choose Your Mode:</strong> Select "Annotate Text" for written works or "Annotate Video Transcript" to sync with a YouTube video.</li>
                <li><strong>Provide Input:</strong> For text, simply paste it in. For video, provide the YouTube URL and a timecoded transcript. A helper prompt is available to assist in generating transcripts with Gemini.</li>
                <li><strong>Select Languages:</strong> Choose the source language (or let the app autodetect it) and the target language for translations.</li>
                <li><strong>Generate:</strong> With a single click, Gemini analyzes the text and produces a rich, interactive annotation.</li>
            </ol>
            <p>In the output view, you can toggle the visibility of word translations, grammar details, and idiomatic line translations. You can also click to edit any word translation or the main title to refine the results.</p>
            
            <h3 className="text-2xl font-bold mt-8 mb-2">Interaction Modes in Detail</h3>
            
            <h4>Deep Read Mode</h4>
            <p>A focused, minimalist environment for close reading. The text is displayed cleanly in a single column. Click on any word to reveal a pop-up with its translation, grammar, or the full line's idiomatic translation, allowing you to get more information without losing your place.</p>
            
            <h4>Slideshow Mode</h4>
            <p>Transform your annotation into an engaging multimedia presentation. This mode syncs your annotated text with a YouTube video, highlighting each line, sentence, or paragraph as it's spoken. It's perfect for lectures, language classes, or poetry readings. Key features include:</p>
            <ul>
                <li><strong>Automatic Playback:</strong> Play the video from the beginning or the current slide, and the text will automatically scroll in sync.</li>
                <li><strong>Timecode Recording:</strong> Don't have timecodes? Create them yourself! Play the video and press a button at the start of each segment to record the timestamp.</li>
                <li><strong>Timecode Editor:</strong> Fine-tune your timings with a detailed editor that lets you manually adjust the start and end time for every slide.</li>
                <li><strong>Customizable View:</strong> Change the granularity (line, sentence, or paragraph) and what annotations are displayed on the fly.</li>
            </ul>

            <h4>Study Mode</h4>
            <p>Gamify your learning by turning any annotation into an interactive drag-and-drop quiz. This mode is designed to test and reinforce your knowledge.</p>
            <ul>
                <li><strong>Flexible Setup:</strong> Choose what to study (specific stanzas or the whole text), what to match (word translations or grammar), and how to play (a relaxed practice mode or a timed challenge).</li>
                <li><strong>Interactive Gameplay:</strong> Drag words from a "Word Bank" and drop them onto their corresponding original words in the text.</li>
                <li><strong>Instant Feedback:</strong> Check your answers at any time to see which words you matched correctly and which you didn't.</li>
                <li><strong>Session Management:</strong> The app saves your progress, so you can exit a session and resume it later. Completed sessions are saved to your study history.</li>
                <li><strong>Track Your Progress:</strong> After each session, view a summary of your score and time. The app compares your performance to your last session, helping you see your improvement over time.</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-2">Saving, Exporting & Sharing</h3>
            <p>Your work is always within reach. The app offers multiple ways to save and share your annotations:</p>
            <ul>
                <li><strong>Save to Browser:</strong> Save sessions, including edits, slideshow data, and study history, to your browser's local storage for easy access.</li>
                <li><strong>Export All:</strong> Export your entire collection of saved annotations as a single JSON file for backup or transferring to another device.</li>
                <li><strong>Import:</strong> Load annotations from a JSON file shared by others or from one of your backups.</li>
                <li><strong>Single Export Options:</strong> Export the current annotation as a <strong>JSON</strong> file, a multi-page <strong>PDF</strong> document, or export individual stanzas/paragraphs as <strong>PNG</strong> images.</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-2">Keyboard Shortcuts</h3>
            <p>
                For faster navigation, you can use the following keyboard shortcuts when viewing an annotation:
            </p>
            <ul>
                <li><strong>a:</strong> Return to the main <strong>A</strong>nnotation Output view.</li>
                <li><strong>r:</strong> Enter Deep <strong>R</strong>ead mode.</li>
                <li><strong>h:</strong> Enter Slides<strong>h</strong>ow mode (Karaoke view).</li>
                <li><strong>s:</strong> Enter <strong>S</strong>tudy Mode.</li>
                <li><strong>n:</strong> Start a <strong>N</strong>ew annotation.</li>
                <li><strong>u:</strong> Save or <strong>U</strong>pdate the current annotation.</li>
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