

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SavedAnnotation, Word, Line, StudySession, StudySessionResult } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import CloseIcon from './icons/CloseIcon';

interface StudyModeViewProps {
  savedAnnotation: SavedAnnotation;
  onExit: () => void;
  onSessionComplete: (annotationId: string, result: StudySessionResult) => void;
}

type GameMode = 'translation' | 'grammar';
type PlayMode = 'points' | 'timed';
type GameState = 'setup' | 'playing' | 'summary' | 'resuming';
type StudyUnit = 'stanza' | 'line';

interface DraggableItem {
  id: string; // "s0-l1-w2"
  text: string;
}

interface DropZone {
  word: Word;
  id: string;
  placedItem: DraggableItem | null;
  feedback: 'correct' | 'incorrect' | 'none';
}

interface StudyItem {
  unitType: StudyUnit;
  stanzaIndex: number;
  lineIndex?: number;
  lines: Line[];
}

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const StudyModeView: React.FC<StudyModeViewProps> = ({ savedAnnotation, onExit, onSessionComplete }) => {
  const [studySessions, setStudySessions] = useLocalStorage<StudySession[]>('study-sessions', []);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);

  // Setup state
  const [gameMode, setGameMode] = useState<GameMode>('translation');
  const [playMode, setPlayMode] = useState<PlayMode>('points');
  const [studyUnit, setStudyUnit] = useState<StudyUnit>('line');
  const [selectedStanzaIndices, setSelectedStanzaIndices] = useState<number[]>([]);

  // Gameplay state
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [wordBank, setWordBank] = useState<DraggableItem[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  // Timer refs
  const timerIntervalRef = useRef<number | null>(null);
  const lastTickTimestampRef = useRef<number>(0);

  // Resume prompt state
  const [inProgressSession, setInProgressSession] = useState<StudySession | null>(null);
  
  const unitName = savedAnnotation.annotation.textType === 'prose' ? 'Paragraph' : 'Stanza';
  const unitNamePlural = savedAnnotation.annotation.textType === 'prose' ? 'Paragraphs' : 'Stanzas';

  useEffect(() => {
    const session = studySessions.find(
      s => s.annotationId === savedAnnotation.id && s.status === 'in-progress'
    );
    if (session) {
      setInProgressSession(session);
      setGameState('resuming');
    } else {
        // Initialize selected stanzas when entering setup for a new session
        setSelectedStanzaIndices(savedAnnotation.annotation.stanzas.map((_, i) => i));
    }
  }, [savedAnnotation.id, savedAnnotation.annotation.stanzas, studySessions]);

  const studyItems = useMemo<StudyItem[]>(() => {
    if (!activeSession) return [];

    const unit = activeSession.studyUnit;
    const indicesToStudy = activeSession.selectedStanzaIndices && activeSession.selectedStanzaIndices.length > 0
        ? activeSession.selectedStanzaIndices
        : savedAnnotation.annotation.stanzas.map((_, i) => i);
    
    const stanzasToProcess = savedAnnotation.annotation.stanzas
        .map((stanza, index) => ({ stanza, originalIndex: index }))
        .filter(item => indicesToStudy.includes(item.originalIndex));

    if (unit === 'line') {
      return stanzasToProcess.flatMap(({ stanza, originalIndex }) =>
        stanza.lines.map((line, lIndex) => ({
          unitType: 'line', 
          stanzaIndex: originalIndex, 
          lineIndex: lIndex, 
          lines: [line],
        }))
      );
    }
    return stanzasToProcess.map(({ stanza, originalIndex }) => ({
      unitType: 'stanza', stanzaIndex: originalIndex, lines: stanza.lines,
    }));
  }, [savedAnnotation.annotation, activeSession?.studyUnit, JSON.stringify(activeSession?.selectedStanzaIndices)]);


  const currentItem = useMemo(() => {
    if (!activeSession || studyItems.length === 0) return null;
    return studyItems[activeSession.currentItemIndex];
  }, [studyItems, activeSession?.currentItemIndex]);
  
  const setupItem = useCallback(() => {
    if (!currentItem) return;
    const zones: DropZone[] = [];
    const bank: DraggableItem[] = [];
    currentItem.lines.forEach((line, relLineIdx) => {
      // Find the original line index within its stanza
      const originalStanza = savedAnnotation.annotation.stanzas[currentItem.stanzaIndex];
      const absLineIdx = originalStanza.lines.indexOf(line);

      line.words.forEach((word, wIndex) => {
        const id = `s${currentItem.stanzaIndex}-l${absLineIdx}-w${wIndex}`;
        zones.push({ word, id, placedItem: null, feedback: 'none' });
        bank.push({ id, text: activeSession?.gameMode === 'translation' ? word.translation : word.grammar });
      });
    });
    setDropZones(zones);
    setWordBank(shuffleArray(bank));
    setIsChecked(false);
  }, [currentItem, activeSession?.gameMode, savedAnnotation.annotation.stanzas]);

  const startTimer = useCallback(() => {
    stopTimer();
    lastTickTimestampRef.current = performance.now();
    timerIntervalRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastTickTimestampRef.current) / 1000;
      lastTickTimestampRef.current = now;
      setActiveSession(s => s ? { ...s, timeElapsedSeconds: s.timeElapsedSeconds + elapsed } : null);
      if (playMode === 'timed') {
        setTimeLeft(t => Math.max(0, t - elapsed));
      }
    }, 1000);
  }, [playMode]);

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };
  
  useEffect(() => {
    if (gameState === 'playing' && !isChecked) {
      setupItem();
    }
  }, [gameState, currentItem, isChecked, setupItem]);

  useEffect(() => {
    if (gameState === 'playing' && !isChecked) {
        startTimer();
    } else {
        stopTimer();
    }
    return stopTimer;
  }, [gameState, isChecked, startTimer]);

  useEffect(() => {
    if (gameState === 'playing' && playMode === 'timed' && timeLeft <= 0 && !isChecked) {
      checkAnswers();
    }
  }, [gameState, playMode, timeLeft, isChecked]);

  const saveSession = (sessionToSave: StudySession) => {
    setStudySessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === sessionToSave.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = sessionToSave;
        return updated;
      }
      return [...prev, sessionToSave];
    });
  };

  const createAndStartNewSession = () => {
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      annotationId: savedAnnotation.id,
      gameMode, playMode, studyUnit,
      selectedStanzaIndices: studyUnit === 'stanza' || savedAnnotation.annotation.stanzas.length > 1 ? selectedStanzaIndices : undefined,
      status: 'in-progress',
      currentItemIndex: 0,
      currentScore: 0,
      timeElapsedSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveSession(newSession);
    setTimeLeft(120);
    setGameState('playing');
  };

  const handleResume = () => {
    if (!inProgressSession) return;
    setActiveSession(inProgressSession);
    setGameMode(inProgressSession.gameMode);
    setPlayMode(inProgressSession.playMode);
    setStudyUnit(inProgressSession.studyUnit);
    setSelectedStanzaIndices(inProgressSession.selectedStanzaIndices || savedAnnotation.annotation.stanzas.map((_, i) => i));
    setTimeLeft(120 - inProgressSession.timeElapsedSeconds);
    setGameState('playing');
  };

  const handleStartNewIgnoringProgress = () => {
    if (inProgressSession) {
      setStudySessions(prev => prev.filter(s => s.id !== inProgressSession.id));
    }
    setInProgressSession(null);
    setSelectedStanzaIndices(savedAnnotation.annotation.stanzas.map((_, i) => i));
    setGameState('setup');
  };

  const handleSaveAndExit = () => {
    if (!activeSession) return;
    const sessionToSave = { ...activeSession, updatedAt: new Date().toISOString() };
    saveSession(sessionToSave);
    onExit();
  };

  const checkAnswers = () => {
    let itemCorrectCount = 0;
    const newDropZonesWithFeedback = dropZones.map(zone => {
      if (!zone.placedItem) return zone;
      if (zone.placedItem.id === zone.id) {
        itemCorrectCount++;
        return { ...zone, feedback: 'correct' as const };
      }
      return { ...zone, feedback: 'incorrect' as const };
    });
  
    setDropZones(newDropZonesWithFeedback);
    setActiveSession(s => s ? { ...s, currentScore: s.currentScore + itemCorrectCount } : null);
    setIsChecked(true);
  };
  
  const nextItem = () => {
    if (!activeSession || !currentItem) return;
    if (activeSession.currentItemIndex < studyItems.length - 1) {
      setActiveSession(s => s ? { ...s, currentItemIndex: s.currentItemIndex + 1 } : null);
      setIsChecked(false);
    } else {
      const totalWords = studyItems.reduce((sum, item) => sum + item.lines.reduce((lSum, l) => lSum + l.words.length, 0), 0);
      const result: StudySessionResult = {
        score: activeSession.currentScore,
        totalWords,
        durationSeconds: activeSession.timeElapsedSeconds,
        completedAt: new Date().toISOString(),
        gameMode: activeSession.gameMode,
        studyUnit: activeSession.studyUnit,
      };
      const finalSession = { ...activeSession, status: 'completed' as 'completed', result };
      setActiveSession(finalSession);
      saveSession(finalSession);
      onSessionComplete(savedAnnotation.id, result);
      setGameState('summary');
    }
  };

  const summaryStats = useMemo(() => {
    if (gameState !== 'summary' || !activeSession?.result) return null;
    const relevantSessions = studySessions.filter(s => 
        s.status === 'completed' && s.annotationId === savedAnnotation.id &&
        s.gameMode === activeSession.gameMode && s.studyUnit === activeSession.studyUnit
      ).sort((a, b) => new Date(b.result!.completedAt).getTime() - new Date(a.result!.completedAt).getTime());
    
    const currentResult = activeSession.result;
    const previousResult = relevantSessions.length > 1 ? relevantSessions[1].result : null;

    let scoreChange = null;
    let timeChange = null;
    if (previousResult) {
        scoreChange = currentResult.score - previousResult.score;
        timeChange = currentResult.durationSeconds - previousResult.durationSeconds;
    }
    return { ...currentResult, scoreChange, timeChange };
  }, [gameState, activeSession, studySessions, savedAnnotation.id]);

  const handleStanzaSelection = (index: number) => {
    setSelectedStanzaIndices(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index].sort((a,b) => a - b)
    );
  };

  if (gameState === 'resuming') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-4xl font-bold mb-4">In-progress Session Found!</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Would you like to resume your last session or start a new one?
        </p>
        <div className="flex gap-4">
            <button onClick={handleStartNewIgnoringProgress} className="py-3 px-6 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold rounded-md transition flex items-center gap-2">
                <span className="material-symbols-outlined">add</span>
                Start New
            </button>
            <button onClick={handleResume} className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition flex items-center gap-2">
                <span className="material-symbols-outlined">play_arrow</span>
                Resume Session
            </button>
        </div>
      </div>
    );
  }

  if (gameState === 'setup') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-8">
        <h2 className="text-4xl font-bold mb-8">Study Mode Setup</h2>
        <div className="space-y-6 w-full max-w-md">
          <div>
            <label className="block text-lg font-medium mb-2">Study Unit</label>
            <select value={studyUnit} onChange={e => setStudyUnit(e.target.value as StudyUnit)} className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
              <option value="line">Line by Line</option>
              <option value="stanza">{unitName}</option>
            </select>
          </div>

          {savedAnnotation.annotation.stanzas.length > 1 && (
            <div>
              <label className="block text-lg font-medium mb-2">Which {unitNamePlural} to Study?</label>
              <div className="space-y-2 max-h-32 overflow-y-auto p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                {savedAnnotation.annotation.stanzas.map((_, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStanzaIndices.includes(index)}
                      onChange={() => handleStanzaSelection(index)}
                      className="form-checkbox h-4 w-4 rounded text-blue-600 bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 focus:ring-blue-500"
                    />
                    <span>{unitName} {index + 1}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-lg font-medium mb-2">Match what?</label>
            <select value={gameMode} onChange={e => setGameMode(e.target.value as GameMode)} className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
              <option value="translation">Word Translations</option>
              <option value="grammar">Grammar Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">How to play?</label>
            <select value={playMode} onChange={e => setPlayMode(e.target.value as PlayMode)} className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
              <option value="points">Practice (Points)</option>
              <option value="timed">Timed Challenge</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onExit} className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold rounded-md transition flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">arrow_back</span>
                Back
            </button>
            <button onClick={createAndStartNewSession} disabled={selectedStanzaIndices.length === 0} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">play_arrow</span>
                Start Studying
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'summary') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Study Session Complete!</h2>
        <div className="text-2xl text-gray-600 dark:text-gray-300 mb-8 space-y-2">
            <p>You scored {summaryStats?.score} out of {summaryStats?.totalWords} words correct.</p>
            <p>Total time: {formatDuration(summaryStats?.durationSeconds ?? 0)}</p>
        </div>
        {summaryStats?.scoreChange !== null && (
            <div className="text-lg mb-8 p-4 rounded-md bg-gray-100 dark:bg-gray-800">
                <h3 className="font-bold mb-2">Compared to last session:</h3>
                <p>Score: <span className={summaryStats.scoreChange > 0 ? 'text-green-500' : 'text-red-500'}>{summaryStats.scoreChange > 0 && '+'}{summaryStats.scoreChange}</span></p>
                <p>Time: <span className={summaryStats.timeChange! < 0 ? 'text-green-500' : 'text-red-500'}>{summaryStats.timeChange! < 0 ? '' : '+'}{formatDuration(summaryStats.timeChange!)}</span></p>
            </div>
        )}
        <div className="flex gap-4">
            <button onClick={onExit} className="py-3 px-6 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold rounded-md transition flex items-center gap-2">
                <span className="material-symbols-outlined">exit_to_app</span>
                Exit
            </button>
            <button onClick={() => setGameState('setup')} className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition flex items-center gap-2">
                <span className="material-symbols-outlined">replay</span>
                Play Again
            </button>
        </div>
      </div>
    );
  }
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetZoneId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-200', 'dark:bg-blue-800');
    if (isChecked) return;

    const item = JSON.parse(e.dataTransfer.getData('application/json')) as DraggableItem;
    
    setWordBank(prev => prev.filter(b => b.id !== item.id));
    setDropZones(prev => prev.map(dz => {
      if (dz.id === targetZoneId) {
        if (dz.placedItem) {
          setWordBank(bank => [...bank, dz.placedItem!]);
        }
        return { ...dz, placedItem: item };
      }
      return dz;
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isChecked) return;
    e.currentTarget.classList.add('bg-blue-200', 'dark:bg-blue-800');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-blue-200', 'dark:bg-blue-800');
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-40 flex flex-col p-4 md:p-8">
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
            <h2 className="text-2xl font-bold">Study Mode</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{activeSession?.studyUnit} {activeSession ? activeSession.currentItemIndex + 1 : 0} of {studyItems.length}</p>
        </div>
        <div className="flex items-center gap-4 text-lg font-semibold">
          {activeSession?.playMode === 'timed' && <span>Time: {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft % 60)).toString().padStart(2, '0')}</span>}
          <span>Score: {activeSession?.currentScore ?? 0}</span>
          <button onClick={handleSaveAndExit} className="px-3 py-1.5 text-sm rounded-md bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-base">save</span> Save & Exit
          </button>
          <button onClick={onExit} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><CloseIcon /></button>
        </div>
      </header>
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 min-h-0">
        <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 overflow-y-auto">
          <div className="font-serif text-xl leading-loose">
            {currentItem?.lines.map((line, lineIdx) => (
              <div key={lineIdx} className="mb-6">
                {savedAnnotation.annotation.textType === 'dialogue' && line.speaker && (
                  <p className="font-sans text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">{line.speaker}:</p>
                )}
                <div className="flex flex-wrap items-end gap-x-4 gap-y-6">
                    {line.words.map((word, wordIdx) => {
                    const zone = dropZones.find(dz => dz.word === word);
                    if (!zone) return null;
                    const feedbackClasses = { correct: 'bg-green-100 dark:bg-green-900/50 border-green-500', incorrect: 'bg-red-100 dark:bg-red-900/50 border-red-500', none: 'border-gray-300 dark:border-gray-600' };
                    return (
                        <div key={wordIdx} className="inline-block text-center">
                        <span className="block mb-1">{word.original}</span>
                        <div id={zone.id} onDrop={(e) => handleDrop(e, zone.id)} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={`w-32 h-12 border-2 border-dashed rounded-md flex items-center justify-center p-2 text-sm font-sans transition-colors ${feedbackClasses[zone.feedback]}`}>
                            {zone.placedItem?.text}
                        </div>
                        </div>
                    );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex flex-col">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700">Word Bank</h3>
            <div className="flex-grow overflow-y-auto space-y-2 min-h-0">
                {wordBank.map(item => (
                    <div key={item.id} draggable={!isChecked} onDragStart={(e) => handleDragStart(e, item)} onDragEnd={handleDragEnd} className={`p-3 bg-white dark:bg-gray-700 rounded-md shadow border dark:border-gray-600 text-sm font-sans ${!isChecked ? 'cursor-grab' : 'cursor-not-allowed opacity-60'}`}>
                        {item.text}
                    </div>
                ))}
            </div>
        </div>
      </main>

      <footer className="flex-shrink-0 mt-4 flex justify-end items-center gap-4">
        <button onClick={() => setupItem()} disabled={isChecked} className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">restart_alt</span> Reset
        </button>
        {isChecked ? (
          <button onClick={nextItem} className="px-6 py-2 font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            {activeSession && activeSession.currentItemIndex < studyItems.length - 1 ? `Next ${activeSession.studyUnit === 'stanza' ? unitName : 'Line'}` : 'Finish'}
            <span className="material-symbols-outlined">skip_next</span>
          </button>
        ) : (
          <button onClick={checkAnswers} className="px-6 py-2 font-bold rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <span className="material-symbols-outlined">check</span>
            Check Answers
          </button>
        )}
      </footer>
    </div>
  );
};

export default StudyModeView;