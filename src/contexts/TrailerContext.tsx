
import React, { createContext, useContext, useState } from 'react';

interface TrailerContextType {
  isTrailerOpen: boolean;
  setIsTrailerOpen: (open: boolean) => void;
  trailerKey: string;
  setTrailerKey: (key: string) => void;
  movieTitle: string;
  setMovieTitle: (title: string) => void;
}

const TrailerContext = createContext<TrailerContextType | undefined>(undefined);

export const TrailerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState('');
  const [movieTitle, setMovieTitle] = useState('');

  return (
    <TrailerContext.Provider value={{ 
      isTrailerOpen, 
      setIsTrailerOpen,
      trailerKey,
      setTrailerKey,
      movieTitle,
      setMovieTitle
    }}>
      {children}
    </TrailerContext.Provider>
  );
};

export const useTrailerContext = () => {
  const context = useContext(TrailerContext);
  if (context === undefined) {
    throw new Error('useTrailerContext must be used within a TrailerProvider');
  }
  return context;
};
