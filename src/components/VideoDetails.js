import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilm, 
  faClock, 
  faLink, 
  faScissors, 
  faObjectGroup, 
  faCheckCircle, 
  faQuoteLeft,
  faTimeline,
  faChevronUp,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const VideoDetails = ({ currentClip, showTranscript = false, onFinishAndSave }) => {
  const [showDetails, setShowDetails] = useState(true);
  
  if (!currentClip) return null;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="w-full max-w-[400px] bg-[#1f1f1f] rounded-lg shadow-lg p-3 flex flex-col min-h-0 sm:h-[calc(100vh-64px)] mt-3 sm:mt-0 dark:bg-[#121212] dark:text-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#6c5ce7]/70 flex items-center justify-center flex-shrink-0 shadow-md">
            <FontAwesomeIcon icon={showDetails ? faFilm : faQuoteLeft} className="text-white text-sm" />
          </div>
          <h3 className="text-base font-medium text-white">
            {showDetails ? "Video Details" : "Transcript"}
          </h3>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="px-2 py-1 bg-gray-800/70 hover:bg-gray-700/70 rounded-md text-xs text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1"
        >
          <FontAwesomeIcon icon={showDetails ? faQuoteLeft : faFilm} className="text-xs" />
          <span>{showDetails ? "Show Transcript" : "Show Details"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showDetails ? (
          <motion.div 
            key="details"
            className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title */}
            <motion.div 
              className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7]/30 to-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faFilm} className="text-[#6c5ce7] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">Title</div>
                <div className="text-xs text-white font-medium truncate">
                  {currentClip.title || 'Untitled Video'}
                </div>
              </div>
            </motion.div>

            {/* Duration */}
            <motion.div 
              className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7]/30 to-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faClock} className="text-[#6c5ce7] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">Duration</div>
                <div className="text-xs text-white font-medium tabular-nums">
                  {formatTime(currentClip.originalVideoDuration)} ({currentClip.originalVideoDuration}s)
                </div>
              </div>
            </motion.div>

            {/* Source */}
            <motion.div 
              className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7]/30 to-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faLink} className="text-[#6c5ce7] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">Source</div>
                <div className="text-xs text-white font-medium truncate hover:text-[#6c5ce7] transition-colors duration-300 cursor-pointer">
                  {currentClip.thumbnail}
                </div>
              </div>
            </motion.div>

            {/* Trim Duration */}
            <motion.div 
              className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7]/30 to-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faScissors} className="text-[#6c5ce7] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">Trim Duration</div>
                <div className="text-xs text-white font-medium tabular-nums">
                  {formatTime(currentClip.duration)} ({currentClip.duration}s)
                </div>
              </div>
            </motion.div>

            {/* Trim Points */}
            <motion.div 
              className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7]/30 to-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faTimeline} className="text-[#6c5ce7] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">Trim Points</div>
                <div className="text-xs text-white font-medium tabular-nums flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-700/60 rounded">
                    Start: {formatTime(currentClip.startTime)}
                  </span>
                  <span className="px-2 py-1 bg-gray-700/60 rounded">
                    End: {formatTime(currentClip.endTime)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="transcript"
            className="flex-1 overflow-y-auto custom-scrollbar pr-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Transcript Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7]/30 to-[#6c5ce7]/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faQuoteLeft} className="text-[#6c5ce7] text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">Transcript</div>
                <div className="text-xs text-white font-medium">
                  <span className="px-2 py-1 bg-gray-700/60 rounded-md text-xs">
                    {formatTime(currentClip.startTime)} - {formatTime(currentClip.endTime)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Transcript Content */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
              <div className="text-gray-300 text-sm leading-relaxed">
                <div className="text-[#6c5ce7] text-base mb-2 flex items-center">
                  <FontAwesomeIcon icon={faQuoteLeft} className="mr-2 text-xs opacity-70" />
                  <span className="italic">Transcript</span>
                </div>
                {currentClip.transcriptText ? (
                  <p className="text-white/90 font-light leading-relaxed">
                    {currentClip.transcriptText}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No transcript available for this clip.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action Buttons - Fixed at the bottom with vertical layout */}


      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 31, 31, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(108, 92, 231, 0.3);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(108, 92, 231, 0.5);
        }

        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 0;
            height: 0;
          }
        }
        `}
      </style>
    </motion.div>
  );
};

export default VideoDetails; 