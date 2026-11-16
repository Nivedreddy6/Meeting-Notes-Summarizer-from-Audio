import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatTime } from '../utils/exportUtils';

export default function AudioPlayerDeck({ audioUrl, trackTitle }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (val / 100) * duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-deck">
      <div className="deck-left">
        <button className="btn-play-toggle" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="deck-track-info">
          <span className="track-title">{trackTitle || 'Audio Recording'}</span>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="deck-center">
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progressPercent) ? 0 : progressPercent}
          onChange={handleSeek}
          className="seek-slider"
        />
      </div>

      <div className="deck-right">
        <div className="speed-selector">
          {[1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
}
