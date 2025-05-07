import React, { useState } from 'react';
import VideoClipCard from '../components/VideoClipCard';
import TrimmingTool from '../components/TrimmingTool';

const ClipsPage = () => {
  // Sample clips data
  const [clips, setClips] = useState([
    {
      id: 1,
      title: 'Introduction Segment',
      startTime: 10,
      endTime: 45,
      duration: 35,
      thumbnail: 'https://placekitten.com/400/225', // Placeholder image
      views: 120,
      likes: 24,
      createdAt: '2023-02-15T10:30:00'
    },
    {
      id: 2,
      title: 'Product Demo',
      startTime: 65,
      endTime: 110,
      duration: 45,
      thumbnail: 'https://placekitten.com/401/225', // Placeholder image
      views: 85,
      likes: 12,
      createdAt: '2023-02-16T14:20:00'
    },
    {
      id: 3,
      title: 'Final Summary',
      startTime: 140,
      endTime: 175,
      duration: 35,
      thumbnail: 'https://placekitten.com/402/225', // Placeholder image
      views: 45,
      likes: 8,
      createdAt: '2023-02-17T09:15:00'
    }
  ]);

  // State for the currently selected clip
  const [selectedClip, setSelectedClip] = useState(null);
  
  // State for the trim editor visibility
  const [showTrimEditor, setShowTrimEditor] = useState(false);

  // Handle playing a clip
  const handlePlayClip = (clip) => {
    console.log('Playing clip:', clip);
    // Implementation would depend on your video player
  };

  // Handle editing a clip
  const handleEditClip = (clip) => {
    setSelectedClip(clip);
    setShowTrimEditor(true);
  };

  // Handle deleting a clip
  const handleDeleteClip = (clip) => {
    if (window.confirm(`Are you sure you want to delete "${clip.title}"?`)) {
      setClips(clips.filter(c => c.id !== clip.id));
    }
  };

  const handleSelectClip = (clip) => {
    setSelectedClip(clip);
  };

  const handleSaveTrim = ({ startTime, endTime, duration }) => {
    if (selectedClip) {
      setClips(clips.map(clip => 
        clip.id === selectedClip.id 
          ? { ...clip, startTime, endTime, duration } 
          : clip
      ));
    } else {
      // Create new clip
      const newClip = {
        id: Date.now(), // Simple ID generation
        title: `Clip ${clips.length + 1}`,
        startTime,
        endTime,
        duration,
        views: 0,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      setClips([...clips, newClip]);
    }
    
    setShowTrimEditor(false);
    setSelectedClip(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Video Clips</h1>
        
        {showTrimEditor ? (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-medium">
                {selectedClip ? `Editing: ${selectedClip.title}` : 'Create New Clip'}
              </h2>
              <button 
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setShowTrimEditor(false);
                  setSelectedClip(null);
                }}
              >
                Cancel
              </button>
            </div>
            
            <TrimmingTool 
              initialStartTime={selectedClip ? selectedClip.startTime : 0}
              initialEndTime={selectedClip ? selectedClip.endTime : 30}
              onSaveTrim={handleSaveTrim}
            />
          </div>
        ) : (
          <div className="mb-8">
            <button 
              className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5849e0] transition-all duration-300 mb-8"
              onClick={() => setShowTrimEditor(true)}
            >
              Create New Clip
            </button>
          </div>
        )}
        
        <VideoClipCard 
          clips={clips}
          onPlayClip={handlePlayClip}
          onEditClip={handleEditClip}
          onDeleteClip={handleDeleteClip}
          onSelectClip={handleSelectClip}
        />
      </div>
    </div>
  );
};

export default ClipsPage; 