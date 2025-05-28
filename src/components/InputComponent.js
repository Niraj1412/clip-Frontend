import React, { useState, useRef, useEffect } from 'react';
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
  faMagicWandSparkles,
  faLightbulb,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { AUTH_API } from '../config';

const InputComponent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { addVideoIds, clearVideoIds } = useVideoIds();
  const { prompt, setPrompt } = usePrompt();
  const [urlError, setUrlError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  

  // Validate YouTube URL format
   // Validate YouTube URL format
  const validateYouTubeUrl = (url) => {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /^[a-zA-Z0-9_-]{11}$/
    ];
    return url && patterns.some(pattern => pattern.test(url));
  };

  useEffect(() => {
    // Check token validity on component mount
    const token = localStorage.getItem('token');
    if (token) {
      // You can set the token in state if needed
    }
  }, []);

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setUrlError('');
    // Clear file selection if YouTube URL is entered
    if (e.target.value) {
      setSelectedFile(null);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
      const maxSize = 500 * 1024 * 1024; // 500MB

      if (!validTypes.includes(file.type)) {
        setUrlError('Please upload a valid video file (MP4, WebM, MOV)');
        return;
      }

      if (file.size > maxSize) {
        setUrlError('File size must be less than 500MB');
        return;
      }

      setSelectedFile(file);
      setYoutubeUrl('');
      setUrlError('');
    }
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

const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('video', file);

  const config = {
    onUploadProgress: progressEvent => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percentCompleted);
    },
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    timeout: 30000
  };

  try {
    const response = await axios.post(
      `${API_URL}/api/v1/upload`,
      formData,
      config
    );

    if (response.data?.videoId) {
      return response.data.videoId;
    }
    throw new Error(response.data?.message || 'File upload failed');
  } catch (error) {
    if (error.response?.status === 401) {
      try {
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: localStorage.getItem('refreshToken')
        });
        localStorage.setItem('token', refreshResponse.data.token);
        return uploadFile(file);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        throw new Error('Session expired. Please log in again.');
      }
    }
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload file. Please try again.');
  }
};

// Enhanced processing function with better error handling
const handleGenerate = async () => {
  if (isLoading) return;

  setIsLoading(true);
  setUrlError('');
  setShowSuccessMessage(false);

  try {
    // Validate input
    if (!selectedFile && !validateYouTubeUrl(youtubeUrl)) {
      throw new Error('Please upload a video file or enter a valid YouTube URL');
    }

    let videoId;

    if (selectedFile) {
      // Handle file upload
      videoId = await uploadFile(selectedFile);

      // Process the uploaded file with retry logic
      try {
        const response = await axios.post(
          `${API_URL}/api/v1/process/${videoId}`,
          null,
          {
            timeout: 300000, // 5 minute timeout for processing
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.status === 401) {
          // Handle token refresh
          const refreshResponse = await axios.post(`${AUTH_API}/refresh`, {
            refreshToken: localStorage.getItem('refreshToken')
          });
          localStorage.setItem('token', refreshResponse.data.token);
          return handleGenerate();
        }

        if (response.data?.success) {
          await processSuccessResponse(videoId);
          return;
        }
        throw new Error(response.data?.error || 'Failed to process video');
      } catch (error) {
        console.error('File processing error:', error);

        if (error.response?.status === 401) {
          setUrlError('Session expired. Please log in again.');
          navigate('/login');
          return;
        }

        // Enhanced error handling for 404
        if (error.response?.status === 404) {
          throw new Error('Video processing service unavailable. Please try again later.');
        }

        throw new Error('Failed to process uploaded file');
      }
    } else {
      // Handle YouTube URL
      videoId = extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      // Try primary endpoint
      try {
        const response = await axios.post(
          `${YOUTUBE_API}/video/${videoId}`,
          null,
          {
            timeout: 10000,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.status === 401) {
          const refreshResponse = await axios.post(`${AUTH_API}/refresh`, {
            refreshToken: localStorage.getItem('refreshToken')
          });
          localStorage.setItem('token', refreshResponse.data.token);
          return handleGenerate();
        }

        if (response.data?.success) {
          await processSuccessResponse(videoId);
          return;
        }
        throw new Error(response.data?.error || 'Failed to process video');
      } catch (primaryError) {
        console.warn('Primary endpoint failed, trying fallback:', primaryError);

        if (primaryError.response?.status === 401) {
          setUrlError('Session expired. Please log in again.');
          navigate('/login');
          return;
        }

        // Try fallback endpoint
        try {
          const fallbackResponse = await axios.post(
            `${PYTHON_API}/transcript/${videoId}`,
            null,
            {
              timeout: 10000,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (fallbackResponse.data?.success) {
            await processSuccessResponse(videoId);
            return;
          }
          throw new Error(fallbackResponse.data?.error || 'Failed to process video');
        } catch (fallbackError) {
          console.error('Fallback endpoint failed:', fallbackError);

          if (fallbackError.response?.status === 401) {
            setUrlError('Session expired. Please log in again.');
            navigate('/login');
            return;
          }

          throw new Error('All processing endpoints failed');
        }
      }
    }
  } catch (error) {
    handleProcessingError(error);

    // Enhanced retry logic
    if (retryCount < maxRetries) {
      const isNetworkError = error.code === 'ECONNABORTED' || !error.response;
      const isServerError = error.response?.status >= 500;
      const isTemporaryError = error.response?.status === 404 || error.response?.status === 429;

      if (isNetworkError || isServerError || isTemporaryError) {
        const delay = 3000 * (retryCount + 1);
        console.log(`Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1})`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleGenerate();
        }, delay);
        return;
      }
    }
  } finally {
    setIsLoading(false);
    setUploadProgress(0);
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
                  {selectedFile ? (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg">
                            <FontAwesomeIcon icon={faFileVideo} className="text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm truncate max-w-[180px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeFile}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>

                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}

                      <div className="flex justify-center">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-grey hover:text-grey-900 transition-colors font-medium"
                        >
                          Choose different file
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="fileInput"
                      className="cursor-pointer block p-8"
                    >
                      <div className="border-2 border-dashed border-gray-700/50 rounded-lg p-6 flex flex-col items-center hover:border-[#6c5ce7]/50 transition-colors">
                        <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-3" />
                        <p className="text-gray-400 text-center mb-2">Drag & drop your file here</p>
                        <p className="text-gray-500 text-xs text-center mb-3">or click to browse</p>
                        <div className="px-4 py-1.5 bg-[#6c5ce7]/10 text-[#6c5ce7] text-xs font-medium rounded-full">
                          MP4, WebM, MOV (max 500MB)
                        </div>
                      </div>
                    </label>
                  )}
                  <input
                    type="file"
                    id="fileInput"
                    ref={fileInputRef}
                    className="hidden"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    onChange={handleFileChange}
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
              ${isLoading || (!youtubeUrl && !selectedFile)
                ? 'bg-gray-800/50 cursor-not-allowed shadow-inner'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transform hover:scale-[1.01] hover:shadow-xl shadow-lg'}`}
              onClick={handleGenerate}
              disabled={isLoading || (!youtubeUrl && !selectedFile)}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{selectedFile ? 'Uploading...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-lg" />
                  <span>{selectedFile ? 'Generate From Upload' : 'Generate From YouTube'}</span>
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
