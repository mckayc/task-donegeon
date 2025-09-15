import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quest, Bookmark } from '../../types';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import Button from '../user-interface/Button';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, BookOpen, BookmarkPlusIcon, BookmarkSolidIcon, ChevronsUpDown, Maximize, Minimize, TrashIcon } from '../user-interface/Icons';
import { useDebounce } from '../../hooks/useDebounce';
import ePub from 'epubjs';
import { useDeveloperDispatch } from '../../context/DeveloperContext';

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { addEpubLog } = useDeveloperDispatch();
    
    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);
    const userProgress = useMemo(() => {
      if (!currentUser) return null;
      return liveQuest.readingProgress?.[currentUser.id];
    }, [liveQuest.readingProgress, currentUser]);

    const [book, setBook] = useState<any>(null);
    const [rendition, setRendition] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<string | null>(userProgress?.locationCfi || null);
    const debouncedLocation = useDebounce(currentLocation, 1000);
    
    // UI State
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [theme, setTheme] = useState('dark');
    const [fontSize, setFontSize] = useState(100);
    const [isImmersive, setIsImmersive] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(userProgress?.bookmarks || []);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [toc, setToc] = useState<any[]>([]);
    
    // Progress & Time
    const [progress, setProgress] = useState(0);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(userProgress?.totalSeconds || 0);

    const viewerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Book Initialization ---
     useEffect(() => {
        const epubUrl = quest.epubUrl;
        if (!epubUrl) {
            setError("No EPUB file URL provided.");
            addEpubLog({ type: 'ERROR', message: `No EPUB URL for quest "${quest.title}"` });
            return;
        }

        const loadBook = async () => {
            setIsLoading(true);
            setError(null);
            addEpubLog({ type: 'INFO', message: `Starting to load EPUB: ${epubUrl}` });
            
            try {
                const response = await fetch(epubUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                if (!response.body) {
                    addEpubLog({ type: 'WARN', message: 'Response body is not readable. Downloading without progress.' });
                    const arrayBuffer = await response.arrayBuffer();
                    addEpubLog({ type: 'INFO', message: 'EPUB file downloaded successfully.' });
                    return arrayBuffer;
                }
                
                const contentLength = response.headers.get('content-length');
                if (!contentLength) {
                    addEpubLog({ type: 'WARN', message: 'Content-Length header not found. Cannot display download progress.' });
                    const arrayBuffer = await response.arrayBuffer();
                    addEpubLog({ type: 'INFO', message: 'EPUB file downloaded successfully.' });
                    return arrayBuffer;
                }

                const total = parseInt(contentLength, 10);
                let loaded = 0;
                const reader = response.body.getReader();
                const chunks: Uint8Array[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    loaded += value.length;
                    setDownloadProgress(Math.round((loaded / total) * 100));
                }

                addEpubLog({ type: 'INFO', message: 'EPUB file downloaded successfully.' });
                
                const fullBuffer = new Uint8Array(loaded);
                let offset = 0;
                for (const chunk of chunks) {
                    fullBuffer.set(chunk, offset);
                    offset += chunk.length;
                }
                
                return fullBuffer.buffer;

            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
                setError(`Failed to download EPUB file: ${message}`);
                addEpubLog({ type: 'ERROR', message: `Failed to download EPUB: ${message}` });
                setIsLoading(false);
                return null;
            }
        };

        loadBook().then(arrayBuffer => {
            if (!arrayBuffer || !viewerRef.current) return;
            
            addEpubLog({ type: 'DEBUG', message: 'Initializing ePub with ArrayBuffer...' });
            const epubBook = ePub(arrayBuffer);
            setBook(epubBook);
        
            const epubRendition = epubBook.renderTo(viewerRef.current, {
                width: "100%",
                height: "100%",
                spread: "auto",
            });
            setRendition(epubRendition);

            addEpubLog({ type: 'DEBUG', message: 'ePub rendition created.' });
        });

    }, [quest.epubUrl, quest.title, addEpubLog]);

    // --- Rendition and Progress Events ---
    useEffect(() => {
        if (!rendition || !book) return;

        rendition.themes.register("dark", { body: { color: "#d1d5db", background: "#1c1917" } });
        rendition.themes.register("light", { body: { color: "#1f2937", background: "#f3f4f6" } });
        rendition.themes.register("sepia", { body: { color: "#5b4636", background: "#f1e8d9" } });
        rendition.themes.select(theme);

        book.ready.then(() => {
            setIsLoading(false);
            setDownloadProgress(null);
            addEpubLog({ type: 'INFO', message: 'Book is ready and rendered.' });
            rendition.display(currentLocation || undefined);
            
            book.locations.generate(1650).then(() => {
                if (currentLocation) {
                    const startingProgress = book.locations.percentageFromCfi(currentLocation);
                    setProgress(startingProgress);
                }
                 addEpubLog({ type: 'DEBUG', message: `Locations generated. Total locations: ${book.locations.length()}` });
            });

            book.navigation.load().then((nav: any) => setToc(nav.toc));
        });

        rendition.on("relocated", (location: any) => {
            setCurrentLocation(location.start.cfi);
            const newProgress = book.locations.percentageFromCfi(location.start.cfi);
            setProgress(newProgress);
        });
        
    }, [rendition, book, theme, currentLocation, addEpubLog]);

    // --- UI Actions ---
    const nextPage = () => rendition?.next();
    const prevPage = () => rendition?.prev();
    const changeTheme = (newTheme: string) => {
        setTheme(newTheme);
        rendition?.themes.select(newTheme);
    };
    const changeFontSize = (newSize: number) => {
        setFontSize(newSize);
        rendition?.themes.fontSize(`${newSize}%`);
    };

    // --- Bookmarks ---
    const addBookmark = () => {
        if (!rendition || !currentLocation) return;
        const newBookmark: Bookmark = {
            cfi: currentLocation,
            label: `Page ${Math.round(progress * 100)}%`,
            createdAt: new Date().toISOString()
        };
        const newBookmarks = [...bookmarks, newBookmark];
        setBookmarks(newBookmarks);
    };
    const removeBookmark = (cfi: string) => {
        setBookmarks(prev => prev.filter(b => b.cfi !== cfi));
    };
    const goToBookmark = (cfi: string) => {
        rendition?.display(cfi);
        setIsTocOpen(false);
    };
    
    // --- Time Tracking & Syncing ---
    useEffect(() => {
        const timer = setInterval(() => {
            setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const syncProgress = useCallback(async (isFinal = false) => {
        if (!currentUser || !debouncedLocation) return;
        
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
        
        if (secondsToAdd > 0 || isFinal) {
            updateReadingProgress(quest.id, currentUser.id, {
                secondsToAdd,
                sessionSeconds,
                locationCfi: debouncedLocation,
                bookmarks,
            });
            lastSyncTimeRef.current = now;
        }
    }, [currentUser, quest.id, updateReadingProgress, debouncedLocation, bookmarks, sessionSeconds]);
    
    useEffect(() => {
        const syncInterval = setInterval(() => syncProgress(), 30000); // Sync every 30s
        window.addEventListener('beforeunload', () => syncProgress(true));
        
        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('beforeunload', () => syncProgress(true));
            syncProgress(true); // Final sync on close
        };
    }, [syncProgress]);
    
    const totalSecondsRead = initialTotalSecondsRef.current + sessionSeconds;
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = Number(e.target.value) / 100;
        const location = book.locations.cfiFromPercentage(percentage);
        rendition.display(location);
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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'ArrowRight') nextPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900 z-[80] flex flex-col items-center justify-center pdf-container"
        >
            {/* Header */}
            <motion.header
                animate={{ y: isImmersive ? -100 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full p-3 flex justify-between items-center z-20 text-white bg-stone-800/80 backdrop-blur-sm flex-shrink-0"
            >
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsTocOpen(p => !p)} title="Table of Contents & Bookmarks"><BookOpen className="w-5 h-5"/></Button>
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => changeFontSize(Math.max(80, fontSize - 10))} title="Decrease Font Size">-A</Button>
                    <Button variant="ghost" size="icon" onClick={() => changeFontSize(Math.min(200, fontSize + 10))} title="Increase Font Size">+A</Button>
                    <Button variant="ghost" size="icon" onClick={() => changeTheme('light')} title="Light Theme"><SunIcon className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => changeTheme('dark')} title="Dark Theme"><MoonIcon className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" onClick={addBookmark} title="Add Bookmark"><BookmarkPlusIcon className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                    <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </motion.header>

            {/* Content & Loading */}
            <div className="flex-grow w-full min-h-0 relative">
                <div id="viewer" ref={viewerRef} className="w-full h-full" onClick={() => setIsImmersive(p => !p)} />
                 {isLoading && (
                    <div className="absolute inset-0 bg-stone-900/80 flex flex-col items-center justify-center gap-4 z-30">
                        {downloadProgress !== null ? (
                            <>
                                <div className="w-64 bg-stone-700 rounded-full h-2.5">
                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                                </div>
                                <p className="text-xl font-semibold text-white">Downloading eBook... {downloadProgress}%</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                                <p className="text-xl font-semibold text-white">Loading eBook...</p>
                            </>
                        )}
                    </div>
                )}
                {error && <p className="absolute inset-0 flex items-center justify-center text-red-400">{error}</p>}
                
                {/* TOC / Bookmarks Panel */}
                 <AnimatePresence>
                    {isTocOpen && (
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="absolute top-0 left-0 bottom-0 w-80 bg-stone-800/90 backdrop-blur-sm border-r border-stone-700 z-30 flex flex-col"
                        >
                            <h3 className="p-4 font-bold text-lg text-white border-b border-stone-700 flex-shrink-0">Contents</h3>
                            <div className="flex-grow overflow-y-auto">
                                <h4 className="p-2 text-sm font-semibold text-stone-300 bg-stone-700/50 sticky top-0">Table of Contents</h4>
                                {toc.map((item, index) => (
                                    <button key={index} onClick={() => goToBookmark(item.href)} className="block w-full text-left p-3 text-sm text-stone-300 hover:bg-emerald-800/50 truncate">
                                        {item.label}
                                    </button>
                                ))}
                                <h4 className="p-2 text-sm font-semibold text-stone-300 bg-stone-700/50 sticky top-0 mt-4">Bookmarks</h4>
                                {bookmarks.map(bm => (
                                    <button key={bm.cfi} onClick={() => goToBookmark(bm.cfi)} className="w-full text-left p-3 text-sm text-stone-300 hover:bg-emerald-800/50 flex justify-between items-center">
                                        <span className="truncate">{bm.label}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeBookmark(bm.cfi) }}><TrashIcon className="w-4 h-4"/></Button>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Footer */}
             <motion.footer
                animate={{ y: isImmersive ? 100 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full p-3 flex justify-between items-center gap-4 z-20 text-white bg-stone-800/80 backdrop-blur-sm flex-shrink-0 text-sm"
            >
                <div className="flex gap-4 w-1/3">
                    <div title="Session Time">S: {new Date(sessionSeconds * 1000).toISOString().substr(11, 8)}</div>
                    <div title="Total Time Read">T: {new Date(totalSecondsRead * 1000).toISOString().substr(11, 8)}</div>
                </div>
                <div className="flex-grow flex items-center gap-4">
                    <Button variant="secondary" size="icon" onClick={prevPage}><ChevronLeftIcon className="w-5 h-5"/></Button>
                    <div className="flex-grow flex items-center gap-2">
                        <span className="text-stone-400">{Math.round(progress * 100)}%</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress * 100}
                            onChange={handleProgressChange}
                            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <Button variant="secondary" size="icon" onClick={nextPage}><ChevronRightIcon className="w-5 h-5"/></Button>
                </div>
                <div className="w-1/3" />
            </motion.footer>
        </motion.div>
    );
};

export default EpubReaderPanel;