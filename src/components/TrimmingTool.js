
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
  faExclamationTriangle,
  faRefresh,
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
  isYouTube = false,
  initialDuration = 600,
  initialStartTime = 0,
  initialEndTime = 60,
  transcriptText = '',
  onTimingChange = () => { },
  onSaveTrim = () => { },
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const [error, setError] = useState('');
  const [videoLoadAttempts, setVideoLoadAttempts] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);

  const parsedStartTime = typeof initialStartTime === 'string' ? parseFloat(initialStartTime) : initialStartTime;
  const parsedEndTime = typeof initialEndTime === 'string' ? parseFloat(initialEndTime) : initialEndTime;

  const [currentTime, setCurrentTime] = useState(Math.min(parsedStartTime, initialDuration));
  const [startTime, setStartTime] = useState(Math.min(parsedStartTime, initialDuration));
  const [endTime, setEndTime] = useState(Math.min(parsedEndTime, initialDuration));
  const [playbackRate, setPlaybackRate] = useState(1);

  const [player, setPlayer] = useState(null);
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

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  // Enhanced video format checking
  const checkVideoSupport = () => {
    if (!videoRef.current) return { mp4: false, webm: false, ogg: false };

    return {
      mp4: !!videoRef.current.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
      webm: !!videoRef.current.canPlayType('video/webm; codecs="vp8, vorbis"'),
      ogg: !!videoRef.current.canPlayType('video/ogg; codecs="theora, vorbis"'),
      h264: !!videoRef.current.canPlayType('video/mp4; codecs="avc1.42E01E"'),
      h265: !!videoRef.current.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"'),
    };
  };

  // Enhanced error handling for video loading
  const handleVideoError = (errorEvent, customMessage = null) => {
    const video = errorEvent?.target || videoRef.current;
    if (!video?.error) {
      setError(customMessage || 'Unknown video error occurred');
      return;
    }

    const errorCode = video.error.code;
    const errorMessages = {
      1: 'Video loading was aborted by the user',
      2: 'A network error occurred while loading the video',
      3: 'Video decoding failed due to corruption or unsupported format',
      4: 'Video format is not supported by this browser',
    };

    let detailedError = errorMessages[errorCode] || 'Unknown video load error';

    // Add more specific guidance based on error type
    if (errorCode === 4) {
      const support = checkVideoSupport();
      detailedError += '\n\nSupported formats:';
      if (support.mp4) detailedError += ' MP4';
      if (support.webm) detailedError += ' WebM';
      if (support.ogg) detailedError += ' OGG';

      if (!support.mp4 && !support.webm && !support.ogg) {
        detailedError += ' None detected. Your browser may not support video playback.';
      }
    }

    setError(detailedError);
    setReady(false);
    console.error('Video error details:', {
      code: errorCode,
      message: video.error.message,
      support: checkVideoSupport(),
      videoUrl,
      attempts: videoLoadAttempts
    });
  };

  // Retry mechanism for video loading
  const retryVideoLoad = () => {
    if (videoLoadAttempts >= 3) {
      setError('Failed to load video after multiple attempts. Please check the video file format and try a different video.');
      return;
    }

    setVideoLoadAttempts(prev => prev + 1);
    setError('');
    setReady(false);

    if (videoRef.current) {
      // Force reload
      const currentSrc = videoRef.current.src;
      videoRef.current.src = '';
      videoRef.current.load();

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
          videoRef.current.load();
        }
      }, 100);
    }
  };

  // **YouTube Player Initialization**
  useEffect(() => {
    if (!isYouTube) return;

    if (!videoId) {
      setError('No video ID provided for YouTube video');
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
      console.log('Initializing YouTube player with videoId:', videoId);
      const playerContainer = videoRef.current;
      const playerElement = document.createElement('div');
      playerElement.id = 'youtube-player-element';
      playerContainer.appendChild(playerElement);

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
            origin: window.location.origin,
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
    console.log('YouTube player ready for videoId:', videoId);
    const videoDuration = event.target.getDuration();
    const validStartTime = Math.max(0, Math.min(parsedStartTime, videoDuration - 0.1));
    const validEndTime = Math.max(validStartTime + 0.1, Math.min(parsedEndTime, videoDuration));
    setDuration(videoDuration);
    setStartTime(validStartTime);
    setEndTime(validEndTime);
    setCurrentTime(validStartTime);
    event.target.seekTo(validStartTime);
    event.target.playVideo(); // Start playing the video automatically
    setIsPlaying(true); // Update state to reflect playing status
    setReady(true); // Hide loading indicator
    setYoutubeReady(true); // Enable time updates
    console.log(`YouTube video ready. Positioned at ${validStartTime.toFixed(2)} seconds and playing`);
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

  // **HTML5 Video Controls**
  useEffect(() => {
    if (isYouTube || !videoRef.current || !ready) return;

    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.error('Error playing HTML5 video:', err);
        setError('Failed to play video: ' + err.message);
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

  // **YouTube Current Time Updates**
  useEffect(() => {
    if (!isYouTube || !player || !ready || !youtubeReady) return;

    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const playerTime = player.getCurrentTime();
        setCurrentTime(playerTime);

        if (playerTime >= endTime - 0.05 && isPlaying) { // 50ms buffer
          player.pauseVideo();
          player.seekTo(startTime);
          setIsPlaying(false);
          console.log('YouTube playback paused and reset to startTime:', startTime);
        }
      }
    }, 50); // Reduced to 50ms for better precision

    return () => clearInterval(interval);
  }, [isYouTube, player, ready, youtubeReady, startTime, endTime, isPlaying]);

  // **Enhanced HTML5 Video Initialization**
  useEffect(() => {
    if (isYouTube) return;

    if (videoRef.current && videoUrl) {
      console.log('Setting video source:', videoUrl);

      // Reset attempts when URL changes
      setVideoLoadAttempts(0);

      // Enhanced browser support checking
      const support = checkVideoSupport();
      console.log('Browser video support:', support);

      if (!support.mp4 && !support.webm && !support.ogg) {
        setError('This browser does not support video playback');
        return;
      }

      // Set video attributes for better compatibility
      const video = videoRef.current;
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.playsInline = true;

      // Try to get video info first
      const testVideo = document.createElement('video');
      testVideo.crossOrigin = 'anonymous';
      testVideo.preload = 'metadata';

      testVideo.addEventListener('loadedmetadata', () => {
        setVideoInfo({
          duration: testVideo.duration,
          videoWidth: testVideo.videoWidth,
          videoHeight: testVideo.videoHeight,
        });
        console.log('Video metadata loaded:', {
          duration: testVideo.duration,
          dimensions: `${testVideo.videoWidth}x${testVideo.videoHeight}`,
        });
      });

      video.src = videoUrl;
      video.load();

      const handleLoadedMetadata = () => {
        const videoDuration = video.duration;

        // Validate duration
        if (!videoDuration || !isFinite(videoDuration) || videoDuration <= 0) {
          setError('Invalid video duration. The video file may be corrupted.');
          return;
        }

        setDuration(videoDuration);
        setReady(true);
        const validStartTime = Math.max(0, Math.min(parsedStartTime, videoDuration - 0.1));
        const validEndTime = Math.max(validStartTime + 0.1, Math.min(parsedEndTime, videoDuration));
        setStartTime(validStartTime);
        setEndTime(validEndTime);
        setCurrentTime(validStartTime);
        setError(''); // Clear any previous errors
        console.log('HTML5 video loaded successfully. Duration:', videoDuration);
      };

      const handleCanPlay = () => {
        console.log('Video can start playing');
      };

      const handleError = (e) => {
        handleVideoError(e);
      };

      const handleLoadStart = () => {
        console.log('Video load started');
        setError('');
      };

      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          console.log('Video buffered:', bufferedEnd, 'seconds');
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('progress', handleProgress);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('progress', handleProgress);
      };
    } else {
      setError('No video URL provided for uploaded video');
      setReady(false);
      console.error('Missing videoRef or videoUrl:', { videoRef: !!videoRef.current, videoUrl });
    }
  }, [isYouTube, videoUrl, parsedStartTime, parsedEndTime, videoLoadAttempts]);

  // **HTML5 Time Updates**
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      const handleTimeUpdate = () => {
        const current = videoRef.current.currentTime;
        setCurrentTime(current);
        if (current >= endTime && isPlaying) {
          videoRef.current.pause();
          videoRef.current.currentTime = startTime;
          setIsPlaying(false);
          console.log('HTML5 playback paused and reset to startTime:', startTime);
        }
      };
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [isYouTube, endTime, isPlaying, startTime]);

  // **Trim Duration Updates**
  useEffect(() => {
    const newDuration = endTime - startTime;
    setTrimDuration(newDuration);

    if (userInteracted) {
      onTimingChange({ startTime, endTime, duration: newDuration });
      console.log('Timing changed:', { startTime, endTime, duration: newDuration });
    }
  }, [startTime, endTime, onTimingChange, userInteracted]);

  const updateStartTime = (newStartTime) => {
    const validStartTime = Math.max(0, Math.min(Number(newStartTime), endTime - 0.1));

    if (validStartTime !== startTime) {
      setStartTime(validStartTime);
      setCurrentTime(validStartTime);
      setUserInteracted(true);

      if (!isDragging) {
        const newHistoryEntry = { startTime: validStartTime, endTime };
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryEntry]);
        setHistoryIndex((prev) => prev + 1);
      }
      console.log('Updated startTime:', validStartTime);
    }
  };

  const updateEndTime = (newEndTime) => {
    const validEndTime = Math.max(startTime + 0.1, Math.min(Number(newEndTime), duration));

    if (validEndTime !== endTime) {
      setEndTime(validEndTime);
      setUserInteracted(true);

      if (!isDragging) {
        const newHistoryEntry = { startTime, endTime: validEndTime };
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryEntry]);
        setHistoryIndex((prev) => prev + 1);
      }
      console.log('Updated endTime:', validEndTime);
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
      console.log('YouTube seek to:', boundedTime);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = boundedTime;
      setCurrentTime(boundedTime);
      console.log('HTML5 seek to:', boundedTime);
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
        console.log('YouTube seek to startTime:', startTime);
      } else if (!isYouTube && videoRef.current) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        console.log('HTML5 seek to startTime:', startTime);
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
          console.log('YouTube seek to startTime before play:', startTime);
        }
        setTimeout(() => {
          player.playVideo();
        }, 100); // 100ms delay for YouTube
      } else if (!isYouTube && videoRef.current) {
        if (Math.abs(currentTime - startTime) > 0.5) {
          videoRef.current.currentTime = startTime;
          setCurrentTime(startTime);
          console.log('HTML5 seek to startTime before play:', startTime);
        }
        videoRef.current.play().catch((err) => {
          console.error('Error playing HTML5 video:', err);
          setError('Failed to play video: ' + err.message);
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
      console.log('Skip to startTime:', startTime);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      console.log('Skip to startTime:', startTime);
    }
  };

  const skipToEnd = () => {
    if (!ready) return;

    if (isYouTube && player && typeof player.seekTo === 'function') {
      player.seekTo(endTime);
      setCurrentTime(endTime);
      console.log('Skip to endTime:', endTime);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = endTime;
      setCurrentTime(endTime);
      console.log('Skip to endTime:', endTime);
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
    console.log('Drag complete, updated history');
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
    console.log('Saving trim:', { startTime, endTime, duration: trimDuration });
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
    <div className="flex flex-col items-center w-full max-w-full">
      <div className="w-full bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-xl shadow-lg overflow-hidden transform transition-all duration-500">
        <div ref={containerRef} className="w-full p-2 sm:p-3 flex flex-col gap-2 sm:gap-3">
          {/* Video Player */}
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
                crossOrigin="anonymous"
                controls
              />
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}></div>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="bg-gradient-to-br from-red-900/60 to-red-800/60 backdrop-blur-lg p-2 sm:p-4 rounded-xl max-w-xs text-center border border-red-500/30 shadow-xl mx-2">
                  <FontAwesomeIcon icon={faCircleNotch} className="text-red-400 text-lg mb-2" />
                  <h3 className="text-white text-sm font-medium mb-1">Video Error</h3>
                  <p className="text-white/80 text-xs mb-3 leading-relaxed">{error}</p>
                  <button
                    className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border border-[#6366f1]/30"
                    onClick={() => {
                      setError('');
                      setReady(false);
                      setYoutubeReady(false);
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
                <div className="bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/80 backdrop-blur-lg p-2 sm:p-4 rounded-xl max-w-xs text-center border border-[#6366f1]/20 shadow-xl mx-2">
                  <FontAwesomeIcon icon={faScissors} className="text-[#6366f1] text-lg mb-2" />
                  <h3 className="text-white text-sm font-medium mb-1">No Video Selected</h3>
                  <p className="text-white/80 text-xs">Please select a clip to trim</p>
                </div>
              </div>
            )}
            {!ready && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex flex-col items-center">
                  <FontAwesomeIcon icon={faCircleNotch} className="text-[#6366f1] text-2xl animate-spin mb-2" />
                  <p className="text-white text-xs">Loading video...</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Control Panel */}
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl shadow-inner border border-[#6366f1]/10 overflow-hidden">
            {/* Primary Controls Section */}
            <div className="p-3 sm:p-4 border-b border-[#6366f1]/10">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                {/* Current Time Display */}
                <div className="flex items-center gap-2">
                  <div className="text-[#f9fafb] text-sm bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-3 py-2 rounded-lg flex items-center gap-2 border border-[#6366f1]/30 shadow-inner">
                    <FontAwesomeIcon icon={faClock} className="text-[#22d3ee] text-sm" />
                    <span className="font-medium tabular-nums">{formatPreciseTime(currentTime)}</span>
                  </div>
                  <div className="text-[#f9fafb] text-sm bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-3 py-2 rounded-lg border border-[#6366f1]/30 shadow-inner">
                    <span className="tabular-nums font-medium">{playbackRate}x</span>
                  </div>
                </div>
                
                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/30 shadow-inner"
                    onClick={skipToStart}
                    disabled={!ready}
                  >
                    <FontAwesomeIcon icon={faBackwardStep} className="text-sm" />
                  </button>
                  <button
                    className="w-12 h-12 text-[#f9fafb] text-lg bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-full flex items-center justify-center hover:from-[#4f46e5] hover:to-[#4338ca] transition-all shadow-lg border border-[#6366f1]/30"
                    onClick={handlePlayPause}
                    disabled={!ready}
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                  </button>
                  <button
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/30 shadow-inner"
                    onClick={skipToEnd}
                    disabled={!ready}
                  >
                    <FontAwesomeIcon icon={faForwardStep} className="text-sm" />
                  </button>
                </div>
                
                {/* Utility Controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/30 shadow-inner"
                    onClick={toggleMute}
                  >
                    <FontAwesomeIcon
                      icon={isMuted ? faVolumeMute : volume > 0.5 ? faVolumeHigh : faVolumeLow}
                      className="text-sm"
                    />
                  </button>
                  <button
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center text-[#f9fafb] hover:bg-[#6366f1]/70 transition-all duration-300 border border-[#6366f1]/30 shadow-inner"
                    onClick={toggleFullscreen}
                  >
                    <FontAwesomeIcon icon={faExpand} className="text-sm" />
                  </button>
                </div>
              </div>
            {/* Interactive Timeline Section - Moved closer to video */}
            <div className="px-3 sm:px-4 py-3">
              <div ref={timelineRef} className="w-full select-none relative touch-pan-y">
                <div className="relative w-full h-12 flex items-center">
                  <div
                    className="w-full h-4 bg-gradient-to-r from-[#1f2937] via-[#2d3748] to-[#1f2937] rounded-full relative cursor-pointer group/timeline shadow-inner"
                    onClick={handleSeek}
                  >
                    <div
                      className="absolute h-full bg-gradient-to-r from-[#6366f1]/40 to-[#22d3ee]/40 rounded-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md"></div>
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
                    <div className="absolute w-full top-5 flex justify-between text-xs text-[#9ca3af]">
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
                          <div className="absolute w-1.5 h-10 bg-[#6366f1] -top-5 left-1/2 -translate-x-1/2 rounded-full cursor-ew-resize" />
                          <div
                            className="absolute w-6 h-6 -top-3 left-1/2 -translate-x-1/2 cursor-ew-resize shadow-md"
                            style={{
                              background: pointer.isStart
                                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                                : 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
                              borderRadius: '50%',
                              border: '2px solid white',
                              boxShadow: '0 0 8px rgba(99, 102, 241, 0.7)',
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setIsDragging(true);
                              const timeline = timelineRef.current;
                              if (!timeline) {
                                console.error('Timeline reference not found');
                                return;
                              }
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
                      className="absolute w-1.5 h-8 top-[-0.75em] pointer-events-none z-[15]"
                      style={{
                        left: `${(currentTime / duration) * 100}%`,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3))',
                      }}
                    >
                      <div
                        className="absolute -top-[0.3em] left-1/2 -translate-x-1/2 w-[0.75em] h-[0.75em] rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                          boxShadow: '0 0 0.3em rgba(255, 255, 255, 0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trim Controls Panel */}
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl shadow-inner border border-[#6366f1]/10 overflow-hidden">
            {/* Trim Duration Display */}
            <div className="p-3 sm:p-4 border-b border-[#6366f1]/10">
              <div className="flex items-center justify-center">
                <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-4 py-2 rounded-lg text-[#f9fafb] flex items-center gap-2 border border-[#6366f1]/30 shadow-inner">
                  <FontAwesomeIcon icon={faCut} className="text-[#22d3ee]" />
                  <span className="text-sm font-medium">Clip Duration:</span>
                  <span className="tabular-nums font-bold text-[#22d3ee]">{formatPreciseTime(trimDuration)}</span>
                </div>
              </div>
            </div>

            {/* Start and End Time Controls */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time Controls */}
                <div className="flex flex-col gap-2">
                  <span className="text-[#9ca3af] text-sm font-medium">Start Time</span>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-lg px-3 py-2 border border-[#6366f1]/30 shadow-inner">
                    <button
                      className="w-7 h-7 text-[#f9fafb]/80 flex items-center justify-center hover:bg-[#6366f1]/20 rounded transition-colors flex-shrink-0"
                      onClick={() => adjustStartTime(false)}
                      disabled={!ready || startTime <= 0}
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-sm" />
                    </button>
                    <div className="text-[#f9fafb] text-sm font-medium text-center tabular-nums flex-1">
                      {formatTime(startTime)}
                    </div>
                    <button
                      className="w-7 h-7 text-[#f9fafb]/80 flex items-center justify-center hover:bg-[#6366f1]/20 rounded transition-colors flex-shrink-0"
                      onClick={() => adjustStartTime(true)}
                      disabled={!ready || startTime >= endTime - 1}
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    </button>
                  </div>
                </div>
                
                {/* End Time Controls */}
                <div className="flex flex-col gap-2">
                  <span className="text-[#9ca3af] text-sm font-medium">End Time</span>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-lg px-3 py-2 border border-[#6366f1]/30 shadow-inner">
                    <button
                      className="w-7 h-7 text-[#f9fafb]/80 flex items-center justify-center hover:bg-[#6366f1]/20 rounded transition-colors flex-shrink-0"
                      onClick={() => adjustEndTime(false)}
                      disabled={!ready || endTime <= startTime + 1}
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-sm" />
                    </button>
                    <div className="text-[#f9fafb] text-sm font-medium text-center tabular-nums flex-1">
                      {formatTime(endTime)}
                    </div>
                    <button
                      className="w-7 h-7 text-[#f9fafb]/80 flex items-center justify-center hover:bg-[#6366f1]/20 rounded transition-colors flex-shrink-0"
                      onClick={() => adjustEndTime(true)}
                      disabled={!ready || endTime >= duration}
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Speed Controls and Save Button */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#9ca3af] text-sm font-medium">Speed:</span>
                  <div className="flex items-center gap-1">
                    <button
                      className="w-7 h-7 text-[#f9fafb]/80 flex items-center justify-center hover:bg-[#6366f1]/20 rounded transition-colors bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-[#6366f1]/30"
                      onClick={() => adjustSpeed(false)}
                      disabled={!ready}
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-sm" />
                    </button>
                    <button
                      className="w-7 h-7 text-[#f9fafb]/80 flex items-center justify-center hover:bg-[#6366f1]/20 rounded transition-colors bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-[#6366f1]/30"
                      onClick={() => adjustSpeed(true)}
                      disabled={!ready}
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={saveTrim}
                  className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg font-medium border border-[#6366f1]/30"
                  disabled={!ready}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Save Trim</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mini Timeline Overview */}
          <div className="w-full h-2 bg-gradient-to-r from-[#1f2937] to-[#2d3748] rounded-full relative mx-1">
            <div
              className="absolute h-full bg-gradient-to-r from-[#6366f1] to-[#22d3ee] rounded-full shadow-sm"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`,
              }}
            />
            <div
              className="absolute h-2 w-1 bg-[#6366f1] rounded-full top-1/2 -translate-y-1/2 shadow-sm"
              style={{ left: `${(startTime / duration) * 100}%` }}
            />
            <div
              className="absolute h-2 w-1 bg-[#22d3ee] rounded-full top-1/2 -translate-y-1/2 shadow-sm"
              style={{ left: `${(endTime / duration) * 100}%` }}
            />
          </div>


        </div>
      </div>
    </div>
  );
};

export default TrimmingTool;