import React, { createContext, useState, useContext, useEffect } from 'react';

const PromptContext = createContext();

// Default prompt value to use if none is provided
const DEFAULT_PROMPT = "";

// Try to get persisted prompt from localStorage
const getPersistedPrompt = () => {
  try {
    const persistedPrompt = localStorage.getItem('prompt');
    return persistedPrompt || DEFAULT_PROMPT;
  } catch (error) {
    console.error('[PromptContext] Error reading from localStorage:', error);
    return DEFAULT_PROMPT;
  }
};

export const PromptProvider = ({ children }) => {
  const [prompt, setPrompt] = useState(getPersistedPrompt());

  // Persist prompt to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('prompt', prompt);
      console.log('[PromptContext] Persisted prompt to localStorage:', prompt);
    } catch (error) {
      console.error('[PromptContext] Error persisting to localStorage:', error);
    }
  }, [prompt]);

  const clearPrompt = () => {
    console.log("[PromptContext] Clearing prompt");
    setPrompt(DEFAULT_PROMPT);
    localStorage.removeItem('prompt');
  };

  return (
    <PromptContext.Provider
      value={{
        prompt,
        setPrompt,
        clearPrompt,
        DEFAULT_PROMPT,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return context;
}; 