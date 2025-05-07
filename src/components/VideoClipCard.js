import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPencilAlt, 
  faTrash,
  faClock,
  faFilm,
  faDownload,
  faEllipsisVertical,
  faHeart,
  faEye,
  faClipboard
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const VideoClipCard = ({ 
  clips = [], 
  onPlayClip = () => {}, 
  onEditClip = () => {}, 
  onDeleteClip = () => {},
  onSelectClip = () => {}
}) => {

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

  // Generate a gradient color based on clip index
  const getClipColor = (index) => {
    const colors = [
      'from-[#6c5ce7] to-[#a29bfe]',
      'from-[#0984e3] to-[#74b9ff]',
      'from-[#00b894] to-[#55efc4]',
      'from-[#d63031] to-[#ff7675]',
      'from-[#e84393] to-[#fd79a8]',
      'from-[#fdcb6e] to-[#ffeaa7]'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Your Video Clips</h2>
        <div className="text-sm text-gray-400">
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'} • Total duration: {
            formatTime(clips.reduce((total, clip) => total + clip.duration, 0))
          }
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <div className="mb-3 bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <FontAwesomeIcon icon={faFilm} className="text-gray-500 text-2xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No clips yet</h3>
          <p className="text-gray-400 mb-4">Use the trimming tool to create your first clip</p>
          <button className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5849e0] transition-all duration-300">
            Create Clip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip, index) => (
            <div 
              key={clip.id}
              className={`bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:shadow-[#6c5ce7]/10 transition-all duration-300 group`}
            >
              {/* Thumbnail preview */}
              <div className="relative aspect-video bg-gray-900 overflow-hidden cursor-pointer" onClick={() => onPlayClip(clip)}>
                {/* Gradient overlay for thumbnail */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getClipColor(index)} opacity-30`}></div>
                
                {/* Video thumbnail (placeholder) */}
                {clip.thumbnail ? (
                  <img 
                    src={clip.thumbnail} 
                    alt={`Clip ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faFilm} className="text-gray-600 text-4xl" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                  <div className="bg-[#6c5ce7] w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-75 transition-all duration-300 hover:bg-[#5849e0]">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-lg ml-1" />
                  </div>
                </div>
                
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {formatTime(clip.duration)}
                </div>
                
                {/* Time range badge */}
                <div className="absolute bottom-2 left-2 bg-[#6c5ce7]/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="text-xs" />
                  <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
                </div>
              </div>
              
              {/* Clip info */}
              <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white line-clamp-1 group-hover:text-[#6c5ce7] transition-colors duration-300">
                    {clip.title || `Clip ${index + 1}`}
                  </h3>
                  
                  {/* Dropdown menu */}
                  <div className="relative group/menu">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all duration-300">
                      <FontAwesomeIcon icon={faEllipsisVertical} className="text-sm" />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10 w-36 py-1 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transform group-hover/menu:translate-y-0 translate-y-2 transition-all duration-200">
                      <button 
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        onClick={() => onEditClip(clip)}
                      >
                        <FontAwesomeIcon icon={faPencilAlt} className="text-xs w-4" />
                        <span>Edit</span>
                      </button>
                      <button 
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        onClick={() => onSelectClip(clip)}
                      >
                        <FontAwesomeIcon icon={faClipboard} className="text-xs w-4" />
                        <span>Select</span>
                      </button>
                      <button 
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faDownload} className="text-xs w-4" />
                        <span>Download</span>
                      </button>
                      <button 
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-red-600/20 text-red-400 hover:text-red-300 flex items-center gap-2"
                        onClick={() => onDeleteClip(clip)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Metadata row */}
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faEye} className="text-xs" />
                      <span>{clip.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faHeart} className="text-xs" />
                      <span>{clip.likes || 0}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoClipCard; 