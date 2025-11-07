import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Annotation, SlideshowData, Timecode, Word, Line } from '../types';
import CloseIcon from './icons/CloseIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import RecordIcon from './icons/RecordIcon';
import VideoIcon from './icons/VideoIcon';
import VideoOffIcon from './icons/VideoOffIcon';
import ClockIcon from './icons/ClockIcon';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface SlideshowPlayerProps {
  annotation: Annotation;
  initialData: SlideshowData;
  onExit: () => void;
  onSave: (data: SlideshowData) => void;
}

type Granularity = 'line' | 'sentence' | 'paragraph';
type AnnotationDisplay = 'none' | 'word' | 'line';
type RecordingStatus = 'idle' | 'recording' | 'paused';

interface SlideshowItem {
  id: string;
  content: React.ReactNode;
}

const formatTime = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00.00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
};
  
const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return NaN;
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    if (isNaN(minutes) || isNaN(seconds)) return NaN;
    return minutes * 60 + seconds;
};

const SlideshowPlayer: React.FC<SlideshowPlayerProps> = ({ annotation, initialData, onExit, onSave }) => {
  const [youtubeUrl, setYoutubeUrl] = useState(initialData.youtubeUrl);
  const [timecodes, setTimecodes] = useState<Timecode[]>(initialData.timecodes);
  const [granularity, setGranularity] = useState<Granularity>('line');
  const [annotationDisplay, setAnnotationDisplay] = useState<AnnotationDisplay>('word');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(!!initialData.youtubeUrl);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [isSettingStartTime, setIsSettingStartTime] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('00:00.00');
  const [isEditingTimecodes, setIsEditingTimecodes] = useState(false);
  const [tempTimecodes, setTempTimecodes] = useState<Timecode[]>([]);

  const playerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const timecodesMap = useMemo(() => new Map(timecodes.map(tc => [tc.itemId, tc.time])), [timecodes]);

  const flattenedItems = useMemo<SlideshowItem[]>(() => {
    const renderWordsBlock = (words: Word[], displayType: AnnotationDisplay) => (
        <p className="font-serif text-2xl text-left w-full flex flex-wrap justify-start leading-relaxed">
          {words.map((word, wIndex) => (
            <div key={wIndex} className="inline-block text-left align-top mx-1 px-1 py-2 leading-tight">
              {displayType === 'word' && (
                  <span className="block text-sm text-gray-600 dark:text-gray-400 font-sans font-medium">{word.translation || ' '}</span>
              )}
              <span className="block my-0.5 text-gray-900 dark:text-white">{word.original || ' '}</span>
            </div>
          ))}
        </p>
    );

    const renderLineTranslationBlock = (lines: Line[]) => (
        <div className="mt-4 w-full space-y-2">
            {lines.map((line, lIndex) =>
                line.idiomaticTranslation ? (
                    <p key={lIndex} className="font-sans text-md italic text-gray-600 dark:text-gray-400 pl-2 border-l-2 border-blue-500">
                        {line.idiomaticTranslation}
                    </p>
                ) : null
            )}
        </div>
    );
    
    const renderItemContent = (words: Word[], lines: Line[], displayType: AnnotationDisplay) => (
        <div className="text-left w-full">
            {renderWordsBlock(words, displayType)}
            {displayType === 'line' && renderLineTranslationBlock(lines)}
        </div>
    );

    const items: SlideshowItem[] = [];
    if (granularity === 'paragraph') {
        annotation.stanzas.forEach((stanza, sIndex) => {
            const allWords = stanza.lines.flatMap(line => line.words);
            items.push({
                id: `s${sIndex}`,
                content: renderItemContent(allWords, stanza.lines, annotationDisplay),
            });
        });
    } else if (granularity === 'sentence') {
        const sentences: { id: string; words: Word[]; lines: Line[] }[] = [];
        let currentSentenceWords: Word[] = [];
        let currentSentenceLines = new Map<Line, boolean>();
        let stanzaSentenceIndex = 0;

        annotation.stanzas.forEach((stanza, sIndex) => {
            stanzaSentenceIndex = 0;
            stanza.lines.forEach((line) => {
                line.words.forEach((word) => {
                    currentSentenceWords.push(word);
                    currentSentenceLines.set(line, true);
                    if (word.original.match(/[.?!]"?[']?$/)) {
                        if (currentSentenceWords.length > 0) {
                            sentences.push({ id: `s${sIndex}-sent${stanzaSentenceIndex++}`, words: currentSentenceWords, lines: Array.from(currentSentenceLines.keys()) });
                        }
                        currentSentenceWords = [];
                        currentSentenceLines.clear();
                    }
                });
            });

            if (currentSentenceWords.length > 0) {
                sentences.push({ id: `s${sIndex}-sent${stanzaSentenceIndex++}`, words: currentSentenceWords, lines: Array.from(currentSentenceLines.keys()) });
                currentSentenceWords = [];
                currentSentenceLines.clear();
            }
        });

        sentences.forEach(({ id, words, lines }) => {
            items.push({ id, content: renderItemContent(words, lines, annotationDisplay) });
        });

    } else { // line
        annotation.stanzas.forEach((stanza, sIndex) => {
          stanza.lines.forEach((line, lIndex) => {
            items.push({
              id: `s${sIndex}-l${lIndex}`,
              content: renderItemContent(line.words, [line], annotationDisplay),
            });
          });
        });
    }
    return items;
  }, [annotation, granularity, annotationDisplay]);
  
  const handleRecordTimecode = useCallback(() => {
    if (!player || typeof player.getCurrentTime !== 'function' || recordingStatus !== 'recording') return;
    const currentTime = player.getCurrentTime();
    const currentItemId = flattenedItems[currentIndex].id;
    
    setTimecodes(prev => {
        const otherTimecodes = prev.filter(tc => tc.itemId !== currentItemId);
        return [...otherTimecodes, { itemId: currentItemId, time: currentTime }].sort((a, b) => a.time - b.time);
    });

    if (currentIndex < flattenedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setRecordingStatus('paused'); // Finished recording, go to paused state
      player.pauseVideo();
    }
  }, [player, recordingStatus, currentIndex, flattenedItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingStartTime || isEditingTimecodes) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (player && typeof player.getPlayerState === 'function') {
            const playerState = player.getPlayerState();
            if (playerState === 1) player.pauseVideo();
            else player.playVideo();
          }
          break;
        case 'ArrowRight':
          setCurrentIndex(p => Math.min(flattenedItems.length - 1, p + 1));
          break;
        case 'ArrowLeft':
          setCurrentIndex(p => Math.max(0, p - 1));
          break;
        case 'KeyR':
          if (recordingStatus === 'recording') {
            handleRecordTimecode();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, flattenedItems.length, recordingStatus, handleRecordTimecode, isSettingStartTime, isEditingTimecodes]);

  useEffect(() => {
    if (showVideo && youtubeUrl) {
      if (!window.YT) {
        window.onYouTubeIframeAPIReady = () => loadVideo();
      } else {
        loadVideo();
      }
    }
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [youtubeUrl, showVideo]);
  
  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
      if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
    } catch (e) { /* Invalid URL */ }
    return null;
  };

  const loadVideo = () => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId && playerRef.current) {
        if (player) {
            player.loadVideoById(videoId);
        } else {
            const newPlayer = new window.YT.Player(playerRef.current.id, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: { origin: window.location.origin, rel: 0 },
            });
            setPlayer(newPlayer);
        }
    }
  };
  
  useEffect(() => {
      setCurrentIndex(0);
      setRecordingStatus('idle');
  }, [granularity, annotationDisplay]);

  const startRecording = () => {
    setIsSettingStartTime(false);
    const startTime = parseTime(startTimeInput);
    if (isNaN(startTime)) return;

    const currentItemIds = new Set(flattenedItems.map(item => item.id));
    setTimecodes(prev => prev.filter(tc => currentItemIds.has(tc.itemId))); // Clear only relevant timecodes
    setCurrentIndex(0);
    setRecordingStatus('recording');
    player?.seekTo(startTime, true);
    player?.playVideo();
  };

  const stopRecording = () => {
    setRecordingStatus('paused');
    player?.pauseVideo();
  }

  const resumeRecording = () => {
    setRecordingStatus('recording');
    player?.playVideo();
  }
  
  const finishRecording = () => {
    setRecordingStatus('idle');
  }

  const handleManualPlay = () => {
    player?.playVideo();
  };

  const handlePausePlayback = () => {
    setIsAutoPlaying(false);
    player?.pauseVideo();
  };

  const handlePlayFromBeginning = () => {
    if (!player || timecodes.length === 0) return;
    setCurrentIndex(0);
    player.seekTo(0, true);
    player.playVideo();
    setIsAutoPlaying(true);
  };

  const handlePlayFromCurrent = () => {
    if (!player || timecodes.length === 0) return;

    const sortedTimecodes = timecodes
        .filter(tc => flattenedItems.some(item => item.id === tc.itemId))
        .sort((a, b) => a.time - b.time);

    let startTime = 0;
    if (currentIndex > 0) {
        const timecodesBefore = sortedTimecodes.filter(tc => {
            const itemIndex = flattenedItems.findIndex(item => item.id === tc.itemId);
            return itemIndex >= 0 && itemIndex < currentIndex;
        });

        if (timecodesBefore.length > 0) {
            startTime = timecodesBefore[timecodesBefore.length - 1].time;
        }
    }
    
    player.seekTo(startTime, true);
    player.playVideo();
    setIsAutoPlaying(true);
  };

  useEffect(() => {
      if (isAutoPlaying) {
          intervalRef.current = window.setInterval(() => {
              if (!player || typeof player.getCurrentTime !== 'function' || typeof player.getPlayerState !== 'function' || player.getPlayerState() !== 1) return;
              
              const currentTime = player.getCurrentTime();

              const sortedTimecodes = timecodes
                .filter(tc => flattenedItems.some(item => item.id === tc.itemId))
                .sort((a, b) => a.time - b.time);

              let newIndex = 0; // Default to first slide
              
              for (const timecode of sortedTimecodes) {
                  if (currentTime >= timecode.time) {
                      const timedSlideIndex = flattenedItems.findIndex(item => item.id === timecode.itemId);
                      if (timedSlideIndex !== -1) {
                          newIndex = timedSlideIndex + 1;
                      }
                  } else {
                      break; 
                  }
              }

              const finalIndex = Math.min(newIndex, flattenedItems.length - 1);
              
              if (finalIndex !== currentIndex) {
                  setCurrentIndex(finalIndex);
              }
          }, 250);
      } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
  }, [isAutoPlaying, player, timecodes, flattenedItems, currentIndex]);
  
  const handleSaveAndExit = () => {
      onSave({ youtubeUrl, timecodes });
      onExit();
  };

  const openTimecodeEditor = () => {
    setTempTimecodes([...timecodes]);
    setIsEditingTimecodes(true);
  };

  const saveTimecodeChanges = () => {
    setTimecodes(tempTimecodes.sort((a,b) => a.time - b.time));
    setIsEditingTimecodes(false);
  };

  const handleTempTimecodeChange = (itemId: string, newTimeStr: string) => {
    const newTimeInSeconds = parseTime(newTimeStr);
    if (isNaN(newTimeInSeconds)) return;

    setTempTimecodes(prev => {
        const existing = prev.find(tc => tc.itemId === itemId);
        if (existing) {
            return prev.map(tc => tc.itemId === itemId ? { ...tc, time: newTimeInSeconds } : tc);
        } else {
            return [...prev, { itemId, time: newTimeInSeconds }];
        }
    });
  }

  const currentItemHasTimecode = useMemo(() => {
    if (!flattenedItems[currentIndex]) return false;
    return timecodesMap.has(flattenedItems[currentIndex].id);
  }, [currentIndex, flattenedItems, timecodesMap]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white z-40 flex flex-col p-4 md:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">Slideshow Mode</h2>
        <div className="flex items-center gap-4">
            <button onClick={handleSaveAndExit} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Save & Exit</button>
            <button onClick={onExit} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover-bg-gray-600"><CloseIcon/></button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-grow grid grid-cols-1 ${showVideo ? 'md:grid-cols-2' : ''} gap-8 min-h-0`}>
        {/* Video Player */}
        <div className={`${showVideo ? 'flex' : 'hidden'} bg-black rounded-lg flex-col`}>
            <input 
                type="text"
                placeholder="Paste YouTube URL here..."
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                className="w-full p-2 bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 rounded-t-lg text-gray-900 dark:text-white"
            />
            <div id="youtube-player-container" ref={playerRef} className="flex-grow w-full h-full">
                {!youtubeUrl && <div className="w-full h-full flex items-center justify-center text-gray-500">Enter a YouTube URL to begin</div>}
            </div>
        </div>

        {/* Annotation Viewer */}
        <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8 relative ${!showVideo ? 'col-span-1 md:col-span-2' : ''}`}>
          <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
            {currentItemHasTimecode && <ClockIcon className="w-5 h-5 text-blue-500" title={`Timecode: ${formatTime(timecodesMap.get(flattenedItems[currentIndex]?.id) ?? 0)}`} />}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Annotation:</span>
                <select value={annotationDisplay} onChange={e => setAnnotationDisplay(e.target.value as AnnotationDisplay)} className="bg-gray-200 dark:bg-gray-700 p-1 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 dark:border-gray-600">
                    <option value="none">None</option>
                    <option value="word">Word Translation</option>
                    <option value="line">Line Translation</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">View by:</span>
                <select value={granularity} onChange={e => setGranularity(e.target.value as Granularity)} className="bg-gray-200 dark:bg-gray-700 p-1 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 dark:border-gray-600">
                    <option value="line">Line</option>
                    <option value="sentence">Sentence</option>
                    <option value="paragraph">Paragraph/Stanza</option>
                </select>
            </div>
          </div>
          <div className="flex-grow flex items-center justify-center w-full overflow-y-auto p-4">
            {flattenedItems.length > 0 ? flattenedItems[currentIndex].content : "No content"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 mt-4 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg">
         <div className="flex justify-between items-center w-full">
             <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowVideo(p => !p)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" title={showVideo ? "Hide Video" : "Show Video"}>
                  {showVideo ? <VideoOffIcon className="w-6 h-6"/> : <VideoIcon className="w-6 h-6"/>}
                </button>
                
                {isAutoPlaying ? (
                  <button onClick={handlePausePlayback} className="px-3 py-2 text-sm font-medium flex items-center gap-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600" title="Pause Sync">
                      <PauseIcon className="w-5 h-5"/> Pause Playback
                  </button>
                ) : (
                  <>
                    <button onClick={handleManualPlay} className="px-3 py-2 text-sm font-medium flex items-center gap-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" disabled={!showVideo || !player} title="Manual Playback">
                        <PlayIcon className="w-5 h-5"/> Manual Playback
                    </button>
                    <button onClick={handlePlayFromBeginning} className="px-3 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" disabled={!showVideo || !player || timecodes.length === 0} title="Automatic Playback from Start">
                        Play from Beginning
                    </button>
                    <button onClick={handlePlayFromCurrent} className="px-3 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" disabled={!showVideo || !player || timecodes.length === 0} title="Automatic Playback from Current">
                        Play from Current Slide
                    </button>
                  </>
                )}

                <button onClick={openTimecodeEditor} className="px-3 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" disabled={flattenedItems.length === 0}>Edit Timecodes</button>
                
                {recordingStatus === 'idle' && (
                  <button onClick={() => setIsSettingStartTime(true)} className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50" disabled={!showVideo || !player}>Record Timecodes</button>
                )}
                {recordingStatus === 'recording' && (
                  <>
                    <button onClick={stopRecording} className="px-3 py-2 text-sm font-medium rounded-md bg-yellow-600 hover:bg-yellow-700 text-white">Stop Recording</button>
                    <button onClick={handleRecordTimecode} className="px-3 py-2 text-sm font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2">
                      <RecordIcon className="w-5 h-5" /> Record & Next (R)
                    </button>
                  </>
                )}
                {recordingStatus === 'paused' && (
                  <>
                    <button onClick={resumeRecording} className="px-3 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white">Resume Recording</button>
                    <button onClick={() => setIsSettingStartTime(true)} className="px-3 py-2 text-sm font-medium rounded-md bg-gray-500 hover:bg-gray-600 text-white">Start Over</button>
                    <button onClick={finishRecording} className="px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white">Finish Recording</button>
                  </>
                )}
             </div>

             <div className="flex items-center gap-4 font-medium">
                <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Prev</button>
                <span className="text-sm text-gray-500 dark:text-gray-400 select-none">{flattenedItems.length > 0 ? currentIndex + 1 : 0} / {flattenedItems.length}</span>
                <button onClick={() => setCurrentIndex(p => Math.min(flattenedItems.length - 1, p + 1))} disabled={currentIndex >= flattenedItems.length - 1} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Next</button>
             </div>
         </div>
         <div className="text-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 w-full">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Keyboard Shortcuts: <b>Space</b> (Play/Pause Video), <b>← →</b> (Prev/Next Slide), <b>R</b> (Record Timecode)
            </p>
         </div>
      </div>
      
      {/* Start Time Modal */}
      {isSettingStartTime && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setIsSettingStartTime(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Set Recording Start Time</h3>
                <input 
                    type="text"
                    value={startTimeInput}
                    onChange={e => setStartTimeInput(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 mb-4"
                    placeholder="MM:SS.ss"
                />
                <div className="flex justify-between gap-2">
                    <button onClick={() => setStartTimeInput(formatTime(player?.getCurrentTime() || 0))} className="px-3 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Use Current Time</button>
                    <div className="flex gap-2">
                        <button onClick={() => setIsSettingStartTime(false)} className="px-3 py-2 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
                        <button onClick={startRecording} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Start Recording</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Timecode Editor Modal */}
      {isEditingTimecodes && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setIsEditingTimecodes(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-0 w-full max-w-2xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-lg font-bold">Edit Timecodes</h3>
                </div>
                <div className="p-4 overflow-y-auto flex-grow">
                    <div className="space-y-2">
                        {flattenedItems.map(item => {
                             const tempTimecodeValue = tempTimecodes.find(tc => tc.itemId === item.id)?.time ?? null;
                             return (
                                <div key={item.id} className="grid grid-cols-4 items-center gap-4 p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                    <div className="col-span-3 text-sm truncate text-gray-600 dark:text-gray-300">
                                        <div className="w-full max-h-12 overflow-hidden text-ellipsis">{item.content}</div>
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="text"
                                            value={formatTime(tempTimecodeValue ?? -1)}
                                            onChange={(e) => handleTempTimecodeChange(item.id, e.target.value)}
                                            className="w-full p-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-center"
                                        />
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-end gap-2">
                    <button onClick={() => setIsEditingTimecodes(false)} className="px-4 py-2 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
                    <button onClick={saveTimecodeChanges} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SlideshowPlayer;
