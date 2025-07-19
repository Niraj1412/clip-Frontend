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
  const [retryCounts, setRetryCounts] = useState({}); // Track retries per video
  const [maxRetries] = useState(3); // Maximum number of retry attempts
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

        // Only fetch if we don't already have the data
        if (!transcripts[firstVideoId]) {
          await fetchTranscript(firstVideoId);
        }

        // Similarly for video details
        if (!videoDetails[firstVideoId]) {
          await fetchVideoDetails(firstVideoId);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    initializeFirstVideo();
  }, [videoIds]); // Only depend on videoIds to prevent unnecessary re-runs

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
      // First check if we have a valid MongoDB ID format
      const isMongoId = /^[a-f0-9]{24}$/.test(videoId);
      let details = {};
      let isYouTube = false;

      if (isMongoId) {
        // Try to get video details from our database first
        try {
          const response = await axios.get(`${API_BASE_URL}/video/${videoId}/details`, { headers });
          details = response.data.data || response.data;

          // If we have a YouTube ID associated, fetch those details too
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
          // If database lookup fails, try YouTube as fallback
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
        // If not MongoDB ID, assume it's a YouTube ID
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

      // Parse duration from ISO format or seconds
      let durationInSeconds;
      if (isYouTube && details.duration && typeof details.duration === 'string' && details.duration.startsWith('PT')) {
        durationInSeconds = parseISODuration(details.duration);
      } else {
        durationInSeconds = Number(details.duration) || 0;
      }

      // Determine thumbnail URL
      let thumbnailUrl;
      if (isYouTube) {
        thumbnailUrl = `https://img.youtube.com/vi/${details.youtubeId || videoId}/maxresdefault.jpg`;
        if (!await checkImageExists(thumbnailUrl)) {
          thumbnailUrl = `https://img.youtube.com/vi/${details.youtubeId || videoId}/hqdefault.jpg`;
        }
      } else {
        thumbnailUrl = details.thumbnailUrl || `${API_BASE_URL}/thumbnails/${videoId}.jpg`;
      }

      // Set the video details
      setVideoDetails(prev => ({
        ...prev,
        [videoId]: {
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
        }
      }));

    } catch (error) {
      console.error("Error fetching video details:", error);

      // Set fallback details with appropriate thumbnail
      const fallbackThumbnail = /^[a-f0-9]{24}$/.test(videoId)
        ? `${API_BASE_URL}/thumbnails/${videoId}`
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      setVideoDetails(prev => ({
        ...prev,
        [videoId]: {
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
        }
      }));
    }
  };

  const fetchTranscript = async (videoId, attempt = 1) => {
    if (transcripts[videoId]) return;

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    setLoading(prev => ({ ...prev, [videoId]: true }));
    setErrors(prev => ({ ...prev, [videoId]: null }));

    try {
      console.log(`Fetching transcript for video ${videoId} (attempt ${attempt})...`);

      // First try YouTube-specific endpoint
      let response;
      let isYouTube = false;
      try {
        response = await axios.post(`https://clip-py-backend-1.onrender.com/transcript/${videoId}`, { headers });
        isYouTube = true;
      } catch (youtubeError) {
        // If YouTube endpoint fails, fall back to generic endpoint
        if (youtubeError.response?.status === 404) {
          response = await axios.get(`${API_BASE_URL}/video/${videoId}/transcript`, { headers });
        } else {
          throw youtubeError;
        }
      }

      const transcriptData = response.data.data?.transcript || response.data.transcript || response.data.data || response.data;

      if (!transcriptData) {
        throw new Error('Transcript data not found in response');
      }

      // Process transcript data based on source (YouTube or uploaded video)
      const processedTranscript = (Array.isArray(transcriptData) ? transcriptData : transcriptData.segments || [])
        .map(segment => ({
          text: segment.text || '',
          startTime: Number(segment.startTime || 0), // Use 'startTime' from backend
          endTime: Number(segment.endTime || 0),     // Use 'endTime' from backend
          duration: Number(segment.duration || 0),   // Use 'duration' from backend
          speaker: segment.speaker || null,
          confidence: segment.confidence || null
        }));

      if (processedTranscript.length === 0) {
        throw new Error('Transcript is empty or unavailable');
      }

      setTranscripts(prev => {
        const newTranscripts = {
          ...prev,
          [videoId]: processedTranscript
        };
        console.log(`Processed transcript for ${videoId}:`, processedTranscript); // Log for debugging
        return newTranscripts;
      });
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
          fetchTranscript(videoId, attempt + 1);
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
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6c5ce7] flex items-center justify-center">
            <FontAwesomeIcon icon={faList} className="text-white" />
          </div>
          <h1 className="text-lg font-medium text-white">
            Video Transcripts
            <span className="ml-2 text-sm text-gray-400">
              ({selectedVideos.size} selected / {videoIds?.length || 0} videos)
            </span>
          </h1>
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
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
          {/* Left Panel - Video List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full md:w-[420px] bg-gray-900 flex flex-col md:border-r md:border-[#2d2d2d]"
          >
            {/* Search Bar */}
            <div className="p-4 border-b border-[#2d2d2d]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#252525] text-sm px-10 py-2.5 rounded-lg text-gray-300 
                           placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
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
                  className={`p-2 sm:p-3 cursor-pointer transition-all duration-200 border-b border-[#2d2d2d]
                ${selectedVideo === videoId ? 'bg-[#2d2d2d]' : 'hover:bg-[#252525]'}
                ${loading[videoId] ? 'opacity-70' : ''}`}
                  onClick={() => selectVideo(videoId)}
                >
                  {videoDetails[videoId] ? (
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <button
                          onClick={(e) => toggleVideoSelection(e, videoId)}
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center transition-colors
                      ${selectedVideos.has(videoId)
                              ? 'bg-[#6c5ce7] text-white'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
                        >
                          <FontAwesomeIcon
                            icon={selectedVideos.has(videoId) ? faSquareCheck : faSquare}
                            className={`text-xs sm:text-sm ${selectedVideos.has(videoId) ? 'scale-110' : ''}`}
                          />
                        </button>
                        <a
                          href={`https://www.youtube.com/watch?v=${videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group w-24 sm:w-32 h-16 sm:h-20 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={videoDetails[videoId].thumbnail}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 
                          flex items-center justify-center transition-colors rounded-lg">
                            <FontAwesomeIcon icon={faPlay} className="text-white/90" />
                          </div>
                          <span className="absolute bottom-1 right-1 text-[8px] sm:text-[10px] bg-black/60 
                           text-white px-1 sm:px-1.5 py-0.5 rounded">
                            {formatDuration(videoDetails[videoId].duration)}
                          </span>
                        </a>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-200 line-clamp-2 mb-1 leading-snug">
                          {videoDetails[videoId].title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCalendar} className="text-[8px] sm:text-[10px]" />
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

          {/* Middle Panel - Transcript */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden bg-[#121212] relative"
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
                  {/* Transcript Header */}
                  <div className="px-6 py-4 border-b border-[#2d2d2d] bg-[#1a1a1a]/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#6c5ce7]/10 flex items-center justify-center">
                          <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7]" />
                        </div>
                        <div>
                          <h2 className="text-sm font-medium text-white">Video Transcript</h2>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {transcripts[selectedVideo]?.length || 0} segments • {formatDuration(videoDetails[selectedVideo]?.duration)} total duration
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-[#6c5ce7]/10 text-[#6c5ce7] text-xs font-medium">
                          Auto-Generated
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transcript Content with custom scrollbar */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-purple-scrollbar">
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
                              <div className="pt-6 pb-3">
                                <h2 className="text-[#6c5ce7] text-sm font-semibold flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7]"></div>
                                  {generateSectionHeading(startTime)}
                                  <div className="h-px bg-[#6c5ce7]/20 flex-1 ml-2"></div>
                                </h2>
                              </div>
                            )}
                            <div className="p-3 bg-[#1a1a1a]/60 rounded-lg hover:bg-[#252525] 
                                         transition-colors group flex gap-3">
                              <div className="flex flex-col items-start gap-1 w-32">
                                <span className="text-xs font-medium text-[#6c5ce7] whitespace-nowrap">
                                  {formatTimeRangePrecise(startTime, endTime)}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  Duration: {duration.toFixed(3)}s
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 flex-1">{segment.text}</p>
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
                  className="flex flex-col items-center justify-center h-full w-full p-6"
                >
                  <div className="bg-gray-800/50 backdrop-blur-xl p-6 rounded-xl max-w-lg w-full shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-[#6c5ce7] flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faFilm} className="text-white text-xl" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2 text-center">
                      Video Transcripts
                    </h2>
                    <p className="text-gray-300 text-center text-sm leading-relaxed">
                      Select a video from the sidebar to view its transcript.
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

      {/* Floating Generate Clips Button with improved animation */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        onClick={handleGenerateClips}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#6c5ce7] to-[#8b7cf7] 
                 hover:from-[#5849e0] hover:to-[#7a6af6] px-5 py-3 rounded-xl
                 text-white font-medium text-sm shadow-lg hover:shadow-xl
                 transition-all duration-300 flex items-center gap-2.5
                 hover:scale-105 active:scale-95 z-50"
      >
        <FontAwesomeIcon icon={faWandMagicSparkles} className="text-lg" />
        Generate Clips
      </motion.button>
    </div>
  );
};

export default TranscriptGridPage;