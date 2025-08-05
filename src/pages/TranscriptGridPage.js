

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PYTHON_API } from '../config';
import {
  faSpinner,
  faExclamationCircle,
  faWandMagicSparkles,
  faClock,
  faCalendar,
  faPlay,
  faSearch,
  faFilm,
  faList,
  faSquare,
  faSquareCheck
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../styles/TranscriptGrid.css';
import { useVideoIds } from '../context/videoIds';
import { useClipsData } from '../context/clipsData';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
import { FaChevronLeft, FaChevronRight, FaShareAlt, FaDownload } from 'react-icons/fa';
import { YOUTUBE_API } from '../config';

const TranscriptGridPage = () => {
  const { videoIds } = useVideoIds();
  const navigate = useNavigate();
  const [transcripts, setTranscripts] = useState({});
  const [videoDetails, setVideoDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const { setSelectedClipsData } = useClipsData();
  const [retryCounts, setRetryCounts] = useState({});
  const [maxRetries] = useState(3);
  const API_BASE_URL = 'https://new-ai-clip-1.onrender.com/api/v1';

  useEffect(() => {
    const initializeFirstVideo = async () => {
      if (!videoIds?.length) {
        navigate('/input');
        return;
      }

      setInitialLoading(true);
      const firstVideoId = videoIds[0];

      try {
        setSelectedVideo(firstVideoId);
        setSelectedVideos(new Set(videoIds));

        const details = await fetchVideoDetails(firstVideoId);
        if (!transcripts[firstVideoId]) {
          await fetchTranscript(firstVideoId, details);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    initializeFirstVideo();
  }, [videoIds]);

  useEffect(() => {
    const loadVideoData = async () => {
      if (selectedVideo && !transcripts[selectedVideo] && !loading[selectedVideo]) {
        setLoading(prev => ({ ...prev, [selectedVideo]: true }));
        try {
          const details = await fetchVideoDetails(selectedVideo);
          await fetchTranscript(selectedVideo, details);
        } catch (error) {
          console.error("Error loading video data:", error);
          setErrors(prev => ({ ...prev, [selectedVideo]: error.message }));
        } finally {
          setLoading(prev => ({ ...prev, [selectedVideo]: false }));
        }
      }
    };
    loadVideoData();
  }, [selectedVideo]);

  const checkImageExists = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const fetchVideoDetails = async (videoId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const isMongoId = /^[a-f0-9]{24}$/.test(videoId);
      let details = {};
      let isYouTube = false;

      if (isMongoId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/video/${videoId}/details`, { headers });
          details = response.data.data || response.data;

          if (details.youtubeId) {
            try {
              const youtubeResponse = await axios.get(
                `${API_BASE_URL}/youtube/video/${videoId}`,
                { headers }
              );
              const youtubeData = youtubeResponse.data.data || {};
              details = { ...details, ...youtubeData };
              isYouTube = true;
            } catch (youtubeError) {
              console.log("YouTube details not available, using basic video info");
            }
          }
        } catch (dbError) {
          if (dbError.response?.status === 404) {
            try {
              const youtubeResponse = await axios.post(
                `${API_BASE_URL}/youtube/details/${videoId}`,
                {},
                { headers }
              );
              details = youtubeResponse.data.data || youtubeResponse.data;
              isYouTube = true;
            } catch (youtubeError) {
              throw new Error('Neither video nor YouTube details found');
            }
          } else {
            throw dbError;
          }
        }
      } else {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/youtube/details/${videoId}`,
            {},
            { headers }
          );
          details = response.data.data || response.data;
          isYouTube = true;
        } catch (youtubeError) {
          throw new Error('YouTube details not found');
        }
      }

      let durationInSeconds;
      if (isYouTube && details.duration && typeof details.duration === 'string' && details.duration.startsWith('PT')) {
        durationInSeconds = parseISODuration(details.duration);
      } else {
        durationInSeconds = Number(details.duration) || 0;
      }

      let thumbnailUrl;
      if (isYouTube) {
        thumbnailUrl = `https://img.youtube.com/vi/${details.youtubeId || videoId}/maxresdefault.jpg`;
        if (!await checkImageExists(thumbnailUrl)) {
          thumbnailUrl = `https://img.youtube.com/vi/${details.youtubeId || videoId}/hqdefault.jpg`;
        }
      } else {
        thumbnailUrl = details.thumbnailUrl || `${API_BASE_URL}/thumbnails/${videoId}.jpg`;
      }

      const videoData = {
        title: details.title || (isYouTube ? 'YouTube Video' : 'Uploaded Video'),
        description: details.description || '',
        duration: durationInSeconds,
        durationISO: details.duration || 'PT0M0S',
        publishedAt: details.publishedAt || details.createdAt || new Date().toISOString(),
        thumbnail: thumbnailUrl,
        isYouTubeVideo: isYouTube,
        isCustomVideo: !isYouTube,
        status: details.status || 'processed',
        videoUrl: details.videoUrl || null
      };

      setVideoDetails(prev => ({
        ...prev,
        [videoId]: videoData
      }));

      return videoData;
    } catch (error) {
      console.error("Error fetching video details:", error);

      const fallbackThumbnail = /^[a-f0-9]{24}$/.test(videoId)
        ? `${API_BASE_URL}/thumbnails/${videoId}`
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const fallbackData = {
        title: 'Video Details Unavailable',
        description: '',
        duration: 0,
        durationISO: 'PT0M0S',
        publishedAt: new Date().toISOString(),
        thumbnail: fallbackThumbnail,
        isYouTubeVideo: false,
        isCustomVideo: true,
        status: 'error',
        videoUrl: null,
        error: error.message
      };

      setVideoDetails(prev => ({
        ...prev,
        [videoId]: fallbackData
      }));

      return fallbackData;
    }
  };

  const fetchTranscript = async (videoId, videoDetails, attempt = 1) => {
    if (!videoDetails) {
      throw new Error('Video details are required to fetch the transcript');
    }
    if (transcripts[videoId]) return;

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    setLoading(prev => ({ ...prev, [videoId]: true }));
    setErrors(prev => ({ ...prev, [videoId]: null }));

    try {
      console.log(`Fetching transcript for video ${videoId} (attempt ${attempt})...`);

      let response;
      if (videoDetails.isYouTubeVideo) {
        response = await axios.post(`https://clip-py-backend-1.onrender.com/transcript/${videoId}`, { headers });
      } else {
        response = await axios.get(`${API_BASE_URL}/video/${videoId}/transcript`, { headers });
      }

      const transcriptData = response.data.data?.transcript || response.data.transcript || response.data.data || response.data;

      if (!transcriptData) {
        throw new Error('Transcript data not found in response');
      }

       const processedTranscript = (Array.isArray(transcriptData) ? transcriptData : transcriptData.segments || [])
      .map(segment => ({
        text: segment.text || '',
        startTime: Number(segment.startTime || segment.start || 0),
        endTime: Number(segment.endTime || segment.end || 0),
        duration: Number(segment.duration || 0),
        speaker: segment.speaker || null,
        confidence: segment.confidence || null
      }));

      if (processedTranscript.length === 0) {
        throw new Error('Transcript is empty or unavailable');
      }

      setTranscripts(prev => ({
        ...prev,
        [videoId]: processedTranscript
      }));
      setRetryCounts(prev => ({ ...prev, [videoId]: 0 }));
    } catch (error) {
      console.error('Error fetching transcript:', {
        error,
        videoId,
        attempt,
        response: error.response?.data
      });

      if (attempt < maxRetries) {
        setTimeout(() => {
          fetchTranscript(videoId, videoDetails, attempt + 1);
          setRetryCounts(prev => ({ ...prev, [videoId]: attempt }));
        }, 3000 * attempt);
        return;
      }

      setErrors(prev => ({
        ...prev,
        [videoId]: error.response?.data?.message ||
          error.message ||
          "Failed to fetch transcript. Please check if captions are available for this video."
      }));
    } finally {
      setLoading(prev => ({ ...prev, [videoId]: false }));
    }
  };




  // Updated formatTimeRange function
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00';

    // Handle negative values
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);

    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const millis = Math.floor((absSeconds % 1) * 1000);

    // Format as M:SS or MM:SS
    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

    return `${isNegative ? '-' : ''}${timeStr}`;
  };

  const formatTimePrecise = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00.000';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const millis = Math.floor((absSeconds % 1) * 1000);
    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
    return `${isNegative ? '-' : ''}${timeStr}`;
  };

  const formatTimeRangePrecise = (start, end) => {
    const startSec = typeof start === 'number' ? start : 0;
    const endSec = typeof end === 'number' ? end : startSec + 1;
    if (isNaN(startSec) || isNaN(endSec)) return '0:00.000 - 0:00.000';
    return `${formatTimePrecise(startSec)} - ${formatTimePrecise(endSec)}`;
  };


  const parseISODuration = (duration) => {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return (hours * 3600) + (minutes * 60) + seconds;
  };

  // In your frontend code
  const formatDuration = (duration) => {
    if (typeof duration === 'string' && duration.startsWith('PT')) {
      // Handle ISO 8601 format if needed
      return formatTime(parseISODuration(duration));
    }

    // Ensure duration is a number
    const durationNum = Number(duration);
    if (isNaN(durationNum)) return '0:00';

    return formatTime(durationNum);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectVideo = (videoId) => {
    setSelectedVideo(videoId);
  };

  const handleGenerateClips = () => {
    const selectedClipsData = Array.from(selectedVideos).map(videoId => {
      const videoData = {
        videoId,
        title: videoDetails[videoId]?.title,
        duration: videoDetails[videoId]?.duration,
        publishedAt: videoDetails[videoId]?.publishedAt,
        thumbnail: videoDetails[videoId]?.thumbnail,
        segments: transcripts[videoId]?.map(segment => ({
          startTime: Math.floor(segment.startTime),
          endTime: Math.ceil(segment.endTime),
          duration: segment.duration,
          text: segment.text
        })) || []
      };
      return videoData;
    });

    setSelectedClipsData(selectedClipsData);
    navigate('/create');
  };

  const filteredVideoIds = videoIds?.filter(videoId =>
    videoDetails[videoId]?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    !searchTerm
  );

  const formatTimeRange = (start, end) => {
    const startSec = typeof start === 'number' ? start : 0;
    const endSec = typeof end === 'number' ? end : startSec + 1;

    // Ensure valid times
    if (isNaN(startSec) || isNaN(endSec)) return '0:00 - 0:00';

    return `${formatTime(startSec)} - ${formatTime(endSec)}`;
  };

  // Function to generate section heading based on time
  const generateSectionHeading = (timeInSeconds) => {
    if (timeInSeconds < 60) return "Opening Remarks";
    const minutes = Math.floor(timeInSeconds / 60);
    if (minutes < 5) return "Key Points";
    else if (minutes < 10) return "Main Discussion";
    else if (minutes < 15) return "Detailed Analysis";
    else return "Extended Discussion";
  };

  const shouldShowHeading = (currentIndex, segments) => {
    if (currentIndex === 0) return true;
    const currentTime = segments[currentIndex].startTime;
    const prevTime = segments[currentIndex - 1].startTime;
    const currentMinute = Math.floor(currentTime / 60);
    const prevMinute = Math.floor(prevTime / 60);
    return currentMinute !== prevMinute && (currentMinute === 0 || currentMinute === 5 || currentMinute === 10 || currentMinute === 15 || currentMinute === 20);
  };

  // Add selection handlers
  const toggleVideoSelection = (e, videoId) => {
    e.stopPropagation();
    setSelectedVideos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(videoId)) {
        newSelection.delete(videoId);
      } else {
        newSelection.add(videoId);
      }
      return newSelection;
    });
  };



  return (
    <div className="h-screen bg-[#121212] text-white flex flex-col">
      {/* Header - Mobile Optimized */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#6c5ce7] flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faList} className="text-white text-sm sm:text-base" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-medium text-white truncate">
              Video Transcripts
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-0">
              {selectedVideos.size} selected / {videoIds?.length || 0} videos
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {initialLoading ? (
        <div className="flex-1 flex items-center justify-center bg-[#121212]">
          <div className="text-center space-y-4">
            <FontAwesomeIcon icon={faSpinner} className="text-[#6c5ce7] text-4xl animate-spin" />
            <p className="text-gray-400 text-sm animate-pulse">Loading your videos...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0">
          {/* Left Panel - Video List - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full lg:w-[420px] bg-gray-900 flex flex-col lg:border-r lg:border-[#2d2d2d] max-h-[40vh] lg:max-h-none"
          >
            {/* Search Bar - Mobile Optimized */}
            <div className="p-3 sm:p-4 border-b border-[#2d2d2d]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#252525] text-sm px-9 sm:px-10 py-2.5 sm:py-3 rounded-lg text-gray-300 
                           placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6c5ce7] 
                           transition-all duration-200"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                />
              </div>
            </div>

            {/* Video List with custom scrollbar and loading states */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <style>
                {`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #1a1a1a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #2d2d2d;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #3d3d3d;
                }
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #2d2d2d #1a1a1a;
                }
                .custom-purple-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-purple-scrollbar::-webkit-scrollbar-track {
                  background: #1a1a1a;
                }
                .custom-purple-scrollbar::-webkit-scrollbar-thumb {
                  background: #6c5ce7;
                  border-radius: 4px;
                  opacity: 0.3;
                }
                .custom-purple-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #8b7cf7;
                }
                .custom-purple-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #6c5ce7 #1a1a1a;
                }
                .video-item-enter {
                  opacity: 0;
                  transform: translateY(10px);
                }
                .video-item-enter-active {
                  opacity: 1;
                  transform: translateY(0);
                  transition: opacity 300ms, transform 300ms;
                }
                `}
              </style>
              {filteredVideoIds?.map((videoId, index) => (
                <motion.div
                  key={videoId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`p-3 sm:p-3 cursor-pointer transition-all duration-200 border-b border-[#2d2d2d]
                ${selectedVideo === videoId ? 'bg-[#2d2d2d] border-l-2 border-l-[#6c5ce7]' : 'hover:bg-[#252525]'}
                ${loading[videoId] ? 'opacity-70' : ''} active:bg-[#2d2d2d] active:scale-[0.99]`}
                  onClick={() => selectVideo(videoId)}
                >
                  {videoDetails[videoId] ? (
                    <div className="flex gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => toggleVideoSelection(e, videoId)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 touch-manipulation
                      ${selectedVideos.has(videoId)
                              ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/30'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 active:scale-95'}`}
                        >
                          <FontAwesomeIcon
                            icon={selectedVideos.has(videoId) ? faSquareCheck : faSquare}
                            className={`text-sm ${selectedVideos.has(videoId) ? 'scale-110' : ''} transition-transform`}
                          />
                        </button>
                        <a
                          href={`https://www.youtube.com/watch?v=${videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group w-28 h-[4.5rem] sm:w-32 sm:h-20 flex-shrink-0 touch-manipulation"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={videoDetails[videoId].thumbnail}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                            alt=""
                            className="w-full h-full object-cover rounded-lg shadow-md"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 group-active:bg-black/60
                          flex items-center justify-center transition-all duration-200 rounded-lg">
                            <FontAwesomeIcon icon={faPlay} className="text-white/90 text-sm group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 
                           text-white px-1.5 py-0.5 rounded font-medium">
                            {formatDuration(videoDetails[videoId].duration)}
                          </span>
                        </a>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-200 line-clamp-2 mb-1.5 leading-tight">
                          {videoDetails[videoId].title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faCalendar} className="text-[10px] text-[#6c5ce7]" />
                            {formatDate(videoDetails[videoId].publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse flex gap-2 sm:gap-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-700/50 rounded" />
                      <div className="w-24 sm:w-32 h-16 sm:h-20 bg-[#252525] rounded-lg" />
                      <div className="flex-1">
                        <div className="h-3 sm:h-4 bg-[#252525] rounded w-full mb-1 sm:mb-2" />
                        <div className="h-2 sm:h-3 bg-[#252525] rounded w-2/3" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Middle Panel - Transcript - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden bg-[#121212] relative min-h-0"
          >
            <AnimatePresence mode="wait">
              {selectedVideo && videoDetails[selectedVideo] ? (
                <motion.div
                  key="transcript-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Transcript Header - Mobile Optimized */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2d2d2d] bg-[#1a1a1a]/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7] text-sm sm:text-base" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm sm:text-base font-medium text-white truncate">Video Transcript</h2>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {transcripts[selectedVideo]?.length || 0} segments • {formatDuration(videoDetails[selectedVideo]?.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="px-2 sm:px-3 py-1 rounded-full bg-[#6c5ce7]/10 text-[#6c5ce7] text-[10px] sm:text-xs font-medium">
                          Auto-Generated
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transcript Content with custom scrollbar - Mobile Optimized */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 custom-purple-scrollbar">
                    {loading[selectedVideo] ? (
                      <div className="flex items-center justify-center h-full">
                        <FontAwesomeIcon icon={faSpinner} className="text-[#6c5ce7] text-2xl animate-spin" />
                      </div>
                    ) : errors[selectedVideo] ? (
                      <div className="flex items-center justify-center h-full text-red-400 text-sm">
                        <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                        {errors[selectedVideo]}
                      </div>
                    ) : transcripts[selectedVideo] ? (
                      transcripts[selectedVideo].map((segment, index) => {
                        // Floor startTime and ceil endTime
                        const startTime = segment.startTime;
                        const endTime = segment.endTime;
                        const duration = segment.duration;
                        const showHeading = shouldShowHeading(index, transcripts[selectedVideo]);
                        return (
                          <React.Fragment key={index}>
                            {showHeading && (
                              <div className="pt-4 sm:pt-6 pb-2 sm:pb-3">
                                <h2 className="text-[#6c5ce7] text-sm sm:text-base font-semibold flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] flex-shrink-0"></div>
                                  <span className="truncate">{generateSectionHeading(startTime)}</span>
                                  <div className="h-px bg-[#6c5ce7]/20 flex-1 ml-2"></div>
                                </h2>
                              </div>
                            )}
                            <div className="p-3 sm:p-4 bg-[#1a1a1a]/60 rounded-lg hover:bg-[#252525] active:bg-[#2a2a2a]
                                         transition-all duration-200 group flex flex-col sm:flex-row gap-2 sm:gap-3 touch-manipulation">
                              <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-1 w-full sm:w-32 flex-shrink-0">
                                <span className="text-xs sm:text-sm font-medium text-[#6c5ce7] whitespace-nowrap">
                                  {formatTimeRangePrecise(startTime, endTime)}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500">
                                  {duration.toFixed(3)}s
                                </span>
                              </div>
                              <p className="text-sm sm:text-base text-gray-300 flex-1 leading-relaxed">{segment.text}</p>
                            </div>
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No transcript available
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full w-full p-4 sm:p-6"
                >
                  <div className="bg-gray-800/50 backdrop-blur-xl p-4 sm:p-6 rounded-xl max-w-sm sm:max-w-lg w-full shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#6c5ce7] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FontAwesomeIcon icon={faFilm} className="text-white text-lg sm:text-xl" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white mb-2 text-center">
                      Video Transcripts
                    </h2>
                    <p className="text-gray-300 text-center text-sm leading-relaxed">
                      Select a video from the <span className="lg:hidden">list above</span><span className="hidden lg:inline">sidebar</span> to view its transcript.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Panel - Video Details */}
          {selectedVideo && videoDetails[selectedVideo] && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="hidden md:block md:w-[300px] bg-[#1f1f1f] md:border-l md:border-[#2d2d2d] p-4"
            >
              <div className="space-y-4">
                <a
                  href={`https://www.youtube.com/watch?v=${selectedVideo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative w-full aspect-video rounded-lg overflow-hidden group"
                >
                  <img
                    src={videoDetails[selectedVideo].thumbnail}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://img.youtube.com/vi/${selectedVideo}/hqdefault.jpg`;
                    }}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300">
                    <FontAwesomeIcon icon={faPlay} className="text-white/90 text-xl transform group-hover:scale-110 transition-transform" />
                  </div>
                </a>

                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-white leading-snug">
                    {videoDetails[selectedVideo].title}
                  </h2>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FontAwesomeIcon icon={faClock} className="text-[#6c5ce7]" />
                      <span>{formatDuration(videoDetails[selectedVideo].duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FontAwesomeIcon icon={faCalendar} className="text-[#6c5ce7]" />
                      <span>{formatDate(videoDetails[selectedVideo].publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Floating Generate Clips Button - Mobile Optimized */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        onClick={handleGenerateClips}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-gradient-to-r from-[#6c5ce7] to-[#8b7cf7] 
                 hover:from-[#5849e0] hover:to-[#7a6af6] px-4 sm:px-5 py-3 sm:py-3 rounded-xl
                 text-white font-medium text-sm sm:text-base shadow-lg hover:shadow-xl
                 transition-all duration-300 flex items-center gap-2 sm:gap-2.5
                 hover:scale-105 active:scale-95 z-50 touch-manipulation
                 min-h-[48px] min-w-[120px] sm:min-w-[140px] justify-center"
      >
        <FontAwesomeIcon icon={faWandMagicSparkles} className="text-base sm:text-lg" />
        <span className="hidden xs:inline sm:inline">Generate Clips</span>
        <span className="xs:hidden sm:hidden">Clips</span>
      </motion.button>
    </div>
  );
};

export default TranscriptGridPage;