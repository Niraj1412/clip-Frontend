import React, { useState, useRef, useEffect } from 'react';
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
  faClock,
  faCut,
  faUndo,
  faRedo,
  faLock,
  faLockOpen,
} from '@fortawesome/free-solid-svg-icons';

const primaryColor = '#6366f1';
const secondaryColor = '#4f46e5';
const accentColor = '#22d3ee';
const backgroundColor = '#111827';
const surfaceColor = '#1f2937';
const textColor = '#f9fafb';
const mutedTextColor = '#9ca3af';
const shadowColor = 'rgba(0, 0, 0, 0.5)';

const TrimmingTool = ({
  videoId = '',
  videoUrl = '',
  isYouTube = false, // New prop to distinguish video type
  initialDuration = 600,
  initialStartTime = 0,
  initialEndTime = 60,
  transcriptText = '',
  onTimingChange = () => { },
  onSaveTrim = () => { }
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const [error, setError] = useState('');

  const parsedStartTime = typeof initialStartTime === 'string' ? parseFloat(initialStartTime) : initialStartTime;
  const parsedEndTime = typeof initialEndTime === 'string' ? parseFloat(initialEndTime) : initialEndTime;

  const [currentTime, setCurrentTime] = useState(Math.min(parsedStartTime, initialDuration));
  const [startTime, setStartTime] = useState(Math.min(parsedStartTime, initialDuration));
  const [endTime, setEndTime] = useState(Math.min(parsedEndTime, initialDuration));
  const [playbackRate, setPlaybackRate] = useState(1);

  const [player, setPlayer] = useState(null); // For YouTube player
  const [youtubeReady, setYoutubeReady] = useState(false);

  const [isHovering, setIsHovering] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showKeyframes, setShowKeyframes] = useState(false);
  const [isLockedRatio, setIsLockedRatio] = useState(false);
  const [trimDuration, setTrimDuration] = useState(initialEndTime - initialStartTime);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [history, setHistory] = useState([{ startTime: initialStartTime, endTime: initialEndTime }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [userInteracted, setUserInteracted] = useState(false);

  const videoRef = useRef(null); // For HTML5 video or YouTube player container
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  // Initialize player based on video type
  useEffect(() => {
    if (!videoId || !isYouTube) {
      setError('Invalid video ID or configuration');
      setReady(false);
      return;
    }

    console.log(`Initializing YouTube player for videoId: ${videoId}`);
    let isLoading = false;

    const initYouTubeAPI = () => {
      if (isLoading || window.YT?.Player) {
        initializeYouTubePlayer();
        return;
      }
      isLoading = true;

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer();
      };

      tag.onerror = () => {
        setError('Failed to load YouTube API');
        setReady(false);
        isLoading = false;
      };
    };

    const initializeYouTubePlayer = () => {
      if (!videoRef.current) {
        setError('Player container not found');
        setReady(false);
        return;
      }

      try {
        if (player) {
          player.destroy();
        }
        const playerContainer = videoRef.current;
        while (playerContainer.firstChild) {
          playerContainer.removeChild(playerContainer.firstChild);
        }

        const playerElement = document.createElement('div');
        playerElement.id = 'youtube-player-element';
        playerContainer.appendChild(playerElement);

        const newPlayer = new window.YT.Player(playerElement, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            playsinline: 1,
            origin: 'https://clip-frontend-three.vercel.app', // Hardcode this
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError,
          },
        });

        setPlayer(newPlayer);
      } catch (error) {
        console.error('YouTube player initialization failed:', error);
        setError('Failed to initialize YouTube player');
        setReady(false);
      }
    };

    initYouTubeAPI();

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (err) {
          console.warn('Error destroying YouTube player:', err);
        }
      }
      setPlayer(null);
      setYoutubeReady(false);
      setReady(false);
    };
  }, [videoId, isYouTube, parsedStartTime]);

  const onPlayerReady = (event) => {
    setYoutubeReady(true);
    const videoDuration = event.target.getDuration();
    setDuration(videoDuration);

    setStartTime(parsedStartTime);
    setEndTime(parsedEndTime);
    setCurrentTime(parsedStartTime);

    setUserInteracted(false);

    event.target.seekTo(parsedStartTime);

    setReady(true);

    console.log(`YouTube video ready. Starting playback from ${parsedStartTime.toFixed(2)} seconds`);
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (player) {
        player.seekTo(startTime);
      }
    }
  };

  const onPlayerError = (event) => {
    console.error('YouTube Player Error:', event.data);
    setReady(false);

    const errorMessages = {
      2: 'The video ID is invalid',
      5: 'The requested content cannot be played in an HTML5 player',
      100: 'The video requested was not found',
      101: 'The video owner does not allow it to be played in embedded players',
      150: 'The video owner does not allow it to be played in embedded players',
    };

    setError(errorMessages[event.data] || 'An error occurred loading the video');
  };

  // HTML5 video controls
  useEffect(() => {
    if (isYouTube || !videoRef.current || !ready) return;

    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.error('Error playing HTML5 video:', err);
        setError('Failed to play video');
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, ready, isYouTube]);

  useEffect(() => {
    if (isYouTube || !videoRef.current) return;

    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, isYouTube]);

  useEffect(() => {
    if (isYouTube || !videoRef.current) return;

    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted, isYouTube]);

  useEffect(() => {
    if (!isYouTube || !player || !ready || !youtubeReady) return;

    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const playerTime = player.getCurrentTime();
        setCurrentTime(playerTime);

        if (playerTime >= endTime && isPlaying) {
          player.seekTo(startTime);
          player.pauseVideo();
          setIsPlaying(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isYouTube, player, ready, youtubeReady, startTime, endTime, isPlaying]);

  // Validate initial times
  useEffect(() => {
    // Validate initial times
    const validStartTime = Math.max(0, Math.min(parsedStartTime, duration - 0.1));
    const validEndTime = Math.max(validStartTime + 0.1, Math.min(parsedEndTime, duration));
    setStartTime(validStartTime);
    setEndTime(validEndTime);
    setCurrentTime(validStartTime);
    setTrimDuration(validEndTime - validStartTime);
    setUserInteracted(false);
  }, [parsedStartTime, parsedEndTime, duration]);

  // Update trim duration
  useEffect(() => {
    const newDuration = endTime - startTime;
    setTrimDuration(newDuration);

    if (userInteracted) {
      onTimingChange({ startTime, endTime, duration: newDuration });
    }
  }, [startTime, endTime, onTimingChange, userInteracted]);

  const updateStartTime = (newStartTime) => {
    const validStartTime = Math.max(0, Math.min(newStartTime, endTime - 0.1));

    if (validStartTime !== startTime) {
      setStartTime(validStartTime);
      setCurrentTime(validStartTime);
      setUserInteracted(true);

      if (!isDragging) {
        const newHistoryEntry = { startTime: validStartTime, endTime };
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryEntry]);
        setHistoryIndex((prev) => prev + 1);
      }
    }
  };

  const updateEndTime = (newEndTime) => {
    const validEndTime = Math.max(startTime + 0.1, Math.min(newEndTime, duration));

    if (validEndTime !== endTime) {
      setEndTime(validEndTime);
      setUserInteracted(true);

      if (!isDragging) {
        const newHistoryEntry = { startTime, endTime: validEndTime };
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryEntry]);
        setHistoryIndex((prev) => prev + 1);
      }
    }
  };

  const handleSeek = (e) => {
    if (!ready) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const newTime = percentage * duration;
    const boundedTime = Math.max(startTime, Math.min(newTime, endTime));

    if (isYouTube && player && typeof player.seekTo === 'function') {
      player.seekTo(boundedTime);
      setCurrentTime(boundedTime);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = boundedTime;
      setCurrentTime(boundedTime);
    }
  };

  const getTimeMarkers = () => {
    const interval = duration <= 60 ? 5 : duration <= 300 ? 15 : duration <= 900 ? 30 : 60;
    const markerCount = Math.ceil(duration / interval) + 1;
    return Array.from({ length: markerCount }).map((_, i) => ({
      time: i * interval,
      label: formatTime(i * interval),
    }));
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

    if (currentTime <= startTime || currentTime >= endTime) {
      if (isYouTube && player && typeof player.seekTo === 'function') {
        player.seekTo(startTime);
        setCurrentTime(startTime);
      } else if (!isYouTube && videoRef.current) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
    }

    if (isPlaying) {
      if (isYouTube && player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      } else if (!isYouTube && videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      if (isYouTube && player && typeof player.playVideo === 'function') {
        if (Math.abs(currentTime - startTime) > 0.5) {
          player.seekTo(startTime);
          setCurrentTime(startTime);
        }
        player.playVideo();
      } else if (!isYouTube && videoRef.current) {
        if (Math.abs(currentTime - startTime) > 0.5) {
          videoRef.current.currentTime = startTime;
          setCurrentTime(startTime);
        }
        videoRef.current.play().catch((err) => {
          console.error('Error playing HTML5 video:', err);
          setError('Failed to play video');
        });
      }
    }

    setIsPlaying(!isPlaying);
  };

  const adjustSpeed = (faster) => {
    if (!ready) return;
    const newRate = faster ? Math.min(playbackRate + 0.25, 2) : Math.max(playbackRate - 0.25, 0.25);
    setPlaybackRate(newRate);
  };

  const skipToStart = () => {
    if (!ready) return;

    if (isYouTube && player && typeof player.seekTo === 'function') {
      player.seekTo(startTime);
      setCurrentTime(startTime);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const skipToEnd = () => {
    if (!ready) return;

    if (isYouTube && player && typeof player.seekTo === 'function') {
      player.seekTo(endTime);
      setCurrentTime(endTime);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = endTime;
      setCurrentTime(endTime);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleStartEndDragComplete = () => {
    setIsDragging(false);
    setUserInteracted(true);

    const newHistoryEntry = { startTime, endTime };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryEntry]);
    setHistoryIndex((prev) => prev + 1);
  };

  const adjustZoom = (increase) => {
    setZoomLevel((prev) => (increase ? Math.min(prev + 0.5, 4) : Math.max(prev - 0.5, 1)));
  };

  const adjustStartTime = (increment) => {
    if (!ready) return;
    const newStartTime = startTime + (increment ? 1 : -1);
    updateStartTime(newStartTime);
  };

  const adjustEndTime = (increment) => {
    if (!ready) return;
    const newEndTime = endTime + (increment ? 1 : -1);
    updateEndTime(newEndTime);
  };

  const saveTrim = () => {
    onSaveTrim({ startTime, endTime, duration: trimDuration });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-xl shadow-lg overflow-hidden transform transition-all duration-500">
        <div ref={containerRef} className="w-full p-3 flex flex-col gap-3">
          <div
            className="w-full aspect-video bg-[#0f172a] rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-transparent to-[#22d3ee]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {isYouTube ? (
              <div
                id="youtube-player"
                ref={videoRef}
                className="w-full h-full absolute inset-0 bg-black"
                style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ></div>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                preload="metadata"
              />
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}></div>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="bg-red-900/60 backdrop-blur-lg p-4 rounded-xl max-w-lg text-center border border-red-500/30 shadow-xl">
                  <FontAwesomeIcon icon={faCircleNotch} className="text-red-400 text-2xl mb-2" />
                  <h3 className="text-white text-lg font-medium mb-1">Video Error</h3>
                  <p className="text-white/80 text-sm mb-4">{error}</p>
                  <button
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                    onClick={() => {
                      setError('');
                      setReady(false);
                      setYoutubeReady(false);
                      // Trigger re-initialization by resetting videoId
                      setPlayer(null);
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {!videoId && !videoUrl && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <div className="bg-[#1e293b]/80 backdrop-blur-lg p-4 rounded-xl max-w-lg text-center border border-[#6366f1]/20 shadow-xl">
                  <FontAwesomeIcon icon={faScissors} className="text-[#6366f1] text-2xl mb-2" />
                  <h3 className="text-white text-lg font-medium mb-1">No Video Selected</h3>
                  <p className="text-white/80 text-sm">Please select a clip to trim</p>
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
          {/* Rest of the JSX remains unchanged */}
          <div className="grid grid-cols-3 gap-2 bg-[#1e293b] p-2 rounded-lg shadow-inner items-center">
            <div className="flex gap-2 items-center">
              <div className="text-[#f9fafb] text-sm bg-[#0f172a] px-2 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#6366f1]/20 shadow-inner whitespace-nowrap">
                <FontAwesomeIcon icon={faClock} className="text-[#22d3ee] text-xs" />
                <span className="font-medium tabular-nums text-xs">{formatPreciseTime(currentTime)}</span>
                <span className="opacity-50 mx-0.5 text-xs">/</span>
                <span className="opacity-75 tabular-nums text-xs">{formatPreciseTime(duration)}</span>
              </div>
              <div className="text-[#f9fafb] text-xs bg-[#0f172a] px-2 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#6366f1]/20 shadow-inner">
                <span className="tabular-nums">{playbackRate}x</span>
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
                onClick={toggleMute}
              >
                <FontAwesomeIcon
                  icon={isMuted ? faVolumeMute : volume > 0.5 ? faVolumeHigh : faVolumeLow}
                  className="text-sm"
                />
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
                  onClick={() => adjustStartTime(false)}
                  disabled={!ready || startTime <= 0}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <div className="text-[#f9fafb] text-xs font-medium min-w-[3rem] text-center tabular-nums">
                  {formatTime(startTime)}
                </div>
                <button
                  className="w-6 h-6 text-[#f9fafb]/80 text-xs flex items-center justify-center hover:bg-[#6366f1]/20 rounded-lg transition-colors"
                  onClick={() => adjustStartTime(true)}
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
                  onClick={() => adjustEndTime(false)}
                  disabled={!ready || endTime <= startTime + 1}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <div className="text-[#f9fafb] text-xs font-medium min-w-[3rem] text-center tabular-nums">
                  {formatTime(endTime)}
                </div>
                <button
                  className="w-6 h-6 text-[#f9fafb]/80 text-xs flex items-center justify-center hover:bg-[#6366f1]/20 rounded-lg transition-colors"
                  onClick={() => adjustEndTime(true)}
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
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
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
                    { time: endTime, isStart: false, update: updateEndTime },
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
                            background: pointer.isStart
                              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                              : 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
                            borderRadius: '50%',
                            border: '1.5px solid white',
                            boxShadow: '0 0 6px rgba(99, 102, 241, 0.7)',
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
                              handleStartEndDragComplete();
                            };
                            document.addEventListener('mousemove', handleMove);
                            document.addEventListener('mouseup', handleUp);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div
                    className="absolute w-0.5 h-6 top-[-0.8em] pointer-events-none z-[15]"
                    style={{
                      left: `${(currentTime / duration) * 100}%`,
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3))',
                    }}
                  >
                    <div
                      className="absolute -top-[0.25em] left-1/2 -translate-x-1/2 w-[0.625em] h-[0.625em] rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        boxShadow: '0 0 0.2em rgba(255, 255, 255, 0.5)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-[0.375em] bg-[#1f2937] rounded-full relative mx-[1em]">
            <div
              className="absolute h-full bg-[#6366f1] rounded-full"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`,
              }}
            />
            <div
              className="absolute h-[0.75em] w-[0.25em] bg-[#6366f1] rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${(startTime / duration) * 100}%` }}
            />
            <div
              className="absolute h-[0.75em] w-[0.25em] bg-[#6366f1] rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${(endTime / duration) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimmingTool;