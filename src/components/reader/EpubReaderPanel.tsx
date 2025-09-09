import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, SettingsIcon, SunIcon, MoonIcon, BookmarkSolidIcon, TrashIcon, BookmarkPlusIcon, ZoomIn, ZoomOut, Minimize, Maximize, ChevronLeftIcon, ChevronRightIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

declare var ePub: any;
const EPUB_CACHE_NAME = 'epub-cache-v1';

interface EpubReaderPanelProps {
  quest: Quest;
}

interface Bookmark {
    cfi: string;
    progress: number;
    text?: string;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { addNotification } = useNotificationsDispatch();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);

    const [book, setBook] = useState<any>(null);
    const [rendition, setRendition] = useState<any>(null);
    const [locations, setLocations] = useState<any>(null);
    const [currentCfi, setCurrentCfi] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(0);
    const [bookTitle, setBookTitle] = useState('');
    const [pageTurnClass, setPageTurnClass] = useState('');
    
    // UI State
    const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('epubTheme') as 'light' | 'dark' || 'dark');
    const [fontSize, setFontSize] = useState(() => {
        const savedSize = localStorage.getItem('epubFontSize');
        return savedSize ? parseInt(savedSize, 10) : 100;
    });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(0);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    const userProgress = useMemo(() => {
        if (!currentUser) return null;
        return liveQuest.readingProgress?.[currentUser.id];
    }, [liveQuest.readingProgress, currentUser]);
    
    useEffect(() => {
        initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
    }, [quest.id, userProgress]);

    const totalSecondsRead = useMemo(() => {
        return initialTotalSecondsRef.current + sessionSeconds;
    }, [sessionSeconds]);

    useEffect(() => {
        if (!quest.epubUrl) return;
        let isMounted = true;
    
        const initializeBook = async (bookData: ArrayBuffer) => {
            if (!isMounted) return;
            setIsDownloading(false);
            setIsLoading(true);
            
            const newBook = ePub(bookData);
            setBook(newBook);
            
            newBook.loaded.metadata.then((meta: any) => { if (isMounted) setBookTitle(meta.title) });
            await newBook.ready;
            if (!isMounted) return;
            
            const generatedLocations = await newBook.locations.generate(1650);
            if (isMounted) setLocations(generatedLocations);
        };

        const fetchAndCacheEpub = async (url: string) => {
            const cache = await caches.open(EPUB_CACHE_NAME);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                console.log("Loading EPUB from cache.");
                const arrayBuffer = await cachedResponse.arrayBuffer();
                if (isMounted) initializeBook(arrayBuffer);
                return;
            }

            console.log("EPUB not in cache, downloading...");
            setIsDownloading(true);
            
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                await cache.put(url, response.clone());
                
                const arrayBuffer = await response.arrayBuffer();
                if (isMounted) initializeBook(arrayBuffer);
            } catch (error) {
                if (isMounted) {
                    addNotification({ type: 'error', message: 'Failed to download the book.' });
                    setReadingQuest(null);
                }
            }
        };
        
        fetchAndCacheEpub(quest.epubUrl);
        return () => { isMounted = false; };
    }, [quest.epubUrl, addNotification, setReadingQuest]);
    
    useEffect(() => {
        if (!book || !locations || !viewerRef.current) return;
        
        const renditionInstance = book.renderTo(viewerRef.current, {
            width: "100%", height: "100%", flow: "paginated", spread: "auto"
        });
        setRendition(renditionInstance);

        const initialCfi = userProgress?.locationCfi;
        renditionInstance.display(initialCfi);
        
        renditionInstance.on("displayed", () => setIsLoading(false));
        renditionInstance.on("relocated", (loc: any) => {
            setCurrentCfi(loc.start.cfi);
            setProgress(Math.round(book.locations.percentageFromCfi(loc.start.cfi) * 100));
        });
        
        const cfiStrings: string[] = userProgress?.bookmarks || [];
        Promise.all(cfiStrings.map(cfi => 
            book.getRange(cfi).then((range: any) => ({
                cfi,
                progress: Math.round(book.locations.percentageFromCfi(cfi) * 100),
                text: range.toString().trim().substring(0, 40) + '...'
            }))
        )).then(setBookmarks);

        return () => renditionInstance.destroy();
    }, [book, locations]);

    useEffect(() => {
        if (rendition) {
            rendition.themes.fontSize(`${fontSize}%`);
            rendition.themes.override("color", theme === 'light' ? "#1c1917" : "#f3f4f6");
            setTimeout(() => rendition.resize(), 50);
        }
    }, [rendition, theme, fontSize]);
    
    useEffect(() => {
        if (rendition) rendition.resize();
    }, [isFullScreen, rendition]);

    useEffect(() => {
        sessionStartTimeRef.current = Date.now();
        lastSyncTimeRef.current = Date.now();
        setSessionSeconds(0);
        const timer = setInterval(() => setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000)), 1000);
        return () => clearInterval(timer);
    }, []);

    const syncProgress = useCallback(async (forceSync = false, bookmarksToSync?: string[]) => {
        if (!currentUser || !currentCfi) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
        
        if (secondsToAdd > 0 || forceSync || bookmarksToSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, { 
                    locationCfi: currentCfi,
                    sessionSeconds,
                    secondsToAdd: forceSync ? secondsToAdd : undefined,
                    bookmarks: bookmarksToSync,
                });
                if (secondsToAdd > 0) lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("Sync failed", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, currentCfi, sessionSeconds]);

    useEffect(() => {
        const intervalId = setInterval(() => syncProgress(false), 30000);
        const handleUnload = () => syncProgress(true);
        window.addEventListener('beforeunload', handleUnload);
        return () => { clearInterval(intervalId); window.removeEventListener('beforeunload', handleUnload); syncProgress(true); };
    }, [syncProgress]);
    
    const handleClose = () => setReadingQuest(null);

    const handlePageTurn = useCallback((direction: 'prev' | 'next') => {
        if (rendition) {
            rendition[direction]();
            setPageTurnClass('animate-page-turn');
            setTimeout(() => setPageTurnClass(''), 250);
        }
    }, [rendition]);
    
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme); localStorage.setItem('epubTheme', newTheme);
    };

    const handleSetFontSize = (newSize: number) => {
        const clampedSize = Math.max(80, Math.min(200, newSize));
        setFontSize(clampedSize); localStorage.setItem('epubFontSize', String(clampedSize));
    };
    
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) containerRef.current.requestFullscreen();
        else document.exitFullscreen();
    };
    
    useEffect(() => {
        const cb = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', cb);
        return () => document.removeEventListener('fullscreenchange', cb);
    }, []);
    
    const isBookmarked = useMemo(() => !!(currentCfi && bookmarks.some(b => b.cfi === currentCfi)), [currentCfi, bookmarks]);

    const addBookmark = () => {
        if (currentCfi && !isBookmarked && book && rendition) {
            book.getRange(currentCfi).then((range: any) => {
                const text = range.toString().trim().substring(0, 40) + '...';
                const newBookmarks = [...bookmarks, { cfi: currentCfi, progress, text }];
                setBookmarks(newBookmarks);
                syncProgress(false, newBookmarks.map(b => b.cfi));
                addNotification({ type: 'success', message: 'Bookmark added!' });
            });
        }
    };
    
    const removeBookmark = (cfi: string) => {
        const newBookmarks = bookmarks.filter(bm => bm.cfi !== cfi);
        setBookmarks(newBookmarks);
        syncProgress(false, newBookmarks.map(b => b.cfi));
    };

    const goToBookmark = (cfi: string) => {
        rendition?.display(cfi); setShowBookmarks(false);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (book?.locations && rendition) {
            const cfi = book.locations.cfiFromPercentage(parseInt(e.target.value) / 100);
            rendition.display(cfi);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") handlePageTurn('prev');
            if (e.key === "ArrowRight") handlePageTurn('next');
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handlePageTurn, handleClose]);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => touchStartX.current = e.touches[0].clientX;
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) handlePageTurn(diff > 0 ? 'next' : 'prev');
        touchStartX.current = null;
    };
    
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-[80] flex items-center justify-center epub-container">
            <div className="w-full h-full bg-stone-800 shadow-2xl relative flex flex-col">
                <header className={`epub-reader-header p-3 flex justify-between items-center z-20 text-white flex-shrink-0 transition-transform duration-300 ${isImmersive ? '-translate-y-full' : ''}`}>
                    <div className="overflow-hidden"><h3 className="font-bold text-lg truncate">{quest.title}</h3><p className="text-sm text-stone-300 truncate">{bookTitle}</p></div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={addBookmark} title={isBookmarked ? "Already Bookmarked" : "Add Bookmark"} disabled={isBookmarked}>{isBookmarked ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400" /> : <BookmarkPlusIcon className="w-5 h-5" />}</Button>
                        <Button variant="ghost" size="icon" onClick={() => { setShowBookmarks(p => !p); setShowSettings(false); }} title="View Bookmarks"><BookmarkSolidIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setShowSettings(p => !p); setShowBookmarks(false); }} title="Settings"><SettingsIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                        <Button variant="ghost" size="icon" onClick={handleClose} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                    </div>
                </header>

                <div id="viewer-wrapper" className="flex-grow relative min-h-0" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setIsImmersive(p => !p)}>
                    {(isDownloading || isLoading) && (
                        <div className="absolute inset-0 bg-stone-900/80 z-40 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                            <p className="text-xl font-semibold text-white">{isDownloading ? 'Downloading eBook...' : 'Preparing Reader...'}</p>
                            {isDownloading && downloadProgress !== null && <div className="w-64 bg-stone-700 rounded-full h-2.5"><div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div></div>}
                        </div>
                    )}
                    <div id="viewer" ref={viewerRef} className={`h-full w-full ${theme} ${pageTurnClass}`} />
                    <button aria-label="Previous Page" id="prev" className="absolute top-0 bottom-0 left-0 w-[15%] cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); handlePageTurn('prev'); }}></button>
                    <button aria-label="Next Page" id="next" className="absolute top-0 bottom-0 right-0 w-[15%] cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); handlePageTurn('next'); }}></button>
                </div>

                {showSettings && <div className="absolute top-16 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-60 z-30 text-white space-y-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold mb-2">Theme</h3><div className="flex justify-around"><button onClick={() => handleThemeChange('light')} className={`p-2 rounded-md w-24 text-center border-2 ${theme === 'light' ? 'border-emerald-400' : 'border-transparent'}`}><div className="w-full h-12 mx-auto rounded bg-stone-100 flex items-center justify-center mb-1"><SunIcon className="w-5 h-5 text-stone-900"/></div><span className="text-xs">Light</span></button><button onClick={() => handleThemeChange('dark')} className={`p-2 rounded-md w-24 text-center border-2 ${theme === 'dark' ? 'border-emerald-400' : 'border-transparent'}`}><div className="w-full h-12 mx-auto rounded bg-stone-900 flex items-center justify-center mb-1"><MoonIcon className="w-5 h-5 text-stone-100"/></div><span className="text-xs">Dark</span></button></div>
                    <h3 className="font-semibold mb-2">Font Size</h3><div className="flex justify-around items-center"><Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleSetFontSize(fontSize - 10)}><ZoomOut className="w-4 h-4" /></Button><span className="font-mono">{fontSize}%</span><Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleSetFontSize(fontSize + 10)}><ZoomIn className="w-4 h-4" /></Button></div>
                </div>}
                {showBookmarks && <div className="absolute bottom-20 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-72 z-30 text-white" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold mb-2">Bookmarks</h3>
                    <ul className="max-h-64 overflow-y-auto pr-2">{bookmarks.length > 0 ? bookmarks.map((bm) => (<li key={bm.cfi} className="text-sm hover:bg-stone-700/50 p-2 rounded-md flex justify-between items-center gap-2"><button onClick={() => goToBookmark(bm.cfi)} className="text-left flex-grow overflow-hidden"><p className="text-stone-300 flex-grow truncate italic">"{bm.text || `Bookmark at ${bm.progress}%`}"</p><span className="text-xs text-stone-400 mt-1 block">Page at {bm.progress}%</span></button><Button variant="ghost" size="icon" onClick={() => removeBookmark(bm.cfi)} className="h-6 w-6 text-red-400 hover:text-red-300 flex-shrink-0"><TrashIcon className="w-4 h-4"/></Button></li>)) : <p className="text-xs text-stone-500">No bookmarks yet. Click the '+' icon in the header to add one.</p>}</ul>
                </div>}

                <footer className={`epub-reader-footer p-3 flex justify-between items-center z-20 text-white text-sm flex-shrink-0 transition-transform duration-300 ${isImmersive ? 'translate-y-full' : ''}`}>
                     <div className="flex gap-2 w-1/4">
                        <Button variant="secondary" size="sm" onClick={() => handlePageTurn('prev')}>Prev</Button>
                        <Button variant="secondary" size="sm" onClick={() => handlePageTurn('next')}>Next</Button>
                     </div>
                     <div className="flex-grow flex items-center gap-3 px-4">
                        <input type="range" min="0" max="100" value={progress} onChange={handleSliderChange} className="epub-progress-slider w-full" disabled={!locations} />
                        <span className="font-semibold w-12 text-right">{progress}%</span>
                     </div>
                     <div className="flex gap-4 w-1/4 justify-end">
                        <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                        <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor(totalSecondsRead))}</div>
                     </div>
                </footer>
            </div>
        </div>
    );
};

export default EpubReaderPanel;