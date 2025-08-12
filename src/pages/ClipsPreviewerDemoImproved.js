import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfo,
  faBackwardStep,
  faForwardStep,
  faCheck,
  faFilm,
  faSave,
  faExclamationTriangle,
  faSearch,
  faSpinner,
  faExclamationCircle,
  faList,
  faScissors,
  faInfoCircle,
  faSort,
  faClock,
  faRuler,
  faTimes,
  faCheckSquare,
  faSquare,
  faArrowRight,
  faBrain,
  faFileAlt,
  faLaptopCode,
  faVideo,
  faMagic,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ClipsPreviewer from '../components/ClipsPreviewer';
import TrimmingTool from '../components/TrimmingTool';
import VideoDetails from '../components/VideoDetails';
import videoPlayer from '../components/videoPlayer';
import { useClipsData } from '../context/clipsData';
import { usePrompt } from '../context/promptContext';
import { useVideoIds } from '../context/videoIds';
import { YOUTUBE_API } from '../config';
import axios from 'axios';

const ClipsPreviewerDemo = () => {
  const { selectedClipsData, setSelectedClipsData, transcriptData } = useClipsData();
  const { prompt } = usePrompt();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedClips, setProcessedClips] = useState([]);
  const [sortOrder, setSortOrder] = useState('time'); // 'time' or 'length'
  const [searchQuery, setSearchQuery] = useState('');
  const API_BASE_URL = 'https://ai-clip-backend1-1.onrender.com/api/v1';
  const initialSelectionRef = useRef(false);


  // Add new state for advanced loading animation
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingInterval = useRef(null);
  const stageMessages = [
    { title: "Analyzing transcript", subtitle: "Identifying key moments in your content" },
    { title: "Extracting meaningful segments", subtitle: "Finding the most engaging parts of your video" },
    { title: "Creating clip sequences", subtitle: "Crafting the perfect segments from your content" },
    { title: "Finalizing clips", subtitle: "Perfecting timestamps and transitions" },
    { title: "Almost ready", subtitle: "Your clips are being prepared for editing" }
  ];

  

  // Simulate loading progress for better UX
  useEffect(() => {
    if (loading && processedClips.length === 0) {
      // Clear any existing interval
      if (loadingInterval.current) clearInterval(loadingInterval.current);

      setLoadingProgress(0);
      setLoadingStage(0);

      // Create smooth progress simulation
      loadingInterval.current = setInterval(() => {
        setLoadingProgress(prev => {
          // Calculate new progress
          let increment;
          if (prev < 20) increment = 0.8; // Start fast
          else if (prev < 50) increment = 0.5; // Slow down a bit
          else if (prev < 70) increment = 0.3; // Slow more
          else if (prev < 85) increment = 0.2; // Very slow
          else increment = 0.1; // Extremely slow at the end

          const newProgress = prev + increment;

          // Update stage based on progress
          if (newProgress >= 20 && prev < 20) setLoadingStage(1);
          else if (newProgress >= 40 && prev < 40) setLoadingStage(2);
          else if (newProgress >= 65 && prev < 65) setLoadingStage(3);
          else if (newProgress >= 85 && prev < 85) setLoadingStage(4);

          return newProgress > 95 ? 95 : newProgress; // Cap at 95%
        });
      }, 150);

      return () => {
        if (loadingInterval.current) {
          clearInterval(loadingInterval.current);
        }
      };
    } else if (!loading && loadingProgress < 100) {
      // Complete the progress to 100% when loading is done
      clearInterval(loadingInterval.current);
      setLoadingProgress(100);

      // Add small delay before showing content
      setTimeout(() => {
        setLoadingProgress(0);
      }, 500);
    }
  }, [loading, processedClips.length]);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        // Try to restore from localStorage if no selectedClipsData
        if (!selectedClipsData || selectedClipsData.length === 0) {
          const savedTranscriptData = localStorage.getItem('transcriptData');
          const savedSelectedClipsData = localStorage.getItem('selectedClipsData');
          
          if (savedTranscriptData) {
            try {
              const parsedTranscriptData = JSON.parse(savedTranscriptData);
              if (parsedTranscriptData && parsedTranscriptData.length > 0) {
                console.log('Restoring transcript data from localStorage');
                // Set the transcript data back to context if available
                if (setSelectedClipsData) {
                  setSelectedClipsData(parsedTranscriptData);
                }
                return; // Let the effect run again with restored data
              }
            } catch (err) {
              console.error('Error parsing saved transcript data:', err);
            }
          }
          
          if (savedSelectedClipsData) {
            try {
              const parsedSelectedClipsData = JSON.parse(savedSelectedClipsData);
              if (parsedSelectedClipsData && parsedSelectedClipsData.length > 0) {
                console.log('Restoring selected clips data from localStorage');
                if (setSelectedClipsData) {
                  setSelectedClipsData(parsedSelectedClipsData);
                }
                return; // Let the effect run again with restored data
              }
            } catch (err) {
              console.error('Error parsing saved selected clips data:', err);
            }
          }
          
          throw new Error('No transcript data available. Please go back and select a video.');
        }

        // Save current data to localStorage for persistence
        localStorage.setItem('selectedClipsData', JSON.stringify(selectedClipsData));

        setLoading(true);
        setError(null);
        showFeedback('Generating clips...', 'info');

        // Process clips for each video separately
        const allProcessedClips = await Promise.all(
          selectedClipsData.map(async (videoData, videoIndex) => {
            const videoDuration = videoData.duration || 600;
            const response = await fetch(`${YOUTUBE_API}/generateClips`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcripts: [videoData], // Send one video's data at a time
                customPrompt: prompt || "Generate 3 clips...",
                videoDuration: videoDuration,
              }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to generate clips');

            const cleanScript = data.data.script
              .replace(/```json/g, '')
              .replace(/```/g, '')
              .replace(/\((\d+\.?\d*)\).toFixed\(2\)/g, '$1')
              .replace(/\((\d+\.?\d*)\s*[-+]\s*\d+\.?\d*\).toFixed\(2\)/g, (match) =>
                eval(match.replace('.toFixed(2)', '')).toFixed(2)
              )
              .trim();

            const clipsArray = JSON.parse(cleanScript);
            if (!Array.isArray(clipsArray) || clipsArray.length === 0) {
              throw new Error('No valid clips generated for video');
            }

            return clipsArray.map((clip, index) => ({
              id: `clip_${videoIndex}_${index + 1}`,
              videoId: videoData.videoId,
              isYouTube: videoData.videoId.length === 11,
              videoUrl: videoData.videoId.length !== 11 ? `${API_BASE_URL}/video/${videoData.videoId}` : '',
              title: `Clip ${index + 1}: ${clip.transcriptText?.substring(0, 50) || 'No transcript'}...`,
              originalVideoDuration: videoDuration,
              duration: parseFloat(((clip.endTime || 0) - (clip.startTime || 0)).toFixed(2)),
              startTime: parseFloat(parseFloat(clip.startTime || 0).toFixed(2)),
              endTime: parseFloat(parseFloat(clip.endTime || 0).toFixed(2)),
              transcriptText: (clip.transcriptText || '').replace(/'/g, "'"),
              thumbnail: `https://img.youtube.com/vi/${videoData.videoId}/maxresdefault.jpg`,
            }));
          })
        );

        setProcessedClips(allProcessedClips.flat());
        showFeedback('Clips generated successfully!', 'success');
      } catch (err) {
        console.error('Error details:', err);
        setError(err.message);
        showFeedback(`Error: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (processedClips.length === 0 && selectedClipsData) {
      fetchClips();
    }
  }, [selectedClipsData, processedClips]);

  const [selectedClips, setSelectedClips] = useState([]);
  const [currentClip, setCurrentClip] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Initialize all processed clips as selected by default and select first clip
  useEffect(() => {
    if (processedClips.length > 0 && selectedClips.length === 0 && !initialSelectionRef.current) {
      console.log('Initializing all clips as selected in ClipsPreviewerDemo');
      setSelectedClips([...processedClips]);
      initialSelectionRef.current = true;

      // Automatically select the first clip to display in the trimming tool
      if (processedClips[0] && !currentClip) {
        console.log('Automatically selecting first clip for display:', processedClips[0].id);
        setCurrentClip(processedClips[0]);
      }
    }
  }, [processedClips, selectedClips.length, currentClip]);

  const showFeedback = (message, type = 'success') => {
    // Valid types: 'success', 'error', 'info', 'warning'
    setFeedback({ message, type });

    // Keep warnings visible a bit longer
    const timeout = type === 'warning' || type === 'error' ? 5000 : 3000;
    setTimeout(() => setFeedback(null), timeout);
  };

  const handlePlayClip = (clip) => {
    console.log('Clip selected:', {
      id: clip.id,
      videoId: clip.videoId,
      isYouTube: clip.isYouTube,
      videoUrl: clip.videoUrl,
      thumbnail: clip.thumbnail,
    });
    setCurrentClip(clip);
  };

  const handleDeleteClip = (clipToDelete) => {
    setProcessedClips(clips => clips.filter(clip => clip.id !== clipToDelete.id));
    setSelectedClips(selected => selected.filter(clip => clip.id !== clipToDelete.id));
    if (currentClip && currentClip.id === clipToDelete.id) {
      setCurrentClip(null);
      showFeedback('Clip deleted successfully!', 'info');
    }
  };

  const handleSelectClip = (clip) => {
    console.log('Selecting clip in parent component:', clip.id);
    setSelectedClips(prev => [...prev, clip]);
  };

  const handleUnselectClip = (clipToRemove) => {
    console.log('Unselecting clip in parent component:', clipToRemove.id);
    setSelectedClips(prev => prev.filter(clip => clip.id !== clipToRemove.id));
  };

  const handleTimingChange = ({ startTime, endTime, duration }) => {
    if (currentClip) {
      setProcessedClips(clips => clips.map(clip =>
        clip.id === currentClip.id
          ? { ...clip, startTime, endTime, duration }
          : clip
      ));
    }
  };

  const handleSaveTrim = ({ startTime, endTime, duration }) => {
    if (currentClip) {
      setProcessedClips(clips => clips.map(clip =>
        clip.id === currentClip.id
          ? { ...clip, startTime, endTime, duration }
          : clip
      ));
      showFeedback('Trim saved successfully!');
    }
  };

  const handleNextClip = () => {
    if (!currentClip || processedClips.length === 0) return;
    const currentIndex = processedClips.findIndex(clip => clip.id === currentClip.id);
    const nextIndex = (currentIndex + 1) % processedClips.length;
    setCurrentClip(processedClips[nextIndex]);
  };

  const handlePreviousClip = () => {
    if (!currentClip || processedClips.length === 0) return;
    const currentIndex = processedClips.findIndex(clip => clip.id === currentClip.id);
    const previousIndex = (currentIndex - 1 + processedClips.length) % processedClips.length;
    setCurrentClip(processedClips[previousIndex]);
  };

  const handleClearSelection = () => {
    setSelectedClips([]);
    showFeedback('Selection cleared', 'info');
  };

  const handleUnselectAll = () => {
    setSelectedClips([]);
    showFeedback('All clips unselected', 'info');
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'time' ? 'length' : 'time');
  };

  const validateVideoId = (id) => {
    const validIdPattern = /^[0-9A-Za-z_-]{11}$/;
    return validIdPattern.test(id);
  };

  const handleFinishAndSave = () => {
    if (selectedClips.length === 0) {
      showFeedback('No clips selected. Please select clips to save.', 'error');
      return;
    }

    // Only process SELECTED clips, not all processed clips
    const clipsByVideo = selectedClips.reduce((acc, clip) => {
      if (!acc[clip.videoId]) acc[clip.videoId] = [];
      acc[clip.videoId].push(clip);
      return acc;
    }, {});

    const updatedClipsData = Object.entries(clipsByVideo).map(([videoId, clips]) => {
      const originalVideoData = selectedClipsData.find(data => data.videoId === videoId) || {};
      return {
        ...originalVideoData,
        videoId,
        segments: clips.map(clip => ({
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          text: clip.transcriptText
        })),
      };
    });

    console.log('Updated clips data (selected only):', JSON.stringify(updatedClipsData, null, 2)); // Debugging log
    console.log('Selected clips count:', selectedClips.length, 'Total clips count:', processedClips.length);
    
    setSelectedClipsData(updatedClipsData);
    showFeedback(`${selectedClips.length} clips saved successfully! Redirecting to merge page...`, 'success');
    
    // Clear localStorage when navigating to merge page, including any previous output
    localStorage.removeItem('selectedClipsData');
    localStorage.removeItem('transcriptData');
    localStorage.removeItem('processedVideoUrl');
    
    setTimeout(() => navigate('/merge'), 1500);
  };

  // Add cleanup effect for navigation (but not reload)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Don't clear on page reload, only on navigation away
      if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
        return;
      }
      // Clear localStorage when navigating away
      localStorage.removeItem('selectedClipsData');
      localStorage.removeItem('transcriptData');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Format time function
  const formatTimeRange = (startTime, endTime) => {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const filteredClips = processedClips.filter(clip =>
    clip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedClips = [...filteredClips].sort((a, b) => {
    if (sortOrder === 'time') {
      return a.startTime - b.startTime;
    } else {
      return a.duration - b.duration;
    }
  });

  const isClipSelected = (clip) => {
    return selectedClips.some(selectedClip => selectedClip.id === clip.id);
  };

  // Custom clip item renderer - Enhanced Design
  const renderClipItem = (clip) => {
    const isSelected = isClipSelected(clip);
    const isActive = currentClip && currentClip.id === clip.id;

    return (
      <motion.div
        key={clip.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`relative group p-3 sm:p-4 cursor-pointer transition-all duration-300 border-b border-[#2d2d2d]/30
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#6c5ce7]/10 via-[#6c5ce7]/5 to-transparent border-l-2 border-l-[#6c5ce7] shadow-lg shadow-[#6c5ce7]/10' 
                    : isSelected 
                      ? 'bg-gradient-to-r from-[#252525]/50 to-[#2a2a2a]/50' 
                      : 'hover:bg-gradient-to-r hover:from-[#252525] hover:to-[#2a2a2a] hover:shadow-md'
                  } active:scale-[0.98] hover:border-[#6c5ce7]/20`}
        onClick={() => handlePlayClip(clip)}
      >
        {/* Selection Glow Effect */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 to-transparent rounded-r-lg pointer-events-none"></div>
        )}
        
        <div className="relative flex gap-3 sm:gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              isSelected ? handleUnselectClip(clip) : handleSelectClip(clip);
            }}
            className={`relative w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation
                      ${isSelected
                        ? 'bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] text-white shadow-lg shadow-[#6c5ce7]/40 scale-110'
                        : 'bg-gradient-to-br from-gray-700/50 to-gray-600/50 text-gray-400 hover:from-gray-600/60 hover:to-gray-500/60 hover:text-gray-200 active:scale-95'}`}
          >
            <FontAwesomeIcon icon={isSelected ? faCheckSquare : faSquare} className={`text-sm transition-all duration-200 ${isSelected ? 'drop-shadow-sm' : ''}`} />
            {isSelected && (
              <div className="absolute -inset-1 bg-[#6c5ce7]/30 rounded-lg blur-sm -z-10"></div>
            )}
          </button>

          <div className={`relative flex-shrink-0 w-28 h-[4.5rem] sm:w-32 sm:h-20 bg-black/50 rounded-xl overflow-hidden shadow-lg ${isActive ? 'ring-2 ring-[#6c5ce7]' : isSelected ? 'ring-1 ring-[#6c5ce7]/50' : ''} group-hover:ring-1 group-hover:ring-[#6c5ce7]/30 transition-all duration-300`}>
            <img
              src={clip.thumbnail}
              alt={clip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.onerror = null;
                if (e.target.src.includes('maxresdefault.jpg')) {
                  e.target.src = `https://img.youtube.com/vi/${clip.videoId}/hqdefault.jpg`;
                }
                else if (e.target.src.includes('hqdefault.jpg')) {
                  e.target.src = `https://ai-clip-backend1-1.onrender.com/api/v1/thumbnails/${clip.videoId}.jpg`;
                }
                else {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAxMjggNzIiPjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iNzIiIGZpbGw9IiMyMjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5ObyBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl"></div>
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-white/20 shadow-lg">
              {Math.round(clip.duration)}s
            </div>
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all duration-300 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faScissors} className="text-white text-xs" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h3 className={`text-sm sm:text-base font-semibold ${isActive ? 'text-white' : isSelected ? 'text-gray-200' : 'text-gray-300'} truncate group-hover:text-white transition-colors duration-200`}>
              {clip.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20">
                <FontAwesomeIcon icon={faClock} className="text-[10px] text-[#6c5ce7]" />
                <span className="text-gray-300 font-medium">{formatTimeRange(clip.startTime, clip.endTime)}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] text-white flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6c5ce7]/5 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/3 rounded-full filter blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#6c5ce7]/2 to-transparent opacity-20"></div>
      </div>
      
      {/* Enhanced Header Bar - Mobile Optimized */}
      <div className="relative flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/95 via-[#1e1e1e]/95 to-[#1a1a1a]/95 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 via-transparent to-[#6c5ce7]/5 opacity-50"></div>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center flex-shrink-0 shadow-lg">
              <FontAwesomeIcon icon={faScissors} className="text-white text-sm sm:text-base drop-shadow-sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-white bg-clip-text text-transparent truncate">
              Clip Editor
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6c5ce7]/20 text-[#6c5ce7] text-[10px] sm:text-xs font-medium">
                {selectedClips.length} selected
              </span>
              <span className="text-gray-500">/</span>
              <span>{processedClips.length || 0} total</span>
            </p>
          </div>
        </div>

        {/* Mobile Help Button */}
        <div className="relative z-10">
          <button className="md:hidden w-8 h-8 rounded-lg bg-[#6c5ce7]/20 border border-[#6c5ce7]/30 flex items-center justify-center text-[#6c5ce7] hover:bg-[#6c5ce7]/30 transition-all duration-200">
            <FontAwesomeIcon icon={faInfoCircle} className="text-sm" />
          </button>
          
          {/* Desktop Help text */}
          <div className="hidden md:flex text-gray-400 text-sm items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-[#6c5ce7]" />
            <span>Select and edit clips, then save to continue</span>
          </div>
        </div>
      </div>

      {/* Clear feedback notifications */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-12 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${feedback.type === 'success' ? 'bg-green-500' :
              feedback.type === 'error' ? 'bg-red-500' :
                feedback.type === 'warning' ? 'bg-amber-500' :
                  'bg-blue-500'
              } text-white text-sm flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={
                feedback.type === 'success' ? faCheck :
                  feedback.type === 'warning' ? faExclamationTriangle :
                    faInfo
              }
              className="text-base"
            />
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Loading State - Mobile Optimized */}
      {loading && processedClips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center relative p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-sm sm:max-w-2xl lg:max-w-3xl w-full"
          >
            {/* Main card */}
            <div className="bg-gradient-to-br from-[#1a1a1a]/95 via-[#1e1e1e]/95 to-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-[#2d2d2d]/50">
              {/* Top section with pulse animation */}
              <div className="mb-6 sm:mb-8 relative">
                <div className="absolute -top-16 sm:-top-20 -left-16 sm:-left-20 w-32 sm:w-40 h-32 sm:h-40 bg-[#6c5ce7]/30 rounded-full filter blur-3xl animate-pulse-slow"></div>
                <div className="absolute -top-12 sm:-top-16 -right-12 sm:-right-16 w-24 sm:w-32 h-24 sm:h-32 bg-[#a281ff]/20 rounded-full filter blur-3xl animate-pulse-slower"></div>

                <div className="relative flex justify-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#1f1f1f] rounded-full flex items-center justify-center mb-4 sm:mb-5">
                    <div className="absolute inset-0 rounded-full border-4 border-[#6c5ce7]/30 border-t-[#6c5ce7] animate-spin"></div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#232323] rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={
                          loadingStage === 0 ? faBrain :
                            loadingStage === 1 ? faFileAlt :
                              loadingStage === 2 ? faVideo :
                                loadingStage === 3 ? faScissors :
                                  faMagic
                        }
                        className="text-[#6c5ce7] text-lg sm:text-xl"
                      />
                    </div>
                  </div>
                </div>

                <motion.h2
                  key={`loading-title-${loadingStage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-white bg-clip-text text-transparent text-center mb-2"
                >
                  {stageMessages[loadingStage].title}
                </motion.h2>

                <motion.p
                  key={`loading-subtitle-${loadingStage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-gray-400 text-xs sm:text-sm text-center max-w-sm sm:max-w-md mx-auto leading-relaxed"
                >
                  {stageMessages[loadingStage].subtitle}
                </motion.p>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden mb-6 sm:mb-8">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a281ff]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Steps */}
              <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-6 sm:mb-8">
                {stageMessages.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="absolute top-2 sm:top-3 left-0 right-0 -z-10">
                      <div className={`h-0.5 ${index === 0 ? 'w-1/2 ml-auto' : index === stageMessages.length - 1 ? 'w-1/2' : 'w-full'} ${index <= loadingStage ? 'bg-[#6c5ce7]' : 'bg-[#2d2d2d]'} transition-colors duration-300`}></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full mb-1 sm:mb-2 flex items-center justify-center ${index <= loadingStage ? 'bg-[#6c5ce7]' : 'bg-[#2d2d2d]'} transition-colors duration-300`}>
                        {index < loadingStage ? (
                          <FontAwesomeIcon icon={faCheck} className="text-white text-[10px] sm:text-xs" />
                        ) : (
                          <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${index === loadingStage ? 'bg-white' : 'bg-transparent'}`}></div>
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-xs ${index <= loadingStage ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rotating insights */}
              <div className="bg-gradient-to-r from-[#232323]/80 to-[#2a2a2a]/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[#3a3a3a]/30">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="bg-gradient-to-br from-[#6c5ce7]/20 to-purple-600/20 rounded-lg p-1.5 sm:p-2 text-[#6c5ce7] flex-shrink-0">
                    <FontAwesomeIcon icon={faLightbulb} className="text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">ClipSmart AI Insight</h4>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`tip-${loadingStage}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-gray-400 text-[10px] sm:text-xs leading-relaxed"
                      >
                        {loadingStage === 0 && "Our AI is scanning through all your video content to identify the most engaging moments based on speech patterns, content, and context."}
                        {loadingStage === 1 && "We're extracting meaningful segments from your video and arranging them to form the most compelling narrative structure."}
                        {loadingStage === 2 && "Creating a seamless viewing experience by selecting clips that flow naturally together while maintaining context."}
                        {loadingStage === 3 && "Fine-tuning the precise start and end points of each clip for perfect timing and smooth transitions."}
                        {loadingStage === 4 && "Your clips are almost ready! We're optimizing the final selections to ensure they deliver maximum impact."}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Random interesting facts/encouragement - changes every few seconds */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`fact-${Math.floor(loadingProgress / 20)}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center text-gray-500 text-[10px] sm:text-xs px-2"
                >
                  {[
                    "Did you know? The human brain can process video 60,000 times faster than text.",
                    "Short video clips capture 30% more audience attention than longer ones.",
                    "Our AI analyzes hundreds of data points to find the perfect clip moments.",
                    "The best video clips tell a complete story in just seconds.",
                    "We're building clips that will increase your engagement by up to 35%."
                  ][Math.floor(loadingProgress / 20)] || "Your clips are being crafted with precision..."}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row h-full lg:h-[calc(100vh-49px)] overflow-y-auto lg:overflow-hidden">
          {/* Left Panel - Clip Selection - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full lg:w-[420px] bg-gradient-to-b from-[#1a1a1a]/95 via-[#151515]/95 to-[#1a1a1a]/95 backdrop-blur-sm flex flex-col lg:border-r border-[#2d2d2d]/50 max-h-[45vh] lg:max-h-full relative"
          >
            {/* Panel Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/3 via-transparent to-purple-600/2 pointer-events-none"></div>
            {/* Clips List Header
            <div className="flex items-center px-4 py-2 border-b border-[#2d2d2d] bg-gray-900">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-lg mr-2 flex items-center justify-center">
                  <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7]" />
                </div>
                <h3 className="text-sm font-medium text-white">Clips</h3>
                <span className="ml-2 text-xs bg-[#252525] px-2 py-0.5 rounded text-gray-400">
                  {processedClips.length || 0}
                </span>
              </div>
            </div> */}

            {/* Search Bar - Enhanced Design */}
            <div className="relative p-3 sm:p-4 border-b border-[#2d2d2d]/50">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300"></div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search clips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gradient-to-r from-[#252525] to-[#2a2a2a] text-sm px-9 sm:px-10 py-2.5 sm:py-3 rounded-xl text-gray-300 
                             placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:bg-[#2a2a2a]
                             transition-all duration-300 border border-[#3a3a3a]/50 focus:border-[#6c5ce7]/30 shadow-lg"
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6c5ce7] transition-colors duration-200 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sort and Filter Controls - Enhanced Design */}
            <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 border-b border-[#2d2d2d]/50">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  className={`flex items-center text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-full transition-all duration-200 ${
                    sortOrder === 'time' 
                      ? 'bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 text-[#6c5ce7] border border-[#6c5ce7]/30 shadow-sm' 
                      : 'bg-gradient-to-r from-[#252525] to-[#2a2a2a] text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a]'
                  }`}
                  onClick={toggleSort}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-1 sm:mr-1.5 text-[10px] sm:text-xs" />
                  <span>Time</span>
                </button>

                <button
                  className={`flex items-center text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-full transition-all duration-200 ${
                    sortOrder === 'length' 
                      ? 'bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 text-[#6c5ce7] border border-[#6c5ce7]/30 shadow-sm' 
                      : 'bg-gradient-to-r from-[#252525] to-[#2a2a2a] text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a]'
                  }`}
                  onClick={toggleSort}
                >
                  <FontAwesomeIcon icon={faRuler} className="mr-1 sm:mr-1.5 text-[10px] sm:text-xs" />
                  <span>Length</span>
                </button>
              </div>

              <button
                className="text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-[#252525]/50"
                onClick={handleUnselectAll}
              >
                Unselect All
              </button>
            </div>

            {/* Clips List */}
            <div className="flex-1 overflow-y-auto custom-purple-scrollbar relative">
              {error ? (
                <div className="flex items-center justify-center h-full text-red-400 text-sm p-4">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-2xl mb-2 text-red-400" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : sortedClips.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm p-4">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faFilm} className="text-2xl mb-2 text-gray-400" />
                    <p className="text-sm">No clips found</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#2d2d2d]/30">
                  {sortedClips.map(renderClipItem)}
                </div>
              )}
            </div>

            {/* Selection Counter and Clear Button - Enhanced Design */}
            <div className="relative p-3 sm:p-4 border-t border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/80 to-[#1e1e1e]/80 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6c5ce7] animate-pulse"></div>
                  <span className="text-sm text-gray-300 font-medium">
                    {selectedClips.length} selected
                  </span>
                </div>

                {selectedClips.length > 0 && (
                  <button
                    className="flex items-center text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#252525] to-[#2a2a2a] text-gray-300 hover:from-[#2a2a2a] hover:to-[#303030] transition-all duration-200 border border-[#3a3a3a]/50 hover:border-[#6c5ce7]/30 shadow-sm"
                    onClick={handleClearSelection}
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-1.5 text-[10px]" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Middle Panel - Trimming Tool - Enhanced Design */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-1 flex flex-col bg-[#121212] relative"
          >
            <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/95 via-[#1e1e1e]/95 to-[#1a1a1a]/95 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 via-transparent to-purple-600/5 opacity-50"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center flex-shrink-0 shadow-lg">
                      <FontAwesomeIcon icon={faScissors} className="text-white text-sm sm:text-base drop-shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-white bg-clip-text text-transparent">
                      Edit Clip {currentClip ? currentClip.id.replace('clip_', '#') : ''}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Trim and adjust your clip timing</p>
                  </div>
                </div>
                {currentClip && processedClips.length > 1 && (
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      className="px-2 sm:px-3 py-1.5 sm:py-1 bg-gradient-to-r from-[#252525] to-[#2a2a2a] hover:from-[#2a2a2a] hover:to-[#303030] text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none border border-[#3a3a3a]/50 hover:border-[#6c5ce7]/30 shadow-sm"
                      onClick={handlePreviousClip}
                    >
                      <FontAwesomeIcon icon={faBackwardStep} className="text-xs" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <button
                      className="px-2 sm:px-3 py-1.5 sm:py-1 bg-gradient-to-r from-[#252525] to-[#2a2a2a] hover:from-[#2a2a2a] hover:to-[#303030] text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none border border-[#3a3a3a]/50 hover:border-[#6c5ce7]/30 shadow-sm"
                      onClick={handleNextClip}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <FontAwesomeIcon icon={faForwardStep} className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
              <AnimatePresence mode="wait">
                {currentClip ? (
                  <TrimmingTool
                    videoId={currentClip.isYouTube ? currentClip.videoId : ''}
                    videoUrl={currentClip.isYouTube ? '' : currentClip.videoUrl}
                    isYouTube={currentClip.isYouTube || false}
                    initialDuration={currentClip.originalVideoDuration}
                    initialStartTime={currentClip.startTime}
                    initialEndTime={currentClip.endTime}
                    transcriptText={currentClip.transcriptText}
                    onTimingChange={handleTimingChange}
                    onSaveTrim={handleSaveTrim}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-4">
                    <div className="text-center">
                      <div className="relative mx-auto mb-4">
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#6c5ce7]/20 to-purple-600/20 rounded-2xl opacity-75 blur-lg"></div>
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center shadow-2xl shadow-[#6c5ce7]/40">
                          <FontAwesomeIcon icon={faScissors} className="text-white text-xl drop-shadow-lg" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                        Ready to Edit
                      </h3>
                      <p className="text-sm text-gray-400">Select a clip from the list to start trimming</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Panel - Video Details - Enhanced Design */}
          {currentClip && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="w-full lg:w-[300px] bg-gradient-to-b from-[#1a1a1a]/95 via-[#151515]/95 to-[#1a1a1a]/95 backdrop-blur-sm lg:border-l border-t lg:border-t-0 border-[#2d2d2d]/50 flex flex-col relative"
            >
              {/* Panel Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/3 via-transparent to-purple-600/2 pointer-events-none"></div>
              
              <div className="relative p-4 sm:p-6 border-b border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/80 to-[#1e1e1e]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center flex-shrink-0 shadow-lg">
                      <FontAwesomeIcon icon={faFilm} className="text-white text-sm sm:text-base drop-shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-white bg-clip-text text-transparent">Video Details</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Clip information and metadata</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-purple-scrollbar p-4 sm:p-6 relative">
                <VideoDetails
                  currentClip={currentClip}
                  showTranscript={true}
                />
              </div>

              {/* Save & Continue Button in Right Panel - Enhanced Design */}
              <div className="relative p-4 sm:p-6 border-t border-[#2d2d2d]/50 bg-gradient-to-r from-[#1a1a1a]/80 to-[#1e1e1e]/80 backdrop-blur-sm">
                <button
                  className="relative group w-full py-3 sm:py-4 bg-gradient-to-r from-[#6c5ce7] via-[#7c66ff] to-[#8b7cf7] hover:from-[#5849e0] hover:via-[#6c5ce7] hover:to-[#7a6af6] text-white rounded-xl text-sm sm:text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-[#6c5ce7]/25 border border-[#6c5ce7]/30 backdrop-blur-sm overflow-hidden"
                  onClick={handleFinishAndSave}
                  disabled={selectedClips.length === 0}
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
                    <FontAwesomeIcon icon={faSave} className="text-sm sm:text-base drop-shadow-lg" />
                  </motion.div>
                  
                  {/* Text */}
                  <span className="relative z-10 font-bold tracking-wide drop-shadow-sm">
                    <span className="hidden sm:inline">
                      Save {selectedClips.length} Clip{selectedClips.length !== 1 ? 's' : ''} & Continue
                    </span>
                    <span className="sm:hidden">
                      Save ({selectedClips.length})
                    </span>
                  </span>
                  
                  {/* Arrow Icon */}
                  <FontAwesomeIcon icon={faArrowRight} className="relative z-10 ml-1 text-sm sm:text-base drop-shadow-sm" />
                  
                  {/* Pulse Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-purple-600 rounded-xl opacity-30 group-hover:opacity-50 blur-sm transition-opacity duration-300 -z-10"></div>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style>
        {`
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
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        `}
      </style>
    </div>
  );
};

export default ClipsPreviewerDemo;