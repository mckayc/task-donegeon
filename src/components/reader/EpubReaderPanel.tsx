
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon } from '../user-interface/Icons';
import { useQuestsDispatch } from '../../context/QuestsContext';

// FIX: Add global JSX declaration for the 'foliate-view' custom element.
// This informs TypeScript about the custom web component, resolving the error.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'foliate-view': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
  const { setReadingQuest } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { updateReadingProgress } = useQuestsDispatch();

  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewRef = useRef<HTMLElement & { open: (url: string) => Promise<void>; goTo: (cfi: string) => Promise<void> }>(null);

  // 1. Load the Foliate library script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/foliate-js';
    script.type = 'module';
    script.onload = () => setIsLibraryLoaded(true);
    script.onerror = () => setError('Failed to load the EPUB reader library.');
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // 2. Open the book when the library is ready
  useEffect(() => {
    const viewElement = viewRef.current;
    const epubUrl = quest.epubUrl;

    if (isLibraryLoaded && viewElement && epubUrl) {
      const openBook = async () => {
        try {
          await viewElement.open(epubUrl);
          const savedLocation = currentUser && quest.readingProgress?.[currentUser.id]?.locationCfi;
          if (savedLocation) {
            await viewElement.goTo(savedLocation);
          }
        } catch (err) {
          console.error("Foliate: failed to open book", err);
          setError(`Failed to open book: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      };
      openBook();
    } else if (isLibraryLoaded && !epubUrl) {
        setError("No EPUB file is associated with this quest.");
    }
  }, [isLibraryLoaded, quest.epubUrl, currentUser, quest.readingProgress, quest.id]);

  // 3. Set up event listeners for saving progress
  const handleRelocate = useCallback((e: Event) => {
    if (!currentUser) return;
    const customEvent = e as CustomEvent;
    const location = customEvent.detail?.cfi;
    if (location) {
        updateReadingProgress(quest.id, currentUser.id, { locationCfi: location });
    }
  }, [currentUser, quest.id, updateReadingProgress]);
  
  useEffect(() => {
    const viewElement = viewRef.current;
    if (!viewElement || !isLibraryLoaded) return;
    
    viewElement.addEventListener('relocate', handleRelocate);
    
    return () => { viewElement.removeEventListener('relocate', handleRelocate); };
  }, [handleRelocate, isLibraryLoaded]);

  return (
    <div className="fixed inset-0 bg-stone-900/90 z-[80] flex flex-col items-center justify-center backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl flex flex-col shadow-2xl">
        <header className="w-full p-2 bg-stone-800 text-white flex justify-between items-center z-10 flex-shrink-0 rounded-t-lg">
          <h3 className="font-bold text-lg truncate ml-2">{quest.title}</h3>
          <Button variant="ghost" size="icon" onClick={() => setReadingQuest(null)} title="Close Reader">
            <XCircleIcon className="w-6 h-6"/>
          </Button>
        </header>
        <div className="flex-grow w-full h-full relative bg-black">
          {isLibraryLoaded && !error && (
            <foliate-view ref={viewRef} style={{ width: '100%', height: '100%' }}></foliate-view>
          )}
          {!isLibraryLoaded && !error && (
            <div className="flex items-center justify-center h-full text-white">Loading Reader...</div>
          )}
          {error && (
             <div className="flex items-center justify-center h-full text-red-400 font-semibold p-4 text-center">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpubReaderPanel;
