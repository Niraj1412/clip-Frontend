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
import { API_URL, PYTHON_API, INITIAL_VERSION_API, API_BASE_URL } from '../config';
import authService from '../services/authService';

const OutputPage = () => {
  const { selectedClipsData } = useClipsData();
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
      setError('No clips selected for merging');
      return;
    }

    mergeClips();
  }, []);

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
      const clipsToMerge = selectedClipsData.map(clip => ({
        videoId: clip.videoId,
        transcriptText: clip.transcriptText,
        startTime: clip.startTime,
        endTime: clip.endTime,
        isYouTube: clip.videoId.length === 11, // Flag to identify YouTube videos
        videoUrl: clip.videoId.length !== 11 ? `${API_BASE_URL}/video/${clip.videoId}` : '' // URL for non-YouTube videos
      }));

      console.log('Clips to merge:', JSON.stringify(clipsToMerge, null, 2)); // Debugging log

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
          timeout: 3000000
        });
        console.log('Python backend response:', response.data);
        if (!response.data?.success || !response.data?.s3Url) {
          throw new Error('Python backend response invalid, trying fallback');
        }
      } catch (err) {
        pythonError = err;
        try {
          console.log('Python backend failed, trying Node backend:', pythonError.message);
          response = await axios.post(`${API_URL}/api/merge/videoMerge`, {
            clips: clipsToMerge
          }, {
            headers,
            timeout: 300000
          });
          console.log('Node backend response:', response.data);
        } catch (nodeError) {
          console.error('Both backends failed:', { pythonError, nodeError });
          throw new Error(`All backends failed. Python: ${pythonError.message}, Node: ${nodeError.message}`);
        }
      }

      // Handle various response structures
      const rawVideoUrl = response.data?.videoUrl ||
        response.data?.data?.videoUrl ||
        response.data?.s3Url ||
        response.data?.data?.s3Url;

      console.log('Raw video URL received:', rawVideoUrl);

      if (!rawVideoUrl) {
        console.error('No video URL found in response. Full response:', response.data);
        throw new Error(
          response.data?.message ||
          response.data?.data?.message ||
          'Video was processed but no URL was returned. Please check console for details.'
        );
      }

      // Validate and clean the video URL
      const cleanVideoUrl = validateVideoUrl(rawVideoUrl);
      if (!cleanVideoUrl) {
        throw new Error('Invalid video URL format received from server');
      }

      console.log('Clean video URL:', cleanVideoUrl);
      setVideoUrl(cleanVideoUrl);
      setLoadingProgress(98);

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
    navigate('/transcripts');
  };

  const handleBackToExplore = () => {
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
    return selectedClipsData.reduce((acc, clip) =>
      acc + (clip.endTime - clip.startTime), 0);
  };

  return (
    <div className="h-screen bg-[#121212] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6c5ce7] flex items-center justify-center">
            <FontAwesomeIcon icon={faFilm} className="text-white" />
          </div>
          <h1 className="text-lg font-medium text-white">
            Video Output
            <span className="ml-2 text-sm text-gray-400">
              ({selectedClipsData.length} clips merged)
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToExplore}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="text-sm">Explore</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToClips}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="text-sm">Back to Clips</span>
          </motion.button>
        </div>
      </div>

      {/* Background Elements */}
      <ParticleBackground />

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
        .custom-purple-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8b7cf7;
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Grid Layout - Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full p-6 flex-1 overflow-y-auto custom-scrollbar"
            >
              <div className="w-full bg-[#1a1a1a] backdrop-blur-md rounded-lg p-6 border border-[#ff5757]/30 shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-lg bg-[#ff5757]/20 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-[#ff5757] text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Processing Error</h2>
                    <p className="text-gray-300">{error}</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBackToClips}
                      className="mt-4 bg-[#252525] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#303030] transition-colors"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                      <span>Go Back and Try Again</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid Layout - Loading State */}
        <AnimatePresence>
          {loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-y-auto custom-scrollbar"
            >
              {/* Loading Visualization */}
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-8 flex flex-col items-center justify-center shadow-lg flex-1">
                <div className="relative w-40 h-40 mb-8">
                  {/* Outer ring */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="#232323"
                      strokeWidth="8"
                    />
                    <circle
                      className="progress-ring-circle"
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="289.27"
                      strokeDashoffset={289.27 * (1 - loadingProgress / 100)}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6c5ce7" />
                        <stop offset="100%" stopColor="#8b7cf7" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner spinner */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-[#151515] flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#6c5ce7]/5 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        >
                          <FontAwesomeIcon icon={faSpinner} className="text-[#6c5ce7] text-2xl" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Percentage display */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-[#151515] px-4 py-1 rounded-full border border-[#2A2A2A] shadow-xl">
                    <span className="font-mono text-sm font-bold text-[#6c5ce7]">{Math.round(loadingProgress)}%</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Processing Your Video</h2>
                <p className="text-gray-400 text-center max-w-md mb-2">
                  We're merging and processing your clips. This may take a few minutes depending on the complexity.
                </p>
              </div>

              {/* Processing Steps Sidebar */}
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6 shadow-lg lg:w-[350px]">
                <h3 className="text-xl font-bold mb-4 text-white">Processing Steps</h3>

                <div className="space-y-4">
                  {[
                    { label: 'Initializing', done: loadingProgress > 10 },
                    { label: 'Extracting Audio', done: loadingProgress > 30 },
                    { label: 'Merging Clips', done: loadingProgress > 60 },
                    { label: 'Applying Transitions', done: loadingProgress > 80 },
                    { label: 'Finalizing Video', done: loadingProgress > 95 }
                  ].map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.done ? 'bg-[#6c5ce7]/20' : 'bg-[#2A2A2A]/40'}`}>
                        {step.done ? (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-[#6c5ce7] text-xs" />
                        ) : (
                          index === [0, 10, 30, 60, 80, 95].findIndex(threshold => loadingProgress <= threshold) ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            >
                              <FontAwesomeIcon icon={faSpinner} className="text-gray-400 text-xs" />
                            </motion.div>
                          ) : (
                            <div className="w-2 h-2 bg-[#2A2A2A] rounded-full"></div>
                          )
                        )}
                      </div>
                      <span className={`text-sm ${step.done ? 'text-white' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[#2d2d2d]">
                  <h4 className="text-gray-400 text-sm mb-3">Clips Being Processed</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {selectedClipsData.map((clip, index) => (
                      <div
                        key={index}
                        className="bg-[#252525] rounded-lg p-2 text-xs"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="text-[#6c5ce7]">Clip {index + 1}</span>
                          <span className="text-gray-500">{(clip.endTime - clip.startTime).toFixed(1)}s</span>
                        </div>
                        <div className="text-gray-400 truncate">
                          {clip.transcriptText?.slice(0, 30)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid Layout - Success State */}
        <AnimatePresence>
          {videoUrl && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-y-auto custom-scrollbar"
            >
              {/* Video Player */}
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] overflow-hidden flex flex-col shadow-lg flex-1">
                <div className="border-b border-[#2d2d2d] px-6 py-4 flex justify-between items-center">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7]" />
                    <span>Final Video</span>
                  </h2>
                  <div className="flex items-center gap-2 bg-[#252525] px-3 py-1 rounded-full text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Ready</span>
                  </div>
                </div>

                {/* Player Area */}
                <div className="p-6 flex-1">
                  <div className="rounded-lg overflow-hidden shadow-lg group">
                    <div className="aspect-video relative z-10 rounded-lg overflow-hidden">
                      <video
                        controls
                        src={videoUrl}
                        className="w-full h-full object-contain bg-[#080808]"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-[#151515] border-t border-[#2d2d2d] px-6 py-4">
                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={downloadVideo}
                      className="relative group flex-1"
                    >
                      <div className="bg-[#6c5ce7] hover:bg-[#5849e0] py-3 rounded-lg font-medium text-white flex items-center gap-3 justify-center transition-colors">
                        <FontAwesomeIcon icon={faDownload} />
                        <span>Download Video</span>
                      </div>
                    </motion.button>

                    <div className="relative flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="w-full"
                      >
                        <div className="bg-[#252525] border border-[#3A3A3A] py-3 rounded-lg font-medium text-white flex items-center gap-3 justify-center hover:bg-[#303030] transition-colors w-full">
                          <FontAwesomeIcon icon={faShare} />
                          <span>Share Video</span>
                        </div>
                      </motion.button>

                      {/* Share Dropdown Menu */}
                      <AnimatePresence>
                        {showShareMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] shadow-xl overflow-hidden z-50"
                          >
                            <div className="p-3 border-b border-[#2d2d2d]">
                              <h3 className="text-sm font-medium text-gray-300">Share via</h3>
                            </div>
                            <div className="p-2 grid grid-cols-2 gap-2">
                              <motion.button
                                whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                className="flex items-center gap-3 p-3 rounded-lg"
                                onClick={() => shareToSocial('twitter')}
                              >
                                <div className="w-8 h-8 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faTwitter} className="text-[#1DA1F2]" />
                                </div>
                                <span className="text-sm">Twitter</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                className="flex items-center gap-3 p-3 rounded-lg"
                                onClick={() => shareToSocial('facebook')}
                              >
                                <div className="w-8 h-8 rounded-full bg-[#4267B2]/10 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faFacebook} className="text-[#4267B2]" />
                                </div>
                                <span className="text-sm">Facebook</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                className="flex items-center gap-3 p-3 rounded-lg"
                                onClick={() => shareToSocial('linkedin')}
                              >
                                <div className="w-8 h-8 rounded-full bg-[#0077B5]/10 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faLinkedin} className="text-[#0077B5]" />
                                </div>
                                <span className="text-sm">LinkedIn</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                className="flex items-center gap-3 p-3 rounded-lg"
                                onClick={() => shareToSocial('whatsapp')}
                              >
                                <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faWhatsapp} className="text-[#25D366]" />
                                </div>
                                <span className="text-sm">WhatsApp</span>
                              </motion.button>
                            </div>

                            <div className="p-2 border-t border-[#2d2d2d]">
                              <motion.button
                                whileHover={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg"
                                onClick={copyToClipboard}
                              >
                                <div className="w-8 h-8 rounded-full bg-[#6c5ce7]/10 flex items-center justify-center">
                                  <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} className={copied ? "text-green-500" : "text-[#6c5ce7]"} />
                                </div>
                                <span className="text-sm">{copied ? 'Copied!' : 'Copy Video Link'}</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Panel */}
              <div className="lg:w-[350px] flex flex-col gap-4">
                {/* Video Information Card */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#2d2d2d]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FontAwesomeIcon icon={faVideo} className="text-[#6c5ce7] text-sm" />
                      Video Information
                    </h3>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Duration</div>
                        <div className="font-medium flex items-center">
                          <FontAwesomeIcon icon={faClock} className="text-[#6c5ce7] mr-2 text-xs" />
                          {formatDuration(getTotalDuration())}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-1">Format</div>
                        <div className="font-medium">MP4</div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-1">Clips Merged</div>
                        <div className="font-medium">{selectedClipsData.length}</div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-1">Status</div>
                        <div className="font-medium text-[#6c5ce7]">Completed</div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#2d2d2d]">
                      <div className="text-gray-500 text-xs mb-3">Video URL</div>
                      <div className="bg-[#252525] rounded-lg p-2 flex items-center justify-between">
                        <div className="text-gray-300 text-sm truncate max-w-[220px]">
                          {videoUrl.substring(0, 40)}...
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={copyToClipboard}
                          className="bg-[#333333] p-2 rounded-lg hover:bg-[#3a3a3a] transition-colors"
                        >
                          <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} className={copied ? "text-green-500" : "text-[#6c5ce7]"} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clip List */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] shadow-lg overflow-hidden flex-1">
                  <div className="px-6 py-4 border-b border-[#2d2d2d]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FontAwesomeIcon icon={faList} className="text-[#6c5ce7] text-sm" />
                      Merged Clips
                    </h3>
                  </div>

                  <div className="p-2 max-h-[300px] overflow-y-auto custom-purple-scrollbar">
                    {selectedClipsData.map((clip, index) => (
                      <div
                        key={index}
                        className="bg-[#252525] rounded-lg p-3 mb-2 hover:bg-[#2a2a2a] transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center mr-2">
                              <span className="text-xs text-[#6c5ce7] font-bold">{index + 1}</span>
                            </div>
                            <span className="font-medium text-sm">Clip {index + 1}</span>
                          </div>
                          <span className="text-gray-500 text-xs">{(clip.endTime - clip.startTime).toFixed(1)}s</span>
                        </div>
                        <div className="text-gray-400 text-xs line-clamp-2">
                          {clip.transcriptText}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-4 border-t border-[#2d2d2d] bg-[#151515]">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBackToClips}
                        className="flex-1 bg-[#252525] py-2 rounded-lg text-sm font-medium hover:bg-[#303030] transition-colors flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        <span>Back to Clips</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBackToExplore}
                        className="flex-1 bg-[#6c5ce7] py-2 rounded-lg text-sm font-medium hover:bg-[#5849e0] transition-colors flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
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
              className="flex-1 p-6 flex items-center justify-center"
            >
              <div className="bg-[#1a1a1a] backdrop-blur-md rounded-lg border border-[#2d2d2d] p-12 shadow-lg max-w-lg w-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-xl bg-[#6c5ce7] flex items-center justify-center mb-6">
                    <FontAwesomeIcon icon={faVideo} className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">No Video Generated</h2>
                  <p className="text-gray-400 max-w-md mb-6">Your clips need to be processed to generate a video. Please select clips to merge.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackToClips}
                    className="bg-[#6c5ce7] hover:bg-[#5849e0] px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-colors mr-3"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Select Clips</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackToExplore}
                    className="bg-[#252525] hover:bg-[#303030] px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Back to Explore</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Database Save Notification */}
      <AnimatePresence>
        <DatabaseSaveNotification />
      </AnimatePresence>
    </div>
  );
};

export default OutputPage;