import React, { createContext, useState, useContext, useEffect } from 'react';

const VideoIdsContext = createContext();

// Try to get persisted video IDs from localStorage
const getPersistedVideoIds = () => {
  try {
    const persistedIds = localStorage.getItem('videoIds');
    return persistedIds ? JSON.parse(persistedIds) : [];
  } catch (error) {
    console.error('[VideoIdsContext] Error reading from localStorage:', error);
    return [];
  }
};

export const VideoIdsProvider = ({ children }) => {
  const [videoIds, setVideoIds] = useState(getPersistedVideoIds());
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [videoDetails, setVideoDetails] = useState({});

  // Persist videoIds to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('videoIds', JSON.stringify(videoIds));
      console.log('[VideoIdsContext] Persisted videoIds to localStorage:', videoIds);
    } catch (error) {
      console.error('[VideoIdsContext] Error persisting to localStorage:', error);
    }
  }, [videoIds]);

  const addVideoIds = (newIds) => {
    console.log("[VideoIdsContext] Adding new video IDs:", newIds);
    // Check if we're adding a single video - if so, replace entirely to avoid accumulation
    if (newIds.length === 1) {
      console.log("[VideoIdsContext] Single video ID detected - replacing all existing IDs");
      setVideoIds(newIds);
    } else {
      // For playlists, keep the merged unique set behavior
      setVideoIds(prevIds => {
        const updatedIds = [...new Set([...prevIds, ...newIds])];
        console.log("[VideoIdsContext] Updated video IDs:", updatedIds);
        return updatedIds;
      });
    }
  };

  const clearVideoIds = () => {
    console.log("[VideoIdsContext] Clearing all video IDs");
    setVideoIds([]);
    setSelectedVideoId(null);
    setVideoDetails({});
    localStorage.removeItem('videoIds');
  };

  const updateVideoDetails = (videoId, details) => {
    console.log(`[VideoIdsContext] Updating details for video ID: ${videoId}`, details);
    setVideoDetails(prev => ({
      ...prev,
      [videoId]: details
    }));
  };

  return (
    <VideoIdsContext.Provider
      value={{
        videoIds,
        selectedVideoId,
        videoDetails,
        setSelectedVideoId,
        addVideoIds,
        clearVideoIds,
        updateVideoDetails,
      }}
    >
      {children}
    </VideoIdsContext.Provider>
  );
};

export const useVideoIds = () => {
  const context = useContext(VideoIdsContext);
  if (!context) {
    throw new Error('useVideoIds must be used within a VideoIdsProvider');
  }
  return context;
};
