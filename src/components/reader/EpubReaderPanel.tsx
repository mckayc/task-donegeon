

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Quest } from '../../types';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsDispatch } from '../../context/QuestsContext';
import { XCircleIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';

// Define the type for the custom element's instance methods
interface FoliateViewElement extends HTMLElement {
  open(url: string): Promise<void>;
  goTo(location: string): Promise<void>;
}

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
  const { setReadingQuest } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { updateReadingProgress } = useQuestsDispatch();
  const viewRef = useRef<FoliateViewElement>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Dynamically import the library
  useEffect(() => {
    // As per user instructions, assuming foliate-js is available at this path.
    // @ts-ignore - This is a dynamic import for a non-typed JS module.
    import('/foliate-js/view.js')
      .then(() => {
        setIsLibraryLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load foliate-js library:", err);
        setError("Could not load the e-book reader library.");
      });
  }, []);

  // 2. Open the book when the component is ready
  useEffect(() => {
    // Capture the current values in constants to ensure TypeScript
    // knows they are non-null within the async function's scope.
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
  }, [isLibraryLoaded, quest.epubUrl, currentUser, quest.readingProgress]);

  // 3. Set up event listeners for saving progress
  const handleRelocate = useCallback((e: Event) => {
    if (!currentUser) return;
    const customEvent = e as CustomEvent;
    // The detail object structure is { cfi, path, location, pages }
    const location = customEvent.detail?.cfi;
    if (location) {
        // Only sending the location CFI, as foliate-js doesn't provide the other progress metrics
        updateReadingProgress(quest.id, currentUser.id, { locationCfi: location });
    }
  }, [currentUser, quest.id, updateReadingProgress]);
  
  useEffect(() => {
    const viewElement = viewRef.current;
    if (!viewElement) return;
    
    viewElement.addEventListener('relocate', handleRelocate);
    
    return () => {
      viewElement.removeEventListener('relocate', handleRelocate);
    };
  }, [handleRelocate, isLibraryLoaded]); // Re-add listener if library reloads

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
