import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useVideoIds } from '../context/videoIds';
import { usePrompt } from '../context/promptContext';
import { PYTHON_API, YOUTUBE_API, API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  faExclamationTriangle,
  faCheck,
  faVideo,
  faMusic,
  faStar,
  faWandMagicSparkles,
  faFileVideo,
  faUpload,
  faSpinner,
  faMagicWandSparkles,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';

const InputComponent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { addVideoIds, clearVideoIds } = useVideoIds();
  const { prompt, setPrompt } = usePrompt();
  const [urlError, setUrlError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Validate YouTube URL format
  const validateYouTubeUrl = (url) => {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /^[a-zA-Z0-9_-]{11}$/
    ];
    return url && patterns.some(pattern => pattern.test(url));
  };

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setUrlError('');
  };

  // Extract video ID from various URL formats
  const extractVideoId = (url) => {
    if (!url) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&]/)[0];
    return null;
  };

  // Process successful response
  const processSuccessResponse = async (videoId) => {
    clearVideoIds();
    await new Promise(resolve => setTimeout(resolve, 100));
    addVideoIds([videoId]);
    setShowSuccessMessage(true);
    setTimeout(() => navigate('/transcripts'), 1500);
  };

  // Handle processing errors
  const handleProcessingError = (error) => {
    let errorMessage = 'Service unavailable. Please try again later.';
    
    if (error.message.includes('No transcript available') || 
        error.response?.data?.message?.includes('No transcript available')) {
      errorMessage = 'This video doesn\'t have captions available. Please try a different video with subtitles.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Video processing service is currently unavailable.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message.includes('All processing endpoints failed')) {
      errorMessage = 'Unable to process video. Please try again later or contact support.';
    }
    
    setUrlError(errorMessage);
    console.error('Processing error:', error);
  };

  // Main processing function
  const handleGenerate = async () => {
    setIsLoading(true);
    setUrlError('');
    setShowSuccessMessage(false);

    try {
      // Validate input
      if (!validateYouTubeUrl(youtubeUrl)) {
        throw new Error('Please enter a valid YouTube URL or video ID');
      }

      const videoId = extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      // Try primary endpoint first
      try {
        const response = await axios.post(
          `${YOUTUBE_API}/video/${videoId}`,
          null,
          { timeout: 10000 }
        );

        if (response.data?.status) {
          await processSuccessResponse(videoId);
          return;
        }
        throw new Error(response.data?.message || 'Failed to process video');
      } catch (primaryError) {
        console.warn('Primary endpoint failed, trying fallback:', primaryError);
        
        // Try fallback endpoint
        try {
          const fallbackResponse = await axios.post(
            `${PYTHON_API}/transcript/${videoId}`,
            null,
            { timeout: 10000 }
          );

          if (fallbackResponse.data?.status) {
            await processSuccessResponse(videoId);
            return;
          }
          throw new Error(fallbackResponse.data?.message || 'Failed to process video');
        } catch (fallbackError) {
          console.error('Fallback endpoint failed:', fallbackError);
          
          // Special handling for local development
          if (process.env.NODE_ENV === 'development') {
            try {
              const devResponse = await axios.post(
                `https://clip-backend-f93c.onrender.com/api/v1/youtube/video/${videoId}`,
                null,
                { timeout: 10000 }
              );
              
              if (devResponse.data?.status) {
                await processSuccessResponse(videoId);
                return;
              }
              throw new Error(devResponse.data?.message || 'Local endpoint failed');
            } catch (devError) {
              console.error('Local development endpoint failed:', devError);
            }
          }
          
          throw new Error('All processing endpoints failed');
        }
      }
    } catch (error) {
      handleProcessingError(error);
      
      // Auto-retry for network errors only (not for 404s or no captions)
      if ((error.code === 'ECONNABORTED' || !error.response) && retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          handleGenerate();
        }, 3000 * (retryCount + 1));
      }
    } finally {
      setIsLoading(false);
    }
  };

    const promptSuggestions = [
        {
            icon: faVideo,
            text: "Create a highlight reel of the most engaging moments from these clips",
            category: "Highlights",
            description: "Best moments compilation"
        },
        {
            icon: faMusic,
            text: "Generate a short teaser with dramatic transitions and music that builds tension",
            category: "Teaser",
            description: "Promotional content"
        },
        {
            icon: faStar,
            text: "Extract the key insights and create an educational summary clip",
            category: "Educational",
            description: "Knowledge sharing"
        },
        {
            icon: faWandMagicSparkles,
            text: "Transform these clips into a cohesive story with smooth transitions and narrative flow",
            category: "Storytelling",
            description: "Content transformation"
        }
    ];

    return (
        <div className="min-h-screen pt-14 pb-6 px-6">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `
                        radial-gradient(#6c5ce7 1.5px, transparent 1.5px),
                        radial-gradient(#8b7cf7 1.5px, transparent 1.5px)
                    `,
                    backgroundSize: '50px 50px, 25px 25px',
                    backgroundPosition: '0 0, 25px 25px',
                    animation: 'backgroundMove 60s linear infinite'
                }}></div>
            </div>

            {showSuccessMessage && (
                <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-top backdrop-blur-md border border-white/20 z-50">
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <FontAwesomeIcon icon={faCheck} className="text-base" />
                    </div>
                    <p className="text-sm font-medium">Your clip is being generated</p>
                </div>
            )}

            <div className="max-w-[1120px] mx-auto">
                <div className="relative backdrop-blur-xl bg-[#1a1a1a]/90 rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#6c5ce7]/0 via-[#6c5ce7]/50 to-[#6c5ce7]/0"></div>

                    <div className="p-8 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 bg-[#6c5ce7]/10 px-4 py-1.5 rounded-full">
                                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[#6c5ce7] text-base" />
                                <h2 className="text-xl font-semibold text-white">Create New Clip</h2>
                                <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-xs animate-pulse" />
                            </div>
                            <p className="text-gray-400/80 text-sm">Transform your content into engaging clips with AI-powered magic</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                            <div className="space-y-4">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faFileVideo} className="text-[#6c5ce7] text-xs" />
                                    </span>
                                    Choose Your Content
                                </h3>

                                <div className="relative border border-gray-700/30 rounded-xl bg-[#151515]/60 shadow-md overflow-hidden">
                                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2">
                                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full mb-2">
                                            <FontAwesomeIcon icon={faUpload} className="text-white text-xl" />
                                        </div>
                                        <h3 className="text-white font-semibold text-lg">File Upload</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-gray-300 font-medium">Coming Soon</span>
                                            <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                                        </div>
                                        <p className="text-gray-400 text-sm max-w-xs">
                                            Please use the YouTube URL option below.
                                        </p>
                                    </div>

                                    <div className="p-8 opacity-50 pointer-events-none">
                                        <div className="border-2 border-dashed border-gray-700/50 rounded-lg p-6 flex flex-col items-center">
                                            <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-3" />
                                            <p className="text-gray-400 text-center mb-2">Drag & drop your file here</p>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        id="fileInput"
                                        className="hidden"
                                        accept="video/*,audio/*"
                                        disabled={true}
                                    />
                                </div>

                                <div className="flex items-center gap-3 py-3">
                                    <div className="h-px bg-gray-700/30 flex-1"></div>
                                    <div className="px-4 py-1 bg-[#151515] rounded-full border border-gray-700/30">
                                        <span className="text-gray-400 text-xs font-medium">OR</span>
                                    </div>
                                    <div className="h-px bg-gray-700/30 flex-1"></div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center">
                                        <FontAwesomeIcon icon={faYoutube} className="text-red-500 text-lg" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Paste YouTube video or playlist link"
                                        className="w-full pl-12 pr-4 py-4 bg-[#151515]/60 rounded-xl text-white placeholder-gray-400 text-sm border border-gray-700/30 focus:border-[#6c5ce7] transition-all duration-300 focus:ring-2 focus:ring-[#6c5ce7]/20 outline-none shadow-inner"
                                        value={youtubeUrl}
                                        onChange={handleYoutubeUrlChange}
                                    />
                                    {urlError && urlError.includes('Please enter') && (
                                        <p className="text-red-500 text-xs mt-2 ml-2 flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            <span>{urlError}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="space-y-4"
                            >
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faMagicWandSparkles} className="text-[#6c5ce7] text-xs" />
                                    </span>
                                    Describe Your Vision
                                </h3>

                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Describe how you want your clip to look... Be creative!"
                                        className="w-full h-[100px] p-3 bg-gray-800/30 rounded-xl text-white placeholder-gray-400 text-sm border border-gray-700/50 focus:border-[#6c5ce7] transition-all duration-300 focus:ring-2 focus:ring-[#6c5ce7]/20 outline-none resize-none"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faLightbulb} className="text-yellow-500 text-xs" />
                                            <span className="text-gray-400 text-sm">Quick Suggestions:</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {promptSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setPrompt(suggestion.text)}
                                                    className="flex items-start gap-2 p-3 bg-gray-800/30 rounded-xl hover:bg-[#6c5ce7]/10 transition-all duration-300 text-left group border border-gray-700/50 hover:border-[#6c5ce7]/50"
                                                >
                                                    <span className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center shrink-0">
                                                        <FontAwesomeIcon icon={suggestion.icon} className="text-[#6c5ce7] text-xs group-hover:scale-110 transition-transform" />
                                                    </span>
                                                    <div>
                                                        <span className="block text-[10px] text-[#6c5ce7] mb-0.5 font-medium uppercase tracking-wide">{suggestion.category}</span>
                                                        <span className="block text-xs text-gray-300 group-hover:text-white transition-colors leading-relaxed">{suggestion.text}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <button
                            className={`w-full py-4 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-3
                            ${isLoading || !youtubeUrl
                                    ? 'bg-gray-800/50 cursor-not-allowed shadow-inner'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transform hover:scale-[1.01] hover:shadow-xl shadow-lg'}`}
                            onClick={handleGenerate}
                            disabled={isLoading || !youtubeUrl}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faWandMagicSparkles} className="text-lg" />
                                    <span>Generate From YouTube</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {urlError && !urlError.includes('Please enter') && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-top backdrop-blur-md border border-white/20 max-w-md z-50">
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-base" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{urlError}</p>
                        {retryCount < maxRetries && (
                            <button
                                onClick={handleGenerate}
                                className="text-xs mt-1 underline hover:text-white/80 transition-colors flex items-center gap-1"
                            >
                                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs" />
                                <span>Try again ({maxRetries - retryCount} attempts left)</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style>
                {`
                @keyframes backgroundMove {
                    0% { background-position: 0 0, 25px 25px; }
                    100% { background-position: 50px 50px, 75px 75px; }
                }
                `}
            </style>
        </div>
    );
};

export default InputComponent;