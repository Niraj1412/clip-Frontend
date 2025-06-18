import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMinus, faPlus, faBackwardStep, faForwardStep, faPlay, faPause, 
  faCircleNotch, faScissors, faCheck, faExpand, faVolumeLow, 
  faVolumeHigh, faVolumeMute, faGear, faClock, faCut 
} from '@fortawesome/free-solid-svg-icons';

const primaryColor = '#6366f1';
const secondaryColor = '#4f46e5';
const accentColor = '#22d3ee';
const backgroundColor = '#111827';
const surfaceColor = '#1f2937';
const textColor = '#f9fafb';
const mutedTextColor = '#9ca3af';

const TrimmingTool = ({ 
  videoId = '',
  videoUrl = '',
  isYouTube = true,
  initialDuration = 600,
  initialStartTime = 0,
  initialEndTime = 60,
  transcriptText = '',
  onTimingChange = () => {},
  onSaveTrim = () => {}
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const [error, setError] = useState('');
  const parsedStartTime = parseFloat(initialStartTime);
  const parsedEndTime = parseFloat(initialEndTime);
  const [currentTime, setCurrentTime] = useState(parsedStartTime);
  const [startTime, setStartTime] = useState(parsedStartTime);
  const [endTime, setEndTime] = useState(parsedEndTime);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [player, setPlayer] = useState(null);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [trimDuration, setTrimDuration] = useState(parsedEndTime - parsedStartTime);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (isYouTube) {
      let isLoading = false;
      const initYouTubeAPI = () => {
        if (isLoading || !videoId) return;
        isLoading = true;
        if (!window.YT) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.onload = () => {
            const checkYT = setInterval(() => {
              if (window.YT && window.YT.Player) {
                clearInterval(checkYT);
                initializeYouTubePlayer();
              }
            }, 100);
          };
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
        } else if (window.YT.Player) {
          initializeYouTubePlayer();
        }
      };
      initYouTubeAPI();
      return () => { if (player) player.destroy(); };
    } else if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current.duration);
        setReady(true);
      };
      videoRef.current.onerror = () => setError('Failed to load uploaded video');
    }
  }, [videoId, videoUrl, isYouTube]);

  const initializeYouTubePlayer = () => {
    if (!videoRef.current || !videoId) return;
    const playerContainer = videoRef.current;
    while (playerContainer.firstChild) playerContainer.removeChild(playerContainer.firstChild);
    const playerElement = document.createElement('div');
    playerElement.id = 'youtube-player-element';
    playerContainer.appendChild(playerElement);
    const newPlayer = new window.YT.Player(playerElement, {
      videoId,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, enablejsapi: 1, iv_load_policy: 3, modestbranding: 1, rel: 0, showinfo: 0, fs: 0, playsinline: 1 },
      events: {
        onReady: (event) => {
          setYoutubeReady(true);
          setDuration(event.target.getDuration());
          setStartTime(parsedStartTime);
          setEndTime(parsedEndTime);
          setCurrentTime(parsedStartTime);
          event.target.seekTo(parsedStartTime);
          setReady(true);
        },
        onStateChange: (event) => {
          if (event.data === 1) setIsPlaying(true);
          else if (event.data === 2 || event.data === 0) setIsPlaying(false);
          if (event.data === 0) event.target.seekTo(startTime);
        },
        onError: (event) => setError('YouTube video error: ' + event.data)
      }
    });
    setPlayer(newPlayer);
  };

  useEffect(() => {
    if (isYouTube && player && youtubeReady) {
      isPlaying ? player.playVideo() : player.pauseVideo();
    } else if (!isYouTube && videoRef.current) {
      isPlaying ? videoRef.current.play() : videoRef.current.pause();
    }
  }, [isPlaying, player, youtubeReady, isYouTube]);

  useEffect(() => {
    if (isYouTube && player && youtubeReady) {
      player.setPlaybackRate(playbackRate);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, player, youtubeReady, isYouTube]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isYouTube && player && youtubeReady) {
        const time = player.getCurrentTime();
        setCurrentTime(time);
        if (time >= endTime && player.getPlayerState() === 1) {
          player.pauseVideo();
          player.seekTo(startTime);
        }
      } else if (!isYouTube && videoRef.current) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        if (time >= endTime && !videoRef.current.paused) {
          videoRef.current.pause();
          videoRef.current.currentTime = startTime;
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, endTime, player, youtubeReady, isYouTube]);

  useEffect(() => {
    const newDuration = endTime - startTime;
    setTrimDuration(newDuration);
    onTimingChange({ startTime, endTime, duration: newDuration });
  }, [startTime, endTime, onTimingChange]);

  const updateStartTime = (newStartTime) => {
    const validStartTime = Math.max(0, Math.min(newStartTime, endTime - 0.1));
    if (validStartTime !== startTime) {
      setStartTime(validStartTime);
      setCurrentTime(validStartTime);
      if (isYouTube && player) player.seekTo(validStartTime);
      else if (!isYouTube && videoRef.current) videoRef.current.currentTime = validStartTime;
    }
  };

  const updateEndTime = (newEndTime) => {
    const validEndTime = Math.max(startTime + 0.1, Math.min(newEndTime, duration));
    if (validEndTime !== endTime) {
      setEndTime(validEndTime);
      if (isYouTube && player) player.seekTo(validEndTime);
      else if (!isYouTube && videoRef.current) videoRef.current.currentTime = validEndTime;
    }
  };

  const handleSeek = (e) => {
    if (!ready) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const newTime = Math.max(startTime, Math.min(percentage * duration, endTime));
    if (isYouTube && player) player.seekTo(newTime);
    else if (!isYouTube && videoRef.current) videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatPreciseTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!ready) return;
    if (currentTime >= endTime || currentTime < startTime) {
      if (isYouTube && player) player.seekTo(startTime);
      else if (!isYouTube && videoRef.current) videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
    setIsPlaying(!isPlaying);
  };

  const skipToStart = () => {
    if (!ready) return;
    if (isYouTube && player) player.seekTo(startTime);
    else if (!isYouTube && videoRef.current) videoRef.current.currentTime = startTime;
    setCurrentTime(startTime);
  };

  const skipToEnd = () => {
    if (!ready) return;
    if (isYouTube && player) player.seekTo(endTime);
    else if (!isYouTube && videoRef.current) videoRef.current.currentTime = endTime;
    setCurrentTime(endTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const saveTrim = () => onSaveTrim({ startTime, endTime, duration: trimDuration });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-xl shadow-lg overflow-hidden">
        <div ref={containerRef} className="w-full p-3 flex flex-col gap-3">
          <div className="w-full aspect-video bg-[#0f172a] rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
            {isYouTube ? (
              <div ref={videoRef} id="youtube-player" className="w-full h-full absolute inset-0 bg-black"></div>
            ) : (
              <video ref={videoRef} className="w-full h-full object-contain" controls={false} />
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="bg-red-900/60 backdrop-blur-lg p-4 rounded-xl max-w-lg text-center border border-red-500/30 shadow-xl">
                  <FontAwesomeIcon icon={faCircleNotch} className="text-red-400 text-2xl mb-2" />
                  <h3 className="text-white text-lg font-medium mb-1">Video Error</h3>
                  <p className="text-white/80 text-sm">{error}</p>
                </div>
              </div>
            )}
            {!ready && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex flex-col items-center">
                  <FontAwesomeIcon icon={faCircleNotch} className="text-[#6366f1] text-4xl animate-spin mb-2" />
                  <p className="text-white text-sm">Loading video...</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#1e293b] p-2 rounded-lg shadow-inner items-center">
            <div className="flex gap-2 items-center">
              <div className="text-[#f9fafb] text-sm bg-[#0f172a] px-2 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#6366f1]/20 shadow-inner whitespace-nowrap">
                <FontAwesomeIcon icon={faClock} className="text-[#22d3ee] text-xs" />
                <span className="font-medium tabular-nums text-xs">{formatPreciseTime(currentTime)}</span>
                <span className="opacity-50 mx-0.5 text-xs">/</span>
                <span className="opacity-75 tabular-nums text-xs">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button 
                className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/20 shadow-inner"
                onClick={skipToStart}
                disabled={!ready}
              >
                <FontAwesomeIcon icon={faBackwardStep} className="text-sm" />
              </button>
              <button 
                className="w-10 h-10 text-[#f9fafb] text-base bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-full flex items-center justify-center hover:from-[#4f46e5] hover:to-[#4338ca] transition-all shadow-md"
                onClick={handlePlayPause}
                disabled={!ready}
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              </button>
              <button 
                className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/20 shadow-inner"
                onClick={skipToEnd}
                disabled={!ready}
              >
                <FontAwesomeIcon icon={faForwardStep} className="text-sm" />
              </button>
            </div>
            <div className="flex justify-end items-center gap-2">
              <button 
                className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/20 shadow-inner"
                onClick={() => setIsMuted(!isMuted)}
              >
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : volume > 0.5 ? faVolumeHigh : faVolumeLow} className="text-sm" />
              </button>
              <button 
                className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/20 shadow-inner"
                onClick={toggleFullscreen}
              >
                <FontAwesomeIcon icon={faExpand} className="text-sm" />
              </button>
              <button
                onClick={saveTrim}
                className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-300 shadow-md text-xs font-medium"
                disabled={!ready}
              >
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-[#1e293b] p-2 rounded-lg shadow-inner">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 bg-[#0f172a] rounded-lg px-2 py-1 border border-[#6366f1]/20 shadow-inner">
                <div className="text-[#9ca3af] text-xs">Start</div>
                <button 
                  className="w-6 h-6 text-[#f9fafb]/80 text-xs flex items-center justify-center hover:bg-[#6366f1]/20 rounded-lg transition-colors"
                  onClick={() => updateStartTime(startTime - 1)}
                  disabled={!ready || startTime <= 0}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <div className="text-[#f9fafb] text-xs font-medium min-w-[3rem] text-center tabular-nums">
                  {formatTime(startTime)}
                </div>
                <button 
                  className="w-6 h-6 text-[#f9fafb]/80 text-xs flex items-center justify-center hover:bg-[#6366f1]/20 rounded-lg transition-colors"
                  onClick={() => updateStartTime(startTime + 1)}
                  disabled={!ready || startTime >= endTime - 1}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>
              <div className="bg-[#0f172a] px-2 py-1 rounded-lg text-[#f9fafb] text-xs flex items-center gap-2 border border-[#6366f1]/20 shadow-inner">
                <FontAwesomeIcon icon={faCut} className="text-[#22d3ee] text-xs" />
                <span className="tabular-nums font-medium">{formatPreciseTime(trimDuration)}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#0f172a] rounded-lg px-2 py-1 border border-[#6366f1]/20 shadow-inner">
                <div className="text-[#9ca3af] text-xs">End</div>
                <button 
                  className="w-6 h-6 text-[#f9fafb]/80 text-xs flex items-center justify-center hover:bg-[#6366f1]/20 rounded-lg transition-colors"
                  onClick={() => updateEndTime(endTime - 1)}
                  disabled={!ready || endTime <= startTime + 1}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <div className="text-[#f9fafb] text-xs font-medium min-w-[3rem] text-center tabular-nums">
                  {formatTime(endTime)}
                </div>
                <button 
                  className="w-6 h-6 text-[#f9fafb]/80 text-xs flex items-center justify-center hover:bg-[#6366f1]/20 rounded-lg transition-colors"
                  onClick={() => updateEndTime(endTime + 1)}
                  disabled={!ready || endTime >= duration}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>
            </div>
            <div ref={timelineRef} className="w-full px-1 py-2 select-none relative">
              <div className="relative w-full h-12 flex items-center">
                <div 
                  className="w-full h-2.5 bg-gradient-to-r from-[#1f2937] via-[#2d3748] to-[#1f2937] rounded-full relative cursor-pointer group/timeline shadow-inner"
                  onClick={handleSeek}
                >
                  <div 
                    className="absolute h-full bg-gradient-to-r from-[#6366f1]/40 to-[#22d3ee]/40 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md"></div>
                  </div>
                  <div 
                    className="absolute h-full overflow-hidden rounded-full z-10"
                    style={{ 
                      left: `${(startTime / duration) * 100}%`,
                      width: `${((endTime - startTime) / duration) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)',
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                  </div>
                  <div className="absolute w-full top-4 flex justify-between text-xs text-[#9ca3af]">
                    <span className="tabular-nums">{formatTime(0)}</span>
                    <span className="tabular-nums">{formatTime(duration)}</span>
                  </div>
                  {[
                    { time: startTime, isStart: true, update: updateStartTime },
                    { time: endTime, isStart: false, update: updateEndTime }
                  ].map((pointer, index) => (
                    <div 
                      key={index}
                      className="absolute top-1/2 -translate-y-1/2 z-20"
                      style={{ left: `${(pointer.time / duration) * 100}%` }}
                    >
                      <div className="relative">
                        <div className="absolute w-0.5 h-8 bg-[#6366f1] -top-4 left-1/2 -translate-x-1/2 rounded-full cursor-ew-resize" />
                        <div 
                          className="absolute w-5 h-5 -top-2.5 left-1/2 -translate-x-1/2 cursor-ew-resize shadow-md"
                          style={{
                            background: pointer.isStart ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
                            borderRadius: '50%',
                            border: '1.5px solid white',
                            boxShadow: '0 0 6px rgba(99, 102, 241, 0.7)'
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDragging(true);
                            const timeline = timelineRef.current;
                            const initialX = e.clientX;
                            const initialTime = pointer.time;
                            const timelineBounds = timeline.getBoundingClientRect();
                            const timelineWidth = timelineBounds.width;

                            const handleMove = (moveEvent) => {
                              const deltaX = moveEvent.clientX - initialX;
                              const deltaPercentage = deltaX / timelineWidth;
                              const deltaTime = deltaPercentage * duration;
                              const newTime = Math.max(0, Math.min(initialTime + deltaTime, duration));
                              pointer.update(newTime);
                            };

                            const handleUp = () => {
                              document.removeEventListener('mousemove', handleMove);
                              document.removeEventListener('mouseup', handleUp);
                              setIsDragging(false);
                            };

                            document.addEventListener('mousemove', handleMove);
                            document.addEventListener('mouseup', handleUp);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div 
                    className="absolute w-0.5 h-6 -top-2 pointer-events-none z-15"
                    style={{ left: `${(currentTime / duration) * 100}%`, background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3))' }}
                  >
                    <div 
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)', boxShadow: '0 0 3px rgba(255,255,255,0.5)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimmingTool;