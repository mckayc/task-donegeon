
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ePub, { Book, Rendition, Location } from 'epubjs';
import { Quest, Bookmark } from '../../types';
import { useUIDispatch } from '../../context/UIContext';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useAuthState } from '../../context/AuthContext';
import Button from '../user-interface/Button';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, MenuIcon, BookmarkIcon, BookmarkSolidIcon, TrashIcon } from '../user-interface/Icons';
import { useDebounce } from '../../hooks/useDebounce';

const EPUB_CACHE_NAME = 'epub-cache-v1';

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);

    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const tocRef = useRef<{ label: string, href: string }[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('epubReaderTheme') as 'light' | 'dark') || 'dark');
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('epubReaderFontSize') || '100', 10));

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(0);

    const userProgress = useMemo(() => currentUser ? liveQuest.readingProgress?.[currentUser.id] : null, [liveQuest.readingProgress, currentUser]);
    const bookmarks = useMemo(() => userProgress?.bookmarks || [], [userProgress]);

    const debouncedLocation = useDebounce(currentLocation, 1500);

    // --- Initialization and Cleanup ---
    useEffect(() => {
        initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
        sessionStartTimeRef.current = Date.now();
        lastSyncTimeRef.current = Date.now();
        setSessionSeconds(0);

        const timer = setInterval(() => {
            setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [quest.id, userProgress]);
    
    useEffect(() => {
        const loadBook = async () => {
            if (!viewerRef.current || !quest.epubUrl) return;
            setIsLoading(true);

            try {
                const cache = await caches.open(EPUB_CACHE_NAME);
                let response = await cache.match(quest.epubUrl);
                if (!response) {
                    console.log('EPUB not in cache, fetching...');
                    response = await fetch(quest.epubUrl);
                    if (response.ok) {
                        await cache.put(quest.epubUrl, response.clone());
                    } else {
                         throw new Error(`Failed to fetch EPUB: ${response.statusText}`);
                    }
                }
                const bookData = await response.arrayBuffer();

                const book = ePub(bookData);
                bookRef.current = book;
                const rendition = book.renderTo(viewerRef.current, { width: '100%', height: '100%' });
                renditionRef.current = rendition;

                await book.ready;
                await book.locations.generate(1024);
                
                tocRef.current = book.navigation.toc.map(item => ({ label: item.label.trim(), href: item.href }));

                rendition.on('rendered', () => {
                    rendition.themes.select(theme);
                    rendition.themes.fontSize(`${fontSize}%`);
                });

                rendition.on('locationChanged', (location: Location) => {
                    setCurrentLocation(location.start.cfi);
                    // FIX: The epubjs Locations object does not have a `total` property. The correct way to get the count is to call the `length()` method.
                    if (book.locations.length() > 0) {
                        const bookProgress = book.locations.percentageFromCfi(location.start.cfi);
                        setProgress(Math.round(bookProgress * 100));
                    }
                });
                
                rendition.on('relocated', (location: Location) => {
                     const cfi = location.start.cfi;
                     const currentBookmark = bookmarks.find(b => book.canonical(b.cfi) === book.canonical(cfi));
                     setIsBookmarked(!!currentBookmark);
                });

                await rendition.display(userProgress?.locationCfi);
                setIsLoading(false);

            } catch (error) {
                console.error("Error loading EPUB:", error);
                setIsLoading(false);
            }
        };

        loadBook();

        return () => {
            bookRef.current?.destroy();
            bookRef.current = null;
            renditionRef.current = null;
        };
    }, [quest.epubUrl, theme, fontSize, userProgress, bookmarks]);

    // --- Syncing ---
    const syncProgress = useCallback(async (isFinal = false) => {
        if (!currentUser || !debouncedLocation) return;
        
        const now = Date.now();
        const secondsSinceLastSync = Math.round((now - lastSyncTimeRef.current) / 1000);
        
        if (secondsSinceLastSync > 0 || isFinal) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, {
                    secondsToAdd: secondsSinceLastSync,
                    sessionSeconds: sessionSeconds,
                    locationCfi: debouncedLocation
                });
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("EPUB sync failed:", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, debouncedLocation, sessionSeconds]);

    useEffect(() => {
        if (debouncedLocation) syncProgress();
    }, [debouncedLocation, syncProgress]);

    useEffect(() => {
        const intervalId = setInterval(() => syncProgress(), 30000);
        const handleUnload = () => syncProgress(true);
        window.addEventListener('beforeunload', handleUnload);
        
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleUnload);
            syncProgress(true);
        };
    }, [syncProgress]);


    // --- UI Handlers ---
    const goNext = () => renditionRef.current?.next();
    const goPrev = () => renditionRef.current?.prev();
    
    const handleTocClick = (href: string) => {
        renditionRef.current?.display(href);
        setIsTocOpen(false);
    };

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        renditionRef.current?.themes.select(newTheme);
        localStorage.setItem('epubReaderTheme', newTheme);
    };

    const handleFontSizeChange = (newSize: number) => {
        const clampedSize = Math.max(75, Math.min(200, newSize));
        setFontSize(clampedSize);
        renditionRef.current?.themes.fontSize(`${clampedSize}%`);
        localStorage.setItem('epubReaderFontSize', String(clampedSize));
    };

    const handleBookmark = () => {
        if (!currentUser || !currentLocation || !bookRef.current) return;

        const book = bookRef.current;
        const currentBookmark = bookmarks.find(b => book.canonical(b.cfi) === book.canonical(currentLocation));
        
        let newBookmarks: Bookmark[];
        if (currentBookmark) {
            newBookmarks = bookmarks.filter(b => b.cfi !== currentBookmark.cfi);
            setIsBookmarked(false);
        } else {
            const newLabel = `Progress: ${progress}%`;
            newBookmarks = [...bookmarks, { label: newLabel, cfi: currentLocation, createdAt: new Date().toISOString() }];
            setIsBookmarked(true);
        }
        updateReadingProgress(quest.id, currentUser.id, { bookmarks: newBookmarks });
    };

    const handleGoToBookmark = (bookmark: Bookmark) => {
        renditionRef.current?.display(bookmark.cfi);
        setIsTocOpen(false);
    };

    const handleDeleteBookmark = (bookmark: Bookmark) => {
        if (!currentUser) return;
        const newBookmarks = bookmarks.filter(b => b.cfi !== bookmark.cfi);
        updateReadingProgress(quest.id, currentUser.id, { bookmarks: newBookmarks });
    };
    
    const totalSecondsRead = initialTotalSecondsRef.current + sessionSeconds;
    const formatTime = (total: number) => {
        const h = Math.floor(total / 3600).toString().padStart(2, '0');
        const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
        const s = (total % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 bg-stone-900 z-[80] flex flex-col">
            {/* Header */}
            <header className="w-full p-2 flex justify-between items-center z-20 text-white bg-stone-800/80 flex-shrink-0 backdrop-blur-sm">
                <Button variant="ghost" size="icon" onClick={() => setIsTocOpen(!isTocOpen)} title="Table of Contents"><MenuIcon className="w-6 h-6"/></Button>
                <div className="text-center truncate px-2">
                    <h3 className="font-bold text-base truncate">{quest.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleBookmark} title="Bookmark Page">
                        {isBookmarked ? <BookmarkSolidIcon className="w-6 h-6 text-emerald-400"/> : <BookmarkIcon className="w-6 h-6"/>}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </header>

            {/* TOC Panel */}
            {isTocOpen && (
                <div className="absolute top-0 left-0 h-full w-full bg-black/60 z-30" onClick={() => setIsTocOpen(false)} />
            )}
            <div className={`absolute top-0 left-0 h-full w-72 bg-stone-900 shadow-xl z-40 transition-transform duration-300 ease-in-out ${isTocOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <h3 className="p-4 text-lg font-bold border-b border-stone-700">Contents</h3>
                <div className="overflow-y-auto h-[calc(100%-120px)]">
                    <h4 className="font-semibold text-sm p-3 text-stone-400">Chapters</h4>
                    <ul>
                        {tocRef.current.map((item, index) => (
                            <li key={index}><button onClick={() => handleTocClick(item.href)} className="w-full text-left p-3 text-sm hover:bg-stone-800">{item.label}</button></li>
                        ))}
                    </ul>
                    <h4 className="font-semibold text-sm p-3 mt-4 text-stone-400 border-t border-stone-700">Bookmarks</h4>
                     <ul className="space-y-1 p-2">
                        {bookmarks.map((bookmark, index) => (
                            <li key={index} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-stone-800">
                                <button onClick={() => handleGoToBookmark(bookmark)} className="flex-grow text-left text-sm">{bookmark.label}</button>
                                <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => handleDeleteBookmark(bookmark)}><TrashIcon className="w-3 h-3"/></Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-grow w-full h-full min-h-0 relative">
                {isLoading && <div className="absolute inset-0 flex items-center justify-center text-white">Loading Book...</div>}
                <div ref={viewerRef} className="w-full h-full" />
            </div>

            {/* Footer */}
            <footer className="w-full p-2 flex flex-col z-20 text-white bg-stone-800/80 flex-shrink-0 backdrop-blur-sm">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4 w-1/3">
                        <div title="Session Time">{formatTime(sessionSeconds)}</div>
                        <div title="Total Time Read">{formatTime(Math.floor(totalSecondsRead))}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={goPrev}><ChevronLeftIcon className="w-6 h-6"/></Button>
                        <span className="font-mono text-sm w-12 text-center">{progress}%</span>
                        <Button variant="ghost" size="icon" onClick={goNext}><ChevronRightIcon className="w-6 h-6"/></Button>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-1/3">
                        <Button variant="ghost" size="icon" onClick={() => handleThemeChange('light')} className={theme === 'light' ? 'text-emerald-400' : ''}><SunIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleThemeChange('dark')} className={theme === 'dark' ? 'text-emerald-400' : ''}><MoonIcon className="w-5 h-5"/></Button>
                        <button onClick={() => handleFontSizeChange(fontSize - 10)} className="text-sm">A-</button>
                        <input type="range" min="75" max="200" step="5" value={fontSize} onChange={(e) => handleFontSizeChange(Number(e.target.value))} className="w-24"/>
                        <button onClick={() => handleFontSizeChange(fontSize + 10)} className="text-lg">A+</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EpubReaderPanel;