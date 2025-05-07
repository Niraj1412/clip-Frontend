import React, { createContext, useContext, useState } from 'react';

const ClipsDataContext = createContext();

export const ClipsDataProvider = ({ children }) => {
  const [selectedClipsData, setSelectedClipsData] = useState([]);

  return (
    <ClipsDataContext.Provider value={{ selectedClipsData, setSelectedClipsData }}>
      {children}
    </ClipsDataContext.Provider>
  );
};

export const useClipsData = () => {
  const context = useContext(ClipsDataContext);
  if (!context) {
    throw new Error('useClipsData must be used within a ClipsDataProvider');
  }
  return context;
}; 