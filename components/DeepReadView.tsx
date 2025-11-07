import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Annotation } from '../types';
import CloseIcon from './icons/CloseIcon';

interface DeepReadViewProps {
  annotation: Annotation;
  onExit: () => void;
}

type DisplayMode = 'translation' | 'grammar' | 'line';

interface PopoverState {
  sIndex: number;
  lIndex: number;
  wIndex: number;
  rect: DOMRect;
}

const DeepReadView: React.FC<DeepReadViewProps> = ({ annotation, onExit }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('translation');
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWordClick = (
    e: React.MouseEvent<HTMLSpanElement>,
    sIndex: number,
    lIndex: number,
    wIndex: number
  ) => {
    e.stopPropagation();
    const target = e.currentTarget;
    
    if (popover && popover.sIndex === sIndex && popover.lIndex === lIndex && popover.wIndex === wIndex) {
      setPopover(null);
    } else {
      setPopover({ sIndex, lIndex, wIndex, rect: target.getBoundingClientRect() });
    }
  };

  const closePopover = useCallback(() => {
    setPopover(null);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = () => {
      closePopover();
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [closePopover]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closePopover();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closePopover]);

  const renderPopoverContent = () => {
    if (!popover) return null;
    const { sIndex, lIndex, wIndex } = popover;
    const word = annotation.stanzas[sIndex].lines[lIndex].words[wIndex];
    const line = annotation.stanzas[sIndex].lines[lIndex];

    switch (displayMode) {
      case 'translation':
        return <p>{word.translation}</p>;
      case 'grammar':
        return <p className="text-emerald-600 dark:text-emerald-400 italic">{word.grammar}</p>;
      case 'line':
        return <p className="italic">{line.idiomaticTranslation}</p>;
      default:
        return null;
    }
  };
  
  const getPopoverStyle = (): React.CSSProperties => {
    if (!popover || !containerRef.current) return { display: 'none' };

    const containerRect = containerRef.current.getBoundingClientRect();
    const { rect } = popover;
    
    const top = rect.bottom - containerRect.top + 8;
    const left = rect.left - containerRect.left + rect.width / 2;
    
    return {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        zIndex: 10,
    };
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white z-40 flex flex-col p-4 md:p-8 transition-colors duration-300">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">Deep Read Mode</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="display-mode" className="text-sm font-medium text-gray-600 dark:text-gray-300">Show on click:</label>
            <select
              id="display-mode"
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
              className="bg-gray-200 dark:bg-gray-700 p-2 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 dark:border-gray-600"
            >
              <option value="translation">Word Translation</option>
              <option value="grammar">Grammar</option>
              <option value="line">Line Translation</option>
            </select>
          </div>
          <button onClick={onExit} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><CloseIcon /></button>
        </div>
      </div>

      <div ref={containerRef} className="flex-grow bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 md:p-8 overflow-y-auto relative" onClick={closePopover}>
        {annotation.stanzas.map((stanza, sIndex) => (
          <div key={sIndex} className="mb-8">
            {stanza.lines.map((line, lIndex) => (
              <p key={lIndex} className="font-serif text-2xl leading-loose mb-2">
                {line.words.map((word, wIndex) => (
                  <span
                    key={wIndex}
                    onClick={(e) => handleWordClick(e, sIndex, lIndex, wIndex)}
                    className={`cursor-pointer rounded px-1 transition-colors duration-150 ${
                      popover && popover.sIndex === sIndex && popover.lIndex === lIndex && popover.wIndex === wIndex
                        ? 'bg-blue-200 dark:bg-blue-800'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {word.original}
                  </span>
                ))}
              </p>
            ))}
          </div>
        ))}

        {popover && (
          <div
            style={getPopoverStyle()}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 text-base font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {renderPopoverContent()}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 mt-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Click on any word to see more details.</p>
      </div>
    </div>
  );
};

export default DeepReadView;
