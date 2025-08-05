

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
  faSquareCheck,
  faXmark
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
    <div className="h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] text-white flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6c5ce7]/5 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/3 rounded-full filter blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#6c5ce7]/2 to-transparent opacity-20"></div>
      </div>
      
      {/* Header - Enhanced Design */}
      <div className="relative flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/90 via-[#1e1e1e]/90 to-[#1a1a1a]/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 via-transparent to-[#6c5ce7]/5 opacity-50"></div>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center flex-shrink-0 shadow-lg">
              <FontAwesomeIcon icon={faList} className="text-white text-sm sm:text-base drop-shadow-sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-white bg-clip-text text-transparent truncate">
              Video Transcripts
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-0 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6c5ce7]/20 text-[#6c5ce7] text-[10px] sm:text-xs font-medium">
                {selectedVideos.size} selected
              </span>
              <span className="text-gray-500">/</span>
              <span>{videoIds?.length || 0} total</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {initialLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-0 w-full relative">
          <div className="flex flex-col items-center justify-center text-center space-y-6 relative mx-auto">
            <div className="relative flex items-center justify-center mx-auto">
              <div className="absolute -inset-8 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center shadow-2xl shadow-[#6c5ce7]/30 mx-auto">
                <FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin" />
              </div>
            </div>
            <div className="space-y-2 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-center">
                Preparing Your Content
              </h3>
              <p className="text-gray-400 text-sm animate-pulse text-center">Loading video transcripts...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0">
          {/* Left Panel - Video List - Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full lg:w-[420px] bg-gradient-to-b from-[#1a1a1a]/95 via-[#151515]/95 to-[#1a1a1a]/95 backdrop-blur-sm flex flex-col lg:border-r lg:border-[#2d2d2d]/50 max-h-[40vh] lg:max-h-none relative"
          >
            {/* Panel Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/3 via-transparent to-purple-600/2 pointer-events-none"></div>
            {/* Search Bar - Enhanced Design */}
            <div className="relative p-3 sm:p-4 border-b border-[#2d2d2d]/50">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300"></div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gradient-to-r from-[#252525] to-[#2a2a2a] text-sm px-9 sm:px-10 py-2.5 sm:py-3 rounded-xl text-gray-300 
                             placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:bg-[#2a2a2a]
                             transition-all duration-300 border border-[#3a3a3a]/50 focus:border-[#6c5ce7]/30 shadow-lg"
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6c5ce7] transition-colors duration-200 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-xs" />
                    </button>
                  )}
                </div>
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
                  background: linear-gradient(180deg, #2d2d2d 0%, #3d3d3d 100%);
                  border-radius: 8px;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, #3d3d3d 0%, #4d4d4d 100%);
                }
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #2d2d2d #1a1a1a;
                }
                .custom-purple-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-purple-scrollbar::-webkit-scrollbar-track {
                  background: linear-gradient(180deg, #1a1a1a 0%, #151515 100%);
                  border-radius: 8px;
                }
                .custom-purple-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(180deg, #6c5ce7 0%, #8b7cf7 100%);
                  border-radius: 8px;
                  border: 1px solid rgba(108, 92, 231, 0.3);
                  box-shadow: 0 2px 8px rgba(108, 92, 231, 0.2);
                }
                .custom-purple-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, #8b7cf7 0%, #a78bfa 100%);
                  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
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
                .bg-gradient-radial {
                  background: radial-gradient(circle, var(--tw-gradient-stops));
                }
                `}
              </style>
              {filteredVideoIds?.map((videoId, index) => (
                <motion.div
                  key={videoId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`relative group p-3 sm:p-4 cursor-pointer transition-all duration-300 border-b border-[#2d2d2d]/30
                ${selectedVideo === videoId 
                  ? 'bg-gradient-to-r from-[#6c5ce7]/10 via-[#6c5ce7]/5 to-transparent border-l-2 border-l-[#6c5ce7] shadow-lg shadow-[#6c5ce7]/10' 
                  : 'hover:bg-gradient-to-r hover:from-[#252525] hover:to-[#2a2a2a] hover:shadow-md'}
                ${loading[videoId] ? 'opacity-70' : ''} active:scale-[0.98] hover:border-[#6c5ce7]/20`}
                  onClick={() => selectVideo(videoId)}
                >
                  {/* Selection Glow Effect */}
                  {selectedVideo === videoId && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 to-transparent rounded-r-lg pointer-events-none"></div>
                  )}
                  
                  {videoDetails[videoId] ? (
                    <div className="relative flex gap-3 sm:gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => toggleVideoSelection(e, videoId)}
                          className={`relative w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation
                      ${selectedVideos.has(videoId)
                              ? 'bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] text-white shadow-lg shadow-[#6c5ce7]/40 scale-110'
                              : 'bg-gradient-to-br from-gray-700/50 to-gray-600/50 text-gray-400 hover:from-gray-600/60 hover:to-gray-500/60 hover:text-gray-200 active:scale-95'}`}
                        >
                          <FontAwesomeIcon
                            icon={selectedVideos.has(videoId) ? faSquareCheck : faSquare}
                            className={`text-sm transition-all duration-200 ${selectedVideos.has(videoId) ? 'drop-shadow-sm' : ''}`}
                          />
                          {selectedVideos.has(videoId) && (
                            <div className="absolute -inset-1 bg-[#6c5ce7]/30 rounded-lg blur-sm -z-10"></div>
                          )}
                        </button>
                        
                        <a
                          href={`https://www.youtube.com/watch?v=${videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group/thumb w-28 h-[4.5rem] sm:w-32 sm:h-20 flex-shrink-0 touch-manipulation overflow-hidden rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-xl opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 blur-sm"></div>
                          <img
                            src={videoDetails[videoId].thumbnail}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                            alt=""
                            className="relative w-full h-full object-cover rounded-xl shadow-lg border border-[#3a3a3a]/50 group-hover/thumb:border-[#6c5ce7]/30 transition-all duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl"></div>
                          <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 group-active/thumb:bg-black/60
                          flex items-center justify-center transition-all duration-300 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover/thumb:bg-white/30 group-hover/thumb:scale-110 transition-all duration-300">
                              <FontAwesomeIcon icon={faPlay} className="text-white text-sm ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 backdrop-blur-sm
                           text-white px-2 py-1 rounded-full font-medium border border-white/20 shadow-lg">
                            {formatDuration(videoDetails[videoId].duration)}
                          </span>
                        </a>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-100 line-clamp-2 leading-tight group-hover:text-white transition-colors duration-200">
                          {videoDetails[videoId].title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20">
                            <FontAwesomeIcon icon={faCalendar} className="text-[10px] text-[#6c5ce7]" />
                            <span className="text-gray-300 font-medium">{formatDate(videoDetails[videoId].publishedAt)}</span>
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
                  {/* Transcript Header - Enhanced Design */}
                  <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/95 via-[#1e1e1e]/95 to-[#1a1a1a]/95 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 via-transparent to-purple-600/5 opacity-60"></div>
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center flex-shrink-0 shadow-lg">
                            <FontAwesomeIcon icon={faFilm} className="text-white text-sm sm:text-base drop-shadow-sm" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-white bg-clip-text text-transparent truncate">
                            Video Transcript
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate flex items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-pulse"></div>
                              {transcripts[selectedVideo]?.length || 0} segments
                            </span>
                            <span className="text-gray-500">•</span>
                            <span>{formatDuration(videoDetails[selectedVideo]?.duration)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7]/30 to-purple-600/30 rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
                          <div className="relative px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 border border-[#6c5ce7]/30 text-[#6c5ce7] text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-sm">
                            <span className="relative flex items-center gap-1">
                              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[8px] sm:text-[10px] animate-pulse" />
                              Auto-Generated
                            </span>
                          </div>
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
                              <div className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                                <div className="relative">
                                  <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-xl blur-sm opacity-50"></div>
                                  <h2 className="relative text-[#6c5ce7] text-sm sm:text-base font-bold flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-[#6c5ce7]/10 to-purple-600/10 rounded-xl border border-[#6c5ce7]/20 backdrop-blur-sm">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6c5ce7] to-purple-600 flex-shrink-0 animate-pulse shadow-lg shadow-[#6c5ce7]/50"></div>
                                    <span className="truncate bg-gradient-to-r from-[#6c5ce7] to-purple-400 bg-clip-text text-transparent">
                                      {generateSectionHeading(startTime)}
                                    </span>
                                    <div className="h-px bg-gradient-to-r from-[#6c5ce7]/40 to-transparent flex-1 ml-2"></div>
                                  </h2>
                                </div>
                              </div>
                            )}
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.02 }}
                              className="relative group p-3 sm:p-4 bg-gradient-to-r from-[#1a1a1a]/80 via-[#1e1e1e]/80 to-[#1a1a1a]/80 rounded-xl hover:from-[#252525]/80 hover:via-[#2a2a2a]/80 hover:to-[#252525]/80 active:from-[#2a2a2a]/80 active:via-[#2f2f2f]/80 active:to-[#2a2a2a]/80
                                         transition-all duration-300 flex flex-col sm:flex-row gap-3 sm:gap-4 touch-manipulation border border-[#2d2d2d]/50 hover:border-[#6c5ce7]/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-[#6c5ce7]/10"
                            >
                              {/* Hover Glow Effect */}
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6c5ce7]/10 to-purple-600/10 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 -z-10"></div>
                              
                              <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-2 w-full sm:w-36 flex-shrink-0">
                                <div className="relative">
                                  <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7]/30 to-purple-600/30 rounded-lg opacity-60 blur-sm"></div>
                                  <span className="relative text-xs sm:text-sm font-bold text-[#6c5ce7] whitespace-nowrap px-2 py-1 bg-[#6c5ce7]/10 rounded-lg border border-[#6c5ce7]/20 backdrop-blur-sm">
                                    {formatTimeRangePrecise(startTime, endTime)}
                                  </span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-400 px-1.5 py-0.5 bg-gray-700/30 rounded-full border border-gray-600/30 font-medium">
                                  {duration.toFixed(2)}s
                                </span>
                              </div>
                              
                              <div className="flex-1 relative">
                                <p className="text-sm sm:text-base text-gray-200 leading-relaxed group-hover:text-gray-100 transition-colors duration-200">
                                  {segment.text}
                                </p>
                                {/* Text gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6c5ce7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded pointer-events-none"></div>
                              </div>
                            </motion.div>
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center h-full w-full p-4 sm:p-6"
                >
                  <div className="relative max-w-sm sm:max-w-lg w-full">
                    {/* Background Glow */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-3xl blur-2xl opacity-50"></div>
                    
                    <div className="relative bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-gray-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl border border-[#2d2d2d]/50">
                      {/* Icon Container */}
                      <div className="relative mx-auto mb-4 sm:mb-6">
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-2xl opacity-75 blur-lg"></div>
                        <motion.div
                          animate={{ rotate: [0, 5, 0, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center shadow-2xl shadow-[#6c5ce7]/40"
                        >
                          <FontAwesomeIcon icon={faFilm} className="text-white text-xl sm:text-2xl drop-shadow-lg" />
                        </motion.div>
                      </div>
                      
                      {/* Content */}
                      <div className="text-center space-y-3">
                        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                          Ready to Explore Transcripts
                        </h2>
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                          Select a video from the <span className="lg:hidden text-[#6c5ce7] font-medium">list above</span><span className="hidden lg:inline text-[#6c5ce7] font-medium">sidebar</span> to view its automatically generated transcript and start creating clips.
                        </p>
                        
                        {/* Decorative Elements */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <div className="w-2 h-2 rounded-full bg-[#6c5ce7] animate-pulse"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          <div className="w-2 h-2 rounded-full bg-[#6c5ce7] animate-pulse" style={{animationDelay: '1s'}}></div>
                        </div>
                      </div>
                    </div>
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

      {/* Floating Generate Clips Button - Enhanced Design */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
      >
        {/* Floating Glow Effect */}
        <div className="absolute -inset-3 bg-gradient-to-r from-[#6c5ce7]/30 to-purple-600/30 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
        
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateClips}
          className="relative group bg-gradient-to-r from-[#6c5ce7] via-[#7c66ff] to-[#8b7cf7] 
                   hover:from-[#5849e0] hover:via-[#6c5ce7] hover:to-[#7a6af6] 
                   px-4 sm:px-6 py-3 sm:py-4 rounded-2xl
                   text-white font-bold text-sm sm:text-base shadow-2xl shadow-[#6c5ce7]/40
                   transition-all duration-500 flex items-center gap-2 sm:gap-3
                   touch-manipulation min-h-[52px] min-w-[130px] sm:min-w-[160px] justify-center
                   border border-[#6c5ce7]/30 backdrop-blur-sm overflow-hidden"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Icon with Animation */}
          <motion.div
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="relative z-10"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-base sm:text-lg drop-shadow-lg" />
          </motion.div>
          
          {/* Text */}
          <span className="relative z-10 font-bold tracking-wide drop-shadow-sm">
            <span className="hidden xs:inline sm:inline">Generate Clips</span>
            <span className="xs:hidden sm:hidden">Clips</span>
          </span>
          
          {/* Pulse Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-2xl opacity-30 group-hover:opacity-50 blur-sm transition-opacity duration-300 -z-10"></div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TranscriptGridPage;