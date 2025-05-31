"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Use useCallback to prevent functions from changing on every render
  const startReveal = useCallback(() => {
    setIsRevealing(true);
  }, []);

  const completeReveal = useCallback(() => {
    setIsRevealing(false);
    setIsReady(true);
  }, []);

  return (
    <LoadingContext.Provider value={{
      isInitialLoading,
      setIsInitialLoading,
      isRevealing,
      isReady,
      startReveal,
      completeReveal
    }}>
      {children}
    </LoadingContext.Provider>
  );
};
