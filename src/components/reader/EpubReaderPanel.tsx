
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ePub, { Book, Rendition, Location } from 'epubjs';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, BookOpen, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, BookmarkPlusIcon, BookmarkSolidIcon, Settings, Maximize, Minimize } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../user-interface/Input';

interface EpubReaderPanelProps {
  quest: Quest;
}

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));
    return parts.join(':');
};


const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { addNotification } = useNotificationsDispatch();

    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isTocOpen, setIsTocOpen] = useState(false);

    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [progress, setProgress] = useState(0);
    
    // UI Settings
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [fontSize, setFontSize] = useState(100);

    // Bookmarks
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [newBookmarkLabel, setNewBookmarkLabel] = useState('');

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(0);

    const userProgress = useMemo(() => {
        if (!currentUser) return null;
        return quest.readingProgress?.[currentUser.id];
    }, [quest.readingProgress, currentUser]);

    // Debounce location for saving to avoid excessive writes
    const debouncedLocation = useDebounce(currentLocation, 1000);

    // --- Book Initialization ---
    useEffect(() => {
        if (!quest.epubUrl || !viewerRef.current || !currentUser) return;
        const book = ePub(quest.epubUrl);
        bookRef.current = book;
        const viewerNode = viewerRef.current;

        const rendition = book.renderTo(viewerNode, {
            width: "100%",
            height: "100%",
            flow: "paginated",
            spread: "auto",
        });
        renditionRef.current = rendition;

        const savedProgress = userProgress?.locationCfi;
        rendition.display(savedProgress).catch((err: any) => {
            console.error("Error displaying saved location:", err);
            rendition.display();
        });

        book.ready.then(() => {
            return book.locations.generate(1650);
        }).then(() => {
            setIsLoading(false);
            const savedBookmarks = userProgress?.bookmarks || [];
            setBookmarks(savedBookmarks);
            initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
            sessionStartTimeRef.current = Date.now();
            lastSyncTimeRef.current = Date.now();
        }).catch((err: any) => {
            setError(`Failed to load book: ${err.message}`);
            setIsLoading(false);
        });

        rendition.on("relocated", (location: Location) => {
            setCurrentLocation(location);
            if (bookRef.current && bookRef.current.locations) {
                const perc = bookRef.current.locations.percentageFromCfi(location.start.cfi);
                setProgress(Math.round(perc * 100));
            }
        });
        
        return () => {
            book.destroy();
            rendition.destroy();
        };
    }, [quest.epubUrl, currentUser, userProgress]);
    
    // --- UI/Progress Sync ---
    const syncProgress = useCallback(async (isFinalSync = false) => {
        if (!currentUser || (!debouncedLocation && !isFinalSync)) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);

        const dataToSync: { secondsToAdd?: number, sessionSeconds?: number, locationCfi?: string, bookmarks?: Bookmark[] } = {};

        if (debouncedLocation) dataToSync.locationCfi = debouncedLocation.start.cfi;
        if (secondsToAdd > 0) dataToSync.secondsToAdd = secondsToAdd;
        dataToSync.sessionSeconds = sessionSeconds;
        dataToSync.bookmarks = bookmarks;

        try {
            await updateReadingProgress(quest.id, currentUser.id, dataToSync);
            lastSyncTimeRef.current = now;
        } catch (e) {
            console.error("EPUB Sync Failed:", e);
        }
    }, [currentUser, quest.id, updateReadingProgress, debouncedLocation, sessionSeconds, bookmarks]);

    // Periodic sync
    useEffect(() => {
        const intervalId = setInterval(() => syncProgress(false), 30000);
        return () => clearInterval(intervalId);
    }, [syncProgress]);

    // Final sync on unmount
    useEffect(() => {
        return () => { syncProgress(true); };
    }, [syncProgress]);
    
    // Debounced location save
    useEffect(() => {
        if (debouncedLocation) syncProgress(false);
    }, [debouncedLocation, syncProgress]);

    // Session Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- UI Actions ---
    const nextPage = () => renditionRef.current?.next();
    const prevPage = () => renditionRef.current?.prev();
    const onProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseInt(e.target.value, 10) / 100;
        const location = bookRef.current?.locations.cfiFromPercentage(percentage);
        if (location) renditionRef.current?.display(location);
    };

    const isCurrentLocationBookmarked = useMemo(() => {
        if (!currentLocation) return false;
        const currentCfi = currentLocation.start.cfi;
        return bookmarks.some(bm => bm.cfi === currentCfi);
    }, [currentLocation, bookmarks]);

    const handleAddBookmark = () => {
        if (!newBookmarkLabel.trim() || !currentLocation) return;
        const newBookmark: Bookmark = {
            label: newBookmarkLabel,
            cfi: currentLocation.start.cfi,
            createdAt: new Date().toISOString(),
        };
        setBookmarks(prev => [...prev, newBookmark]);
        setIsBookmarkModalOpen(false);
        setNewBookmarkLabel('');
    };

    const handleToggleBookmark = () => {
        if (!currentLocation) return;
        if (isCurrentLocationBookmarked) {
            setBookmarks(prev => prev.filter(bm => bm.cfi !== currentLocation.start.cfi));
        } else {
            setIsBookmarkModalOpen(true);
        }
    };
    
    const handleTocClick = (href: string) => {
        renditionRef.current?.display(href);
        setIsTocOpen(false);
    };

    // --- UI/Theme Management ---
    useEffect(() => {
        const rendition = renditionRef.current;
        if (!rendition) return;
        rendition.themes.register("dark", { body: { "background-color": "#1c1917", "color": "#e7e5e4" } });
        rendition.themes.register("light", { body: { "background-color": "#fafaf9", "color": "#1c1917" } });
        rendition.themes.select(theme);
    }, [theme]);
    
    useEffect(() => {
        renditionRef.current?.themes.fontSize(`${fontSize}%`);
    }, [fontSize]);

    const totalSecondsRead = initialTotalSecondsRef.current + sessionSeconds;
    
    const TocPanel = () => (
      <div className="absolute top-0 left-0 h-full w-72 bg-stone-800 shadow-xl z-50 p-4 flex flex-col">
        <h3 className="text-xl font-bold mb-4 flex-shrink-0">Contents</h3>
        <ul className="flex-grow overflow-y-auto space-y-2">
          {bookRef.current?.navigation.toc.map((item, index) => (
            <li key={index}>
              <button onClick={() => handleTocClick(item.href)} className="text-left text-stone-300 hover:text-emerald-400">
                {item.label.trim()}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
    
    return (
        <div ref={viewerRef} className="fixed inset-0 bg-stone-900 z-[80] flex flex-col items-center justify-center epub-container">
            {isLoading && <div className="text-white text-lg">Loading Book...</div>}
            {error && <div className="text-red-400 text-lg">{error}</div>}

            <div id="viewer" className="w-full flex-grow" />

            <div className={`absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-40 text-white bg-gradient-to-b from-black/70 to-transparent transition-opacity ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsTocOpen(p => !p)}><BookOpen/></Button>
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <SunIcon/> : <MoonIcon/>}</Button>
                    <Button variant="ghost" size="icon" onClick={handleToggleBookmark}>{isCurrentLocationBookmarked ? <BookmarkSolidIcon className="text-emerald-400"/> : <BookmarkPlusIcon/>}</Button>
                    <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)}><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 z-40 text-white bg-gradient-to-t from-black/70 to-transparent transition-opacity ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-4">
                    <span className="text-xs w-20 text-center">{currentLocation?.start.displayed.page || '...'}</span>
                    <input type="range" min="0" max="100" value={progress} onChange={onProgressChange} className="w-full"/>
                    <span className="text-xs w-20 text-center">{currentLocation?.end.displayed.page || '...'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="w-1/3 text-left">
                        <span className="font-mono text-sm">Session: {formatTime(sessionSeconds)}</span>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" size="icon" onClick={prevPage}><ChevronLeftIcon /></Button>
                        <Button variant="secondary" size="icon" onClick={nextPage}><ChevronRightIcon /></Button>
                    </div>
                    <div className="w-1/3 text-right">
                         <span className="font-mono text-sm">Total: {formatTime(totalSecondsRead)}</span>
                    </div>
                </div>
            </div>
            
            {isTocOpen && <TocPanel />}
            
            {isBookmarkModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsBookmarkModalOpen(false)}>
                    <div className="bg-stone-800 p-6 rounded-lg" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg mb-4">Add Bookmark</h4>
                        <Input label="Bookmark Label" value={newBookmarkLabel} onChange={e => setNewBookmarkLabel(e.target.value)} autoFocus />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setIsBookmarkModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddBookmark}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EpubReaderPanel;
