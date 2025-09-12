
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// FIX: PDFPageProxy is not directly exported from 'react-pdf' in this version.
import { pdfjs, Document, Page } from 'react-pdf';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, ZoomIn, ZoomOut, Minimize, Maximize, ChevronLeftIcon, ChevronRightIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../user-interface/Input';

// FIX: Replaced failing type inference with a minimal interface for PDFPageProxy to ensure type safety.
type PDFPageProxy = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
};

// Configure the PDF.js worker from a CDN. This is required by react-pdf.
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.js`;

const PDF_CACHE_NAME = 'pdf-cache-v1';

interface PdfReaderPanelProps {
  quest: Quest;
}

const PdfReaderPanel: React.FC<PdfReaderPanelProps> = ({ quest }) => {
  // FIX: Replaced 'setReadingPdfQuest' with 'setReadingEpubQuest' to match the updated UI dispatch context.
  const { setReadingEpubQuest } = useUIDispatch();
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
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width?: number, height?: number }>({});
  const initialPageSetRef = useRef(false);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

  const debouncedPageNumber = useDebounce(pageNumber, 1000);
  
  // Time Tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionStartTimeRef = useRef(Date.now());
  const lastSyncTimeRef = useRef(Date.now());
  const initialTotalSecondsRef = useRef(0);

  const userProgress = useMemo(() => {
    if (!currentUser) return null;
    return liveQuest.readingProgress?.[currentUser.id];
  }, [liveQuest.readingProgress, currentUser]);

  useEffect(() => {
    // Set this only once when the component mounts for this quest.
    initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
  }, [quest.id, userProgress]);

  const totalSecondsRead = useMemo(() => {
    return initialTotalSecondsRef.current + sessionSeconds;
  }, [sessionSeconds]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            setContainerSize({ 
                width: entry.contentRect.width, 
                height: entry.contentRect.height 
            });
        }
    });

    if (pageContainerRef.current) {
        observer.observe(pageContainerRef.current);
    }

    return () => {
        if (pageContainerRef.current) {
            observer.unobserve(pageContainerRef.current);
        }
    };
  }, []);

  useEffect(() => {
    // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
    if (!currentUser || !liveQuest.epubUrl || initialPageSetRef.current) return;
    const initialPage = liveQuest.readingProgress?.[currentUser.id]?.pageNumber || 1;
    setPageNumber(initialPage);
    initialPageSetRef.current = true;
    // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
  }, [currentUser, liveQuest.epubUrl, liveQuest.readingProgress]);

  useEffect(() => {
    const initializeAndCachePdf = async () => {
      // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
      if (!liveQuest.epubUrl) return;
      setIsLoading(true);
      setError(null);

      // Immediately set the URL for react-pdf to start its progressive loading.
      // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
      setPdfFile(liveQuest.epubUrl);

      // In the background, ensure the file is in the cache for offline use.
      // This doesn't block rendering.
      try {
        const cache = await caches.open(PDF_CACHE_NAME);
        // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
        const response = await cache.match(liveQuest.epubUrl);
        if (!response) {
          console.log('PDF not in cache, fetching to prime for offline use...');
          // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
          const fetchResponse = await fetch(liveQuest.epubUrl);
          if (fetchResponse.ok) {
            // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
            await cache.put(liveQuest.epubUrl, fetchResponse.clone());
            console.log('PDF cached successfully.');
          }
        }
      } catch (err) {
        console.warn('Could not prime PDF cache:', err);
        // This is not a critical error for online viewing, so we don't set the error state.
      }
    };
    initializeAndCachePdf();
    // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
  }, [liveQuest.epubUrl]);

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

  const onPageLoadSuccess = useCallback((page: PDFPageProxy) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageDimensions({ width: viewport.width, height: viewport.height });
  }, []);

  const isPortrait = useMemo(() => {
    if (!pageDimensions) return true; // Default to portrait assumption until page loads
    return pageDimensions.height >= pageDimensions.width;
  }, [pageDimensions]);

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
    const onFullscreenChange = () => {
        const isFull = !!document.fullscreenElement;
        setIsFullScreen(isFull);
        setZoom(1); // Reset zoom on fullscreen change to re-trigger fit logic
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  
  const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  const pageProps: any = {
    pageNumber: pageNumber,
    renderAnnotationLayer: false,
    renderTextLayer: false,
    onLoadSuccess: onPageLoadSuccess,
  };

  if (zoom !== 1) {
      pageProps.scale = zoom;
  } else {
      // Smart fit-to-view logic for both fullscreen and initial load
      if (isPortrait) {
          pageProps.height = containerSize.height ? containerSize.height - (isFullScreen ? 0 : 40) : undefined;
          pageProps.width = undefined; // Unset width to maintain aspect ratio
      } else { // Landscape
          pageProps.width = containerSize.width ? containerSize.width - 20 : undefined;
          pageProps.height = undefined; // Unset height to maintain aspect ratio
      }
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-stone-900/90 z-[80] flex flex-col items-center justify-center pdf-container backdrop-blur-sm">
        <header className="w-full p-3 flex justify-between items-center z-20 text-white bg-stone-800/80 flex-shrink-0">
            <h3 className="font-bold text-lg truncate">{quest.title}</h3>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.2))} title="Zoom In"><ZoomIn className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} title="Zoom Out"><ZoomOut className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                {/* FIX: Replaced 'setReadingPdfQuest' with 'setReadingEpubQuest' to match the updated UI dispatch context. */}
                <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
            </div>
        </header>

        <div ref={pageContainerRef} className="flex-grow w-full min-h-0 overflow-auto relative">
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
                    {!isLoading && <Page {...pageProps} />}
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
                    <Input
                        type="number"
                        value={pageNumber}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setPageNumber(val);
                        }}
                        onBlur={() => handlePageChange(pageNumber)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                                handlePageChange(pageNumber);
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="w-20 text-center no-spinner"
                        min={1}
                        max={numPages || 1}
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
