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
  faArrowLeft,
  faArrowRight,
  faTrash,
  faTimes,
  faSort
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ClipsPreviewer from '../components/ClipsPreviewer';
import videoPlayer from '../components/videoPlayer';
import TrimmingTool from '../components/TrimmingTool';
import VideoDetails from '../components/VideoDetails';
import { useClipsData } from '../context/clipsData';
import { usePrompt } from '../context/promptContext';
import { YOUTUBE_API } from '../config';

const ClipsPreviewerDemo = () => {
  const { selectedClipsData, setSelectedClipsData, transcriptData } = useClipsData();
  const { prompt } = usePrompt();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedClips, setProcessedClips] = useState([]);

  const initialSelectionRef = useRef(false);

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

  // Initialize all processed clips as selected by default
  useEffect(() => {
    if (processedClips.length > 0 && selectedClips.length === 0 && !initialSelectionRef.current) {
      console.log('Initializing all clips as selected in ClipsPreviewerDemo');
      setSelectedClips([...processedClips]);
      initialSelectionRef.current = true;
    }
  }, [processedClips, selectedClips.length]);

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

  return (
    <div className="h-screen w-screen bg-[#121212] flex flex-col overflow-hidden mt-10">
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
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
      
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        <div className="w-[420px] bg-gray-900 ">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">
              {error}
            </div>
          ) : (
            <ClipsPreviewer 
              clips={processedClips}
              onPlayClip={handlePlayClip}
              onDeleteClip={handleDeleteClip}
              onSelectClip={handleSelectClip}
              onUnselectClip={handleUnselectClip}
              selectedClips={selectedClips}
            />
          )}
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#121212] relative">
          <AnimatePresence mode ="wait">
            {currentClip ? (
              <motion.div 
                key="trimming-tool"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[calc(100%-40px)] mx-auto h-full px-4 py-6 flex items-center justify-center"
              >
                <div className="w-full max-w-[1200px] mx-auto">
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
                className="flex flex-col items-center justify-center h-full w-full p-3"
              >
                <div className="bg-gray-800/50 backdrop-blur-xl p-4 rounded-xl max-w-lg w-full shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-[#6c5ce7] flex items-center justify-center mx-auto mb-3 transform transition-transform duration-300 hover:rotate-12 hover:scale-110">
                    <FontAwesomeIcon icon={faFilm} className="text-white text-lg" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2 text-center">
                    Video Clip Trimmer
                  </h2>
                  <p className="text-gray-300 mb-3 text-center text-xs leading-relaxed">
                    Select a clip from the sidebar to start trimming. You can adjust the start and end times, 
                    preview the clip, and save your changes.
                  </p>
                  <div className="bg-[#6c5ce7]/10 rounded-lg p-2">*
                    <p className="text-gray-400 text-[10px] text-center">
                      The trimming tool provides precise control over your video clips with frame-accurate trimming 
                      and real-time preview capabilities.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {currentClip && <div className="w-[350px] bg-[#1f1f1f] p-2">
          <VideoDetails 
            currentClip={currentClip}
            showTranscript={true}
            onFinishAndSave={handleFinishAndSave}
          />
        </div>}
      </div>

      {processedClips.length > 0 && (
        <div className="flex justify-between items-center gap-3 mt-1">
          <button 
            className="flex-1 px-4 py-2 bg-gray-700/50 text-white rounded-lg text-sm font-medium hover:bg-gray-600/50 transition-all duration-300 flex items-center justify-center gap-2 group/previous transform hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden"
            onClick={handlePreviousClip}
            disabled={!currentClip}
          >
            <FontAwesomeIcon 
              icon={faBackwardStep} 
              className="transform transition-transform duration-300 group-hover/previous:scale-110 text-sm" 
            />
            <span className="transform transition-transform duration-300 group-hover/previous:translate-x-1">
              Previous Clip
            </span>
          </button>

          <button 
            className="flex-1 px-4 py-2 bg-gray-700/50 text-white rounded-lg text-sm font-medium hover:bg-gray-600/50 transition-all duration-300 flex items-center justify-center gap-2 group/next transform hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden"
            onClick={handleNextClip}
            disabled={!currentClip}
          >
            <FontAwesomeIcon 
              icon={faForwardStep} 
              className="transform transition-transform duration-300 group-hover/next:scale-110 text-sm" 
            />
            <span className="transform transition-transform duration-300 group-hover/next:translate-x-1">
              Next Clip
            </span>
          </button>
          
          <button 
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-cyan-700 transition-all duration-300 flex items-center justify-center gap-2 group/save transform hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden"
            onClick={handleFinishAndSave}
            disabled={processedClips.length === 0}
          >
            <FontAwesomeIcon 
              icon={faSave} 
              className="transform transition-transform duration-300 group-hover/save:scale-110 text-sm" 
            />
            <span className="transform transition-transform duration-300 group-hover/save:translate-x-1">
              Finish and Save
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ClipsPreviewerDemo; 