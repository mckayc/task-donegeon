import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, BookmarkIcon as BookmarkOutlineIcon, SettingsIcon, SunIcon, MoonIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
// FIX: Import `TrashIcon` to resolve missing name error.
import { BookmarkSolidIcon, TrashIcon } from '../user-interface/Icons';
import { useQuestsDispatch } from '../../context/QuestsContext';

declare var ePub: any;

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();

    const [book, setBook] = useState<any>(null);
    const [rendition, setRendition] = useState<any>(null);
    const [currentCfi, setCurrentCfi] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPanelActive, setIsPanelActive] = useState(true);
    
    // UI State
    const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('epubTheme') as 'light' | 'dark' || 'dark');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    
    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const lastSyncTimeRef = useRef(Date.now());
    
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    const userProgress = useMemo(() => {
        if (!currentUser) return null;
        return quest.readingProgress?.[currentUser.id];
    }, [quest.readingProgress, currentUser]);

    const totalSecondsRead = useMemo(() => {
        const storedSeconds = userProgress?.totalSeconds || 0;
        return storedSeconds + sessionSeconds;
    }, [userProgress, sessionSeconds]);

    // --- Book Initialization and Setup ---
    useEffect(() => {
        if (!quest.epubUrl) return;

        const newBook = ePub(quest.epubUrl);
        setBook(newBook);

        // Load bookmarks from quest data
        if (userProgress?.bookmarks) {
            setBookmarks(userProgress.bookmarks);
        }
    }, [quest.epubUrl, userProgress]);
    
    useEffect(() => {
        if (book && viewerRef.current) {
            const newRendition = book.renderTo(viewerRef.current, {
                width: "100%", height: "100%", flow: "paginated", spread: "auto"
            });
            
            const applyTheme = (renditionToTheme: any) => {
                 renditionToTheme.themes.register("custom", {
                    "body": { "color": theme === 'light' ? "#1c1917" : "#f3f4f6" },
                });
                renditionToTheme.themes.select("custom");
            };

            newRendition.on("displayed", () => {
                setIsLoading(false);
                applyTheme(newRendition);
            });
            
            newRendition.on("relocated", (locationData: any) => {
                const cfi = locationData.start.cfi;
                setCurrentCfi(cfi);
                book.ready.then(() => book.locations.generate(1000)).then(() => {
                    const percent = book.locations.percentageFromCfi(cfi);
                    setProgress(Math.round(percent * 100));
                });
            });

            newRendition.ready.then(() => {
                newRendition.display(userProgress?.locationCfi || undefined);
            });
            
            setRendition(newRendition);

            return () => newRendition.destroy();
        }
    }, [book, theme, userProgress]);

    // --- Time & Progress Syncing ---
    const syncProgress = useCallback(async (secondsToSync: number, cfiToSync: string | null, bookmarksToSync: string[]) => {
        if (!currentUser || (secondsToSync <= 0 && !cfiToSync && !bookmarksToSync)) return;
        
        const dataToSync: any = {};
        if (secondsToSync > 0) dataToSync.secondsToAdd = secondsToSync;
        if (cfiToSync) dataToSync.locationCfi = cfiToSync;
        if (bookmarksToSync) dataToSync.bookmarks = bookmarksToSync;

        await updateReadingProgress(quest.id, currentUser.id, dataToSync);

    }, [currentUser, quest.id, updateReadingProgress]);

    useEffect(() => {
        const syncInterval = window.setInterval(() => {
            if (isPanelActive) {
                const now = Date.now();
                const elapsedSeconds = Math.round((now - lastSyncTimeRef.current) / 1000);
                setSessionSeconds(s => s + elapsedSeconds);
                syncProgress(elapsedSeconds, currentCfi, bookmarks);
                lastSyncTimeRef.current = now;
            }
        }, 20000); // Sync every 20 seconds

        return () => clearInterval(syncInterval);
    }, [isPanelActive, currentCfi, bookmarks, syncProgress]);

    // Final sync on unmount
    useEffect(() => {
        return () => {
            const elapsedSeconds = Math.round((Date.now() - lastSyncTimeRef.current) / 1000);
            syncProgress(elapsedSeconds, currentCfi, bookmarks);
        };
    }, [syncProgress, currentCfi, bookmarks]);
    

    // --- UI Interactions and Event Handlers ---
    const handleClose = () => setReadingQuest(null);
    const prevPage = () => rendition?.prev();
    const nextPage = () => rendition?.next();
    
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('epubTheme', newTheme);
    }
    
    const toggleFullscreen = () => {
        const elem = containerRef.current;
        if (!elem) return;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    useEffect(() => {
        const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const addOrRemoveBookmark = () => {
        if (currentCfi) {
            const newBookmarks = bookmarks.includes(currentCfi)
                ? bookmarks.filter(bm => bm !== currentCfi)
                : [...bookmarks, currentCfi];
            setBookmarks(newBookmarks);
            syncProgress(0, null, newBookmarks);
        }
    };

    const goToBookmark = (cfi: string) => {
        rendition?.display(cfi);
        setShowBookmarks(false);
    };
    
    // --- Keyboard and Touch Controls ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevPage();
            if (e.key === "ArrowRight") nextPage();
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [rendition]);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        if (Math.abs(diff) > 50) { // Swipe threshold
            if (diff > 0) nextPage();
            else prevPage();
        }
        touchStartX.current = null;
    };
    
    // --- Utility Functions ---
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center epub-container">
            <div className="w-full h-full bg-stone-800 shadow-2xl relative flex flex-col">
                {/* --- Header --- */}
                <div className="epub-reader-header absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-20 text-white">
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(p => !p)} title="Settings"><SettingsIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowBookmarks(p => !p)} title="View Bookmarks"><BookmarkSolidIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <MinimizeIcon className="w-5 h-5"/> : <MaximizeIcon className="w-5 h-5"/>}</Button>
                        <Button variant="ghost" size="icon" onClick={handleClose} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                    </div>
                </div>

                {/* --- Main Viewer --- */}
                <div className="flex-grow relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-800 z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                        </div>
                    )}
                    <div id="viewer" ref={viewerRef} className={`h-full w-full ${theme}`} />
                    <div id="prev" className="absolute top-0 bottom-0 left-0 w-[15%] cursor-pointer z-10" onClick={prevPage}></div>
                    <div id="next" className="absolute top-0 bottom-0 right-0 w-[15%] cursor-pointer z-10" onClick={nextPage}></div>
                </div>

                {/* --- Popups --- */}
                {showSettings && (
                     <div className="absolute top-16 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-48 z-30 text-white">
                        <h3 className="font-bold mb-2">Theme</h3>
                        <div className="flex justify-around">
                            <Button variant={theme === 'light' ? 'default' : 'secondary'} onClick={() => handleThemeChange('light')}><SunIcon className="w-5 h-5"/></Button>
                            <Button variant={theme === 'dark' ? 'default' : 'secondary'} onClick={() => handleThemeChange('dark')}><MoonIcon className="w-5 h-5"/></Button>
                        </div>
                    </div>
                )}
                {showBookmarks && (
                    <div className="absolute top-16 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-72 z-30 text-white">
                        <h3 className="font-bold mb-2">Bookmarks</h3>
                        <ul className="max-h-64 overflow-y-auto pr-2">
                            {bookmarks.length > 0 ? bookmarks.map((bm, i) => (
                                <li key={bm} className="text-sm hover:bg-stone-700/50 p-2 rounded-md flex justify-between items-center">
                                    <button onClick={() => goToBookmark(bm)} className="text-left flex-grow text-stone-300">
                                        Bookmark {i + 1}
                                        <span className="text-xs text-stone-400 ml-2">({book.locations.percentageFromCfi(bm).toFixed(1)}%)</span>
                                    </button>
                                    <Button variant="ghost" size="icon" onClick={() => addOrRemoveBookmark()} className="h-6 w-6 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></Button>
                                </li>
                            )) : <p className="text-xs text-stone-500">No bookmarks yet. Click the bookmark icon in the header to add one.</p>}
                        </ul>
                    </div>
                )}

                {/* --- Footer --- */}
                <div className="epub-reader-footer absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center z-20 text-white text-sm">
                     <div className="flex gap-4">
                        <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                        <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor(totalSecondsRead))}</div>
                     </div>
                     <Button variant="ghost" size="icon" onClick={addOrRemoveBookmark} title="Add/Remove Bookmark">
                        {currentCfi && bookmarks.includes(currentCfi) ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400"/> : <BookmarkOutlineIcon className="w-5 h-5"/>}
                     </Button>
                     <div className="font-semibold">{progress}%</div>
                </div>
            </div>
        </div>
    );
};

export default EpubReaderPanel;