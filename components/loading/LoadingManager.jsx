"use client";
import React, { createContext, useContext, useState } from 'react';

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

  const startReveal = () => {
    setIsInitialLoading(false);
    setIsRevealing(true);
  };

  const completeReveal = () => {
    setIsRevealing(false);
    setIsReady(true);
  };

  return (
    <LoadingContext.Provider value={{
      isInitialLoading,
      isRevealing,
      isReady,
      startReveal,
      completeReveal
    }}>
      {children}
    </LoadingContext.Provider>
  );
};
