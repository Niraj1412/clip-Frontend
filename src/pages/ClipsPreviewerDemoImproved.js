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
        if (!selectedClipsData || selectedClipsData.length === 0) {
          throw new Error('No transcript data available');
        }

        setLoading(true);
        setError(null);
        showFeedback('Generating clips...', 'info');

        console.log('Sending transcript data to API:', selectedClipsData);

        const response = await fetch(`${YOUTUBE_API}/generateClips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcripts: selectedClipsData,
            customPrompt: prompt || "Generate 3 clips from the transcript with highly accurate and precise transcription and EXACT timestamps. The timestamps must precisely match the actual video timing with frame-level accuracy. Maintain exact wording from the source material. Prioritize both content accuracy and timestamp precision for perfect synchronization with the video."
          })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('API error response:', data);
          throw new Error(data.message || data.error || `Failed to generate clips (Status: ${response.status})`);
        }

        if (data.success && data.data.script) {
          console.log('Received script data:', data.data.script);

          try {
            const cleanScript = data.data.script
              .replace(/\((\d+\.?\d*)\)\.toFixed\(2\)/g, '$1')
              .replace(/\((\d+\.?\d*)\s*[-+]\s*\d+\.?\d*\)\.toFixed\(2\)/g, (match) => {
                return eval(match.replace('.toFixed(2)', '')).toFixed(2);
              });

            const clipsArray = JSON.parse(cleanScript);
            console.log('Parsed clips array:', clipsArray);

            if (!Array.isArray(clipsArray) || clipsArray.length === 0) {
              throw new Error('No valid clips were generated');
            }

            // Process each clip with exact timestamp precision
            const processed = clipsArray.map((clip, index) => {
              if (!clip.videoId || clip.startTime === undefined || clip.endTime === undefined) {
                console.warn(`Clip ${index} has missing required fields:`, clip);
              }

              return {
                id: `clip_${index + 1}`,
                videoId: clip.videoId,
                title: `Clip ${index + 1}: ${clip.transcriptText?.substring(0, 50) || 'No transcript'}...`,
                originalVideoDuration: clip.originalVideoDuration || 60, 
                duration: parseFloat(((clip.endTime || 0) - (clip.startTime || 0)).toFixed(2)),
                startTime: parseFloat(parseFloat(clip.startTime || 0).toFixed(2)),
                endTime: parseFloat(parseFloat(clip.endTime || 0).toFixed(2)),
                transcriptText: (clip.transcriptText || '').replace(/&amp;#39;/g, "'"),
                thumbnail: `https://img.youtube.com/vi/${clip.videoId}/maxresdefault.jpg`,
                createdAt: new Date().toISOString()
              };
            });

            setProcessedClips(processed);
            showFeedback('Clips generated successfully!', 'success');
          } catch (parseError) {
            console.error('Error parsing script:', parseError, data.data.script);
            throw new Error(`Failed to parse generated clips: ${parseError.message}`);
          }
        } else {
          console.error('Invalid API response format:', data);
          throw new Error(data.message || 'Invalid response format');
        }
      } catch (err) {
        console.error('Error details:', err);
        setError(err.message);
        showFeedback(`Error: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (selectedClipsData) {
      fetchClips();
    }
  }, [selectedClipsData]);

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

  const handleFinishAndSave = () => {
    // Check if there are processed clips to save
    if (processedClips && processedClips.length > 0) {
      // Try to extract the videoId from the selectedClipsData or transcriptData first
      let commonVideoId = '';
      
      // Check if we have a common videoId in the original selectedClipsData
      if (selectedClipsData && selectedClipsData.length > 0) {
        if (selectedClipsData[0].videoId) {
          commonVideoId = selectedClipsData[0].videoId;
        } else if (selectedClipsData[0].url) {
          const urlMatch = selectedClipsData[0].url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (urlMatch) commonVideoId = urlMatch[1];
        }
      }
      
      // Make sure each clip has the videoId 
      const clipsWithVideoId = processedClips.map(clip => {
        // If the clip already has a videoId, use it
        if (clip.videoId) return clip;
        
        // Try to extract from videoUrl if available
        if (clip.videoUrl) {
          const videoIdMatch = clip.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (videoIdMatch) {
            return {
              ...clip,
              videoId: videoIdMatch[1]
            };
          }
        }
        
        // Fall back to the common videoId if we found one
        if (commonVideoId) {
          return {
            ...clip,
            videoId: commonVideoId
          };
        }
        
        // If we still don't have a videoId, return the clip as is
        return clip;
      });
      
      // Check if all clips have a videoId
      const missingVideoId = clipsWithVideoId.some(clip => !clip.videoId);
      if (missingVideoId) {
        showFeedback('Warning: Some clips may not have a video ID. Merging might not work correctly.', 'warning');
      }
      
      console.log('Clips prepared for merging:', clipsWithVideoId);
      
      // Save the processed clips to the context
      setSelectedClipsData(clipsWithVideoId);
      
      // Navigate to the MergeClipsPage
      showFeedback('Clips saved successfully! Redirecting to merge page...', 'success');
      
      // Small delay for the feedback to be visible before navigating
      setTimeout(() => {
        navigate('/merge');
      }, 1500);
    } else {
      showFeedback('No clips to save. Please create some clips first.', 'error');
    }
  };

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

  // Custom clip item renderer
  const renderClipItem = (clip) => {
    const isSelected = isClipSelected(clip);
    const isActive = currentClip && currentClip.id === clip.id;
    
    return (
      <div 
        key={clip.id}
        className={`p-3 border-b border-[#2d2d2d] cursor-pointer transition-colors hover:bg-[#2d2d2d]/70 relative
                  ${isActive ? 'bg-[#2d2d2d]' : isSelected ? 'bg-[#2d2d2d]/30' : 'bg-transparent'}`}
        onClick={() => handlePlayClip(clip)}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              isSelected ? handleUnselectClip(clip) : handleSelectClip(clip);
            }}
            className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${isSelected ? 'text-[#6c5ce7]' : 'text-gray-500'}`}
          >
            <FontAwesomeIcon icon={isSelected ? faCheckSquare : faSquare} className={`text-sm ${isSelected ? 'scale-110' : ''}`} />
          </button>
          
          <div className={`relative flex-shrink-0 w-32 h-20 bg-black/50 rounded-md overflow-hidden ${isActive ? 'ring-2 ring-[#6c5ce7]' : isSelected ? 'ring-1 ring-[#6c5ce7]/50' : ''}`}>
            <img 
              src={clip.thumbnail} 
              alt={clip.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/128x72?text=No+Preview';
              }}
            />
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
              {Math.round(clip.duration)}s
            </div>
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-8 h-8 rounded-full bg-[#6c5ce7]/80 flex items-center justify-center">
                  <FontAwesomeIcon icon={faScissors} className="text-white text-xs" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${isActive ? 'text-white' : isSelected ? 'text-gray-200' : 'text-gray-300'} truncate`}>
              {clip.title}
            </h3>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <FontAwesomeIcon icon={faClock} className="mr-1 text-[10px]" />
              {formatTimeRange(clip.startTime, clip.endTime)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#121212] text-white flex flex-col">
      {/* Simple Header Bar */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6c5ce7] flex items-center justify-center">
            <FontAwesomeIcon icon={faScissors} className="text-white" />
          </div>
          <h1 className="text-lg font-medium text-white">
            Clip Editor
            <span className="ml-2 text-sm text-gray-400">
              ({selectedClips.length} selected / {processedClips.length || 0} total)
            </span>
          </h1>
        </div>
        
        {/* Help text */}
        <div className="text-gray-400 text-sm flex items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-[#6c5ce7]" />
          <span>Select and edit clips, then save to continue</span>
        </div>
      </div>

      {/* Clear feedback notifications */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-12 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
              feedback.type === 'success' ? 'bg-green-500' : 
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
      
      {/* Enhanced Loading State */}
      {loading && processedClips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-[#121212] p-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl w-full"
          >
            {/* Main card */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl border border-[#2d2d2d]">
              {/* Top section with pulse animation */}
              <div className="mb-8 relative">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#6c5ce7]/30 rounded-full filter blur-3xl animate-pulse-slow"></div>
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#a281ff]/20 rounded-full filter blur-3xl animate-pulse-slower"></div>
                
                <div className="relative flex justify-center">
                  <div className="relative w-24 h-24 bg-[#1f1f1f] rounded-full flex items-center justify-center mb-5">
                    <div className="absolute inset-0 rounded-full border-4 border-[#6c5ce7]/30 border-t-[#6c5ce7] animate-spin"></div>
                    <div className="w-16 h-16 bg-[#232323] rounded-full flex items-center justify-center">
                      <FontAwesomeIcon 
                        icon={
                          loadingStage === 0 ? faBrain :
                          loadingStage === 1 ? faFileAlt :
                          loadingStage === 2 ? faVideo :
                          loadingStage === 3 ? faScissors :
                          faMagic
                        } 
                        className="text-[#6c5ce7] text-xl"
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
                  className="text-xl font-bold text-white text-center mb-2"
                >
                  {stageMessages[loadingStage].title}
                </motion.h2>
                
                <motion.p 
                  key={`loading-subtitle-${loadingStage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-gray-400 text-sm text-center max-w-md mx-auto"
                >
                  {stageMessages[loadingStage].subtitle}
                </motion.p>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden mb-8">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a281ff]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              
              {/* Steps */}
              <div className="grid grid-cols-5 gap-2 mb-8">
                {stageMessages.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="absolute top-3 left-0 right-0 -z-10">
                      <div className={`h-0.5 ${index === 0 ? 'w-1/2 ml-auto' : index === stageMessages.length - 1 ? 'w-1/2' : 'w-full'} ${index <= loadingStage ? 'bg-[#6c5ce7]' : 'bg-[#2d2d2d]'} transition-colors duration-300`}></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full mb-2 flex items-center justify-center ${index <= loadingStage ? 'bg-[#6c5ce7]' : 'bg-[#2d2d2d]'} transition-colors duration-300`}>
                        {index < loadingStage ? (
                          <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${index === loadingStage ? 'bg-white' : 'bg-transparent'}`}></div>
                        )}
                      </div>
                      <span className={`text-xs ${index <= loadingStage ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Rotating insights */}
              <div className="bg-[#232323] rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-[#6c5ce7]/20 rounded-lg p-2 text-[#6c5ce7]">
                    <FontAwesomeIcon icon={faLightbulb} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">ClipSmart AI Insight</h4>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={`tip-${loadingStage}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-gray-400 text-xs leading-relaxed"
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
                  className="text-center text-gray-500 text-xs"
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
        <div className="flex-1 flex h-[calc(100vh-49px)] overflow-hidden">
          {/* Left Panel - Clip Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-[420px] bg-gray-900 flex flex-col border-r border-[#2d2d2d]"
          >
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
            
            {/* Search Bar */}
            <div className="px-4 py-2 border-b border-[#2d2d2d] bg-gray-900">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#252525] text-sm px-10 py-2 rounded text-gray-300 
                             placeholder-gray-500 outline-none focus:ring-1 focus:ring-[#6c5ce7]"
                />
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>
            
            {/* Sort and Filter Controls */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-[#2d2d2d] bg-gray-900">
              <div className="flex items-center space-x-3">
                <button 
                  className={`flex items-center text-xs px-3 py-1 rounded-full ${
                    sortOrder === 'time' ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]' : 'bg-[#252525] text-gray-400'
                  }`}
                  onClick={toggleSort}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-1.5" />
                  <span>Time</span>
                </button>
                
                <button 
                  className={`flex items-center text-xs px-3 py-1 rounded-full ${
                    sortOrder === 'length' ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]' : 'bg-[#252525] text-gray-400'
                  }`}
                  onClick={toggleSort}
                >
                  <FontAwesomeIcon icon={faRuler} className="mr-1.5" />
                  <span>Length</span>
                </button>
              </div>
              
              <button 
                className="text-xs text-gray-400 hover:text-white transition-colors"
                onClick={handleUnselectAll}
              >
                Unselect All
              </button>
            </div>

            {/* Clips List */}
            <div className="flex-1 overflow-y-auto custom-purple-scrollbar bg-gray-900">
              {error ? (
                <div className="flex items-center justify-center h-full text-red-400 text-sm">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                  {error}
                </div>
              ) : sortedClips.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <p>No clips found</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2d2d2d]">
                  {sortedClips.map(renderClipItem)}
                </div>
              )}
            </div>
            
            {/* Selection Counter and Clear Button */}
            <div className="p-3 border-t border-[#2d2d2d] bg-gray-900 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedClips.length} selected
              </div>
              
              {selectedClips.length > 0 && (
                <button 
                  className="flex items-center text-xs px-3 py-1.5 rounded-md bg-[#252525] text-gray-300 hover:bg-[#303030] transition-colors"
                  onClick={handleClearSelection}
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-1.5" />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Middle Panel - Trimming Tool */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden bg-[#121212] relative"
          >
            {/* Mid Panel Header */}
            <div className="px-4 py-3 border-b border-[#2d2d2d] bg-[#1f1f1f] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faScissors} className="text-[#6c5ce7]" />
                </div>
                <h2 className="text-sm font-medium text-white">
                  Edit Clip {currentClip ? currentClip.id.replace('clip_', '#') : ''}
                </h2>
              </div>
              
              {/* Navigation Buttons */}
              {currentClip && processedClips.length > 1 && (
                <div className="flex gap-3">
                  <button 
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={handlePreviousClip}
                  >
                    <FontAwesomeIcon icon={faBackwardStep} className="text-xs" />
                    <span>Previous</span>
                  </button>
                  <button 
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={handleNextClip}
                  >
                    <span>Next</span>
                    <FontAwesomeIcon icon={faForwardStep} className="text-xs" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Trimming Tool Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {currentClip ? (
                  <motion.div 
                    key="trimming-tool"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="w-full h-full flex items-center justify-center p-6">
                      <TrimmingTool
                        videoId={currentClip.videoId}
                        videoUrl={currentClip.thumbnail}
                        initialDuration={currentClip.originalVideoDuration}
                        initialStartTime={currentClip.startTime}
                        initialEndTime={currentClip.endTime}
                        transcriptText={currentClip.transcriptText}
                        onTimingChange={handleTimingChange}
                        onSaveTrim={handleSaveTrim}
                      />
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
                    <div className="bg-gray-800/50 p-6 rounded-lg max-w-lg w-full text-center">
                      <div className="w-12 h-12 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7] text-xl" />
                      </div>
                      <h2 className="text-lg font-bold text-white mb-2">
                        Trim Your Clips
                      </h2>
                      <p className="text-gray-300 text-sm leading-relaxed mb-4">
                        Select a clip from the left panel to adjust its starting and ending points.
                      </p>
                      <div className="text-left p-3 bg-[#1a1a1a] rounded-lg text-xs text-gray-400">
                        <p className="mb-1"><strong>How to use the trimmer:</strong></p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Click a clip from the left panel</li>
                          <li>Drag the start and end markers to adjust timing</li>
                          <li>Preview your clip with the play button</li>
                          <li>Save your changes when you're happy with the result</li>
                        </ol>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Panel - Video Details */}
          {currentClip && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="w-[300px] bg-[#1f1f1f] border-l border-[#2d2d2d] flex flex-col"
            >
              <div className="p-4 border-b border-[#2d2d2d] bg-[#1f1f1f]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7]" />
                  </div>
                  <h2 className="text-sm font-medium text-white">Video Details</h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-purple-scrollbar p-4">
                <VideoDetails 
                  currentClip={currentClip}
                  showTranscript={true}
                />
              </div>
              
              {/* Save & Continue Button in Right Panel */}
              <div className="p-4 border-t border-[#2d2d2d] bg-[#1f1f1f]">
                <button 
                  className="w-full py-3 bg-[#6c5ce7] hover:bg-[#5849e0] text-white rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  onClick={handleFinishAndSave}
                  disabled={processedClips.length === 0 || selectedClips.length === 0}
                >
                  <FontAwesomeIcon icon={faSave} className="text-sm" />
                  <span>Save & Continue</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-sm" />
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