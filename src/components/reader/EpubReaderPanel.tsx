import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon } from '../user-interface/Icons';
import { useQuestsDispatch } from '../../context/QuestsContext';

interface EpubReaderPanelProps {
  quest: Quest;
}

type LoadingStatus = 'initializing' | 'loading_library' | 'opening_book' | 'ready' | 'error';

const LoadingOverlay: React.FC<{ status: LoadingStatus; message: string }> = ({ status, message }) => {
    if (status === 'ready') {
        return null;
    }

    return (
        <div className="absolute inset-0 bg-stone-900 flex flex-col items-center justify-center text-white z-20">
            {status !== 'error' && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>}
            <p className={`text-lg font-semibold ${status === 'error' ? 'text-red-400' : 'text-stone-300'}`}>{message}</p>
        </div>
    );
};

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
  const { setReadingQuest } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { updateReadingProgress } = useQuestsDispatch();

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('initializing');
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const viewRef = useRef<HTMLElement & { open: (url: string) => Promise<void>; goTo: (cfi: string) => Promise<void> }>(null);

  // 1. Load the Foliate library script
  useEffect(() => {
    setLoadingStatus('loading_library');
    setLoadingMessage('Loading EPUB reader library...');
    
    const script = document.createElement('script');
    script.src = 'https://esm.sh/foliate-js';
    script.type = 'module';
    
    script.onload = () => {
      // Library is loaded, now we can try to open the book.
      // The next useEffect will handle this state change.
      setLoadingStatus('opening_book');
    };
    
    script.onerror = () => {
      setLoadingMessage('Failed to load EPUB library. Please check your internet connection.');
      setLoadingStatus('error');
    };

    document.body.appendChild(script);
    
    return () => {
      // Check if the script is still in the body before trying to remove it
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 2. Open the book when the library is ready
  useEffect(() => {
    const viewElement = viewRef.current;
    const epubUrl = quest.epubUrl;

    if (loadingStatus === 'opening_book' && viewElement && epubUrl) {
      setLoadingMessage('Opening book...');
      const openBook = async () => {
        try {
          await viewElement.open(epubUrl);
          const savedLocation = currentUser && quest.readingProgress?.[currentUser.id]?.locationCfi;
          if (savedLocation) {
            await viewElement.goTo(savedLocation);
          }
          setLoadingStatus('ready');
        } catch (err) {
          console.error("Foliate: failed to open book", err);
          setLoadingMessage(`Failed to open book. The file might be corrupted or in an unsupported format.`);
          setLoadingStatus('error');
        }
      };
      openBook();
    } else if (loadingStatus === 'opening_book' && !epubUrl) {
        setLoadingMessage("No EPUB file is associated with this quest.");
        setLoadingStatus('error');
    }
  }, [loadingStatus, quest.epubUrl, currentUser, quest.readingProgress, quest.id]);

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
    if (!viewElement || loadingStatus !== 'ready') return;
    
    viewElement.addEventListener('relocate', handleRelocate);
    
    return () => { viewElement.removeEventListener('relocate', handleRelocate); };
  }, [handleRelocate, loadingStatus]);

  return (
    <div className="fixed inset-0 bg-stone-900 z-[80] flex flex-col items-center justify-center">
      <div className="w-full h-full flex flex-col shadow-2xl">
        <header className="w-full p-2 bg-stone-800 text-white flex justify-between items-center z-30 flex-shrink-0">
          <h3 className="font-bold text-lg truncate ml-2">{quest.title}</h3>
          <Button variant="ghost" size="icon" onClick={() => setReadingQuest(null)} title="Close Reader">
            <XCircleIcon className="w-6 h-6"/>
          </Button>
        </header>
        <div className="flex-grow w-full h-full relative bg-black">
          <LoadingOverlay status={loadingStatus} message={loadingMessage} />
          <foliate-view 
            ref={viewRef} 
            style={{ width: '100%', height: '100%', visibility: loadingStatus === 'ready' ? 'visible' : 'hidden' }}
          ></foliate-view>
        </div>
      </div>
    </div>
  );
};

export default EpubReaderPanel;