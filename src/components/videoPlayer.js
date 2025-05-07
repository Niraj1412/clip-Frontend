import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMinus, 
  faPlus, 
  faBackwardStep, 
  faForwardStep,
  faPlay,
  faPause,
  faCircleNotch,
  faScissors,
  faCheck,
  faExpand,
  faVolumeLow,
  faVolumeHigh,
  faVolumeMute,
  faGear,
  faClock
} from '@fortawesome/free-solid-svg-icons';

const VideoPlayer = ({ videoUrl, onTimeChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      setIsPlaying(false);
      setReady(false);
      setCurrentTime(0);
      console.log("Loading video URL:", videoUrl);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (currentTime < startTime || currentTime > endTime) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  }, [startTime, endTime, currentTime]);

  useEffect(() => {
    if (onTimeChange) {
      onTimeChange({ startTime, endTime });
    }
  }, [startTime, endTime, onTimeChange]);

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (currentTime >= endTime) {
      setCurrentTime(startTime);
      videoRef.current.currentTime = startTime;
    }
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
        setReady(false);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = Math.max(0, Math.min(x / bounds.width, 1));
    const time = percentage * duration;
    
    videoRef.current.currentTime = Math.min(time, duration);
    setCurrentTime(Math.min(time, duration));
  };

  const adjustSpeed = (faster) => {
    if (!videoRef.current) return;
    
    const newRate = faster ? 
      Math.min(playbackRate + 0.25, 2) : 
      Math.max(playbackRate - 0.25, 0.25);
    
    videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const skipToStart = () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = startTime;
    setCurrentTime(startTime);
  };

  const skipToEnd = () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = endTime;
    setCurrentTime(endTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[800px] mx-auto bg-[#1f1f1f] rounded-xl shadow-lg p-6 flex flex-col gap-5 transform transition-all duration-500 hover:shadow-2xl hover:shadow-[#6c5ce7]/10 relative group/container"
    >

      <div className="absolute -top-3 right-8 px-4 py-1.5 bg-[#6c5ce7] rounded-full text-white text-sm font-medium shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[#6c5ce7]/50 z-10">
        {isPlaying ? 'Playing' : 'Paused'}
      </div>

      <div className="text-center mb-2 relative group">
        <h2 className="text-2xl font-bold text-white inline-block relative group-hover:text-[#6c5ce7] transition-colors duration-300">
          Preview Clip
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6c5ce7] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        </h2>
        <p className="text-gray-400 text-sm mt-2 opacity-75 hover:opacity-100 transition-all duration-300 group-hover:text-[#6c5ce7]/70">
          Adjust the clip duration using the timeline below
        </p>
      </div>

      <div 
        className="w-full aspect-video bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative group/video transform transition-all duration-300 hover:scale-[1.01] shadow-lg hover:shadow-xl"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {!videoUrl ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <FontAwesomeIcon icon={faCircleNotch} className="text-5xl text-[#6c5ce7] animate-spin mb-4" />
            <p className="text-white">Loading video...</p>
          </div>
        ) : (
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onLoadedMetadata={(e) => {
              setDuration(e.target.duration);
              setStartTime(0);
              setEndTime(e.target.duration);
              setReady(true);
            }}
            onTimeUpdate={(e) => {
              setCurrentTime(e.target.currentTime);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(startTime);
            }}
            onError={(e) => {
              console.error("Video error:", e);
              setReady(false);
            }}
            muted={isMuted}
            preload="auto"
          />
        )}
        
        {/* Ambient Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/5 via-transparent to-[#6c5ce7]/10 opacity-0 group-hover/video:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-300" />
        
        {/* Enhanced Time Display */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 transform transition-all duration-300 group-hover/video:translate-y-0 translate-y-12">
          <div className="text-white text-lg bg-black/20 px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-[#6c5ce7] text-sm" />
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span className="opacity-50 mx-1">/</span>
            <span className="opacity-75">{formatTime(duration)}</span>
          </div>
          <div className="text-white/70 text-sm bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-md">
            {playbackRate}x
          </div>
        </div>
        
        {/* Enhanced Controls on Hover */}
        <div className="absolute top-4 right-4 flex gap-2 transform transition-all duration-300 group-hover/video:translate-y-0 -translate-y-12">
          {/* Volume Control with Slider */}
          <div className="relative group/volume">
            <button 
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#6c5ce7]/50 transition-all duration-300"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <FontAwesomeIcon 
                icon={isMuted ? faVolumeMute : volume > 0.5 ? faVolumeHigh : faVolumeLow} 
                className="transform transition-transform duration-300 group-hover/volume:scale-110"
              />
            </button>
            <div className={`absolute -left-12 top-12 bg-black/20 backdrop-blur-md p-2 rounded-lg transform transition-all duration-300 ${showVolumeSlider ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1.5 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7] [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#5849e0] transition-colors duration-300"
              />
            </div>
          </div>

          <button 
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#6c5ce7]/50 transition-all duration-300 group/settings"
          >
            <FontAwesomeIcon 
              icon={faGear} 
              className="transform transition-transform duration-300 group-hover/settings:rotate-90"
            />
          </button>

          <button 
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#6c5ce7]/50 transition-all duration-300"
            onClick={toggleFullscreen}
          >
            <FontAwesomeIcon 
              icon={faExpand} 
              className="transform transition-transform duration-300 hover:scale-110"
            />
          </button>
        </div>
        
        {/* Center Play Button */}
        <div 
          className={`absolute inset-0 flex items-center justify-center ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}
          onClick={handlePlayPause}
        >
          <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-[#6c5ce7]/50 transition-all duration-300 transform hover:scale-110 cursor-pointer">
            <FontAwesomeIcon icon={faPlay} className="text-white text-xl ml-1" />
          </div>
        </div>
      </div>

      {/* Timeline slider - Now fully functional */}
      <div className="w-full h-12 relative px-3 py-4 cursor-pointer group/timeline" onClick={handleSeek}>
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/10 via-[#6c5ce7]/20 to-[#6c5ce7]/10 animate-pulse" />
          <div className="absolute inset-0 bg-[#6c5ce7]/10 animate-shimmer"></div>
        </div>

        {/* Enhanced Time Pointers */}
        {[
          { time: startTime, isStart: true },
          { time: endTime, isStart: false }
        ].map((pointer, index) => (
          <div 
            key={index}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${(pointer.time / duration) * 100}%` }}
          >
            <div className="relative group/pointer">
              <div className="absolute w-1 h-12 bg-[#6c5ce7]/30 -top-6 left-1/2 -translate-x-1/2 rounded-full cursor-ew-resize group-hover/pointer:h-14 transition-all duration-300" />
              <div 
                className="absolute w-6 h-6 bg-[#6c5ce7] rounded-full -top-3 left-1/2 -translate-x-1/2 cursor-ew-resize shadow-lg hover:shadow-[#6c5ce7]/50 hover:scale-110 transition-all duration-300 group-hover:bg-[#5849e0]"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const timeline = e.currentTarget.parentElement.parentElement.parentElement;
                  const handleMove = (moveEvent) => {
                    const bounds = timeline.getBoundingClientRect();
                    const x = moveEvent.clientX - bounds.left;
                    const percentage = Math.max(0, Math.min(x / bounds.width, 1));
                    const newTime = percentage * duration;
                    
                    if (pointer.isStart) {
                      const updatedStartTime = Math.min(newTime, endTime - 1);
                      setStartTime(updatedStartTime);
                      
                      if (videoRef.current) {
                        videoRef.current.currentTime = updatedStartTime;
                      }
                      setCurrentTime(updatedStartTime);
                    } else {
                      const updatedEndTime = Math.max(newTime, startTime + 1);
                      setEndTime(updatedEndTime);
                      
                      if (videoRef.current) {
                        videoRef.current.currentTime = updatedEndTime;
                      }
                      setCurrentTime(updatedEndTime);
                    }
                  };
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                  };
                  
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#6c5ce7] px-3 py-1.5 rounded-lg text-xs text-white whitespace-nowrap shadow-lg transform transition-all duration-300 opacity-0 group-hover/pointer:opacity-100 scale-95 group-hover/pointer:scale-100">
                  {formatTime(pointer.time)}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 transform rotate-45 w-2 h-2 bg-[#6c5ce7]" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Enhanced Current Time Indicator */}
        <div 
          className="absolute w-1 h-8 bg-white/80 rounded-full -top-3 pointer-events-none transform transition-all duration-100 ease-out"
          style={{ 
            left: `${(currentTime / duration) * 100}%`,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Enhanced Controls Section */}
      <div className="flex flex-col gap-4">
        {/* Playback Controls with Enhanced Glass Effect */}
        <div className="flex justify-center items-center gap-6 bg-gray-700/30 backdrop-blur-lg px-8 py-5 rounded-2xl mx-auto transition-all duration-300 hover:bg-gray-700/40 group/controls">
          {/* Speed Control with Enhanced Styling */}
          <div className="flex items-center gap-3 mr-6 bg-black/20 rounded-xl px-4 py-2">
            <button 
              className="w-8 h-8 text-white/80 text-sm flex items-center justify-center hover:bg-white/10 rounded-lg transition-all duration-300 hover:text-white"
              onClick={() => adjustSpeed(false)}
              disabled={!ready}
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <div className="text-white/90 text-sm font-medium min-w-[3rem] text-center tabular-nums">
              {playbackRate}x
            </div>
            <button 
              className="w-8 h-8 text-white/80 text-sm flex items-center justify-center hover:bg-white/10 rounded-lg transition-all duration-300 hover:text-white"
              onClick={() => adjustSpeed(true)}
              disabled={!ready}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {/* Main Controls with Enhanced Effects */}
          <div className="flex items-center gap-4">
            <button 
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#6c5ce7]/50 transition-all duration-300"
              onClick={skipToStart}
              disabled={!ready}
            >
              <FontAwesomeIcon icon={faBackwardStep} />
            </button>
            <button 
              className="w-14 h-14 rounded-full bg-[#6c5ce7] flex items-center justify-center text-white hover:bg-[#5849e0] transition-all duration-300 hover:scale-105"
              onClick={handlePlayPause}
              disabled={!ready}
            >
              <FontAwesomeIcon 
                icon={isPlaying ? faPause : faPlay} 
                className={`text-lg ${isPlaying ? '' : 'ml-1'}`}
              />
            </button>
            <button 
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#6c5ce7]/50 transition-all duration-300"
              onClick={skipToEnd}
              disabled={!ready}
            >
              <FontAwesomeIcon icon={faForwardStep} />
            </button>
          </div>

          {/* Create Clip Button with Shimmer Effect */}
          <button 
            className="group/button relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#5849e0] text-white font-medium ml-6 hover:shadow-lg hover:shadow-[#6c5ce7]/20 transition-all duration-300"
            disabled={!ready}
          >
            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover/button:translate-x-full transition-transform duration-700 skew-x-12"></div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faScissors} className="text-white/90" />
              <span>Create Clip</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
