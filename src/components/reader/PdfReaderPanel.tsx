import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, ZoomIn, ZoomOut, Minimize, Maximize, ChevronLeftIcon, ChevronRightIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';
import NumberInput from '../user-interface/NumberInput';

// Configure the PDF.js worker from a CDN. This is required by react-pdf.
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.js`;

const PDF_CACHE_NAME = 'pdf-cache-v1';

interface PdfReaderPanelProps {
  quest: Quest;
}

const PdfReaderPanel: React.FC<PdfReaderPanelProps> = ({ quest }) => {
  const { setReadingPdfQuest } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { updateReadingProgress } = useQuestsDispatch();
  const { addNotification } = useNotificationsDispatch();
  const { quests } = useQuestsState();

  const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pdfFile, setPdfFile] = useState<string | File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedPageNumber = useDebounce(pageNumber, 1000);
  
  // Time Tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionStartTimeRef = useRef(Date.now());
  const lastSyncTimeRef = useRef(Date.now());

  const userProgress = useMemo(() => {
    if (!currentUser) return null;
    return liveQuest.readingProgress?.[currentUser.id];
  }, [liveQuest.readingProgress, currentUser]);

  const totalSecondsRead = useMemo(() => {
    const storedSeconds = userProgress?.totalSeconds || 0;
    return storedSeconds + sessionSeconds;
  }, [userProgress, sessionSeconds]);


  useEffect(() => {
    if (!currentUser || !liveQuest.pdfUrl) return;
    const initialPage = liveQuest.readingProgress?.[currentUser.id]?.pageNumber || 1;
    setPageNumber(initialPage);
  }, [quest.id, currentUser, liveQuest]);

  useEffect(() => {
    const fetchAndCachePdf = async () => {
      if (!liveQuest.pdfUrl) return;
      setIsLoading(true);
      setError(null);
      setPdfFile(null);
      try {
        const cache = await caches.open(PDF_CACHE_NAME);
        let response = await cache.match(liveQuest.pdfUrl);

        if (!response) {
          response = await fetch(liveQuest.pdfUrl);
          if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
          await cache.put(liveQuest.pdfUrl, response.clone());
        }
        
        const blob = await response.blob();
        setPdfFile(URL.createObjectURL(blob));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error("Failed to load or cache PDF:", message);
        setError(`Could not load document: ${message}`);
        setIsLoading(false);
      }
    };
    fetchAndCachePdf();
  }, [liveQuest.pdfUrl]);

  // --- Time & Progress Syncing ---
  useEffect(() => {
      sessionStartTimeRef.current = Date.now();
      lastSyncTimeRef.current = Date.now();
      setSessionSeconds(0);

      const timer = setInterval(() => {
          setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
      }, 1000);

      return () => clearInterval(timer);
  }, []);

  const syncProgress = useCallback(async (forceSync = false) => {
    if (!currentUser) return;
    const now = Date.now();
    const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
    
    const dataToSync: any = {
        pageNumber: debouncedPageNumber,
        sessionSeconds,
    };
    if (secondsToAdd > 0) {
        dataToSync.secondsToAdd = secondsToAdd;
    }
    
    const shouldSync = dataToSync.secondsToAdd > 0 || forceSync;

    if (shouldSync) {
        try {
            await updateReadingProgress(quest.id, currentUser.id, dataToSync);
            lastSyncTimeRef.current = now;
        } catch (e) {
            console.error("PDF Sync failed, not updating lastSyncTimeRef", e);
        }
    }
  }, [currentUser, quest.id, updateReadingProgress, debouncedPageNumber, sessionSeconds]);

  useEffect(() => {
      const intervalId = setInterval(() => syncProgress(false), 30000);
      const handleUnload = () => syncProgress(true);
      window.addEventListener('beforeunload', handleUnload);
      
      return () => {
          clearInterval(intervalId);
          window.removeEventListener('beforeunload', handleUnload);
          syncProgress(true);
      };
  }, [syncProgress]);


  const onDocumentLoadSuccess = useCallback(({ numPages: totalPages }: { numPages: number }) => {
    setNumPages(totalPages);
    if(currentUser && liveQuest.readingProgress?.[currentUser.id]?.pageNumber) {
        setPageNumber(p => Math.min(totalPages, p));
    }
    setIsLoading(false);
  }, [currentUser, liveQuest.readingProgress]);
  
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('React-PDF load error:', error);
    setError(`Failed to render PDF: ${error.message}`);
    setIsLoading(false);
    addNotification({ type: 'error', message: `Could not open PDF file. It might be corrupted or in an unsupported format.`});
  }, [addNotification]);


  const handlePageChange = (newPageNumber: number) => {
    if (numPages) {
        const clampedPage = Math.max(1, Math.min(newPageNumber, numPages));
        setPageNumber(clampedPage);
    }
  };

  const toggleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
  };
    
  useEffect(() => {
    const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  
  const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-stone-900/90 z-[80] flex flex-col items-center justify-center pdf-container backdrop-blur-sm">
        <header className="w-full p-3 flex justify-between items-center z-20 text-white bg-stone-800/80 flex-shrink-0">
            <h3 className="font-bold text-lg truncate">{quest.title}</h3>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.2))} title="Zoom In"><ZoomIn className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} title="Zoom Out"><ZoomOut className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                <Button variant="ghost" size="icon" onClick={() => setReadingPdfQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6" /></Button>
            </div>
        </header>

        <div className="flex-grow w-full h-full overflow-auto relative">
            {(isLoading || error) && (
                 <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4">
                    {isLoading && <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>}
                    <p className={`text-xl font-semibold ${error ? 'text-red-400' : 'text-white'}`}>
                        {error ? error : 'Preparing Reader...'}
                    </p>
                </div>
            )}
            {pdfFile && !error && (
                <Document 
                    file={pdfFile} 
                    onLoadSuccess={onDocumentLoadSuccess} 
                    onLoadError={onDocumentLoadError}
                    loading={<></>} // Hide default loader
                    className="flex justify-center"
                >
                    {!isLoading && <Page pageNumber={pageNumber} scale={zoom} renderAnnotationLayer={false} renderTextLayer={false} />}
                </Document>
            )}
        </div>

        <footer className="w-full p-3 flex justify-between items-center gap-4 z-20 text-white bg-stone-800/80 flex-shrink-0 text-sm">
             <div className="flex gap-4 w-1/3">
                <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor(totalSecondsRead))}</div>
            </div>
            <div className="flex-grow flex justify-center items-center gap-4">
                <Button variant="secondary" size="icon" onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber <= 1}><ChevronLeftIcon className="w-5 h-5"/></Button>
                <div className="flex items-center gap-2">
                    <NumberInput
                        value={pageNumber}
                        onChange={(val) => handlePageChange(val)}
                        min={1}
                        max={numPages || 1}
                        className="w-24"
                        disabled={!numPages}
                    />
                    <span className="text-stone-400">of {numPages || '...'}</span>
                </div>
                <Button variant="secondary" size="icon" onClick={() => handlePageChange(pageNumber + 1)} disabled={!numPages || pageNumber >= numPages}><ChevronRightIcon className="w-5 h-5"/></Button>
            </div>
            <div className="w-1/3" />
        </footer>
    </div>
  );
};

export default PdfReaderPanel;