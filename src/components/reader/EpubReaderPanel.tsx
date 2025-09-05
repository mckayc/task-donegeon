import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, BookmarkIcon as BookmarkOutlineIcon } from 'lucide-react';
import { BookmarkIcon as BookmarkSolidIcon } from '../user-interface/Icons';
import { logReadingTimeAPI } from '../../api';

declare var ePub: any;

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingQuest } = useUIDispatch();
    const { currentUser } = useAuthState();

    const [book, setBook] = useState<any>(null);
    const [rendition, setRendition] = useState<any>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const viewerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [isPanelActive, setIsPanelActive] = useState(true);
    const sessionSyncIntervalRef = useRef<number | null>(null);

    const bookKey = currentUser ? `epub-loc-${currentUser.id}-${quest.id}` : null;
    const bookmarksKey = currentUser ? `epub-bookmarks-${currentUser.id}-${quest.id}` : null;

    const totalSecondsRead = useMemo(() => {
        if (!currentUser) return 0;
        const storedSeconds = quest.readingProgress?.[currentUser.id] || 0;
        return storedSeconds + sessionSeconds;
    }, [quest.readingProgress, currentUser, sessionSeconds]);

    useEffect(() => {
        let interval: number;
        if (isPanelActive) {
            interval = window.setInterval(() => {
                setSessionSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPanelActive]);

    const syncReadingTime = useCallback(async (secondsToSync: number) => {
        if (!currentUser || secondsToSync <= 0) return;
        try {
            // This is a fire-and-forget call; we don't need to wait for the response
            // as the state will be updated via the main data provider sync.
            logReadingTimeAPI(quest.id, currentUser.id, secondsToSync);
        } catch (error) {
            console.error("Failed to sync reading time:", error);
        }
    }, [currentUser, quest.id]);

    useEffect(() => {
        // Sync every 20 seconds
        sessionSyncIntervalRef.current = window.setInterval(() => {
            setSessionSeconds(prevSeconds => {
                if (prevSeconds > 0) {
                    syncReadingTime(prevSeconds);
                }
                return 0; // Reset session timer after syncing
            });
        }, 20000);

        return () => {
            if (sessionSyncIntervalRef.current) {
                clearInterval(sessionSyncIntervalRef.current);
            }
            // Final sync on unmount
            syncReadingTime(sessionSeconds);
        };
    }, [syncReadingTime, sessionSeconds]);


    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPanelActive(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (!quest.epubUrl) return;

        const newBook = ePub(quest.epubUrl);
        setBook(newBook);

        const storedBookmarks = bookmarksKey ? localStorage.getItem(bookmarksKey) : null;
        if (storedBookmarks) {
            setBookmarks(JSON.parse(storedBookmarks));
        }
    }, [quest.epubUrl, quest.id, currentUser]);
    
    useEffect(() => {
        if (book && viewerRef.current) {
            const newRendition = book.renderTo(viewerRef.current, {
                width: "100%",
                height: "100%",
                flow: "paginated",
                spread: "auto"
            });

            newRendition.on("displayed", () => {
                setIsLoading(false);
            });

            newRendition.on("relocated", (locationData: any) => {
                const cfi = locationData.start.cfi;
                if (bookKey) localStorage.setItem(bookKey, cfi);
                setLocation(cfi);
                
                book.locations.generate(1000).then(() => {
                    const percent = book.locations.percentageFromCfi(cfi);
                    setProgress(Math.round(percent * 100));
                });
            });

            const savedLocation = bookKey ? localStorage.getItem(bookKey) : null;
            newRendition.display(savedLocation || undefined);
            setRendition(newRendition);

            return () => {
                newRendition.destroy();
            };
        }
    }, [book, bookKey]);

    const prevPage = () => rendition?.prev();
    const nextPage = () => rendition?.next();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevPage();
            if (e.key === "ArrowRight") nextPage();
            if (e.key === "Escape") setReadingQuest(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [rendition, setReadingQuest]);

    const addBookmark = () => {
        if (location && !bookmarks.includes(location) && bookmarksKey) {
            const newBookmarks = [...bookmarks, location];
            setBookmarks(newBookmarks);
            localStorage.setItem(bookmarksKey, JSON.stringify(newBookmarks));
        }
    };

    const removeBookmark = (cfi: string) => {
        if (bookmarksKey) {
            const newBookmarks = bookmarks.filter(bm => bm !== cfi);
            setBookmarks(newBookmarks);
            localStorage.setItem(bookmarksKey, JSON.stringify(newBookmarks));
        }
    };
    
    const goToBookmark = (cfi: string) => {
        rendition?.display(cfi);
        setShowBookmarks(false);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const parts = [];
        if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
        parts.push(minutes.toString().padStart(2, '0'));
        parts.push(seconds.toString().padStart(2, '0'));
        return parts.join(':');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[90vh] bg-stone-100 text-stone-900 shadow-2xl rounded-lg relative flex flex-col">
                <div className="p-3 border-b border-stone-300 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={addBookmark} className="h-9 w-9 p-0" title="Add Bookmark">
                           <BookmarkOutlineIcon className="w-5 h-5"/>
                        </Button>
                         <Button variant="secondary" onClick={() => setShowBookmarks(p => !p)} className="h-9 w-9 p-0" title="View Bookmarks">
                           <BookmarkSolidIcon className="w-5 h-5"/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setReadingQuest(null)} className="h-9 w-9 p-0">
                            <XCircleIcon className="w-6 h-6"/>
                        </Button>
                    </div>
                </div>

                <div className="flex-grow relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    )}
                    <div id="viewer" ref={viewerRef} className="h-full w-full" />
                    <div id="prev" className="absolute top-0 bottom-0 left-0 w-[15%] cursor-pointer" onClick={prevPage}></div>
                    <div id="next" className="absolute top-0 bottom-0 right-0 w-[15%] cursor-pointer" onClick={nextPage}></div>
                </div>

                {showBookmarks && (
                    <div className="absolute top-16 right-4 bg-white shadow-lg rounded-md p-4 w-64 border z-20">
                        <h3 className="font-bold text-stone-800 mb-2">Bookmarks</h3>
                        <ul className="max-h-64 overflow-y-auto">
                            {bookmarks.length > 0 ? bookmarks.map((bm, i) => (
                                <li key={bm} className="text-sm text-stone-600 hover:bg-stone-100 p-2 rounded-md flex justify-between items-center">
                                    <button onClick={() => goToBookmark(bm)} className="text-left flex-grow">
                                        Bookmark {i + 1}
                                    </button>
                                    <button onClick={() => removeBookmark(bm)} className="text-red-500 hover:text-red-700 ml-2 font-bold">&times;</button>
                                </li>
                            )) : <p className="text-xs text-stone-500">No bookmarks yet.</p>}
                        </ul>
                    </div>
                )}
                <div className="absolute bottom-4 left-4 bg-stone-800 text-white px-3 py-1.5 rounded-full text-sm font-mono" title="Total Time Read">
                    {formatTime(totalSecondsRead)}
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                    {progress}%
                </div>
            </div>
        </div>
    );
};

export default EpubReaderPanel;