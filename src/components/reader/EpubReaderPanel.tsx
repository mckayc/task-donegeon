import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, SettingsIcon, SunIcon, MoonIcon, BookmarkSolidIcon, TrashIcon, BookmarkPlusIcon, ZoomIn, ZoomOut, Minimize, Maximize } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

declare var ePub: any;

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
    
    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    const userProgress = useMemo(() => {
        if (!currentUser) return null;
        return liveQuest.readingProgress?.[currentUser.id];
    }, [liveQuest.readingProgress, currentUser]);

    const totalSecondsRead = useMemo(() => {
        const storedSeconds = userProgress?.totalSeconds || 0;
        return storedSeconds + sessionSeconds;
    }, [userProgress, sessionSeconds]);

    // --- Book Initialization and Setup ---
    useEffect(() => {
        if (!quest.epubUrl) return;
        const epubBook = ePub(quest.epubUrl);
        setBook(epubBook);
        epubBook.loaded.metadata.then((meta: any) => {
            setBookTitle(meta.title);
        });
    }, [quest.epubUrl]);

    useEffect(() => {
        if (!book) return;
        let isMounted = true;
        book.ready.then(() => {
            return book.locations.generate(1650); // Standard value for better accuracy
        }).then((generatedLocations: any) => {
            if (isMounted) {
                setLocations(generatedLocations);
            }
        });
        return () => { isMounted = false; };
    }, [book]);
    
    useEffect(() => {
        if (!book || !locations || !viewerRef.current) return;

        const renditionInstance = book.renderTo(viewerRef.current, {
            width: "100%", height: "100%", flow: "paginated", spread: "auto"
        });

        const initialCfi = userProgress?.locationCfi;
        renditionInstance.display(initialCfi);
        
        renditionInstance.on("displayed", () => setIsLoading(false));
        
        renditionInstance.on("relocated", (locationData: any) => {
            setCurrentCfi(locationData.start.cfi);
            // FIX: Use the more reliable percentageFromCfi method instead of the direct percentage.
            if (book && book.locations) {
                const percentage = book.locations.percentageFromCfi(locationData.start.cfi);
                setProgress(Math.round(percentage * 100));
            }
        });
        
        const cfiStrings: string[] = userProgress?.bookmarks || [];
        const bookmarkPromises = cfiStrings.map(cfi => 
            book.getRange(cfi).then((range: any) => ({
                cfi,
                progress: Math.round(book.locations.percentageFromCfi(cfi) * 100),
                text: range.toString().trim().substring(0, 40) + '...'
            }))
        );
        Promise.all(bookmarkPromises).then(setBookmarks);

        setRendition(renditionInstance);

        return () => {
            if(renditionInstance) renditionInstance.destroy();
        };
    }, [book, locations]);

    // Effect for dynamic style changes (Theme, Font Size)
    useEffect(() => {
        if (rendition) {
            rendition.themes.fontSize(`${fontSize}%`);
            rendition.themes.override("color", theme === 'light' ? "#1c1917" : "#f3f4f6");
            setTimeout(() => rendition.resize(), 50);
        }
    }, [rendition, theme, fontSize]);
    
    // Effect for container size changes (Fullscreen Mode)
    useEffect(() => {
        if (rendition) {
            const debouncedResize = setTimeout(() => rendition.resize(), 100);
            return () => clearTimeout(debouncedResize);
        }
    }, [isFullScreen, rendition]);

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

    const syncProgress = useCallback(async (forceSync = false, bookmarksToSync?: string[]) => {
        if (!currentUser) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
        
        const dataToSync: any = { 
            locationCfi: currentCfi || undefined,
            sessionSeconds,
        };
        if (secondsToAdd > 0) {
            dataToSync.secondsToAdd = secondsToAdd;
        }
        if (bookmarksToSync) dataToSync.bookmarks = bookmarksToSync;
        
        const shouldSync = Object.keys(dataToSync).length > 2 || forceSync;

        if (shouldSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, dataToSync);
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("Sync failed, not updating lastSyncTimeRef", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, currentCfi, sessionSeconds]);

    useEffect(() => {
        const intervalId = setInterval(() => syncProgress(false), 30000);
        return () => {
            clearInterval(intervalId);
            syncProgress(true);
        };
    }, [syncProgress]);
    
    // --- UI Interactions and Event Handlers ---
    const handleClose = () => setReadingQuest(null);

    const handlePageTurn = useCallback((direction: 'prev' | 'next') => {
        if (rendition) {
            direction === 'prev' ? rendition.prev() : rendition.next();
            setPageTurnClass('animate-page-turn');
            setTimeout(() => setPageTurnClass(''), 250);
        }
    }, [rendition]);
    
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('epubTheme', newTheme);
    }

    const handleSetFontSize = (newSize: number) => {
        const clampedSize = Math.max(80, Math.min(200, newSize));
        setFontSize(clampedSize);
        localStorage.setItem('epubFontSize', String(clampedSize));
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
    
    const isBookmarked = useMemo(() => !!(currentCfi && bookmarks.some(b => b.cfi === currentCfi)), [currentCfi, bookmarks]);

    const addBookmark = () => {
        if (currentCfi && !isBookmarked) {
            book.getRange(currentCfi).then((range: any) => {
                const text = range.toString().trim().substring(0, 40) + '...';
                const newBookmark: Bookmark = { cfi: currentCfi, progress, text };
                const newBookmarks = [...bookmarks, newBookmark];
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
        rendition?.display(cfi);
        setShowBookmarks(false);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (book?.locations && rendition) {
            const percentage = parseInt(e.target.value) / 100;
            const cfi = book.locations.cfiFromPercentage(percentage);
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
        if (Math.abs(diff) > 50) {
            handlePageTurn(diff > 0 ? 'next' : 'prev');
        }
        touchStartX.current = null;
    };
    
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center epub-container">
            <div className="w-full h-full bg-stone-800 shadow-2xl relative flex flex-col">
                <header className="epub-reader-header p-3 flex justify-between items-center z-20 text-white flex-shrink-0">
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                        <p className="text-sm text-stone-300 truncate">{bookTitle}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={addBookmark} title={isBookmarked ? "Already Bookmarked" : "Add Bookmark"} disabled={isBookmarked}>
                            {isBookmarked ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400" /> : <BookmarkPlusIcon className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setShowBookmarks(p => !p); setShowSettings(false); }} title="View Bookmarks"><BookmarkSolidIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setShowSettings(p => !p); setShowBookmarks(false); }} title="Settings"><SettingsIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                        <Button variant="ghost" size="icon" onClick={handleClose} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                    </div>
                </header>

                <div id="viewer-wrapper" className="flex-grow relative min-h-0" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-800 z-30">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                        </div>
                    )}
                    <div id="viewer" ref={viewerRef} className={`h-full w-full ${theme} ${pageTurnClass}`} />
                    <button aria-label="Previous Page" id="prev" className="absolute top-0 bottom-0 left-0 w-[15%] cursor-pointer z-10" onClick={() => handlePageTurn('prev')}></button>
                    <button aria-label="Next Page" id="next" className="absolute top-0 bottom-0 right-0 w-[15%] cursor-pointer z-10" onClick={() => handlePageTurn('next')}></button>
                </div>

                {showSettings && (
                     <div className="absolute top-16 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-60 z-30 text-white space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Theme</h3>
                            <div className="flex justify-around">
                                <button onClick={() => handleThemeChange('light')} className={`p-2 rounded-md w-24 text-center border-2 ${theme === 'light' ? 'border-emerald-400' : 'border-transparent'}`}>
                                    <div className="w-full h-12 mx-auto rounded bg-stone-100 flex items-center justify-center mb-1"><SunIcon className="w-5 h-5 text-stone-900"/></div>
                                    <span className="text-xs">Light</span>
                                </button>
                                <button onClick={() => handleThemeChange('dark')} className={`p-2 rounded-md w-24 text-center border-2 ${theme === 'dark' ? 'border-emerald-400' : 'border-transparent'}`}>
                                    <div className="w-full h-12 mx-auto rounded bg-stone-900 flex items-center justify-center mb-1"><MoonIcon className="w-5 h-5 text-stone-100"/></div>
                                     <span className="text-xs">Dark</span>
                                </button>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Font Size</h3>
                            <div className="flex justify-around items-center">
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleSetFontSize(fontSize - 10)}><ZoomOut className="w-4 h-4" /></Button>
                                <span className="font-mono">{fontSize}%</span>
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleSetFontSize(fontSize + 10)}><ZoomIn className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </div>
                )}
                {showBookmarks && (
                    <div className="absolute bottom-20 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-72 z-30 text-white">
                        <h3 className="font-bold mb-2">Bookmarks</h3>
                        <ul className="max-h-64 overflow-y-auto pr-2">
                            {bookmarks.length > 0 ? bookmarks.map((bm, i) => (
                                <li key={bm.cfi} className="text-sm hover:bg-stone-700/50 p-2 rounded-md flex justify-between items-center gap-2">
                                    <button onClick={() => goToBookmark(bm.cfi)} className="text-left flex-grow overflow-hidden">
                                        <p className="text-stone-300 flex-grow truncate italic">"{bm.text || `Bookmark at ${bm.progress}%`}"</p>
                                        <span className="text-xs text-stone-400 mt-1 block">Page at {bm.progress}%</span>
                                    </button>
                                    <Button variant="ghost" size="icon" onClick={() => removeBookmark(bm.cfi)} className="h-6 w-6 text-red-400 hover:text-red-300 flex-shrink-0"><TrashIcon className="w-4 h-4"/></Button>
                                </li>
                            )) : <p className="text-xs text-stone-500">No bookmarks yet. Click the '+' icon in the header to add one.</p>}
                        </ul>
                    </div>
                )}

                <footer className="epub-reader-footer p-3 flex justify-between items-center z-20 text-white text-sm flex-shrink-0">
                     <div className="flex gap-4 w-1/4">
                        <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                        <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor(totalSecondsRead))}</div>
                     </div>
                     <div className="flex-grow flex items-center gap-3 px-4">
                        <input type="range" min="0" max="100" value={progress} onChange={handleSliderChange} className="epub-progress-slider w-full" disabled={!locations} />
                        <span className="font-semibold w-12 text-right">{progress}%</span>
                     </div>
                     <div className="w-1/4" />
                </footer>
            </div>
        </div>
    );
};

export default EpubReaderPanel;