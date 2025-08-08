import React, { useState, useEffect } from 'react';
import { useClipsData } from '../context/clipsData';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faArrowLeft,
  faSpinner,
  faShare,
  faCheckCircle,
  faExclamationCircle,
  faCopy,
  faVideo,
  faFilm,
  faClock,
  faCalendar,
  faList,
  faWandMagicSparkles,
  faPlay,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import {
  faTwitter,
  faFacebook,
  faLinkedin,
  faWhatsapp
} from '@fortawesome/free-brands-svg-icons';
import { API_URL, PYTHON_API, INITIAL_VERSION_API } from '../config';
import authService from '../services/authService';

const OutputPage = () => {
  const { selectedClipsData, setSelectedClipsData } = useClipsData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [savedToDatabase, setSavedToDatabase] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = 'https://ai-clip-backend1-1.onrender.com/api/v1';

  // Simulated loading progress
  useEffect(() => {
    let interval;
    if (loading && loadingProgress < 95) {
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95);
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [loading, loadingProgress]);

  useEffect(() => {
    // Check if there are clips to merge
    if (selectedClipsData.length === 0) {
      // Try to get clips from localStorage as fallback
      const savedClips = localStorage.getItem('selectedClipsData');
      if (savedClips) {
        try {
          const parsedClips = JSON.parse(savedClips);
          if (parsedClips && parsedClips.length > 0) {
            // Restore clips to context
            console.log('Restoring clips from localStorage:', parsedClips);
            setSelectedClipsData(parsedClips);
            return; // Don't proceed with mergeClips yet, let the effect run again with restored data
          }
        } catch (err) {
          console.error('Error parsing saved clips:', err);
        }
      }
      
      // If no saved clips or invalid data, show error
      setError('No clips selected for merging. Please go back and select clips to merge.');
      return;
    }

    // Save clips to localStorage for persistence
    localStorage.setItem('selectedClipsData', JSON.stringify(selectedClipsData));
    
    // Only merge if we haven't already processed this data
    const processedVideoUrl = localStorage.getItem('processedVideoUrl');
    if (!processedVideoUrl) {
      mergeClips();
    } else {
      // If we have a processed video URL, restore it
      setVideoUrl(processedVideoUrl);
      setLoading(false);
    }
  }, [selectedClipsData, setSelectedClipsData]);

  // Function to validate and clean video URL
  const validateVideoUrl = (url) => {
    if (!url) return null;

    // Handle different URL formats
    let cleanUrl = url.trim();

    // If it's an S3 URL, ensure it's properly formatted
    if (cleanUrl.includes('s3.amazonaws.com') || cleanUrl.includes('amazonaws.com')) {
      // Ensure HTTPS
      if (cleanUrl.startsWith('http://')) {
        cleanUrl = cleanUrl.replace('http://', 'https://');
      }
      // Add CORS headers for S3 if needed
      return cleanUrl;
    }

    // If it's a relative path, make it absolute
    if (cleanUrl.startsWith('/')) {
      cleanUrl = `${window.location.origin}${cleanUrl}`;
    }

    return cleanUrl;
  };

  // Function to send clips data to backend for merging
  const mergeClips = async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    setSavedToDatabase(false);
    setVideoLoaded(false);
    setVideoError(false);

    try {
      // Flatten segments from all videos into a single array of clips
      const clipsToMerge = selectedClipsData.flatMap(videoData =>
        videoData.segments.map(segment => {
          const videoDuration = videoData.duration || 600; // Fallback duration
          const startTime = Math.max(0, Math.min(parseFloat(segment.startTime) || 0, videoDuration - 0.1));
          const endTime = Math.max(startTime + 0.1, Math.min(parseFloat(segment.endTime) || startTime + 1, videoDuration));
          return {
            videoId: videoData.videoId,
            transcriptText: segment.text || '',
            startTime,
            endTime,
            duration: videoDuration,
            isYouTube: videoData.videoId.length === 11,
            videoUrl: videoData.videoId.length !== 11 ? `${API_BASE_URL}/video/${videoData.videoId}` : ''
          };
        })
      );

      console.log('Clips to merge:', JSON.stringify(clipsToMerge, null, 2)); // Debug log

      const token = localStorage.getItem('token');
      const headers = token ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      let response;
      let pythonError = null;

      try {
        console.log('Trying Python backend...');
        response = await axios.post(`https://clip-py-backend-1.onrender.com/merge-clips`, {
          clips: clipsToMerge
        }, {
          headers,
          timeout: 3000000 // 50 minutes
        });
        console.log('Python backend response:', response.data);
        if (!response.data?.success || !response.data?.s3Url) {
          throw new Error('Python backend response invalid, trying fallback');
        }
      } catch (err) {
        pythonError = err;
        console.error('Python backend failed, trying Node backend:', err);
        try {
          console.log('Trying Node backend...');
          response = await axios.post(`${API_URL}/api/merge/videoMerge`, {
            clips: clipsToMerge
          }, {
            headers,
            timeout: 300000
          });
          console.log('Node backend response:', response.data);
        } catch (nodeError) {
          throw new Error(`All backends failed. Python: ${pythonError.message}, Node: ${nodeError.message}`);
        }
      }

      const rawVideoUrl = response.data?.videoUrl || response.data?.data?.videoUrl ||
        response.data?.s3Url || response.data?.data?.s3Url;

      if (!rawVideoUrl) {
        throw new Error('Video processed but no URL returned');
      }

      const cleanVideoUrl = validateVideoUrl(rawVideoUrl);
      if (!cleanVideoUrl) {
        throw new Error('Invalid video URL format received from server');
      }

             setVideoUrl(cleanVideoUrl);
       setLoadingProgress(98);
       
       // Save the processed video URL to localStorage for persistence
       localStorage.setItem('processedVideoUrl', cleanVideoUrl);

      // Test video accessibility
      try {
        const testResponse = await fetch(cleanVideoUrl, {
          method: 'HEAD',
          mode: 'cors'
        });
        console.log('Video accessibility test:', testResponse.status, testResponse.statusText);

        if (!testResponse.ok) {
          console.warn('Video URL might not be accessible:', testResponse.status);
        }
      } catch (testError) {
        console.warn('Could not test video accessibility:', testError.message);
      }

      // Database save logic for authenticated users
      try {
        const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
        const authUser = authService.getCurrentUser();

        if ((userDataFromStorage && userDataFromStorage.id) || (authUser && authUser.id)) {
          const userId = userDataFromStorage.id || authUser?.id;
          const userEmail = userDataFromStorage.email || authUser?.email || "guest@clipsmart.ai";
          const userName = userDataFromStorage.name || authUser?.name || "Guest User";

          const dbResponse = await axios.post(`${API_URL}/api/v1/youtube/addFinalVideo`, {
            clipsInfo: clipsToMerge,
            fileNames3: cleanVideoUrl.split('/').pop(),
            s3Url: cleanVideoUrl,
            userId,
            userEmail,
            userName
          }, { headers });

          if (dbResponse.data?.success) {
            setSavedToDatabase(true);
            if (dbResponse.data.data?.s3Url) {
              const dbVideoUrl = validateVideoUrl(dbResponse.data.data.s3Url);
              if (dbVideoUrl) {
                setVideoUrl(dbVideoUrl);
              }
            }
          }
        }
      } catch (dbError) {
        console.error('Database save error (non-critical):', dbError);
      } finally {
        setLoadingProgress(100);
        setLoading(false);
      }
    } catch (err) {
      console.error('Merge error:', err);
      setError(err.message || 'Failed to merge clips');
      setLoading(false);
    }
  };


  const handleBackToClips = () => {
    clearStoredData();
    navigate('/transcripts');
  };

  const handleBackToExplore = () => {
    clearStoredData();
    navigate('/explore');
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;

    try {
      // For S3 URLs, we might need to handle CORS
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `merged-video-${Date.now()}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const shareToSocial = (platform) => {
    let shareUrl;

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent('Check out this video I created with ClipSmart AI!')}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent('Check out this video I created with ClipSmart AI! ' + videoUrl)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
    setShowShareMenu(false);
  };

  // Video event handlers
  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = (e) => {
    console.error('Video failed to load:', e);
    setVideoError(true);
    setVideoLoaded(false);
  };

  const retryVideoLoad = () => {
    setVideoError(false);
    setVideoLoaded(false);
    // Force video reload by adding timestamp
    const url = new URL(videoUrl);
    url.searchParams.set('t', Date.now().toString());
    setVideoUrl(url.toString());
  };

  // Database save notification component
  const DatabaseSaveNotification = () => {
    if (!savedToDatabase || !videoUrl) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="absolute bottom-4 right-4 bg-green-500/80 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
      >
        <FontAwesomeIcon icon={faCheckCircle} />
        <span>Video saved to database successfully!</span>
      </motion.div>
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  // Added background particle effect
  const ParticleBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array(15).fill(0).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-[#6c5ce7]/10"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{
            x: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
            y: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
            opacity: [Math.random() * 0.3 + 0.1, Math.random() * 0.5 + 0.2, Math.random() * 0.3 + 0.1],
          }}
          transition={{
            duration: Math.random() * 20 + 30,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: (Math.random() * 200 + 50) + "px",
            height: (Math.random() * 200 + 50) + "px",
            filter: "blur(" + (Math.random() * 50 + 50) + "px)"
          }}
        />
      ))}
    </div>
  );

  // Function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get total duration of all clips
  const getTotalDuration = () => {
    return selectedClipsData.reduce((acc, video) =>
      acc + (video.segments ? video.segments.reduce((sum, segment) =>
        sum + (parseFloat(segment.endTime) - parseFloat(segment.startTime)), 0) : 0), 0);
  };

  const getTotalClips = () => {
    return selectedClipsData.reduce((acc, video) =>
      acc + (video.segments ? video.segments.length : 0), 0);
  };

  // Cleanup function to clear localStorage when navigating away
  const clearStoredData = () => {
    localStorage.removeItem('selectedClipsData');
    localStorage.removeItem('processedVideoUrl');
  };

  // Clear stored data when component unmounts or when user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear on page reload, only on navigation away
      if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
        return;
      }
      clearStoredData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#0f0f0f] text-white flex flex-col">
      {/* Enhanced Mobile Header */}
      <div className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-b border-[#2d2d2d] bg-gradient-to-r from-[#1a1a1a] to-[#252525] flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center shadow-lg">
            <FontAwesomeIcon icon={faFilm} className="text-white text-sm sm:text-base" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Video Output
            </h1>
            <span className="text-xs sm:text-sm text-gray-400 bg-[#2d2d2d] px-2 py-0.5 rounded-full">
              {getTotalClips()} clips
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              clearStoredData();
              navigate('/explore');
            }}
            className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white transition-colors text-xs sm:text-sm bg-[#2d2d2d] hover:bg-[#3d3d3d] px-2 py-1.5 rounded-lg"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            <span className="hidden sm:inline">Explore</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              clearStoredData();
              navigate('/transcripts');
            }}
            className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white transition-colors text-xs sm:text-sm bg-[#2d2d2d] hover:bg-[#3d3d3d] px-2 py-1.5 rounded-lg"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            <span className="hidden sm:inline">Clips</span>
          </motion.button>
        </div>
      </div>

             {/* Enhanced Background Elements */}
       <ParticleBackground />

       {/* Mobile-optimized floating elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#6c5ce7]/5 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#8b7cf7]/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#6c5ce7]/3 rounded-full blur-3xl animate-pulse delay-500"></div>
       </div>

       <style jsx>{`
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
        .custom-purple-scrollbar:hover::-webkit-scrollbar-thumb {
          opacity: 0.7;
        }
        .custom-purple-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #6c5ce7 #1a1a1a;
        }
        .progress-ring-circle {
          transition: stroke-dashoffset 0.3s;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
      `}</style>

                           {/* Enhanced Main Content Area */}
        <div className="flex-1 overflow-y-auto md:overflow-y-auto lg:overflow-hidden p-2 sm:p-3 md:p-4">
        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center p-2"
            >
                             <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl p-4 sm:p-6 border border-[#ff5757]/30 shadow-2xl max-w-lg w-full backdrop-blur-sm">
                 <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                   <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#ff5757]/20 to-[#ff5757]/10 flex items-center justify-center shrink-0 shadow-lg">
                     <FontAwesomeIcon icon={faExclamationCircle} className="text-[#ff5757] text-xl sm:text-2xl" />
                   </div>
                   <div className="flex-1">
                     <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Processing Error</h2>
                     <p className="text-gray-300 text-sm sm:text-base mb-4">{error}</p>
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => {
                         clearStoredData();
                         navigate('/transcripts');
                       }}
                       className="w-full sm:w-auto bg-gradient-to-r from-[#252525] to-[#303030] px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:from-[#303030] hover:to-[#353535] transition-all shadow-lg"
                     >
                       <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                       <span>Go Back and Try Again</span>
                     </motion.button>
                   </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

                 {/* Loading State */}
         <AnimatePresence>
           {loading && !error && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="min-h-full flex flex-col lg:flex-row gap-2 sm:gap-3"
             >
                             <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl border border-[#2d2d2d] p-4 sm:p-6 flex flex-col items-center justify-center shadow-2xl flex-1 min-h-0 backdrop-blur-sm">
                 {/* Enhanced Loading visualization */}
                 <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-4 sm:mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#232323" strokeWidth="8" />
                    <circle
                      className="progress-ring-circle"
                      cx="50" cy="50" r="46" fill="none" stroke="url(#gradient)" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray="289.27" strokeDashoffset={289.27 * (1 - loadingProgress / 100)}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6c5ce7" />
                        <stop offset="100%" stopColor="#8b7cf7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#151515] flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#6c5ce7]/5 flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                          <FontAwesomeIcon icon={faSpinner} className="text-[#6c5ce7] text-lg sm:text-xl" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-[#151515] px-2 py-1 rounded-full border border-[#2A2A2A] shadow-xl">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#6c5ce7]">{Math.round(loadingProgress)}%</span>
                  </div>
                </div>
                                 <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Processing Your Video</h2>
                 <p className="text-gray-400 text-center text-sm sm:text-base max-w-xs sm:max-w-md">
                   Merging and processing your clips...
                 </p>
              </div>
                                                                                                                       <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl border border-[#2d2d2d] p-3 sm:p-4 shadow-2xl lg:w-[320px] sm:w-[320px] flex-shrink-0 flex flex-col min-h-0 backdrop-blur-sm">
                 <h3 className="text-lg sm:text-xl font-bold mb-4 text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Processing Steps</h3>
                <div className="space-y-2 sm:space-y-3 flex-1 min-h-0">
                  {[
                    { label: 'Initializing', done: loadingProgress > 10 },
                    { label: 'Extracting Audio', done: loadingProgress > 30 },
                    { label: 'Merging Clips', done: loadingProgress > 60 },
                    { label: 'Applying Transitions', done: loadingProgress > 80 },
                    { label: 'Finalizing Video', done: loadingProgress > 95 }
                  ].map((step, index) => (
                                         <div key={index} className="flex items-center gap-3 sm:gap-4 p-2 rounded-lg hover:bg-[#2d2d2d]/50 transition-colors">
                       <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg ${step.done ? 'bg-gradient-to-br from-[#6c5ce7]/30 to-[#8b7cf7]/20' : 'bg-[#2A2A2A]/60'}`}>
                         {step.done ? (
                           <FontAwesomeIcon icon={faCheckCircle} className="text-[#6c5ce7] text-sm" />
                         ) : (
                           index === [0, 10, 30, 60, 80, 95].findIndex(threshold => loadingProgress <= threshold) ? (
                             <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                               <FontAwesomeIcon icon={faSpinner} className="text-gray-400 text-sm" />
                             </motion.div>
                           ) : (
                             <div className="w-3 h-3 bg-[#2A2A2A] rounded-full"></div>
                           )
                         )}
                       </div>
                       <span className={`text-sm sm:text-base font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</span>
                     </div>
                  ))}
                </div>
                                                                   <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#2d2d2d] flex-shrink-0">
                    <h4 className="text-gray-400 text-sm sm:text-base mb-2 font-medium">Clips Being Processed</h4>
                    <div className="space-y-2 max-h-[120px] sm:max-h-[140px] overflow-y-auto custom-scrollbar">
                     {selectedClipsData.length > 0 && selectedClipsData.some(video => video.segments && video.segments.length > 0) ? (
                       selectedClipsData.flatMap((video, videoIndex) =>
                         video.segments.map((segment, segmentIndex) => (
                           <div key={`${videoIndex}-${segmentIndex}`} className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] rounded-xl p-3 text-sm hover:from-[#2a2a2a] hover:to-[#2f2f2f] transition-all shadow-md">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-[#6c5ce7] font-semibold">Clip {videoIndex + 1}.{segmentIndex + 1}</span>
                               <span className="text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded-full text-xs">
                                 {(parseFloat(segment.endTime) - parseFloat(segment.startTime)).toFixed(1)}s
                               </span>
                             </div>
                             <div className="text-gray-400 text-sm line-clamp-2">
                               {segment.text?.slice(0, 30)}...
                             </div>
                           </div>
                         ))
                       )
                     ) : (
                       <div className="text-gray-400 text-sm text-center py-4">No clips to display</div>
                     )}
                   </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

                 {/* Success State */}
         <AnimatePresence>
           {videoUrl && !loading && !error && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="min-h-full md:h-full lg:h-full flex flex-col lg:flex-row gap-2 sm:gap-3"
             >
                                                              {/* Enhanced Video Player */}
                 <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl border border-[#2d2d2d] flex flex-col shadow-2xl flex-1 min-h-0 backdrop-blur-sm md:h-full lg:h-full">
                  <div className="border-b border-[#2d2d2d] px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center flex-shrink-0">
                    <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                      <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7] text-sm sm:text-base" />
                      <span>Final Video</span>
                    </h2>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-[#252525] to-[#2a2a2a] px-3 py-1 rounded-full text-xs shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="font-medium">Ready</span>
                    </div>
                  </div>
                                   <div className="p-3 sm:p-4 flex-1 overflow-hidden min-h-0">
                                         <div className="aspect-video w-full h-auto max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-180px)] relative z-10 rounded-xl overflow-hidden shadow-2xl">
                                             <video
                         controls
                         src={videoUrl}
                         className="w-full h-full object-contain bg-gradient-to-br from-[#080808] to-[#0a0a0a]"
                         onLoadedData={() => setVideoLoaded(true)}
                         onError={() => setVideoError(true)}
                       />
                    </div>
                  </div>
                                   <div className="bg-gradient-to-r from-[#151515] to-[#1a1a1a] border-t border-[#2d2d2d] px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadVideo}
                        className="flex-1 bg-gradient-to-r from-[#6c5ce7] to-[#8b7cf7] hover:from-[#5849e0] hover:to-[#7c6cf6] py-3 sm:py-3 rounded-xl font-semibold text-white flex items-center gap-2 justify-center transition-all text-sm shadow-lg"
                      >
                        <FontAwesomeIcon icon={faDownload} className="text-sm" />
                        <span>Download Video</span>
                      </motion.button>
                      <div className="relative flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="w-full bg-gradient-to-r from-[#252525] to-[#2a2a2a] border border-[#3A3A3A] py-3 sm:py-3 rounded-xl font-semibold text-white flex items-center gap-2 justify-center hover:from-[#303030] hover:to-[#353535] transition-all text-sm shadow-lg"
                        >
                          <FontAwesomeIcon icon={faShare} className="text-sm" />
                          <span>Share Video</span>
                        </motion.button>
                                               <AnimatePresence>
                           {showShareMenu && (
                             <motion.div
                               initial={{ opacity: 0, y: -10, scale: 0.95 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: -10, scale: 0.95 }}
                               transition={{ duration: 0.2 }}
                                                          className="absolute left-0 right-0 bottom-full mb-2 bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-xl border border-[#2d2d2d] shadow-2xl overflow-hidden z-50 backdrop-blur-sm"
                             >
                                                          <div className="p-4 border-b border-[#2d2d2d]">
                               <h3 className="text-base font-semibold text-gray-300">Share via</h3>
                             </div>
                             <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                               <motion.button
                                 whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                 className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2d2d2d]/50 transition-colors"
                                 onClick={() => shareToSocial('twitter')}
                               >
                                 <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center shadow-lg">
                                   <FontAwesomeIcon icon={faTwitter} className="text-[#1DA1F2] text-lg" />
                                 </div>
                                 <span className="text-sm font-medium">Twitter</span>
                               </motion.button>
                              {/* Other share buttons unchanged */}
                            </div>
                                                         <div className="p-3 border-t border-[#2d2d2d]">
                               <motion.button
                                 whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                 className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#2d2d2d]/50 transition-colors"
                                 onClick={copyToClipboard}
                               >
                                 <div className="w-10 h-10 rounded-full bg-[#6c5ce7]/10 flex items-center justify-center shadow-lg">
                                   <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} className={copied ? "text-green-500" : "text-[#6c5ce7]"} />
                                 </div>
                                 <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Video Link'}</span>
                               </motion.button>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

                                                                                                                                                                                   {/* Enhanced Information Panel */}
                  <div className="w-full lg:w-[340px] md:w-full sm:w-full flex flex-col gap-2 sm:gap-3 lg:gap-3 min-h-0 md:h-full lg:h-full">
                  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl border border-[#2d2d2d] shadow-2xl overflow-hidden flex-shrink-0 backdrop-blur-sm">
                    <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-[#2d2d2d]">
                      <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faVideo} className="text-[#6c5ce7] text-sm sm:text-base" />
                        Video Info
                      </h3>
                    </div>
                                                                               <div className="p-2 sm:p-3 lg:p-3">
                      <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 lg:gap-x-4 gap-y-2 sm:gap-y-3 lg:gap-y-3">
                        <div className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] p-2 sm:p-3 rounded-xl">
                          <div className="text-gray-400 text-xs mb-1 font-medium">Duration</div>
                          <div className="font-semibold flex items-center text-xs sm:text-sm lg:text-base">
                            <FontAwesomeIcon icon={faClock} className="text-[#6c5ce7] mr-1 sm:mr-2 text-xs sm:text-sm" />
                            {formatDuration(getTotalDuration())}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] p-2 sm:p-3 rounded-xl">
                          <div className="text-gray-400 text-xs mb-1 font-medium">Format</div>
                          <div className="font-semibold text-xs sm:text-sm lg:text-base">MP4</div>
                        </div>
                        <div className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] p-2 sm:p-3 rounded-xl">
                          <div className="text-gray-400 text-xs mb-1 font-medium">Clips</div>
                          <div className="font-semibold text-xs sm:text-sm lg:text-base">{selectedClipsData.length}</div>
                        </div>
                        <div className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] p-2 sm:p-3 rounded-xl">
                          <div className="text-gray-400 text-xs mb-1 font-medium">Status</div>
                          <div className="font-semibold text-[#6c5ce7] text-xs sm:text-sm lg:text-base">Completed</div>
                        </div>
                      </div>
                                           <div className="mt-3 sm:mt-4 lg:mt-3 pt-2 sm:pt-3 lg:pt-3 border-t border-[#2d2d2d]">
                        <div className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2 font-medium">Video URL</div>
                        <div className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] rounded-xl p-2 sm:p-3 flex items-center justify-between shadow-lg">
                          <div className="text-gray-300 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px] lg:max-w-[200px] font-medium">
                            {videoUrl.substring(0, 20)}...
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={copyToClipboard}
                            className="bg-gradient-to-r from-[#333333] to-[#3a3a3a] p-1.5 sm:p-2 rounded-lg hover:from-[#3a3a3a] hover:to-[#404040] transition-all shadow-md"
                          >
                            <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} className={`text-xs sm:text-sm ${copied ? "text-green-500" : "text-[#6c5ce7]"}`} />
                          </motion.button>
                        </div>
                      </div>
                   </div>
                 </div>
                                                                       <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl border border-[#2d2d2d] shadow-2xl flex flex-col min-h-0 flex-1 backdrop-blur-sm md:h-full lg:h-full">
                     <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-[#2d2d2d] flex-shrink-0">
                       <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                         <FontAwesomeIcon icon={faList} className="text-[#6c5ce7] text-sm sm:text-base" />
                         Merged Clips
                       </h3>
                     </div>
                                        <div className="p-2 sm:p-3 flex-1 overflow-y-auto custom-purple-scrollbar min-h-0 max-h-[200px] sm:max-h-[250px] md:max-h-[400px] lg:max-h-none">
                      {selectedClipsData.length > 0 && selectedClipsData.some(video => video.segments && video.segments.length > 0) ? (
                        selectedClipsData.flatMap((video, videoIndex) =>
                          video.segments.map((segment, segmentIndex) => (
                            <div
                              key={`${videoIndex}-${segmentIndex}`}
                              className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] rounded-xl p-3 mb-2 hover:from-[#2a2a2a] hover:to-[#2f2f2f] transition-all shadow-md"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#6c5ce7]/30 to-[#8b7cf7]/20 flex items-center justify-center mr-2 shadow-lg">
                                    <span className="text-xs text-[#6c5ce7] font-bold">{videoIndex + 1}.{segmentIndex + 1}</span>
                                  </div>
                                  <span className="font-semibold text-sm">Clip {videoIndex + 1}.{segmentIndex + 1}</span>
                                </div>
                                <span className="text-gray-500 text-xs bg-[#1a1a1a] px-2 py-1 rounded-full">
                                  {(parseFloat(segment.endTime) - parseFloat(segment.startTime)).toFixed(1)}s
                                </span>
                              </div>
                              <div className="text-gray-400 text-sm line-clamp-2">
                                {segment.text}
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        <div className="text-gray-400 text-sm text-center py-6">No clips to display</div>
                      )}
                    </div>
                                                                               <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-[#2d2d2d] bg-gradient-to-r from-[#151515] to-[#1a1a1a] flex-shrink-0">
                       <div className="flex flex-col sm:flex-row gap-2">
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => {
                             clearStoredData();
                             navigate('/transcripts');
                           }}
                           className="flex-1 bg-gradient-to-r from-[#252525] to-[#2a2a2a] py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:from-[#303030] hover:to-[#353535] transition-all flex items-center justify-center gap-2 shadow-lg"
                         >
                           <FontAwesomeIcon icon={faArrowLeft} className="text-xs sm:text-sm" />
                           <span>Back to Clips</span>
                         </motion.button>
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => {
                             clearStoredData();
                             navigate('/explore');
                           }}
                           className="flex-1 bg-gradient-to-r from-[#6c5ce7] to-[#8b7cf7] py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:from-[#5849e0] hover:to-[#7c6cf6] transition-all flex items-center justify-center gap-2 shadow-lg"
                         >
                           <FontAwesomeIcon icon={faArrowLeft} className="text-xs sm:text-sm" />
                           <span>Back to Explore</span>
                         </motion.button>
                       </div>
                     </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

                 {/* Empty State */}
         <AnimatePresence>
           {!videoUrl && !loading && !error && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="h-full flex items-center justify-center p-1"
             >
                                                           <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl border border-[#2d2d2d] p-6 sm:p-8 shadow-2xl max-w-md w-full backdrop-blur-sm">
                 <div className="flex flex-col items-center text-center">
                                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#8b7cf7] flex items-center justify-center mb-4 sm:mb-6 shadow-2xl">
                      <FontAwesomeIcon icon={faVideo} className="text-white text-lg sm:text-xl" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">No Video Generated</h2>
                    <p className="text-gray-400 text-sm sm:text-base max-w-sm mb-5 sm:mb-6">Your clips need to be processed to generate a video. Please select clips to merge.</p>
                                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          clearStoredData();
                          navigate('/transcripts');
                        }}
                        className="bg-gradient-to-r from-[#6c5ce7] to-[#8b7cf7] hover:from-[#5849e0] hover:to-[#7c6cf6] px-5 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-white flex items-center gap-2 transition-all text-sm shadow-lg"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        <span>Select Clips</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          clearStoredData();
                          navigate('/explore');
                        }}
                        className="bg-gradient-to-r from-[#252525] to-[#2a2a2a] hover:from-[#303030] hover:to-[#353535] px-5 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-white flex items-center gap-2 transition-all text-sm shadow-lg"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        <span>Back to Explore</span>
                      </motion.button>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        <DatabaseSaveNotification />
      </AnimatePresence>
    </div>
  );
};

export default OutputPage;