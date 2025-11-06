import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Annotation, SlideshowData, Timecode } from '../types';
import CloseIcon from './icons/CloseIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import RecordIcon from './icons/RecordIcon';
import VideoIcon from './icons/VideoIcon';
import VideoOffIcon from './icons/VideoOffIcon';

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

type Granularity = 'word' | 'line';

interface SlideshowItem {
  id: string;
  content: React.ReactNode;
}

const SlideshowPlayer: React.FC<SlideshowPlayerProps> = ({ annotation, initialData, onExit, onSave }) => {
  const [youtubeUrl, setYoutubeUrl] = useState(initialData.youtubeUrl);
  const [timecodes, setTimecodes] = useState<Timecode[]>(initialData.timecodes);
  const [granularity, setGranularity] = useState<Granularity>('line');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(!!initialData.youtubeUrl);
  const playerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (showVideo) {
      if (!window.YT) {
        window.onYouTubeIframeAPIReady = () => {
          loadVideo();
        };
      } else {
        loadVideo();
      }
    }
    
    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }
  }, [youtubeUrl, showVideo]);
  
  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
    } catch (e) {
      // Invalid URL
    }
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
                playerVars: {
                  origin: window.location.origin,
                },
            });
            setPlayer(newPlayer);
        }
    }
  };
  
  const flattenedItems = useMemo<SlideshowItem[]>(() => {
    const items: SlideshowItem[] = [];
    annotation.stanzas.forEach((stanza, sIndex) => {
      stanza.lines.forEach((line, lIndex) => {
        if (granularity === 'line') {
          items.push({
            id: `s${sIndex}-l${lIndex}`,
            content: (
              <p className="font-serif text-xl text-left w-full">
                {line.words.map((word, wIndex) => (
                  <div key={wIndex} className="inline-block text-center align-top mx-1 px-1 py-2 leading-tight">
                    <span className="block text-sm text-gray-600 dark:text-gray-400 font-sans font-medium">{word.translation || ' '}</span>
                    <span className="block my-0.5 text-gray-900 dark:text-white">{word.original || ' '}</span>
                    <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-sans italic">{word.grammar || ' '}</span>
                  </div>
                ))}
              </p>
            ),
          });
        } else { // granularity === 'word'
          line.words.forEach((word, wIndex) => {
            items.push({
              id: `s${sIndex}-l${lIndex}-w${wIndex}`,
              content: (
                 <div className="text-center">
                    <span className="block text-xl text-gray-500 dark:text-gray-400 font-sans font-medium">{word.translation || ' '}</span>
                    <span className="block text-4xl md:text-5xl my-2 text-gray-900 dark:text-white">{word.original || ' '}</span>
                    <span className="block text-lg text-emerald-600 dark:text-emerald-400 font-sans italic">{word.grammar || ' '}</span>
                </div>
              ),
            });
          });
        }
      });
    });
    return items;
  }, [annotation, granularity]);
  
  useEffect(() => {
      setCurrentIndex(0);
  }, [granularity]);

  const handleRecordTimecode = () => {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const currentTime = player.getCurrentTime();
    const currentItemId = flattenedItems[currentIndex].id;
    
    setTimecodes(prev => {
        const otherTimecodes = prev.filter(tc => tc.itemId !== currentItemId);
        return [...otherTimecodes, { itemId: currentItemId, time: currentTime }].sort((a, b) => a.time - b.time);
    });
  };

  const handleAutoPlayToggle = () => {
      setIsAutoPlaying(prev => !prev);
  }

  useEffect(() => {
      if (isAutoPlaying && player) {
          player.playVideo?.();
          intervalRef.current = window.setInterval(() => {
              if (typeof player.getCurrentTime !== 'function') return;
              const currentTime = player.getCurrentTime();
              let newIndex = -1;

              for (let i = timecodes.length - 1; i >= 0; i--) {
                  if (currentTime >= timecodes[i].time) {
                      newIndex = flattenedItems.findIndex(item => item.id === timecodes[i].itemId);
                      break;
                  }
              }

              if (newIndex !== -1 && newIndex !== currentIndex) {
                  setCurrentIndex(newIndex);
              }

          }, 500);
      } else {
          player?.pauseVideo?.();
          if (intervalRef.current) {
              clearInterval(intervalRef.current);
          }
      }
      return () => {
          if (intervalRef.current) {
              clearInterval(intervalRef.current);
          }
      }
  }, [isAutoPlaying, player, timecodes, flattenedItems, currentIndex]);
  
  const handleSaveAndExit = () => {
      onSave({ youtubeUrl, timecodes });
      onExit();
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white z-40 flex flex-col p-4 md:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">Slideshow Mode</h2>
        <div className="flex items-center gap-4">
            <button onClick={handleSaveAndExit} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Save & Exit</button>
            <button onClick={onExit} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><CloseIcon/></button>
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
        <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8 relative ${!showVideo ? 'md:col-span-2' : ''}`}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">View by:</span>
            <select value={granularity} onChange={e => setGranularity(e.target.value as Granularity)} className="bg-gray-200 dark:bg-gray-700 p-1 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 dark:border-gray-600">
                <option value="line">Line</option>
                <option value="word">Word</option>
            </select>
          </div>
          <div className="flex-grow flex items-center justify-center w-full">
            {flattenedItems.length > 0 ? flattenedItems[currentIndex].content : "No content"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 mt-4 flex justify-between items-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg">
         <div className="flex items-center gap-2">
            <button onClick={() => setShowVideo(p => !p)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" title={showVideo ? "Hide Video" : "Show Video"}>
              {showVideo ? <VideoOffIcon className="w-6 h-6"/> : <VideoIcon className="w-6 h-6"/>}
            </button>
            <button onClick={handleAutoPlayToggle} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" disabled={!showVideo || timecodes.length === 0} title={isAutoPlaying ? "Pause Sync" : "Play with Sync"}>
                {isAutoPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
            </button>
            <button onClick={handleRecordTimecode} className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50" disabled={!showVideo || !player} title="Record Timecode for this item">
                <RecordIcon className="w-6 h-6" />
            </button>
         </div>

         <div className="flex items-center gap-4 font-medium">
            <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-500 dark:text-gray-400 select-none">{currentIndex + 1} / {flattenedItems.length}</span>
            <button onClick={() => setCurrentIndex(p => Math.min(flattenedItems.length - 1, p + 1))} disabled={currentIndex === flattenedItems.length - 1} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Next</button>
         </div>
      </div>
    </div>
  );
};

export default SlideshowPlayer;