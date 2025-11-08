import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface PromptInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const geminiPrompt = `You are a transcription expert. Your task is to take a given text and a link to its corresponding audio or video source (e.g., a YouTube video) and produce a perfectly timecoded transcript.

The output format must be very specific. Each line of text must be preceded by a timecode indicating when that line begins in the source media.

**Formatting Rules:**

1.  **Timecode Format:** The timecode must be enclosed in square brackets \`[]\`. The format inside the brackets must be \`MM:SS.ms\` (minutes, seconds, and milliseconds) or \`HH:MM:SS.ms\` (hours, minutes, seconds, and milliseconds) if the media is longer than an hour. Milliseconds should always be represented with three digits.
    *   Correct: \`[00:42.350]\`
    *   Correct: \`[01:15:22.987]\`
    *   Incorrect: \`[42.35]\`
    *   Incorrect: \`00:42.350\`
    *   Incorrect: \`(00:42.350)\`

2.  **Line Structure:** Each timecoded line must be on a new line in the output. There should be a single space between the closing bracket \`]\` of the timecode and the start of the text for that line.
    *   Correct: \`[00:15.250] This is the text for the first segment.\`
    *   Incorrect: \`[00:15.250]This is the text for the first segment.\` (missing space)

3.  **Accuracy:** The timecode must correspond to the exact moment the first word of the segment is spoken.

**Example Output:**

\`\`\`
[00:00.510] Arma virumque cano, Troiae qui primus ab oris
[00:04.120] Italiam, fato profugus, Laviniaque venit
[00:07.450] litora, multum ille et terris iactatus et alto
[00:10.980] vi superum saevae memorem Iunonis ob iram
\`\`\`

Now, please process the following source and generate the timecoded transcript according to these rules.

**Source Video/Audio:** [Paste YouTube URL here]
**Text to Transcribe:**
---
[Paste full text here]
---
`;

const PromptInfoModal: React.FC<PromptInfoModalProps> = ({ isOpen, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen) return null;
  
    const handleCopy = () => {
      navigator.clipboard.writeText(geminiPrompt).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      });
    };

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-0 w-full max-w-2xl flex flex-col h-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold">Gemini Prompt for Timecoded Transcripts</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon className="w-5 h-5"/></button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none">
              <p>To ensure your transcript works perfectly with the slideshow feature, use the following prompt with a powerful model like Gemini 2.5 Pro. Provide it with the source media URL and the text to be transcribed.</p>
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md text-sm whitespace-pre-wrap break-words">
                    <code>{geminiPrompt}</code>
                </pre>
                <button onClick={handleCopy} className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  {isCopied ? <CheckIcon className="w-3 h-3 text-green-500" /> : <ClipboardIcon className="w-3 h-3" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600">Close</button>
          </div>
        </div>
      </div>
    );
  };
  
  export default PromptInfoModal;
