import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, SettingsIcon, SunIcon, MoonIcon, ExpandIcon, ShrinkIcon } from '../user-interface/Icons';
import { BookmarkSolidIcon, TrashIcon, BookmarkPlusIcon } from '../user-interface/Icons';
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
    const [bookTitle, setBookTitle] = useState('');
    const [pageTurnClass, setPageTurnClass] = useState('');
    
    // UI State
    const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('epubTheme') as 'light' | 'dark' || 'dark');
    const [fontSize, setFontSize] = useState(100); // in percent
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    
    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const startTimeRef = useRef(Date.now());
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
        
        newBook.loaded.metadata.then((meta: any) => {
            setBookTitle(meta.title);
        });

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
            setRendition(newRendition);

            const applyTheme = (renditionToTheme: any) => {
                 renditionToTheme.themes.register("custom", {
                    "body": { "color": theme === 'light' ? "#1c1917" : "#f3f4f6", "font-size": `${fontSize}%` },
                });
                renditionToTheme.themes.select("custom");
            };

            newRendition.on("displayed", () => {
                setIsLoading(false);
                applyTheme(newRendition);
            });
            
            book.ready.then(() => {
                return book.locations.generate(1000); // Generate locations once
            }).then(() => {
                // Now that locations are generated, we can register the relocated handler
                newRendition.on("relocated", (locationData: any) => {
                    const cfi = locationData.start.cfi;
                    setCurrentCfi(cfi);
                    // Now we can safely use percentageFromCfi
                    if (book.locations) {
                        const percent = book.locations.percentageFromCfi(cfi);
                        setProgress(Math.round(percent * 100));
                    }
                });

                // And display the book at the last known location
                newRendition.display(userProgress?.locationCfi || undefined);
            });
            
            return () => {
                if(newRendition) newRendition.destroy();
            };
        }
    }, [book, theme, fontSize, userProgress]);

    // --- Time & Progress Syncing ---
    const syncProgress = useCallback(async (secondsToSync: number, cfiToSync: string | null, bookmarksToSync?: string[]) => {
        if (!currentUser) return;
        
        const dataToSync: any = {};
        if (secondsToSync > 0) dataToSync.secondsToAdd = secondsToSync;
        if (cfiToSync) dataToSync.locationCfi = cfiToSync;
        if (bookmarksToSync) dataToSync.bookmarks = bookmarksToSync;
        
        if (Object.keys(dataToSync).length > 0) {
            await updateReadingProgress(quest.id, currentUser.id, dataToSync);
        }

    }, [currentUser, quest.id, updateReadingProgress]);

    // Refactored time tracking into a single robust effect
    useEffect(() => {
        // Timer for updating the session display every second
        const sessionTimer = setInterval(() => {
            setSessionSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        // Interval for syncing progress with the backend
        const syncInterval = setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = Math.round((now - lastSyncTimeRef.current) / 1000);
            if (elapsedSeconds > 0) {
                syncProgress(elapsedSeconds, currentCfi);
                lastSyncTimeRef.current = now; // Update sync time after successful sync call
            }
        }, 20000); // Sync every 20 seconds

        // Cleanup function for when the component unmounts
        return () => {
            clearInterval(sessionTimer);
            clearInterval(syncInterval);
            // Perform one final sync on close
            const elapsedSeconds = Math.round((Date.now() - lastSyncTimeRef.current) / 1000);
            if (elapsedSeconds > 0) {
                syncProgress(elapsedSeconds, currentCfi);
            }
        };
    }, [currentCfi, syncProgress]);
    
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

    const addBookmark = () => {
        if (currentCfi && !bookmarks.includes(currentCfi)) {
            const newBookmarks = [...bookmarks, currentCfi];
            setBookmarks(newBookmarks);
            syncProgress(0, null, newBookmarks);
        }
    };
    
    const removeBookmark = (cfi: string) => {
        const newBookmarks = bookmarks.filter(bm => bm !== cfi);
        setBookmarks(newBookmarks);
        syncProgress(0, null, newBookmarks);
    };

    const goToBookmark = (cfi: string) => {
        rendition?.display(cfi);
        setShowBookmarks(false);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (book && rendition) {
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
        <div ref={containerRef} className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center epub-container" data-immersive={isImmersive}>
            <div className="w-full h-full bg-stone-800 shadow-2xl relative flex flex-col">
                {/* --- Immersive Mode Toggle --- */}
                {isImmersive && (
                     <Button variant="ghost" size="icon" onClick={() => setIsImmersive(false)} title="Show Controls" className="absolute top-2 right-2 z-30 !bg-stone-800/50 hover:!bg-stone-700/80 text-white">
                        <ShrinkIcon className="w-5 h-5"/>
                    </Button>
                )}
                {/* --- Header --- */}
                <header className="epub-reader-header p-3 flex justify-between items-center z-20 text-white flex-shrink-0">
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                        <p className="text-sm text-stone-300 truncate">{bookTitle}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={addBookmark} title="Add Bookmark"><BookmarkPlusIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowBookmarks(p => !p)} title="View Bookmarks"><BookmarkSolidIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(p => !p)} title="Settings"><SettingsIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsImmersive(true)} title="Immersive Mode"><ExpandIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <ShrinkIcon className="w-5 h-5"/> : <ExpandIcon className="w-5 h-5"/>}</Button>
                        <Button variant="ghost" size="icon" onClick={handleClose} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                    </div>
                </header>

                {/* --- Main Viewer --- */}
                <div id="viewer-wrapper" className="flex-grow relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-800 z-30">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                        </div>
                    )}
                    <div id="viewer" ref={viewerRef} className={`h-full w-full ${theme} ${pageTurnClass}`} />
                    <div id="prev" className="absolute top-0 bottom-0 left-0 w-[15%] cursor-pointer z-10" onClick={() => handlePageTurn('prev')}></div>
                    <div id="next" className="absolute top-0 bottom-0 right-0 w-[15%] cursor-pointer z-10" onClick={() => handlePageTurn('next')}></div>
                </div>

                {/* --- Popups --- */}
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
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setFontSize(s => Math.max(80, s - 10))}>A-</Button>
                                <span className="font-mono">{fontSize}%</span>
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setFontSize(s => Math.min(200, s + 10))}>A+</Button>
                            </div>
                        </div>
                    </div>
                )}
                {showBookmarks && (
                    <div className="absolute bottom-20 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-72 z-30 text-white">
                        <h3 className="font-bold mb-2">Bookmarks</h3>
                        <ul className="max-h-64 overflow-y-auto pr-2">
                            {bookmarks.length > 0 ? bookmarks.map((bm, i) => (
                                <li key={bm} className="text-sm hover:bg-stone-700/50 p-2 rounded-md flex justify-between items-center">
                                    <button onClick={() => goToBookmark(bm)} className="text-left flex-grow text-stone-300">
                                        Bookmark {i + 1}
                                        <span className="text-xs text-stone-400 ml-2">({Math.round(book.locations.percentageFromCfi(bm) * 100)}%)</span>
                                    </button>
                                    <Button variant="ghost" size="icon" onClick={() => removeBookmark(bm)} className="h-6 w-6 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></Button>
                                </li>
                            )) : <p className="text-xs text-stone-500">No bookmarks yet. Click the '+' icon in the header to add one.</p>}
                        </ul>
                    </div>
                )}

                {/* --- Footer --- */}
                <footer className="epub-reader-footer p-3 flex justify-between items-center z-20 text-white text-sm flex-shrink-0">
                     <div className="flex gap-4 w-1/4">
                        <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                        <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor(totalSecondsRead))}</div>
                     </div>
                     <div className="flex-grow flex items-center gap-3 px-4">
                        <input type="range" min="0" max="100" value={progress} onChange={handleSliderChange} className="epub-progress-slider w-full" />
                        <span className="font-semibold w-12 text-right">{progress}%</span>
                     </div>
                     <div className="w-1/4" />
                </footer>
            </div>
        </div>
    );
};

export default EpubReaderPanel;