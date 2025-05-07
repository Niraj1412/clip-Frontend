import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useClipsData } from '../context/clipsData';
import { usePrompt } from '../context/promptContext';
import { useVideoIds } from '../context/videoIds';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faVolumeUp, 
  faVolumeMute,
  faExpand, 
  faCompress,
  faDownload,
  faShare,
  faCheck,
  faSpinner,
  faInfoCircle,
  faExclamationCircle,
  faExclamationTriangle,
  faTimes,
  faArrowLeft,
  faArrowRight,
  faUndo,
  faRedo,
  faCut,
  faTrash,
  faPlus,
  faMinus,
  faEllipsisH,
  faCog,
  faSyncAlt,
  faFilm,
  faClock, 
  faLink,
  faShareAlt,
  faUpload,
  faSave,
  faRobot,
  faUser,
  faBrain,
  faSignOutAlt,
  faChevronLeft,
  faCopy,
  faQrcode,
  faDatabase,
  faCloud,
  faGears,
  faCloudDownload,
  faCheckCircle,
  faCircleNotch,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { 
  faTwitter, 
  faFacebook, 
  faWhatsapp, 
  faLinkedin,
  faFacebookF,  
  faLinkedinIn 
} from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, PROJECTS_API } from '../config';
import { QRCodeSVG } from 'qrcode.react';

const MergeClipsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [mergedVideoUrl, setMergedVideoUrl] = useState("");
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const { selectedClipsData } = useClipsData();
  const { prompt } = usePrompt();
  const { videoIds } = useVideoIds();
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [missingTools, setMissingTools] = useState([]);
  const [activeTab, setActiveTab] = useState('preview');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    totalClips: 0,
    processedClips: 0,
    cachedClips: 0,
    processingSpeed: 0
  });
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(null);
  const [previouslyDownloaded, setPreviouslyDownloaded] = useState([]);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const confettiRef = useRef(null);
  const confettiIntervalRef = useRef(null);
  const navigate = useNavigate();
  const [s3Url, setS3Url] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [videoPublished, setVideoPublished] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [isLocalStorageFallback, setIsLocalStorageFallback] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [processingMessage, setProcessingMessage] = useState("");
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [showVideoError, setShowVideoError] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('preparing');

  const API_BASE_URL = API_URL;

  useEffect(() => {
    // Check if there are selected clips
    if (!selectedClipsData || selectedClipsData.length === 0) {
      setErrorMessage("No clips selected for merging. Please go back and select clips.");
    } else {
      // Only start the merging process when the component first mounts
      // or if selectedClipsData actually changes in a meaningful way
      if (!mergeSuccess && !isLoading && !mergedVideoUrl) {
        handleMergeClips();
      }
    }
    // Only run on mount and if any of these critical states change
  }, []);  // Remove the empty dependency array so we can replace it
  
  // Handle any selectedClipsData changes after initial mount
  useEffect(() => {
    if (selectedClipsData && selectedClipsData.length > 0 && !mergeSuccess && !isLoading && !mergedVideoUrl) {
      // Only reset states if we need to process new clips
      setErrorMessage("");
      setProcessingProgress(0);
    }
  }, [selectedClipsData, mergeSuccess, isLoading, mergedVideoUrl]);

  // Simulate progress updates during processing with more realistic phase transitions
  useEffect(() => {
    if (isLoading) {
      setLoadingStartTime(Date.now());
      
      // Determine phases based on number of clips
      // Modified phases to focus on downloading, trimming, and merging (faster progression)
      let phaseTargets;
      if (selectedClipsData.length > 1) {
        phaseTargets = {
          'preparing': 5,  // Faster initial phase
          'downloading': 25, // Downloading phase is more prominent
          'trimming': 45,   // Added explicit trimming phase
          'merging': 75,    // Renamed to merging (from processing/encoding)
          'finalizing': 95
        };
      } else {
        phaseTargets = {
          'preparing': 10,
          'downloading': 35,
          'trimming': 70,   // Added trimming phase for single clips too
          'finalizing': 95
        };
      }
      
      // Initial phase
      setLoadingPhase('preparing');
      
      // Reset processing stats
      setProcessingStats({
        totalClips: selectedClipsData.length,
        processedClips: 0,
        cachedClips: 0,
        processingSpeed: 0
      });
      
      // More responsive progress simulation with faster transitions
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          // Calculate new progress value with faster progression
          let progressIncrement;
          
          switch(loadingPhase) {
            case 'preparing':
              progressIncrement = (Math.random() * 1.2) + 0.8; // Faster preparing phase
              break;
            case 'downloading':
              // Even faster progress if there are cached clips
              const cachedCount = previouslyDownloaded.filter(id => 
                selectedClipsData.some(clip => clip.videoId === id)
              ).length;
              
              progressIncrement = cachedCount > 0 
                ? (Math.random() * 2.0) + 1.5  // Much faster with cache
                : (Math.random() * 1.2) + 0.8; // Still faster without cache
              break;
            case 'trimming':
              progressIncrement = (Math.random() * 1.0) + 0.7; // Medium speed for trimming
              break;
            case 'merging':
              progressIncrement = (Math.random() * 0.8) + 0.5; // Slightly slower for merging
              break;
            case 'finalizing':
              progressIncrement = (Math.random() * 0.4) + 0.3; // Keep finalizing slower
              break;
            default:
              progressIncrement = 0.5;
          }
          
          // Apply smaller increments as we get closer to 100% to avoid jumps
          if (prev > 85) {
            progressIncrement = progressIncrement * 0.5;
          }
          
          // Calculate new progress
          let newProgress = prev + progressIncrement;
          
          // Check if we should transition to next phase
          if (loadingPhase === 'preparing' && newProgress >= phaseTargets.preparing) {
            setLoadingPhase('downloading');
            setProgressMessage("Downloading video clips...");
            
            // Update cached clips count
            const cachedCount = previouslyDownloaded.filter(id => 
              selectedClipsData.some(clip => clip.videoId === id)
            ).length;
            
            if (cachedCount > 0) {
              setProcessingStats(prev => ({
                ...prev,
                cachedClips: cachedCount
              }));
              
              setProgressMessage(`Using ${cachedCount} cached videos, downloading remaining...`);
            }
          } 
          else if (loadingPhase === 'downloading' && newProgress >= phaseTargets.downloading) {
            setLoadingPhase('trimming');
            setProgressMessage("Trimming video clips to exact timestamps...");
            
            // Update processed clips count
            setProcessingStats(prev => ({
              ...prev,
              processedClips: Math.max(1, Math.ceil(selectedClipsData.length * 0.4))
            }));
          } 
          else if (loadingPhase === 'trimming' && newProgress >= phaseTargets.trimming) {
            // If multiple clips, go to merging phase, otherwise finalize
            if (selectedClipsData.length > 1) {
              setLoadingPhase('merging');
              setProgressMessage("Merging clips into final video...");
              
              // Update processed clips count
              setProcessingStats(prev => ({
                ...prev,
                processedClips: Math.ceil(selectedClipsData.length * 0.8)
              }));
            } else {
              setLoadingPhase('finalizing');
              setProgressMessage("Finalizing your video...");
            
              // Update processed clips to complete
              setProcessingStats(prev => ({
                ...prev,
                processedClips: selectedClipsData.length
              }));
            }
          } 
          else if (loadingPhase === 'merging' && newProgress >= phaseTargets.merging) {
            setLoadingPhase('finalizing');
            setProgressMessage("Finalizing your video...");
            
            // Update processed clips to complete
            setProcessingStats(prev => ({
              ...prev,
              processedClips: selectedClipsData.length
            }));
          } 
          else if ((loadingPhase === 'trimming' || loadingPhase === 'merging') && newProgress % 3 < 1) {
            // More frequent updates to processed clip count to show faster progress
            const progressPercent = loadingPhase === 'trimming' ? 
              (newProgress - phaseTargets.downloading) / (phaseTargets.trimming - phaseTargets.downloading) :
              (newProgress - phaseTargets.trimming) / (phaseTargets.merging - phaseTargets.trimming);
              
            const processedCount = Math.max(
              Math.ceil(progressPercent * selectedClipsData.length),
              processingStats.processedClips
            );
            
            if (processedCount > processingStats.processedClips) {
              setProcessingStats(prev => ({
                ...prev,
                processedClips: processedCount
              }));
            }
          }
          
          // Calculate estimated time remaining with faster estimates
          const elapsedTime = (Date.now() - loadingStartTime) / 1000;
          
          if (elapsedTime > 1) {
            // Use a weighted average for speed calculation based on current phase
            let speedWeight;
            switch(loadingPhase) {
              case 'preparing':
                speedWeight = 0.7; // Preparing is usually faster
                break;
              case 'downloading':
                speedWeight = 0.5;
                break;
              case 'trimming':
                speedWeight = 0.3; // Trimming might slow down
                break;
              case 'merging':
                speedWeight = 0.25; // Merging is usually slower
                break;
              case 'finalizing':
                speedWeight = 0.2; // Finalizing is the slowest
                break;
              default:
                speedWeight = 0.4;
            }
            
            // Speed is progress per second (weighted by phase)
            const progressPerSecond = (newProgress / elapsedTime) * speedWeight;
            
            // Remaining progress from current to target (95%)
            const remainingProgress = 95 - newProgress;
            
            // Estimated time is remaining progress divided by speed
          const estimatedSecondsRemaining = remainingProgress / progressPerSecond;
          
            // Set estimated time only if calculation is valid
            if (!isNaN(estimatedSecondsRemaining) && isFinite(estimatedSecondsRemaining) && estimatedSecondsRemaining > 0) {
              // For short times, show seconds; for longer times, round to nearest minute
              if (estimatedSecondsRemaining < 90) {
                setEstimatedTimeRemaining(`${Math.ceil(estimatedSecondsRemaining)} sec`);
              } else {
                const minutes = Math.ceil(estimatedSecondsRemaining / 60);
                setEstimatedTimeRemaining(`${minutes} min`);
              }
              
              // Update processing speed stat
              setProcessingStats(prev => ({
                ...prev,
                processingSpeed: elapsedTime
              }));
            }
          }
          
          // Ensure progress doesn't exceed the cap for the artificial progress
          return newProgress > phaseTargets.finalizing ? phaseTargets.finalizing : newProgress;
        });
      }, 500); // Update every half second for smoother progress
      
      return () => clearInterval(interval);
    } else {
      // Reset states when not loading
      setProcessingProgress(0);
      setEstimatedTimeRemaining(null);
      setCancelRequested(false);
    }
  }, [isLoading, loadingPhase, selectedClipsData, previouslyDownloaded, processingStats]);

  const handleMergeClips = async () => {
    try {
      // Set loading state right away before any processing begins
      setIsLoading(true);
      setProcessingError(null);
      setProcessingMessage("Initializing merge process...");
      
      // Reset progress indicators to show activity
      setProcessingProgress(5); // Start with a small progress value to indicate activity
      setLoadingPhase('preparing');
      
      // Update processing stats with initial values
      setProcessingStats({
        totalClips: selectedClipsData.length,
        processedClips: 0,
        cachedClips: 0,
        processingSpeed: 0
      });
      
      // Prioritize S3 storage for better video handling
      setUseFallbackMode(false);
      
      if (selectedClipsData.length === 1) {
        // Show detailed message for processing single clip
        setProgressMessage(`Preparing to process ${getFilenameFromPath(selectedClipsData[0]?.title || 'video clip')}...`);
        
        // Handle single clip case
        await handleSingleClip(selectedClipsData[0]);
      } else {
        // Show detailed message for multiple clips
        setProgressMessage(`Preparing to merge ${selectedClipsData.length} clips...`);
        
        // Handle multiple clips case
        await handleMultipleClips(selectedClipsData);
      }
      
      // Validate video URLs after processing
      setTimeout(() => {
        console.log("Checking video URLs after processing");
        if (videoRef.current) {
          if (s3Url) {
            console.log("Using S3 URL for video:", s3Url);
            videoRef.current.src = s3Url;
          } else if (mergedVideoUrl) {
            console.log("Using merged URL for video:", mergedVideoUrl);
            videoRef.current.src = mergedVideoUrl;
          }
          videoRef.current.load();
          
          // Set a timeout to check if video loaded properly
          setTimeout(() => {
            if (videoRef.current && videoRef.current.duration === 0 || isNaN(videoRef.current.duration)) {
              console.log("Video duration still 0, trying to reload");
              // Try to reload the video
              videoRef.current.load();
            }
          }, 1000);
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error merging clips:", error);
      setProcessingError(`Error: ${error.message || "Failed to merge clips"}. Please try again.`);
      setUseFallbackMode(true);
      // Keep loading state false after error
      setIsLoading(false);
    }
    // Note: We don't set isLoading to false here in the final block
    // because we want it to remain true until the video is ready
    // The individual handling functions will set isLoading to false when appropriate
  };

  // Handle processing a single clip
  const handleSingleClip = async (clip) => {
    setProgressMessage("Processing single clip...");
    setIsLoading(true); // Ensure loader is visible
    
    // Ensure clip has valid data
    if (!clip) {
      throw new Error("Invalid clip data");
    }
    
    // Ensure clip has valid startTime and endTime
    const startTime = typeof clip.startTime === 'number' ? clip.startTime : 0;
    const endTime = typeof clip.endTime === 'number' ? clip.endTime : 0;
    
    if (startTime >= endTime) {
      throw new Error(`Invalid clip timing: start (${startTime}) must be less than end (${endTime})`);
    }
    const videoId = clip.videoId;
    
    if (!videoId) {
      throw new Error("No video ID found for the clip");
    }
    
    try {
      setProgressMessage(`Downloading video from YouTube (ID: ${videoId})...`);
      setProcessingProgress(30);
      
      const response = await axios.get(`${API_BASE_URL}/api/merge/process`, {
        params: {
          videoId,
          startTime,
          endTime
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      
      setProcessingProgress(70);
      setProgressMessage(`Trimming video from ${formatTimeRange(startTime, endTime)}...`);
      
      if (response.data.success) {
        // If we have a job ID, we can use it to access the video
        if (response.data.jobId) {
          const jobId = response.data.jobId;
          
          // Use the required path format
          const videoPath = getVideoPath(jobId);
          const videoUrl = `${API_BASE_URL}/api/merge/video/${response.data.videoPath}`;
          
          // For compatibility, also set the mergedVideoUrl with the API URL
          const apiVideoUrl = `${API_BASE_URL}/api/merge/video/${jobId}/${response.data.videoPath || `merged_${jobId}.mp4`}`;
          
          setMergedVideoUrl(apiVideoUrl);
          setMergeSuccess(true);
          setProgressMessage("Clip processed successfully!");
          setProcessingProgress(100);
          
          // Ensure video element uses the required path
          if (videoRef.current) {
            videoRef.current.src = videoPath;
            videoRef.current.load();
          }
        } else {
          throw new Error("No job ID returned from server");
        }
      } else {
        throw new Error(response.data.message || "Unknown error processing clip");
      }
    } catch (error) {
      console.error("Error downloading single clip:", error);
      
      // Show a more user-friendly error message
      if (error.response?.status === 404) {
        throw new Error(`Download endpoint not available. Please ensure the backend server is running at ${API_BASE_URL}`);
      } else if (error.response?.status === 500) {
        throw new Error(`Server error: ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timed out after ${error.config.timeout / 1000} seconds. The video might be too large or the server might be busy.`);
      } else {
        throw error;
      }
    }
  };

  // Get file name from a URL or path
  const getFilenameFromPath = (filePath) => {
    if (!filePath) return '';
    // Split on slashes and take the last part
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  };

  const handleMultipleClips = async (clips) => {
    setProgressMessage("Preparing to merge clips...");
    setProcessingProgress(15);
    setIsLoading(true); // Ensure loader is visible
    
    // Format clips for the API with videoId included in each clip
    const formattedClips = clips.map(clip => ({
      videoId: clip.videoId,
      startTime: typeof clip.startTime === 'number' ? clip.startTime : 0,
      endTime: typeof clip.endTime === 'number' ? clip.endTime : 0,
      title: clip.title || `Clip at ${clip.startTime}s`
    }));

    // Validate clips before sending to API
    const invalidClips = formattedClips.filter(clip => 
      !clip.videoId || clip.startTime >= clip.endTime
    );
    
    if (invalidClips.length > 0) {
      throw new Error(`Found ${invalidClips.length} invalid clips. Please check that all clips have valid start and end times.`);
    }

    setProgressMessage("Sending clips to server for processing...");
    setProcessingProgress(25);
     
    console.log("Making API call to merge clips with data:", {
      clips: formattedClips
    });

    try {
      // First, call the API with JSON response type to get the job ID and status
      const response = await axios.post(`${API_BASE_URL}/api/merge/clips`, {
        clips: formattedClips
      }, {
        timeout: 900000, // 15 minute timeout for merging multiple clips
        headers: {
          'Accept': 'application/json' // Request JSON instead of blob
        }
      });
      
      // Check if we received an early response with inProgress flag
      if (response.data.success && response.data.inProgress) {
        // We got an early response, meaning the process is still running
        // but we can update the UI with the job ID and start polling
        
        // Update processing stats
        if (response.data.cachedClips) {
          setProcessingStats(prev => ({
            ...prev,
            cachedClips: response.data.cachedClips,
            totalClips: response.data.totalClips || clips.length
          }));
          
          // Update progress message to show we're using cached clips
          setProgressMessage(`Using ${response.data.cachedClips} cached videos, downloading the rest...`);
        }
        
        setProcessingProgress(60);
        
        // Start polling for completion
        if (response.data.jobId) {
          setProgressMessage("Server is processing clips in the background...");
          startPollingForFile(response.data.jobId);
          return; // Return early
        }
      }
      
      // This is the normal flow for when we get a complete response
      setProcessingProgress(60);
      
      if (response.data.success) {
        // Check if S3 URL is provided in response
        if (response.data.s3Url) {
          setS3Url(response.data.s3Url);
          setShareUrl(response.data.s3Url);
          setMergeSuccess(true);
          setProgressMessage("Clips merged successfully and stored in S3!");
          setProcessingProgress(100);
          return;
        }
        
        if (response.data.jobId) {
          const jobId = response.data.jobId;
          
          if (response.data.mergedVideo) {
            // Create a URL that points to the video file on the server
            const videoFileName = getFilenameFromPath(response.data.mergedVideo);
            const videoUrl = `${API_BASE_URL}/api/merge/video/${jobId}/${videoFileName}`;
            
            setMergeSuccess(true);
            setMergedVideoUrl(videoUrl);
            setProgressMessage("Clips merged successfully!");
            setProcessingProgress(100);
          } 
          // If video is still processing, start polling for completion
          else {
            setProgressMessage("Processing is continuing in the background...");
            // Poll for the file to be ready
            startPollingForFile(jobId);
          }
        } else {
          throw new Error("No job ID returned from server");
        }
      } else {
        throw new Error(response.data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error in handleMultipleClips:", error);
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED') {
        setErrorMessage(`The request timed out after ${error.config.timeout / 1000} seconds. The video might be too large or the server might be busy. Try with fewer or shorter clips.`);
        return;
      }
      
      // If the API call fails, try the client-side fallback
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log("API call failed. Using client-side fallback...");
        return await handleClientSideFallback(clips);
      }
      
      // Add more specific error handling
      if (error.message && error.message.includes("Network Error")) {
        setErrorMessage("Network error: Could not connect to the server. Please check your internet connection and ensure the backend is running.");
        return;
      }
      
      throw error;
    }
  };

  // Poll for the file to be ready
  const startPollingForFile = (jobId) => {
    setProgressMessage("Processing clips in the background. This may take a few minutes...");
    // Keep the loading state active while polling
    setIsLoading(true);
    
    // Track polling attempts
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes at 5-second intervals
    
    // For the initial polling attempt, try checking right away (1 second)
    setTimeout(() => {
      checkJobStatus(jobId);
    }, 1000);
    
    // Set up an interval to check if the file exists
    const pollInterval = setInterval(() => {
      checkJobStatus(jobId);
    }, 5000); // Check every 5 seconds
    
    // Function to check job status
    async function checkJobStatus(jobId) {
      attempts++;
      
      try {
        // Update loading phase based on attempts with more gradual transitions
        if (attempts <= 2) {
          setLoadingPhase('preparing');
          setProgressMessage("Server is preparing to process clips...");
        } else if (attempts <= 6) {
          setLoadingPhase('downloading');
          setProgressMessage("Downloading video clips from YouTube...");
        } else if (attempts <= 12) {
          setLoadingPhase('trimming');
          setProgressMessage("Trimming clips to selected timeframes...");
        } else if (attempts <= 20) {
          setLoadingPhase('merging');
          setProgressMessage("Merging clips into final video...");
        } else {
          setLoadingPhase('finalizing');
          setProgressMessage("Finalizing video and preparing for playback...");
        }
        
        // Check if the video file is ready
        const response = await axios.get(`${API_BASE_URL}/api/merge/video/${jobId}/status`);
        
        // Update processing stats with information from the server
        if (response.data && response.data.videoFiles) {
          setProcessingStats(prev => ({
            ...prev,
            processedClips: response.data.videoFiles,
            totalClips: response.data.totalFiles || prev.totalClips
          }));
        }

        // Check for S3 URL in response
        if (response.data && response.data.s3Url) {
          console.log("Found S3 URL in job status:", response.data.s3Url);
          setS3Url(response.data.s3Url);
          setProgressMessage("Video is ready on cloud storage!");
        }
        
        if (response.data.success && response.data.fileReady) {
          // File exists, stop polling
          clearInterval(pollInterval);
          
          // Check if there's an S3 URL in the response
          if (response.data.s3Url) {
            setS3Url(response.data.s3Url);
            setShareUrl(response.data.s3Url);
            setMergedVideoUrl("");  // No need for local URL when we have S3
            setProgressMessage("Clips merged successfully and stored in S3!");
            setProcessingProgress(100);
            setMergeSuccess(true);
            setIsLoading(false);
            return;
          }
          
          // Otherwise use the local file with the required path format
          const videoFileName = response.data.files[0] || `merged_${jobId}.mp4`;
          const videoPath = `/temp/${jobId}/${videoFileName}`;
          const videoUrl = `${API_BASE_URL}/api/merge/video/${jobId}/${videoFileName}`;
          
          setMergedVideoUrl(videoUrl);
          setProgressMessage("Clips merged successfully!");
          setProcessingProgress(100);
          setMergeSuccess(true);
          setIsLoading(false); // Stop showing the loader only when complete
          
          // Force refresh the video element with the required path
          const videoElement = document.querySelector('video');
          if (videoElement) {
            videoElement.src = videoPath;
            videoElement.load();
          }
        } else {
          // File doesn't exist yet, continue polling
          console.log(`File not ready yet (attempt ${attempts}/${maxAttempts}), continuing to poll...`);
          
          // Update progress message with attempt count
          if (attempts > 1) {
            // Make the message more informative about the current state
            let statusMessage;
            if (attempts < 6) {
              statusMessage = "Preparing your clips...";
            } else if (attempts < 10) {
              statusMessage = "Downloading videos from YouTube...";
            } else if (attempts < 15) {
              statusMessage = "Trimming clips to selected timestamps...";
            } else if (attempts < 20) {
              statusMessage = "Merging clips into final video...";
            } else if (attempts < 25) {
              statusMessage = "Uploading video to cloud storage...";
            } else {
              statusMessage = "Almost done! Finalizing your video...";
            }
            
            setProgressMessage(`${statusMessage} (attempt ${attempts}/${maxAttempts})`);
            
            // Update progress based on attempts - more gradual progression
            setProcessingProgress(Math.min(95, 30 + (attempts / maxAttempts) * 65));
          }
          
          // If we've reached max attempts, stop polling
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setProgressMessage("Processing is taking longer than expected. Try refreshing the page in a few minutes.");
            setIsLoading(false); // Stop showing loader if polling times out
          }
        }
      } catch (error) {
        console.log("Error checking file:", error);
        
        // Update progress message with attempt count
        if (attempts > 1) {
          setProgressMessage(`Processing clips in the background (attempt ${attempts}/${maxAttempts})...`);
        }
        
        // If we've reached max attempts, stop polling
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setProgressMessage("Processing may still be in progress. Try refreshing the page in a few minutes.");
          setIsLoading(false); // Stop showing loader if polling times out with error
        }
      }
    }
    
    return () => clearInterval(pollInterval);
  };

  // Client-side fallback when backend API is unavailable
  const handleClientSideFallback = async (clips) => {
    setProgressMessage("Backend API unavailable. Processing clips in browser...");
    
    // For now, just process the first clip as a fallback
    if (clips.length > 0) {
      // Show a warning that we're only processing the first clip
      if (clips.length > 1) {
        setErrorMessage("Backend server unavailable. Only processing the first clip as a fallback. Please restart the backend server for full functionality.");
      }
      
      // Process the first clip
      await handleSingleClip(clips[0]);
      return;
    } else {
      throw new Error("No clips available to process");
    }
  };

  const handleDownload = () => {
    // Don't allow download if the file is still processing
    if (progressMessage.includes("background") || progressMessage.includes("still be in progress")) {
      setErrorMessage("The video is still processing. Please wait until it's ready to download.");
      return;
    }
    
    // Priority order: s3Url first (more reliable), then local mergedVideoUrl
    const videoUrl = s3Url || mergedVideoUrl;
    
    if (!videoUrl) {
      setErrorMessage("No video is available to download.");
      return;
    }
    
    // Generate a filename based on video metadata
    const clipType = selectedClipsData.length === 1 ? "clip" : "merged";
    const timestamp = Date.now();
    const filename = videoTitle 
      ? `${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.mp4`
      : `${clipType}-video-${timestamp}.mp4`;
    
    try {
      if (videoUrl.startsWith('blob:')) {
        // For blob URLs (client-side generated content)
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (videoUrl.includes('amazonaws.com') || videoUrl.includes('s3.')) {
        // For S3 URLs, we need to handle CORS and potential signed URL issues
        fetch(videoUrl)
          .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
          })
          .then(blob => {
            // Create a local blob URL from the fetched content
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Clean up the blob URL after download
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          })
          .catch(error => {
            console.error('Error downloading from S3:', error);
            // Fallback to direct link if fetch fails
            window.open(videoUrl, '_blank');
          });
      } else {
        // For other server URLs
        const downloadUrl = `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}download=true&filename=${encodeURIComponent(filename)}`;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error("Download error:", error);
      // Final fallback - just open the URL in a new tab
      window.open(videoUrl, '_blank');
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVideoTimeUpdate = (e) => {
    if (e.target.currentTime) {
      setCurrentTime(e.target.currentTime);
    }
  };

  const handleVideoDurationChange = (e) => {
    if (e.target.duration && !isNaN(e.target.duration)) {
      setDuration(e.target.duration);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
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

  // Modify this function to handle cancel request
  const handleCancelProcessing = () => {
    setCancelRequested(true);
    setProgressMessage("Cancelling processing...");
    
    // Try to cancel the processing on the server if we have an ongoing job
    if (progressMessage.includes("background") || progressMessage.includes("continuing")) {
      // Here you would normally call an API endpoint to cancel the process
      // For now we'll just simulate it
      console.log("Attempting to cancel background processing...");
      
      // For demonstration, add a slight delay for UX
    setTimeout(() => {
      setIsLoading(false);
      setErrorMessage("Processing was cancelled by user.");
        setCancelRequested(false);
        
        // Reset the progress state
        setProcessingProgress(0);
        setMergedVideoUrl("");
        setLoadingPhase('preparing');
    }, 1500);
    } else {
      // For client-side processing, just stop immediately
      setIsLoading(false);
      setErrorMessage("Processing was cancelled by user.");
      setCancelRequested(false);
    }
  };

  // Function to create a confetti particle
  const createConfettiParticle = () => {
    const colors = ['#6c5ce7', '#a29bfe', '#ffeaa7', '#55efc4', '#ff79c6'];
    const particle = document.createElement('div');
    
    const size = Math.random() * 10 + 5;
    const speed = Math.random() * 30 + 11;
    const angle = Math.random() * 360;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const type = Math.random() > 0.6 ? 'circle' : 'star';
    
    particle.className = type === 'star' ? 'confetti-star' : 'confetti-particle';
    particle.style.backgroundColor = color;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    if (type === 'star') {
      particle.innerHTML = '★';
      particle.style.color = color;
      particle.style.fontSize = `${size * 2}px`;
      particle.style.backgroundColor = 'transparent';
    }
    
    const posX = Math.random() * window.innerWidth;
    
    particle.style.position = 'fixed';
    particle.style.left = `${posX}px`;
    particle.style.top = '-10px';
    particle.style.zIndex = '9999';
    particle.style.opacity = '1';
    
    confettiRef.current.appendChild(particle);
    
    const animateParticle = () => {
      const posY = parseFloat(particle.style.top) + speed;
      const rotation = parseFloat(particle.style.transform?.match(/rotate\(([-0-9.]+)deg\)/) || [0, 0])[1] + 5;
      
      particle.style.top = `${posY}px`;
      particle.style.transform = `rotate(${rotation}deg)`;
      particle.style.opacity = Math.max(0, 1 - posY / window.innerHeight);
      
      if (posY < window.innerHeight) {
        requestAnimationFrame(animateParticle);
      } else {
        confettiRef.current?.removeChild(particle);
      }
    };
    
    requestAnimationFrame(animateParticle);
  };

  // Show success animation when mergeSuccess becomes true
  useEffect(() => {
    if (mergeSuccess && !showSuccessAnimation) {
      setShowSuccessAnimation(true);
      
      // Create confetti interval
      if (confettiRef.current) {
        // Clear any existing interval
        if (confettiIntervalRef.current) {
          clearInterval(confettiIntervalRef.current);
        }
        
        // Start emitting confetti
        confettiIntervalRef.current = setInterval(() => {
          for (let i = 0; i < 3; i++) {
            createConfettiParticle();
          }
        }, 200);
        
        // Stop emitting confetti after 4 seconds
        setTimeout(() => {
          if (confettiIntervalRef.current) {
            clearInterval(confettiIntervalRef.current);
          }
        }, 4000);
      }
    }
    
    return () => {
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current);
      }
    };
  }, [mergeSuccess, showSuccessAnimation]);

  // Toggle play/pause for video
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle video play/pause events
  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  // Seek video forward/backward by 5 seconds
  const seekVideo = (seconds) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime += seconds;
  };

  // Add an effect to handle interruptions and cleanup
  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
      // Clear any confetti animation interval
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current);
      }
      
      // If there's an ongoing process when navigating away, could log this or notify user
      if (isLoading) {
        console.log("Navigation occurred during active processing. Process may continue in the background.");
      }
    };
  }, [isLoading]);

  // Add an effect to detect API errors during polling
  useEffect(() => {
    let errorCheckTimer = null;
    
    // If we're waiting for the backend to process, but the error message appears
    // we should stop showing the loading state
    if (isLoading && errorMessage) {
      // Allow a small delay to see the error before stopping the loader
      errorCheckTimer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
    
    return () => {
      if (errorCheckTimer) {
        clearTimeout(errorCheckTimer);
      }
    };
  }, [isLoading, errorMessage]);

  // Add formatTimeRange function definition above where it's being used
  const formatTimeRange = (start, end) => {
    if (typeof start !== 'number' || typeof end !== 'number') return '0:00 - 0:00';
    
    const formatToHHMMSS = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      return `${minutes}:${String(secs).padStart(2, '0')}`;
    };

    return `${formatToHHMMSS(start)} - ${formatToHHMMSS(end)}`;
  };

  // Fix timeRemaining variable in the progress indicator section
  // Near line 1248, add a timeRemaining calculation
  // Calculate estimated time remaining based on progress
  const estimateTimeRemaining = () => {
    if (processingProgress >= 95 || processingProgress <= 0) return null;
    
    // Estimate based on how long it's taken to get to current progress
    const elapsedTime = (Date.now() - loadingStartTime) / 1000; // in seconds
    const estimatedTotalTime = (elapsedTime / processingProgress) * 100;
    const timeRemaining = Math.round(estimatedTotalTime - elapsedTime);
    
    return timeRemaining > 0 ? timeRemaining : null;
  };
  
  const timeRemaining = estimateTimeRemaining();

  // Function to handle sharing the video link
  const handleShareVideo = () => {
    setShowShareModal(true);
  };
  
  // Check if the video is shareable (has an S3 URL)
  const isVideoShareable = () => {
    return Boolean(s3Url);
  };

  // Add a function to get a public S3 URL if needed
  const getPublicS3Url = async () => {
    try {
      // Reset any previous error messages
      setErrorMessage("");
      
      // If we already have an S3 URL, no need to fetch again
      if (s3Url) {
        setShareUrl(s3Url);
        return true;
      }
      
      // If we have a job ID but no S3 URL, fetch the public URL from the server
      if (mergedVideoUrl) {
        // Show loading message
        setProgressMessage("Preparing video for sharing. This may take a moment...");
        
        // Extract job ID from mergedVideoUrl if available
        // Example URL: http://localhost:4001/api/merge/video/0d7bbfc4-8d5a-4e50-8507-e94c4f082b6a/merged_1742710736093.mp4
        const urlMatch = mergedVideoUrl.match(/\/api\/merge\/video\/([^\/]+)\//);
        let jobId = null;
        
        if (urlMatch && urlMatch[1]) {
          jobId = urlMatch[1];
        }
        
        if (jobId) {
          // Request a public S3 URL for this video (this will upload it to S3 if needed)
          const response = await axios.get(`${API_BASE_URL}/api/merge/video/${jobId}/public-url`);
          
          if (response.data && response.data.success && response.data.s3Url) {
            setS3Url(response.data.s3Url);
            setShareUrl(response.data.s3Url);
            
            // If the backend had to upload the video to S3, show a success message
            if (response.data.message && response.data.message.includes("automatically uploaded")) {
              setProgressMessage("Video successfully uploaded to cloud storage!");
              // Update message after 3 seconds
              setTimeout(() => {
                setProgressMessage("");
              }, 3000);
            }
            
            return true;
          }
        }
      }
      
      // If we couldn't get an S3 URL, show a more helpful error message
      setErrorMessage("Unable to generate a shareable link. Please try processing the video again.");
      setProgressMessage("");
      return false;
    } catch (error) {
      console.error("Error getting public S3 URL:", error);
      
      // Provide more specific error messages based on error type
      if (error.response?.status === 404) {
        setErrorMessage("Video not found. It may have been deleted or moved.");
      } else if (error.response?.status === 500) {
        setErrorMessage("Server error while preparing shareable link. Please try again later.");
      } else {
        setErrorMessage("Error generating shareable link. Please try again later.");
      }
      
      setProgressMessage("");
      return false;
    }
  };

  // Function to copy link to clipboard
  const copyToClipboard = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setErrorMessage('Failed to copy to clipboard');
      });
  };

  // Function to share on social media
  const shareOnSocial = (platform) => {
    if (!shareUrl) return;
    
    let shareLink = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(selectedClipsData && selectedClipsData.length === 1 
      ? (selectedClipsData[0].title || 'Video Clip') 
      : `Merged Video (${selectedClipsData ? selectedClipsData.length : 0} clips)`);
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${title}%20${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  // Function to check if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Inside the QR code section, let's add a useEffect for debugging
  useEffect(() => {
    if (shareUrl) {
      console.log("Share URL for QR code:", shareUrl);
      console.log("Is valid URL:", isValidUrl(shareUrl));
    }
  }, [shareUrl]);

  // Add a function to extract jobId from the video URL
  const extractJobIdFromUrl = (url) => {
    if (!url) return null;
    
    // Example URL: http://localhost:4001/api/merge/video/0d7bbfc4-8d5a-4e50-8507-e94c4f082b6a/merged_1742710736093.mp4
    const matches = url.match(/\/api\/merge\/video\/([^\/]+)\//);
    if (matches && matches[1]) {
      return matches[1];
    }
    return null;
  };

  // Function to generate the correct video path format
  const getVideoPath = (jobId) => {
    if (!jobId) return null;
    return `/temp/${jobId}/merged_${jobId}.mp4`;
  };

  // Decode JWT token to get user information
  useEffect(() => {
    const getUserFromToken = () => {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!token) return null;
      
      try {
        // Simple parsing of JWT token (base64 encoded)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Use native browser atob function for base64 decoding
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        
        return JSON.parse(jsonPayload);
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    };
    
    const user = getUserFromToken();
    if (user) {
      setUserData(user);
    }
  }, []);

  // Generate AI summary using clip titles and descriptions
  const generateAISummary = async () => {
    if (!selectedClipsData || selectedClipsData.length === 0) return;
    
    setIsSummaryLoading(true);
    try {
      // Get auth token
      const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!userToken) {
        console.error("No authentication token found");
        // Generate a fallback summary
        generateFallbackSummary();
        return;
      }
      
      // Create context from clip data
      const clipContext = selectedClipsData.map((clip, index) => {
        return `Clip ${index + 1}: "${clip.title || 'Untitled'}" (${formatTimeRange(clip.startTime, clip.endTime)})`
      }).join('\n');
      
      try {
        const response = {data: { summary: 'test summary' }}; 
        
        if (response.data && response.data.summary) {
          setAiGeneratedSummary(response.data.summary);
          if (!videoDescription.trim()) {
            setVideoDescription(response.data.summary);
          }
        } else {
          // If no summary in response, use fallback
          generateFallbackSummary();
        }
      } catch (apiError) {
        console.error("Error calling AI summary API:", apiError);
        // Generate a fallback summary if API call fails
        generateFallbackSummary();
      }
    } catch (error) {
      console.error("Error in generateAISummary:", error);
      // Generate a fallback summary
      generateFallbackSummary();
    } finally {
      setIsSummaryLoading(false);
    }
  };
  const generateFallbackSummary = () => {
    let summary = '';
    
    if (selectedClipsData.length === 1) {
      const clip = selectedClipsData[0];
      const title = clip.title || 'Untitled clip';
      const duration = formatTime(clip.endTime - clip.startTime);
      summary = `A ${duration} video clip titled "${title}". This clip captures a key moment from the original video.`;
    } else {
      const totalDuration = formatTime(selectedClipsData.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0));
      const clipTitles = selectedClipsData.map(clip => clip.title || 'Untitled clip').join('", "');
      
      summary = `A compilation of ${selectedClipsData.length} clips: "${clipTitles}". 
                This ${totalDuration} merged video combines key moments selected from ${selectedClipsData.length} different sources,
                creating a seamless viewing experience that highlights the most important content.`;
    }
    
    setAiGeneratedSummary(summary);
    
    // Also set as description if user hasn't entered anything substantial
    if (!videoDescription.trim() || videoDescription.split('\n').length === selectedClipsData.length) {
      setVideoDescription(summary);
    }
  };

  // Initialize video title based on selected clips when merge is successful
  useEffect(() => {
    if (mergeSuccess && selectedClipsData.length > 0) {
      if (selectedClipsData.length === 1) {
        setVideoTitle(selectedClipsData[0]?.title || 'Video Clip');
      } else {
        setVideoTitle(`Merged Video (${selectedClipsData.length} clips)`);
      }

      const description = selectedClipsData.map((clip, index) => 
        `Clip ${index + 1}: ${clip.title || 'Untitled clip'}`
      ).join('\n');
      
      setVideoDescription(description);
      
      // Generate AI summary when video is ready
      generateAISummary();
    }
  }, [mergeSuccess, selectedClipsData]);

  // Function to publish the video to the user's projects and save to the database
  const handlePublishVideo = async () => {
    if (!mergedVideoUrl && !s3Url) {
      setPublishErrorMessage("No video available to publish. Please process a video first.");
      return;
    }

    try {
      setPublishLoading(true);
      setPublishErrorMessage("");
      console.log("Starting publish process...");

      const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
      
      if (!userToken) {
        setPublishErrorMessage("You must be logged in to publish videos. Please log in and try again.");
        return;
      }

      // Validate token format
      if (!userToken || userToken.split('.').length !== 3) {
        setPublishErrorMessage("Invalid authentication token. Please log out and log in again.");
        return;
      }

      const jobId = extractJobIdFromUrl(mergedVideoUrl);
      
      if (!jobId && !s3Url) {
        setPublishErrorMessage("Unable to identify the video. Please try processing it again.");
        return;
      }

      const userDetails = userData || { userId: 'unknown' };
      console.log("User details for publish:", { 
        userId: userDetails.userId || userDetails._id || userDetails.id || 'guest',
        userEmail: userDetails.email || 'guest@example.com' 
      });

      // Create project data object with enhanced information
      const projectData = {
        title: videoTitle || "Untitled Video",
        description: videoDescription || "",
        jobId: jobId || `s3_${Date.now()}`, // Use timestamp as fallback ID for S3 videos
        duration: duration || 0,
        s3Url: s3Url || mergedVideoUrl,
        thumbnailUrl: selectedClipsData && selectedClipsData[0]?.thumbnail || '',
        createdAt: new Date().toISOString(),
        userId: userDetails.userId || userDetails._id || userDetails.id || 'guest',
        userEmail: userDetails.email || 'guest@example.com',
        userName: userDetails.name || 'Guest User',
        aiSummary: aiGeneratedSummary || "",
        // Include all context data for the backend
        clipsData: selectedClipsData || [],
        promptContext: prompt || "",
        videoIds: videoIds || [],
        sourceClips: selectedClipsData ? selectedClipsData.map(clip => ({
          videoId: clip.videoId || '',
          title: clip.title || 'Untitled clip',
          // Use proper properties from the clip object, with fallbacks
          startTime: clip.startTime || 0,
          endTime: clip.endTime || 0,
          duration: (clip.endTime || 0) - (clip.startTime || 0),
          // Ensure thumbnail has a fallback
          thumbnail: clip.thumbnail || (clip.videoId ? `https://img.youtube.com/vi/${clip.videoId}/mqdefault.jpg` : ''),
          originalVideoTitle: clip.originalVideoTitle || clip.title || 'Unknown source'
        })) : [],
        stats: {
          totalClips: selectedClipsData?.length || 0,
          totalDuration: duration || 0,
          processingTime: processingStats?.processingSpeed || 0,
          mergeDate: new Date().toISOString()
        }
      };

      // Save to projects API with detailed error handling
      try {
        console.log("Sending project data to API:", { 
          url: PROJECTS_API,
          dataSize: JSON.stringify(projectData).length,
          tokenLength: userToken.length,
          title: projectData.title,
          s3Url: projectData.s3Url ? projectData.s3Url.substring(0, 20) + '...' : 'No URL'
        });
        
        // Use the projects API which now creates both a project and published video entry
        const response = await axios.post(PROJECTS_API, projectData, {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15-second timeout for the publish request
        });

        console.log("Project API response:", response.data);

        if (response.data && response.data.success) {
          // If the project was created successfully, show success message
          setPublishSuccess(true);
          setVideoPublished(true);
          
          // Save this video's ID to localStorage to remember it was published
          const jobId = extractJobIdFromUrl(mergedVideoUrl) || '';
          if (jobId) {
            const publishedVideos = JSON.parse(localStorage.getItem('publishedVideos') || '[]');
            if (!publishedVideos.includes(jobId)) {
              publishedVideos.push(jobId);
              localStorage.setItem('publishedVideos', JSON.stringify(publishedVideos));
            }
          }
          
          console.log("Video published successfully:", {
            projectId: response.data.project?._id,
            videoId: response.data.publishedVideo?._id
          });
          setTimeout(() => {
            setShowPublishModal(false);
            // Reset after closing modal - only reset publishSuccess, not videoPublished
            setTimeout(() => setPublishSuccess(false), 500);
          }, 2000);
        } else {
          throw new Error(response.data?.message || "Failed to publish video - unknown error");
        }
      } catch (apiError) {
        console.error("API Error details:", {
          message: apiError.message,
          response: apiError.response ? {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            data: apiError.response.data
          } : 'No response',
          request: apiError.request ? 'Request was made but no response received' : 'Error setting up request'
        });
        
        // Specific error handling based on status codes
        if (apiError.response) {
          const status = apiError.response.status;
          
          if (status === 401) {
            // Prevent automatic session refresh on 401 errors to avoid infinite loops
            setPublishErrorMessage("Authentication failed. Please log in again manually.");
            // Show the login/session modal to prompt manual login
            setShowSessionModal(true);
            return; // Exit without rethrowing
          } else if (status === 403) {
            setPublishErrorMessage("You don't have permission to publish videos. Please contact support.");
          } else if (status === 413) {
            setPublishErrorMessage("The video data is too large to publish. Try a smaller video or contact support.");
          } else if (status >= 500) {
            setPublishErrorMessage("The server encountered an error. Please try again later or contact support.");
          } else {
            setPublishErrorMessage(apiError.response.data?.message || "Failed to publish video. Please try again.");
          }
        } else if (apiError.request) {
          // Request was made but no response received (network issue)
          setPublishErrorMessage("Network error. Please check your connection and try again.");
        } else {
          // Error in setting up the request
          setPublishErrorMessage("Failed to set up publish request. Please try again or contact support.");
        }
        
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("Error publishing video:", error);
      // Only set a generic error if one hasn't already been set by specific handlers
      if (!publishErrorMessage) {
        setPublishErrorMessage("Failed to publish video. Please try again later.");
      }
    } finally {
      setPublishLoading(false);
    }
  };

  // Function to open the publish modal
  const openPublishModal = () => {
    setPublishErrorMessage("");
    setShowPublishModal(true);
    
    // Generate AI summary if it hasn't been generated yet
    if (!aiGeneratedSummary && !isSummaryLoading) {
      generateAISummary();
    }
  };

  // Add a function to refresh the user's session token
  const refreshUserSession = async () => {
    try {
      // Prevent multiple refresh attempts in quick succession
      if (refreshingSession) {
        console.log("Session refresh already in progress, skipping");
        return false;
      }
      
      // Add a timestamp check to prevent repeated calls
      const lastRefreshAttempt = localStorage.getItem('lastTokenRefreshAttempt');
      const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown
      
      if (lastRefreshAttempt && (Date.now() - parseInt(lastRefreshAttempt)) < REFRESH_COOLDOWN) {
        console.log("Token refresh attempted too recently. Please try again later.");
        setPublishErrorMessage("Please wait a moment before trying again.");
        return false;
      }
      
      // Set the current timestamp for this attempt
      localStorage.setItem('lastTokenRefreshAttempt', Date.now().toString());
      
      setRefreshingSession(true);
      
      // Get the existing token - we'll need it for session refresh
      const currentToken = localStorage.getItem('userToken') || localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!currentToken) {
        // No token - switch to demo mode
        activateDemoMode();
        return true;
      }
      
      // Check token expiration by decoding it
      try {
        const tokenParts = currentToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("Token payload:", payload);
          
          // Check if token has exp claim and is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("Token is expired based on exp claim");
          } else if (payload.exp) {
            console.log("Token is still valid until:", new Date(payload.exp * 1000).toLocaleString());
            // Token is still valid according to exp claim
            setShowSessionModal(false);
            
            // Don't automatically retry the publish operation - let user do it manually
            setPublishErrorMessage("");
            return true;
          }
        }
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
      }
      
      // Check if we have user data in localStorage to use for quick re-authentication
      const storedUserData = localStorage.getItem('userData') || localStorage.getItem('user');
      let user = null;
      
      if (storedUserData) {
        try {
          user = JSON.parse(storedUserData);
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }
      
      // Try to refresh the token with the backend - if that API exists
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken
          }, { timeout: 5000 });
          
          if (refreshResponse.data && refreshResponse.data.token) {
            // Store the new token
            localStorage.setItem('token', refreshResponse.data.token);
            if (refreshResponse.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            }
            
            // Session successfully refreshed
            setShowSessionModal(false);
            
            setPublishErrorMessage("");
            // Don't automatically retry the publish operation - let user do it manually
            return true;
          }
        } catch (refreshError) {
          console.error("Token refresh API failed:", refreshError);
          // Continue to fallback authentication
        }
      }
      
      // If we have the user's email/id, we can try a silent re-authentication
      if (user && (user.email || user.userId || user.id)) {
        try {
          // Simple session extension - this depends on your backend supporting this
          const silentAuthResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/extend-session`, {
            userId: user.userId || user.id,
            email: user.email
          }, { timeout: 5000 });
          
          if (silentAuthResponse.data && silentAuthResponse.data.token) {
            // Store the new token
            localStorage.setItem('token', silentAuthResponse.data.token);
            
            // Session successfully refreshed
            setShowSessionModal(false);
            
            // Don't automatically retry the publish operation - let user do it manually
            setPublishErrorMessage("");
            return true;
          }
        } catch (authError) {
          console.error("Silent re-authentication failed:", authError);
          // Fall through to manual refresh prompt
        }
      }
      
      // Last resort: activate demo mode
      const useDemoMode = window.confirm(
        "Unable to refresh your session automatically. Would you like to continue in demo mode? " +
        "Your work will be saved locally but not to the server."
      );
      
      if (useDemoMode) {
        activateDemoMode();
        return true;
      }
      
      // If we reached here, automatic refresh failed - keep modal open for manual action
      return false;
      
    } catch (error) {
      console.error("Session refresh error:", error);
      return false;
    } finally {
      setRefreshingSession(false);
    }
  };
  
  // Function to activate demo mode
  const activateDemoMode = () => {
    console.log("Activating demo mode");
    setIsDemoMode(true);
    setShowSessionModal(false);
    
    // Generate a demo user
    const demoUser = {
      name: "Demo User",
      email: "demo@example.com",
      id: "demo_" + Date.now(),
      role: "Demo User"
    };
    
    // Store demo user data
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    setUserData(demoUser);
    
    // Show a notification
    setPublishErrorMessage("");
    setPublishLoading(false);
    
    // Continue the publish operation in demo mode
    setTimeout(() => {
      handlePublishInDemoMode();
    }, 500);
  };
  
  // Function to handle publishing in demo mode (local storage only)
  const handlePublishInDemoMode = async () => {
    try {
      setPublishLoading(true);
      
      // Extract job ID from mergedVideoUrl if available
      const jobId = extractJobIdFromUrl(mergedVideoUrl);
      
      if (!jobId && !s3Url) {
        setPublishErrorMessage("Unable to identify the video. Please try processing it again.");
        return;
      }
      
      // Get demo user
      const demoUser = JSON.parse(localStorage.getItem('demoUser') || '{}');
      
      // Create project data object with enhanced information
      const projectData = {
        id: `local_${Date.now()}`,
        title: videoTitle || "Untitled Video",
        description: videoDescription || "",
        jobId: jobId || `s3_${Date.now()}`, // Use timestamp as fallback ID for S3 videos
        duration: duration || 0,
        s3Url: s3Url || mergedVideoUrl,
        thumbnailUrl: selectedClipsData && selectedClipsData[0]?.thumbnail || '',
        createdAt: new Date().toISOString(),
        userId: demoUser.id || 'demo_user',
        userEmail: demoUser.email || 'demo@example.com',
        userName: demoUser.name || 'Demo User',
        viewCount: 0,
        aiSummary: aiGeneratedSummary || "",
        // Include all context data for consistency
        clipsData: selectedClipsData || [],
        promptContext: prompt || "",
        videoIds: videoIds || [],
        sourceClips: selectedClipsData ? selectedClipsData.map(clip => ({
          videoId: clip.videoId || '',
          title: clip.title || 'Untitled clip',
          startTime: clip.startTime || 0,
          endTime: clip.endTime || 0,
          duration: (clip.endTime || 0) - (clip.startTime || 0),
          thumbnail: clip.thumbnail || (clip.videoId ? `https://img.youtube.com/vi/${clip.videoId}/mqdefault.jpg` : ''),
          originalVideoTitle: clip.originalVideoTitle || clip.title || 'Unknown source'
        })) : [],
        stats: {
          totalClips: selectedClipsData?.length || 0,
          totalDuration: duration || 0,
          processingTime: processingStats?.processingSpeed || 0,
          mergeDate: new Date().toISOString()
        },
        isLocalOnly: true,
        source: 'localStorage'
      };
      
      // Save to localStorage
      const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
      existingProjects.push(projectData);
      localStorage.setItem('userProjects', JSON.stringify(existingProjects));
      
      console.log("Project saved to localStorage in demo mode:", projectData);
      
      // Set success state
      setIsLocalStorageFallback(true);
      setPublishSuccess(true);
      setTimeout(() => {
        setShowPublishModal(false);
        // Reset after closing modal
        setTimeout(() => {
          setPublishSuccess(false);
          setIsLocalStorageFallback(false);
        }, 500);
      }, 2000);
      
    } catch (error) {
      console.error("Error in demo mode publish:", error);
      setPublishErrorMessage("Failed to save project locally. Please try again.");
    } finally {
      setPublishLoading(false);
    }
  };

  // Add a useEffect to check localStorage for publish status when the component loads
  useEffect(() => {
    // Check if this specific video was already published
    if (mergedVideoUrl) {
      const jobId = extractJobIdFromUrl(mergedVideoUrl);
      if (jobId) {
        const publishedVideos = JSON.parse(localStorage.getItem('publishedVideos') || '[]');
        if (publishedVideos.includes(jobId)) {
          setVideoPublished(true);
        }
      }
    }
  }, [mergedVideoUrl]);

  // Add a useEffect to trigger video loading when URLs change
  useEffect(() => {
    // Reset video element when new URLs are available
    if (videoRef.current && (mergedVideoUrl || s3Url)) {
      console.log("Loading video source:", s3Url || mergedVideoUrl);
      
      // Force reload of the video element
      const video = videoRef.current;
      video.pause();
      
      // Try to load the video directly in JavaScript
      if (s3Url) {
        try {
          video.src = s3Url;
          video.load();
          console.log("Set video source to S3 URL");
        } catch (err) {
          console.error("Error setting S3 URL:", err);
        }
      } else if (mergedVideoUrl) {
        try {
          video.src = mergedVideoUrl;
          video.load();
          console.log("Set video source to merged video URL");
        } catch (err) {
          console.error("Error setting merged URL:", err);
        }
      }
    }
  }, [mergedVideoUrl, s3Url]);

  // Add an effect to handle video source loading correctly
  useEffect(() => {
    if (videoRef.current && (s3Url || mergedVideoUrl)) {
      const video = videoRef.current;
      
      // Reset error attempts counter when sources change
      video.errorAttempts = 0;
      
      // Create sources in priority order
      video.innerHTML = ''; // Clear existing sources
      
      // Helper function to create and append source elements
      const addSource = (src, type) => {
        if (!src) return;
        const source = document.createElement('source');
        source.src = src;
        source.type = type;
        video.appendChild(source);
      };
      
      // Use the required path format if available
      const jobId = extractJobIdFromUrl(mergedVideoUrl);
      if (jobId) {
        const videoPath = `/temp/${jobId}/merged_${jobId}.mp4`;
        addSource(videoPath, 'video/mp4');
      }
      
      // Add sources in priority order with multiple formats
      if (s3Url) {
        addSource(s3Url, 'video/mp4');
        // Try webm as fallback format if mp4 fails
        addSource(s3Url.replace('.mp4', '.webm'), 'video/webm');
      }
      
      if (mergedVideoUrl) {
        addSource(mergedVideoUrl, 'video/mp4');
        // Try webm as fallback format if mp4 fails
        addSource(mergedVideoUrl.replace('.mp4', '.webm'), 'video/webm');
      }
      
      // Force reload the video with new sources
      video.load();
      
      // Attempt to play if autoplay is enabled
      if (isPlaying) {
        video.play().catch(err => {
          console.log("Auto-play was prevented:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [s3Url, mergedVideoUrl]);
  
  // Add effect to check video URLs and correct potential issues
  useEffect(() => {
    // Only run this when we have URLs to check
    if (s3Url || mergedVideoUrl) {
      const checkVideoUrls = async () => {
        // Check if either URL is a valid video source
        let s3Valid = false;
        let mergedValid = false;
        
        if (s3Url) {
          try {
            // Make a HEAD request to check if the S3 URL is valid without downloading content
            const response = await fetch(s3Url, { 
              method: 'HEAD',
              cache: 'no-store',
              mode: 'cors',
              credentials: 'omit'
            });
            
            s3Valid = response.ok && (
              response.headers.get('content-type')?.includes('video') || 
              s3Url.toLowerCase().endsWith('.mp4') || 
              s3Url.toLowerCase().endsWith('.webm')
            );
            
            console.log(`S3 URL check: ${s3Url} - Valid: ${s3Valid}`);
          } catch (error) {
            console.warn("Error checking S3 URL:", error);
          }
        }
        
        if (mergedVideoUrl && !mergedVideoUrl.startsWith('blob:')) {
          try {
            // Check if the merged URL is valid (but skip for blob URLs)
            const response = await fetch(mergedVideoUrl, { 
              method: 'HEAD',
              cache: 'no-store'
            });
            
            mergedValid = response.ok;
            console.log(`Merged URL check: ${mergedVideoUrl} - Valid: ${mergedValid}`);
          } catch (error) {
            console.warn("Error checking merged URL:", error);
          }
        } else if (mergedVideoUrl.startsWith('blob:')) {
          // Blob URLs can't be checked with fetch, assume valid
          mergedValid = true;
        }
        
        // If neither URL is valid, clear error attempts counter to force recovery
        if (!s3Valid && !mergedValid && videoRef.current) {
          console.warn("Neither video URL appears valid. Forcing recovery.");
          videoRef.current.errorAttempts = 0;
          // Set error message to alert user
          setErrorMessage("The video source appears to be unavailable. You can try downloading instead.");
          
          // Show download section
          const downloadSection = document.getElementById('video-download-section');
          if (downloadSection) {
            downloadSection.style.display = 'flex';
          }
        }
      };
      
      // Run URL checks
      checkVideoUrls().catch(console.error);
    }
  }, [s3Url, mergedVideoUrl]);

  // Add in the component, near other useEffect hooks
  useEffect(() => {
    if (mergedVideoUrl) {
      const jobId = extractJobIdFromUrl(mergedVideoUrl);
      if (jobId) {
        const requiredPath = `/temp/${jobId}/merged_${jobId}.mp4`;
        console.log("Required video path:", requiredPath);
        
        // Log the current video source for debugging
        if (videoRef.current) {
          console.log("Current video source:", videoRef.current.src);
          console.log("Using required path format:", videoRef.current.src === requiredPath);
        }
      }
    }
  }, [mergedVideoUrl, videoRef.current?.src]);

  // Add some visual indicators for different phases
  const getPhaseIcon = (phase) => {
    switch(phase) {
      case 'preparing':
        return <FontAwesomeIcon icon={faGears} className="text-indigo-400 mr-2" />;
      case 'downloading':
        return <FontAwesomeIcon icon={faCloudDownload} className="text-blue-400 mr-2" />;
      case 'trimming':
        return <FontAwesomeIcon icon={faCut} className="text-purple-400 mr-2" />;
      case 'merging':
        return <FontAwesomeIcon icon={faFilm} className="text-pink-400 mr-2" />;
      case 'finalizing':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mr-2" />;
      default:
        return null;
    }
  };

  // Detailed phase description for the UI
  const getPhaseDescription = (phase) => {
    switch(phase) {
      case 'preparing':
        return 'Initializing processing pipeline';
      case 'downloading':
        return 'Downloading video content from source';
      case 'trimming':
        return 'Trimming clips to selected timestamps';
      case 'merging':
        return 'Combining clips into seamless video';
      case 'finalizing':
        return 'Optimizing for playback';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen bg-[#121212] text-white flex flex-col">
      {/* Header - Simplified and cleaner */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <FontAwesomeIcon icon={faFilm} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">Merge Clips</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedClipsData?.length || 0} clips selected for processing
            </p>
          </div>
        </div>
        
        {/* Status indicator - More informative */}
        {mergeSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} />
            Video Ready
          </div>
        )}
      </div>

      {/* Error message notification - More prominent */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 p-4 text-sm flex items-start gap-3"
          >
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-300 mb-1">Processing Error</h3>
              <p>{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content - Better organized */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-65px)]">
        {/* Left Panel - Clips List with improved design */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-[320px] bg-[#1c1c1c] flex flex-col border-r border-gray-800"
        >
          <div className="flex items-center px-4 py-3 border-b border-gray-800 bg-[#1a1a1a]">
            <h3 className="text-sm font-medium text-white">Selected Clips</h3>
            <span className="ml-2 px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-xs rounded-md">
              {selectedClipsData?.length || 0}
            </span>
          </div>
          
          <div ref={timelineRef} className="flex-1 overflow-y-auto custom-scrollbar">
            <style>
              {`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #1a1a1a;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #3d3d3d;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #4d4d4d;
              }
              `}
            </style>
            
            {selectedClipsData && selectedClipsData.length > 0 ? (
              <div className="p-2 space-y-2">
                {selectedClipsData.map((clip, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative rounded-md overflow-hidden w-20 h-12 flex-shrink-0 bg-black">
                        <img 
                          src={clip.thumbnail || `https://img.youtube.com/vi/${clip.videoId}/mqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://img.youtube.com/vi/${clip.videoId}/mqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <FontAwesomeIcon icon={faPlay} className="text-white text-xs" />
                          </div>
                        </div>
                        <div className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1 rounded">
                          {formatTime(clip.duration || (clip.endTime - clip.startTime))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-xs font-medium line-clamp-2 mb-1">
                          {clip.title || `Clip ${index + 1}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} className="text-gray-500" />
                            {formatTimeRange(clip.startTime, clip.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faFilm} className="text-gray-600 text-xl" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No clips selected for merging
                </p>
                <button
                  onClick={() => navigate('/transcripts')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-all"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Select Clips
                </button>
              </div>
            )}
          </div>
          
          {/* Action buttons - Simplified */}
          {selectedClipsData && selectedClipsData.length > 0 && (
            <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
              <button
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleMergeClips}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={isLoading ? faSpinner : faSyncAlt} className={`${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Processing...' : 'Process Clips'}</span>
              </button>
              
              <button
                onClick={() => navigate('/transcripts')}
                className="w-full mt-3 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                <span>Back to Clips</span>
              </button>
              
              <button
                onClick={() => navigate('/explore')}
                className="w-full mt-3 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                <span>Back to Explore</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Right Panel - Video Preview with cleaner design */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex-1 flex flex-col overflow-hidden bg-[#0f0f0f]"
        >
          {/* Loading State - Completely redesigned, more professional */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-[#0f0f0f] relative">
              {/* Simple gradient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]"></div>
              
              <div className="relative z-10 max-w-md w-full mx-auto p-6 text-center">
                {/* Simplified loader card */}
                <div className="bg-[#1c1c1c] rounded-xl border border-gray-800 shadow-xl p-5">
                  {/* Simple dot pulse loader */}
                  <div className="mb-4 flex justify-center gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  
                  {/* Simple phase title */}
                  <h3 className="text-base font-medium text-white mb-2">
                    {loadingPhase === 'preparing' ? 'Preparing' : 
                    loadingPhase === 'downloading' ? 'Downloading' : 
                    loadingPhase === 'trimming' ? 'Trimming' : 
                    loadingPhase === 'merging' ? 'Merging' : 
                    'Finalizing'}
                  </h3>
                  
                  {/* Clean progress bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300 bg-indigo-600" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress percentage */}
                  <p className="text-white text-sm font-medium mb-3">
                    {Math.round(processingProgress)}%
                  </p>
                  
                  {/* Status message - simplified */}
                  <p className="text-gray-400 text-xs mb-3">
                    {progressMessage || (
                      loadingPhase === 'preparing' ? 'Setting up...' : 
                      loadingPhase === 'downloading' ? 'Downloading videos...' : 
                      loadingPhase === 'trimming' ? 'Trimming clips...' : 
                      loadingPhase === 'merging' ? 'Merging clips...' : 
                      'Finalizing video...'
                    )}
                  </p>
                  
                  {/* Time estimate - optional */}
                  {estimatedTimeRemaining && (
                    <p className="text-gray-500 text-xs mb-3">
                      Estimated time: {estimatedTimeRemaining}
                    </p>
                  )}
                  
                  {/* Cancel button - simplified */}
                  {!cancelRequested ? (
                    <button
                      className="mt-1 px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                      onClick={handleCancelProcessing}
                    >
                      Cancel
                    </button>
                  ) : (
                    <p className="text-yellow-500 text-xs mt-1">Cancelling...</p>
                  )}
                </div>
              </div>
            </div>
          ) : mergeSuccess ? (
            <div className="flex-1 flex flex-col">
              {/* Confetti container */}
              <div 
                ref={confettiRef} 
                className="absolute inset-0 pointer-events-none overflow-hidden z-50"
              ></div>
              
              {/* Video section with improved UI */}
              <div className="flex-1 bg-black flex flex-col">
                {/* Video header - Cleaner */}
                <div className="bg-[#1a1a1a] px-6 py-4 flex justify-between items-center border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-600/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faFilm} className="text-indigo-500" />
                    </div>
                    <div>
                      <h2 className="font-medium text-white text-sm">
                        {selectedClipsData.length === 1 ? 'Processed Clip' : 'Merged Video'}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTime(duration)} • {s3Url ? 'Cloud storage ready' : 'Local storage only'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View in Full Page button */}
                    <button 
                      onClick={() => {
                        const jobId = extractJobIdFromUrl(mergedVideoUrl);
                        if (jobId) {
                          navigate(`/video/${jobId}`);
                        }
                      }}
                      disabled={!mergedVideoUrl}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Open video in full page"
                    >
                      <FontAwesomeIcon icon={faExpand} />
                      <span>Full Page</span>
                    </button>
                    
                    {/* Share button - Make it more prominent when S3 URL is available */}
                    <button 
                      onClick={() => {
                        console.log(s3Url)
                        handleShareVideo();
                      }}
                      className={`px-3 py-1.5 ${s3Url ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-700'} text-white rounded-md text-sm flex items-center gap-1.5 transition-colors`}
                      title={s3Url ? "Video link is ready to share!" : "Share this video"}
                    >
                      <FontAwesomeIcon icon={s3Url ? faLink : faShareAlt} className={s3Url ? "animate-pulse" : ""} />
                      <span>Share</span>
                      {s3Url && <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>}
                    </button>
                    
                    {/* Publish button - NEW */}
                    <button 
                      onClick={openPublishModal}
                      disabled={(!mergedVideoUrl && !s3Url) || publishSuccess || videoPublished}
                      className={`px-3 py-1.5 ${(publishSuccess || videoPublished) ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-md text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={videoPublished ? "Video published to your projects" : "Save this video to your projects"}
                    >
                      <FontAwesomeIcon icon={(publishSuccess || videoPublished) ? faCheck : faSave} />
                      <span>{(publishSuccess || videoPublished) ? "Published" : "Publish"}</span>
                    </button>
                    
                    {/* Download button */}
                    <button 
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center gap-1.5 transition-colors"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                
                {/* Video Player - Enhanced */}
                <div className="flex-1 bg-[#080808] relative flex items-center justify-center overflow-hidden group">
                  {/* Video wrapper with constrained size */}
                  <div className="w-[80%] max-w-2xl mx-auto">
                    <div className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full'}`}>
                      <video
                        ref={videoRef}
                        controls={true}
                        className={`bg-black ${isFullscreen ? 'w-full h-full' : 'max-w-full max-h-[calc(100vh-300px)] w-full aspect-video object-cover'}`}
                        poster={selectedClipsData[0]?.thumbnail || ''}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onDurationChange={handleVideoDurationChange}
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                        preload="metadata"
                        crossOrigin="anonymous"
                        playsInline
                        onLoadedMetadata={(e) => {
                          console.log("Video metadata loaded");
                          console.log("Duration:", e.target.duration);
                          setDuration(e.target.duration);
                        }}
                        onCanPlay={() => {
                          console.log("Video can play");
                          if (videoRef.current && videoRef.current.duration) {
                            setDuration(videoRef.current.duration);
                          }
                        }}
                        onError={(e) => {
                          console.error("Video error:", e.target.error);
                          const videoElement = videoRef.current;
                          console.log("Video ready state:", videoElement?.readyState);
                          console.log("Network state:", videoElement?.networkState);
                          
                          // Track error attempts to prevent infinite loops
                          if (!videoElement.errorAttempts) {
                            videoElement.errorAttempts = 0;
                          }
                          videoElement.errorAttempts++;
                          
                          // Only try recovery if we haven't tried too many times
                          if (videoElement.errorAttempts <= 2) {
                            console.log(`Attempting video recovery (attempt ${videoElement.errorAttempts})`);
                            
                            // Try an alternative URL first if available
                            const currentSrc = videoElement.currentSrc || '';
                            let recoveryUrl = null;
                            
                            // If current source is S3, try merged, and vice versa
                            // First try S3 URL if available and not already tried
                            if (videoElement && s3Url && videoElement.currentSrc !== s3Url) {
                              console.log("Trying S3 URL as fallback");
                              // Add cache-busting parameter to avoid browser cache issues
                              const cacheBustUrl = s3Url.includes('?') 
                                ? `${s3Url}&cb=${Date.now()}` 
                                : `${s3Url}?cb=${Date.now()}`;
                              videoElement.src = cacheBustUrl;
                              videoElement.load();
                              try {
                                // Attempt to play after a short delay
                                setTimeout(() => videoElement.play().catch(() => {}), 500);
                              } catch (playErr) {
                                console.log("Auto-play after recovery failed:", playErr);
                              }
                              return;
                            } 
                            // Then try merged URL if available and not already tried
                            else if (videoElement && mergedVideoUrl && videoElement.currentSrc !== mergedVideoUrl) {
                              console.log("Trying merged URL as fallback");
                              // Add cache-busting parameter
                              const cacheBustUrl = mergedVideoUrl.includes('?') 
                                ? `${mergedVideoUrl}&cb=${Date.now()}` 
                                : `${mergedVideoUrl}?cb=${Date.now()}`;
                              videoElement.src = cacheBustUrl;
                              videoElement.load();
                              try {
                                // Attempt to play after a short delay
                                setTimeout(() => videoElement.play().catch(() => {}), 500);
                              } catch (playErr) {
                                console.log("Auto-play after recovery failed:", playErr);
                              }
                              return;
                            }
                          }
                          
                          // If we reach here, all recovery attempts failed
                          const errorCode = e.target.error?.code || 'unknown';
                          const networkState = videoElement?.networkState || 'unknown';
                          
                          // More user-friendly error message based on the specific error
                          let videoErrorMessage = "Error playing video. Try downloading the video instead.";
                          
                          if (errorCode === 2) { // MEDIA_ERR_NETWORK
                            videoErrorMessage = "Network error while loading the video. Please check your connection or try downloading instead.";
                          } else if (errorCode === 3) { // MEDIA_ERR_DECODE
                            videoErrorMessage = "This video format may not be supported by your browser. Try downloading it instead.";
                          } else if (errorCode === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
                            videoErrorMessage = "This video format is not supported. You can download it and play with another media player.";
                          }
                          
                          // Set error message and show error UI instead of using alert
                          setErrorMessage(videoErrorMessage);
                          setShowVideoError(true);
                          
                          // Ensure download button is prominently displayed
                          const downloadSection = document.getElementById('video-download-section');
                          if (downloadSection) {
                            downloadSection.style.display = 'block';
                          }
                          
                          // Add special handling for the required path format
                          const jobId = extractJobIdFromUrl(mergedVideoUrl);
                          if (jobId && videoElement.errorAttempts <= 2) {
                            const videoPath = `/temp/${jobId}/merged_${jobId}.mp4`;
                            console.log("Trying required path format:", videoPath);
                            videoElement.src = videoPath;
                            videoElement.load();
                            return;
                          }
                        }}
                      >
                        {/* Add the required path format as the first source with highest priority */}
                        {mergedVideoUrl && (() => {
                          const jobId = extractJobIdFromUrl(mergedVideoUrl);
                          if (jobId) {
                            return <source src={`/temp/${jobId}/merged_${jobId}.mp4`} type="video/mp4" />;
                          }
                          return null;
                        })()}
                        
                        {/* Keep existing sources as fallbacks */}
                        {s3Url && <source src={s3Url} type="video/mp4" />}
                        {mergedVideoUrl && <source src={mergedVideoUrl} type="video/mp4" />}
                        {s3Url && <source src={s3Url} type="video/webm" />}
                        {mergedVideoUrl && <source src={mergedVideoUrl} type="video/webm" />}
                        <p className="text-white text-center m-4">
                          Your browser doesn't support HTML5 video or the video format. 
                          <a href={s3Url || mergedVideoUrl} className="text-blue-400 underline ml-2" download>
                            Download the video
                          </a> instead.
                        </p>
                      </video>
                      
                      {/* Custom controls overlay - Professional */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                        {/* Timeline slider */}
                        <div className="px-4 pb-1">
                          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden relative cursor-pointer">
                            <div 
                              className="absolute inset-y-0 left-0 bg-indigo-600" 
                              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            {/* Play/Pause button */}
                            <button 
                              onClick={togglePlayPause} 
                              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white text-sm" />
                            </button>
                            
                            {/* Time display */}
                            <div className="text-white text-xs font-medium">
                              {formatTime(currentTime)} / {formatTime(duration || 0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Fullscreen button */}
                            <button 
                              onClick={toggleFullscreen} 
                              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-white text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Success banner - Better feedback */}
                <div className="bg-gray-900 px-6 py-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm">Processing Complete</h3>
                        <p className="text-gray-400 text-xs mt-1">
                          Your video has been successfully processed and is ready to download or share
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => navigate('/transcripts')}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        <span>Back to Clips</span>
                      </button>
                      
                      <button 
                        onClick={() => navigate('/explore')}
                        className="ml-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        <span>Back to Explore</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Empty State - Minimalist design
            <div className="flex-1 flex items-center justify-center p-6 bg-[#0f0f0f]">
              <div className="max-w-md w-full bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faFilm} className="text-indigo-500 text-xl" />
                </div>
                <h2 className="text-lg font-medium text-white mb-2">Ready to Process</h2>
                <p className="text-gray-400 text-sm mb-6">
                  {selectedClipsData?.length > 0 
                    ? `Click "Process Clips" to begin merging your ${selectedClipsData.length} selected clips into a video`
                    : "Select clips to merge from the previous page"}
                </p>
                <button
                  onClick={selectedClipsData?.length > 0 ? handleMergeClips : () => navigate('/transcripts')}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all w-full flex items-center justify-center gap-2 mb-3"
                >
                  <FontAwesomeIcon icon={selectedClipsData?.length > 0 ? faSyncAlt : faChevronLeft} />
                  <span>{selectedClipsData?.length > 0 ? "Process Clips" : "Select Clips"}</span>
                </button>
                
                {selectedClipsData?.length > 0 && (
                  <button
                    onClick={() => navigate('/output')}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all w-full flex items-center justify-center gap-2 mb-3"
                  >
                    <FontAwesomeIcon icon={faRocket} />
                    <span>Use New Processor</span>
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/explore')}
                  className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all w-full flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  <span>Back to Explore</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1c1c1c] rounded-xl border border-gray-700 p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Share Video</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {/* Share URL input */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 overflow-hidden text-ellipsis">
                {shareUrl || s3Url || "No shareable link available"}
              </div>
              <button 
                onClick={copyToClipboard}
                disabled={!shareUrl && !s3Url}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={copySuccess ? faCheck : faCopy} />
                <span>{copySuccess ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            
            {/* QR Code */}
            {(shareUrl || s3Url) && (
              <div className="bg-white p-4 rounded-lg mx-auto w-56 h-56 mb-6 flex items-center justify-center">
                {!qrError ? (
                  <QRCodeSVG 
                    value={shareUrl || s3Url}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                    onError={() => setQrError(true)}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-3xl mb-2" />
                    <p className="text-sm">Could not generate QR code</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Social share buttons */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">Share on social media:</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => shareOnSocial('twitter')}
                  disabled={!shareUrl && !s3Url}
                  className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FontAwesomeIcon icon={faTwitter} />
                </button>
                <button
                  onClick={() => shareOnSocial('facebook')}
                  disabled={!shareUrl && !s3Url}
                  className="w-10 h-10 rounded-full bg-[#4267B2]/20 hover:bg-[#4267B2]/30 text-[#4267B2] flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FontAwesomeIcon icon={faFacebookF} />
                </button>
                <button
                  onClick={() => shareOnSocial('whatsapp')}
                  disabled={!shareUrl && !s3Url}
                  className="w-10 h-10 rounded-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FontAwesomeIcon icon={faWhatsapp} />
                </button>
                <button
                  onClick={() => shareOnSocial('linkedin')}
                  disabled={!shareUrl && !s3Url}
                  className="w-10 h-10 rounded-full bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 text-[#0A66C2] flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FontAwesomeIcon icon={faLinkedinIn} />
                </button>
              </div>
            </div>
            
            {/* Get shareable link button (if needed) */}
            {!shareUrl && !s3Url && (
              <button
                onClick={getPublicS3Url}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faLink} />
                <span>Generate Shareable Link</span>
              </button>
            )}
            
            {/* Error message if any */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Add Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-[80vw] max-w-5xl bg-gradient-to-b from-[#1e1e1e] to-[#121212] rounded-xl shadow-2xl overflow-hidden border border-gray-800/50">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 bg-[#1a1a1a]/80 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSave} className="text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Publish Video</h2>
                  <p className="text-sm text-gray-400">Save to your project collection</p>
                </div>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                disabled={publishLoading}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {!publishSuccess ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Form fields */}
                  <div className="lg:col-span-2 space-y-5">
                    <div>
                      <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-300 mb-2">
                        Video Title <span className="text-purple-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="videoTitle"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter a title for your video"
                        disabled={publishLoading}
                      />
                    </div>
                    
                    {/* AI-generated summary section with improved styling */}
                    {(aiGeneratedSummary || isSummaryLoading) && (
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg shadow-inner">
                        <div className="flex items-start gap-3">
                          <div className="min-w-8 w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center mt-1">
                            <FontAwesomeIcon icon={faBrain} className="text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-purple-300">AI-Generated Summary</h3>
                              {isSummaryLoading && (
                                <div className="ml-2 flex items-center">
                                  <FontAwesomeIcon icon={faSpinner} className="text-purple-300 animate-spin" />
                                  <span className="ml-2 text-xs text-purple-300">Generating...</span>
                                </div>
                              )}
                            </div>
                            {aiGeneratedSummary ? (
                              <p className="text-sm text-purple-200 mt-2 leading-relaxed">{aiGeneratedSummary}</p>
                            ) : (
                              <p className="text-sm text-purple-200 mt-2">Generating intelligent summary of your video content...</p>
                            )}
                            {aiGeneratedSummary && (
                              <button 
                                className="mt-3 px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 rounded-md flex items-center gap-1.5 transition-colors"
                                onClick={() => setVideoDescription(aiGeneratedSummary)}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                                Use this summary as description
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-300 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        id="videoDescription"
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        rows="5"
                        className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Add a description for your video"
                        disabled={publishLoading}
                      ></textarea>
                    </div>
                    
                    {/* Error message with improved styling */}
                    {publishErrorMessage && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg shadow-inner">
                        <div className="flex items-start gap-3">
                          <div className="min-w-8 w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center mt-1">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-red-300 mb-1">Error</h3>
                            <p className="text-sm text-red-200">
                              {publishErrorMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column - Preview and Info */}
                  <div className="space-y-5">
                    {/* Video preview with enhanced styling */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
                      <div className="p-4 border-b border-gray-800 bg-[#232323]">
                        <h3 className="text-sm font-medium text-gray-300">Video Preview</h3>
                      </div>
                      <div className="p-4">
                        <div className="relative aspect-video rounded-md overflow-hidden bg-black/30 mb-3">
                          {selectedClipsData && selectedClipsData.length > 0 && (
                            <img 
                              src={selectedClipsData[0].thumbnail || `https://img.youtube.com/vi/${selectedClipsData[0].videoId}/mqdefault.jpg`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                              <FontAwesomeIcon icon={faPlay} className="text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Duration:</span>
                            <span className="text-xs font-medium text-white">{formatTime(duration || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Clips:</span>
                            <span className="text-xs font-medium text-white">{selectedClipsData?.length || 0} clips</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Storage:</span>
                            <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                              {s3Url ? (
                                <>
                                  <FontAwesomeIcon icon={faCheck} className="text-green-400" />
                                  Cloud storage (S3)
                                </>
                              ) : (
                                "Local storage"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User info section with improved styling */}
                    {userData && (
                      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-gray-800 bg-[#232323]">
                          <h3 className="text-sm font-medium text-gray-300">Publisher</h3>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] border border-gray-700 flex items-center justify-center">
                              <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{userData.name || userData.email || "User"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{userData.email}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            This video will be saved to your personal projects collection and will be available from your profile page.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-full h-full bg-green-500/30 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheck} className="text-green-500 text-3xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Video Published!</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Your video has been successfully saved{isLocalStorageFallback || isDemoMode ? ' locally' : ' to your projects collection'} and is available{isLocalStorageFallback || isDemoMode ? ' in your browser storage' : ' on your profile'}.
                  </p>
                  
                  {(isLocalStorageFallback || isDemoMode) && (
                    <div className="mb-6 max-w-md mx-auto p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FontAwesomeIcon icon={faDatabase} className="text-indigo-400 mt-1" />
                        <div className="text-sm text-indigo-300">
                          <p className="font-medium mb-1">Demo Mode Active</p>
                          <p>This video is saved in your browser's local storage and will be available on your profile page. To save to your account permanently, please sign in.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Title</div>
                      <div className="text-sm font-medium text-white truncate w-full text-center">{videoTitle || "Untitled"}</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                      <div className="text-sm font-medium text-white">{formatTime(duration || 0)}</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Source Clips</div>
                      <div className="text-sm font-medium text-white">{selectedClipsData?.length || 0} clips</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Storage</div>
                      <div className="text-sm font-medium text-white flex items-center gap-1.5">
                        <FontAwesomeIcon icon={isLocalStorageFallback || isDemoMode ? faDatabase : faCloud} className={isLocalStorageFallback || isDemoMode ? "text-indigo-400" : "text-sky-400"} />
                        <span>{isLocalStorageFallback || isDemoMode ? "Local Storage" : "Cloud"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => isLocalStorageFallback || isDemoMode ? setShowPublishModal(false) : navigate('/profile')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 flex items-center justify-center gap-2 mx-auto"
                  >
                    <FontAwesomeIcon icon={isLocalStorageFallback || isDemoMode ? faCheck : faUser} />
                    <span>{isLocalStorageFallback || isDemoMode ? "Done" : "Go to Profile"}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Modal Footer - only show when not in success state */}
            {!publishSuccess && (
              <div className="px-6 py-4 border-t border-gray-800 bg-[#1a1a1a]/80 backdrop-blur-sm flex justify-end gap-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-lg text-sm transition-colors"
                  disabled={publishLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishVideo}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={publishLoading || !videoTitle}
                >
                  {publishLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      <span>Publish Video</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session Expiration Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] p-6 rounded-xl shadow-xl w-full max-w-md border border-purple-500/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white">Session Expired</h3>
              <button 
                onClick={() => setShowSessionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="py-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Authentication Required</h4>
                  <p className="text-gray-400 text-sm">Your session has expired. You need to refresh your authentication to continue.</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <button
                  onClick={refreshUserSession}
                  disabled={refreshingSession}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 font-medium"
                >
                  {refreshingSession ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      <span>Refreshing Session...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSyncAlt} />
                      <span>Refresh Session</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => activateDemoMode()}
                  className="w-full py-3 flex items-center justify-center gap-2 border border-purple-700 hover:border-purple-600 bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 rounded-lg transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faUser} />
                  <span>Continue in Demo Mode</span>
                </button>
                
                <button
                  onClick={() => {
                    // Clear tokens and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('refreshToken');
                    
                    // Navigate to login page with return URL
                    navigate('/login?returnTo=' + encodeURIComponent(window.location.pathname));
                  }}
                  className="w-full py-3 flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  <span>Log Out and Log In Again</span>
                </button>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-gray-800 text-xs text-gray-500">
              <p>If refreshing doesn't work, you can continue in demo mode. Your current work will be saved locally.</p>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated download section for error cases */}
      <div 
        id="video-download-section" 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10"
        style={{ display: errorMessage ? 'flex' : 'none' }}
      >
        <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full text-center">
          <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 text-4xl mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Video Playback Error</h3>
          <p className="text-gray-300 mb-4">{errorMessage || "There was an issue playing this video in your browser."}</p>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleDownload}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faDownload} />
              <span>Download Video</span>
            </button>
            
            <button 
              onClick={() => {
                setErrorMessage("");
                const section = document.getElementById('video-download-section');
                if (section) section.style.display = 'none';
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergeClipsPage;