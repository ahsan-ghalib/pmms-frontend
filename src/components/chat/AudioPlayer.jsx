import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function AudioPlayer({ src, isMine }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    if (dur > 0) {
      setProgress((current / dur) * 100);
    }
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    audioRef.current.currentTime = 0;
  };

  return (
    <div className={`flex items-center w-64 p-2 rounded-full mt-2 ${isMine ? 'bg-white/20' : 'bg-gray-100'}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />
      <button 
        onClick={togglePlay} 
        className={`flex items-center justify-center min-w-10 w-10 h-10 rounded-full ${isMine ? 'bg-white text-[#8E54E9]' : 'bg-[#8E54E9] text-white'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
      </button>
      
      <div className="flex-1 mx-3 flex flex-col justify-center">
        <div className="relative w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${isMine ? 'bg-white' : 'bg-[#8E54E9]'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className={`text-[10px] mt-1 font-medium ${isMine ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
          {isPlaying ? formatTime(audioRef.current?.currentTime) : formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
