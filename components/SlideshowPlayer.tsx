import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Annotation, SlideshowData, Timecode, Stanza, Line } from '../types';
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

interface SlideshowItem {
  id: string;
  original: React.ReactNode;
  translation: React.ReactNode;
}

const SlideshowPlayer: React.FC<SlideshowPlayerProps> = ({ annotation, initialData, onExit, onSave }) => {
  const [youtubeUrl, setYoutubeUrl] = useState(initialData.youtubeUrl);
  const [timecodes, setTimecodes] = useState<Timecode[]>(initialData.timecodes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(!!initialData.youtubeUrl);
  const [granularity, setGranularity] = useState<'sentence' | 'paragraph'>('sentence');
  const [showTranslation, setShowTranslation] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const onPlayerReady = (event: any) => {
    setPlayer(event.target);
  };

  const onPlayerError = (event: any) => {
    console.error("YouTube Player Error:", event.data);
  };

  const loadVideo = () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId || !playerRef.current) return;

    if (player) {
      player.destroy();
    }
    
    const newPlayer = new window.YT.Player(playerRef.current.id, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          'onReady': onPlayerReady,
          'onError': onPlayerError,
        }
    });
  };
  
  useEffect(() => {
    if (showVideo && youtubeUrl) {
      const videoId = extractVideoId(youtubeUrl);
      if (!videoId) return;

      if (!window.YT || !window.YT.Player) {
        window.onYouTubeIframeAPIReady = loadVideo;
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
      console.warn("Invalid YouTube URL");
    }
    return null;
  };

  const slideshowContent = useMemo<SlideshowItem[]>(() => {
    const items: SlideshowItem[] = [];
    if (granularity === 'sentence') {
        annotation.stanzas.forEach((stanza, sIndex) => {
            stanza.lines.forEach((line, lIndex) => {
                items.push({
                    id: `s${sIndex}-l${lIndex}`,
                    original: <p className="font-serif">{line.words.map(w => w.original).join(' ')}</p>,
                    translation: <p className="font-sans text-gray-500 dark:text-gray-400">{line.words.map(w => w.translation).join(' ')}</p>,
                });
            });
        });
    } else { // Paragraph
        annotation.stanzas.forEach((stanza, sIndex) => {
            items.push({
                id: `s${sIndex}`,
                original: <div className="space-y-2 font-serif">{stanza.lines.map((line, lIndex) => <p key={lIndex}>{line.words.map(w => w.original).join(' ')}</p>)}</div>,
                translation: <div className="space-y-1 font-sans text-gray-500 dark:text-gray-400">{stanza.lines.map((line, lIndex) => <p key={lIndex}>{line.words.map(w => w.translation).join(' ')}</p>)}</div>,
            });
        });
    }
    return items;
  }, [annotation, granularity]);

  useEffect(() => {
      setCurrentIndex(0);
  }, [granularity]);

  const handleRecordTimecode = () => {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const currentTime = player.getCurrentTime();
    const currentItemId = slideshowContent[currentIndex].id;
    
    setTimecodes(prev => {
        const otherTimecodes = prev.filter(tc => tc.itemId !== currentItemId);
        return [...otherTimecodes, { itemId: currentItemId, time: currentTime }].sort((a, b) => a.time - b.time);
    });
  };

  const handleAutoPlayToggle = () => {
      setIsAutoPlaying(prev => !prev);
  }

  useEffect(() => {
      if (isAutoPlaying && player && typeof player.playVideo === 'function') {
          player.playVideo();
          intervalRef.current = window.setInterval(() => {
              if (typeof player.getCurrentTime !== 'function') return;
              const currentTime = player.getCurrentTime();
              let newIndex = -1;

              const matchingTimecode = timecodes.slice().reverse().find(tc => currentTime >= tc.time);

              if (matchingTimecode) {
                  const foundIndex = slideshowContent.findIndex(item => item.id === matchingTimecode.itemId);
                  if (foundIndex !== -1) {
                      newIndex = foundIndex;
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
  }, [isAutoPlaying, player, timecodes, slideshowContent, currentIndex]);
  
  const handleSaveAndExit = () => {
      onSave({ youtubeUrl, timecodes });
      onExit();
  };
  
  const currentItem = slideshowContent[currentIndex];

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
            <div id="youtube-player" ref={playerRef} className="flex-grow w-full h-full">
                {!youtubeUrl && <div className="w-full h-full flex items-center justify-center text-gray-500">Enter a YouTube URL to begin</div>}
            </div>
        </div>

        {/* Annotation Viewer */}
        <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col justify-center p-8 relative ${!showVideo ? 'col-span-1 md:col-span-2' : ''}`}>
          <div className="w-full text-left">
            {currentItem && (
              <div className="space-y-4">
                  <div className="text-2xl md:text-3xl text-gray-900 dark:text-white">{currentItem.original}</div>
                  {showTranslation && <div className="text-xl md:text-2xl">{currentItem.translation}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 mt-4 flex justify-between items-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg flex-wrap gap-4">
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

        <div className="flex items-center gap-2">
            <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex text-sm">
                <button onClick={() => setGranularity('sentence')} className={`px-3 py-1 rounded-md transition ${granularity === 'sentence' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Sentence</button>
                <button onClick={() => setGranularity('paragraph')} className={`px-3 py-1 rounded-md transition ${granularity === 'paragraph' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Paragraph</button>
            </div>
             <label className="flex items-center space-x-2 cursor-pointer text-sm p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded bg-gray-300 dark:bg-gray-600 text-blue-600 focus:ring-blue-500 border-gray-400 dark:border-gray-500"
                  checked={showTranslation}
                  onChange={() => setShowTranslation(!showTranslation)}
                />
                <span>Show Translation</span>
              </label>
        </div>

         <div className="flex items-center gap-4 font-medium">
            <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-500 dark:text-gray-400 select-none">{currentIndex + 1} / {slideshowContent.length}</span>
            <button onClick={() => setCurrentIndex(p => Math.min(slideshowContent.length - 1, p + 1))} disabled={currentIndex === slideshowContent.length - 1} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Next</button>
         </div>
      </div>
    </div>
  );
};

export default SlideshowPlayer;
