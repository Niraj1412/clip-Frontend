import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faTrash, 
  faClock, 
  faFilm,
  faCheck,
  faTimes,
  faSort,
  faFilter,
  faSearch,
  faChevronDown,
  faChevronUp,
  faChevronRight,
  faChevronLeft,
  faPlus,
  faScissors,
  faMinus,
  faLink,
  faCheckSquare,
  faSquare,
  faGripVertical
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// Updated color palette with more modern and appealing colors
const colors = {
  primary: '#6366f1',      // Indigo 500
  primaryDark: '#4f46e5',  // Indigo 600
  accent: '#22d3ee',       // Cyan 400
  success: '#10b981',      // Emerald 500
  danger: '#ef4444',       // Red 500
  warning: '#f59e0b',      // Amber 500
  background: '#0f172a',   // Slate 900
  surface: '#1e293b',      // Slate 800
  surfaceLight: '#334155', // Slate 700
  border: '#475569',       // Slate 600
  textPrimary: '#f8fafc',  // Slate 50
  textSecondary: '#cbd5e1', // Slate 300
  textMuted: '#94a3b8'     // Slate 400
};

const ClipsPreviewer = ({ 
  clips = [], 
  onPlayClip = () => {}, 
  onDeleteClip = () => {},
  onSelectClip = () => {},
  onUnselectClip = () => {},
  selectedClips = [],
  onReorderClips = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp'); // 'timestamp', 'duration', 'title'
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeCardId, setActiveCardId] = useState(null);
  const [recentlySelected, setRecentlySelected] = useState(null);
  const [activeClip, setActiveClip] = useState(null);
  const [orderedClips, setOrderedClips] = useState([]);
  
  // If all clips should be selected by default, do it only once on initial load
  const initialSelectionDone = React.useRef(false);
  
  useEffect(() => {
    // Check if we need to initialize selection
    if (clips.length > 0 && selectedClips.length === 0 && !initialSelectionDone.current) {
      console.log('Auto-selecting all clips on initial load:', clips.length);
      // Select all clips initially
      clips.forEach(clip => onSelectClip(clip));
      initialSelectionDone.current = true;
    }
  }, [clips, selectedClips.length, onSelectClip]);
  
  useEffect(() => {
    const newlySelected = selectedClips.find(clip => !recentlySelected || clip.id !== recentlySelected);
    if (newlySelected) {
      setRecentlySelected(newlySelected.id);
      setTimeout(() => setRecentlySelected(null), 800);
    }
  }, [selectedClips.length]);

  // Initialize ordered clips when clips change
  useEffect(() => {
    if (clips.length > 0) {
      setOrderedClips([...clips]);
    }
  }, [clips]);

  // Format time to HH:MM:SS format
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Use Reorder.Group from framer-motion for drag and drop
  const handleReorder = (newOrder) => {
    setOrderedClips(newOrder);
    
    // Notify parent component of reordering
    if (onReorderClips) {
      onReorderClips(newOrder);
    }
  };

  // Sort and filter clips
  const processedClips = [...(orderedClips.length > 0 ? orderedClips : clips)]
    .filter(clip => clip.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Only apply sorting if user has explicitly chosen a sort field
      if (!sortBy) return 0;
      
      let comparison = 0;
      
      switch (sortBy) {
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'timestamp':
        default:
          comparison = (new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Check if a clip is selected
  const isSelected = (clipId) => {
    return selectedClips.some(clip => clip.id === clipId);
  };

  // Toggle selection
  const toggleSelection = (clip) => {
    if (isSelected(clip.id)) {
      console.log('Unselecting clip:', clip.id);
      onUnselectClip(clip);
    } else {
      console.log('Selecting clip:', clip.id);
      onSelectClip(clip);
    }
  };
  
  // Toggle all clips selection
  const toggleAllClips = () => {
    const allSelected = processedClips.every(clip => isSelected(clip.id));
    
    console.log('Toggle all clips:', allSelected ? 'Unselecting all' : 'Selecting all');
    
    if (allSelected) {
      // Unselect all clips
      processedClips.forEach(clip => onUnselectClip(clip));
    } else {
      // Select all clips
      processedClips.forEach(clip => {
        if (!isSelected(clip.id)) {
          onSelectClip(clip);
        }
      });
    }
  };

  const handlePlayClip = (clip) => {
    setActiveClip(clip.id);
    onPlayClip(clip);
  };

  // Update container variants to remove collapse animation
  const containerVariants = {
    animate: { 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    },
    initial: { 
      opacity: 0,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  // Container variants for card animations
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 25 
      } 
    },
    exit: { 
      opacity: 0, 
      x: -30, 
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      } 
    },
    hover: { 
      scale: 1.02, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 15 
      } 
    }
  };

  // Button variants
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: 1.05, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 10 
      } 
    },
    tap: { 
      scale: 0.95, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 10 
      } 
    }
  };

  const emptyStateVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 25, 
        delay: 0.2 
      } 
    }
  };

  // Header variants
  const headerTextVariants = {
    expanded: { opacity: 1, width: 'auto', transition: { duration: 0.3, delay: 0.1 } },
    collapsed: { opacity: 0, width: 0, transition: { duration: 0.2 } }
  };

  // Refined animation variants for the clip cards
  const clipCardVariants = {
    initial: { 
      opacity: 0, 
      y: 10,
      scale: 0.98
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { 
        duration: 0.2 
      }
    },
    hover: {
      y: -3,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 20
      }
    },
    tap: { 
      scale: 0.98,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 20
      }
    }
  };

  // Add global styles for the component
  React.useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .clip-list-scrollbar::-webkit-scrollbar {
          width: 6px;
      }
      .clip-list-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
      }
      .clip-list-scrollbar::-webkit-scrollbar-thumb {
          background: #6c5ce7;
          border-radius: 3px;
          opacity: 0.7;
      }
      .clip-list-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7d6cf8;
      }
    `;
    
    // Append the style element to the document head
    document.head.appendChild(styleElement);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <motion.div 
      className="h-[calc(100%)]  flex flex-col bg-gray-900 text-white overflow-hidden"
      variants={containerVariants}
      animate="animate"
      initial="initial"
    >
      {/* Enhanced Header with Glass Effect */}
      <div className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 z-20">
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FontAwesomeIcon icon={faFilm} className="text-[#6366f1] mr-2" />
                <h2 className="font-medium text-white">Clips</h2>
              </motion.div>
              
              {/* Clip Count Badge */}
              <div className="ml-2 px-2 py-0.5 bg-gray-700/50 rounded-full text-xs text-gray-300">
                {processedClips.length}
              </div>
            </div>
          </div>
          
          {/* Search and Controls - Always visible now */}
          <div className="mt-2">
            {/* Enhanced Search Bar */}
            <div className="relative mb-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-xs" />
              </div>
              <input
                type="text"
                placeholder="Search clips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Enhanced Controls Bar */}
            <div className="flex items-center justify-between">
              {/* Sort Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => toggleSort('timestamp')}
                  className={`px-2 py-1 rounded text-xs flex items-center ${
                    sortBy === 'timestamp' ? 'bg-[#6366f1]/20 text-[#6366f1]' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                  } transition-colors`}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-1 text-[8px]" />
                  <span>Time</span>
                  {sortBy === 'timestamp' && (
                    <FontAwesomeIcon 
                      icon={sortOrder === 'asc' ? faChevronUp : faChevronDown} 
                      className="ml-1 text-[8px]" 
                    />
                  )}
                </button>
                <button
                  onClick={() => toggleSort('duration')}
                  className={`px-2 py-1 rounded text-xs flex items-center ${
                    sortBy === 'duration' ? 'bg-[#6366f1]/20 text-[#6366f1]' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                  } transition-colors`}
                >
                  <FontAwesomeIcon icon={faSort} className="mr-1 text-[8px]" />
                  <span>Length</span>
                  {sortBy === 'duration' && (
                    <FontAwesomeIcon 
                      icon={sortOrder === 'asc' ? faChevronUp : faChevronDown} 
                      className="ml-1 text-[8px]" 
                    />
                  )}
                </button>
              </div>
              
              {/* Select All Button */}
              <button
                onClick={toggleAllClips}
                className={`px-2 py-1 rounded text-xs flex items-center ${
                  processedClips.every(clip => isSelected(clip.id)) 
                    ? 'bg-[#6366f1]/20 text-[#6366f1]' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                } transition-colors`}
              >
                <FontAwesomeIcon 
                  icon={processedClips.every(clip => isSelected(clip.id)) ? faCheckSquare : faSquare} 
                  className="mr-1 text-[8px]" 
                />
                <span>{processedClips.every(clip => isSelected(clip.id)) ? 'Unselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Clips List with Enhanced Empty State */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <AnimatePresence>
          {processedClips.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center h-full text-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <FontAwesomeIcon icon={faFilm} className="text-gray-600 text-2xl" />
              </div>
              {searchTerm ? (
                <>
                  <h3 className="text-gray-300 font-medium mb-1">No clips found</h3>
                  <p className="text-gray-500 text-sm">No clips match your search for "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-3 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-gray-300 font-medium mb-1">No clips available</h3>
                  <p className="text-gray-500 text-sm">There are no clips to display</p>
                </>
              )}
            </motion.div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={processedClips} 
              onReorder={handleReorder}
              className="flex flex-col"
            >
              {processedClips.map((clip) => (
                <Reorder.Item
                  key={clip.id}
                  value={clip}
                  className="mb-3"
                  as="div"
                >
                  <motion.div 
                    className="relative overflow-hidden cursor-pointer transition-all duration-300 group"
                    onClick={() => handlePlayClip(clip)}
                    variants={clipCardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="hover"
                    whileTap="tap"
                    layoutId={`clip-${clip.id}`}
                  >
                    {/* Main Card */}
                    <div className={`rounded-xl overflow-hidden shadow-lg ${
                      isSelected(clip.id) 
                        ? `bg-gradient-to-br from-${colors.surface} to-${colors.surfaceLight} ring-2 ring-${colors.primary}` 
                        : `bg-gradient-to-br from-${colors.surface}/90 to-${colors.surfaceLight}/70 hover:from-${colors.surface} hover:to-${colors.surfaceLight}/80 ring-1 ring-${colors.border}/30`
                    }`}>
                      {/* Card Content */}
                      <div className="flex items-stretch">
                        {/* Drag Handle */}
                        <div className="w-8 flex items-center justify-center bg-black/30 cursor-grab active:cursor-grabbing">
                          <FontAwesomeIcon 
                            icon={faGripVertical} 
                            className={`text-${colors.textMuted} text-xs group-hover:text-${colors.textSecondary} transition-colors`}
                          />
                        </div>
                        
                        {/* Thumbnail with Improved Styling */}
                        <div className="relative w-24 h-auto aspect-video flex-shrink-0 bg-black/40 overflow-hidden">
                          <img 
                            src={clip.thumbnail || `https://via.placeholder.com/150/${colors.background.replace('#', '')}/${colors.primary.replace('#', '')}?text=Clip`} 
                            alt={clip.title || `Clip`}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Play Overlay with Animation */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <motion.div 
                              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FontAwesomeIcon icon={faPlay} className={`text-${colors.primary} text-xs ml-0.5`} />
                            </motion.div>
                          </div>
                          
                          {/* Duration Badge with Improved Styling */}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                            {formatTime(clip.duration || 0)}
                          </div>
                        </div>
                        
                        {/* Content with Improved Layout */}
                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                          {/* Title and Time */}
                          <div>
                            <div className="flex items-start justify-between">
                              <h3 className={`font-semibold text-sm text-${colors.textPrimary} line-clamp-1 pr-2 group-hover:text-white transition-colors`}>
                                {clip.title || `Clip`}
                              </h3>
                              
                              {/* Selection Checkbox with Animation */}
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelection(clip);
                                }}
                                className="text-xs flex items-center -mt-0.5"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all duration-200 ${
                                  isSelected(clip.id) 
                                    ? `bg-${colors.primary} text-white shadow-md shadow-${colors.primary}/30` 
                                    : `bg-${colors.surfaceLight}/70 text-${colors.textMuted} border border-${colors.border}/50 hover:border-${colors.primary}/50`
                                }`}>
                                  {isSelected(clip.id) && (
                                    <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                                  )}
                                </div>
                              </motion.button>
                            </div>
                            
                            {/* Time Info with Improved Styling */}
                            <div className={`flex items-center mt-1.5 text-[11px] text-${colors.textSecondary} opacity-80 group-hover:opacity-100`}>
                              <FontAwesomeIcon icon={faClock} className="mr-1.5 text-[9px] text-${colors.accent}" />
                              <span>{formatTime(clip.startTime || 0)} - {formatTime(clip.endTime || 0)}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons with Improved Styling */}
                          <div className="flex items-center justify-between mt-3">
                            {/* Active Indicator with Animation */}
                            {activeClip === clip.id && (
                              <div className={`text-[10px] text-${colors.accent} font-medium flex items-center`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-${colors.accent} mr-1.5 animate-pulse`}></div>
                                <span className="tracking-wide">Playing</span>
                              </div>
                            )}
                            
                            {/* Delete Button with Improved Styling */}
                            <div className={`flex items-center ${activeClip === clip.id ? '' : 'ml-auto'}`}>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteClip(clip);
                                }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center bg-${colors.surfaceLight}/60 text-${colors.textSecondary} hover:bg-${colors.danger} hover:text-white transition-all duration-200`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-[9px]" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Time Indicator Bar with Improved Styling */}
                    <div className="h-1.5 w-full bg-black/30 relative rounded-b-xl overflow-hidden">
                      <motion.div 
                        className={`absolute h-full bg-gradient-to-r from-${colors.primary} to-${colors.accent}`}
                        style={{ 
                          width: `${((clip.endTime - clip.startTime) / (clip.duration || 1)) * 100}%`,
                          left: `${(clip.startTime / (clip.duration || 1)) * 100}%`
                        }}
                        initial={{ scaleX: 0.9, opacity: 0.7 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      ></motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Recently Selected Animation with Improved Styling */}
                  {recentlySelected === clip.id && (
                    <motion.div 
                      className={`absolute inset-0 bg-${colors.success}/15 rounded-xl z-10 pointer-events-none`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Active Clip Indicator with Improved Styling */}
                  {activeClip === clip.id && (
                    <motion.div 
                      className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-${colors.accent} to-${colors.primary} rounded-l-xl`}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </AnimatePresence>
      </div>
      
      {/* Enhanced Footer with Selection Count - Always visible now */}
      <div className="border-t border-gray-800 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`px-2 py-1 rounded text-xs flex items-center ${
                selectedClips.length > 0 ? 'bg-[#6366f1]/20 text-[#6366f1]' : 'bg-gray-800/50 text-gray-400'
              }`}>
                <span className="font-medium">{selectedClips.length}</span>
                <span className="ml-1">selected</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <motion.button 
              className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center transition-all duration-300 ${
                selectedClips.length > 0 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
              }`}
              disabled={selectedClips.length === 0}
              onClick={() => selectedClips.forEach(clip => onUnselectClip(clip))}
              whileHover={selectedClips.length > 0 ? { scale: 1.02 } : {}}
              whileTap={selectedClips.length > 0 ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="mr-2 text-xs" />
                <span>Clear Selection</span>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClipsPreviewer; 