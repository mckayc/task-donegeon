
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, SettingsIcon, SunIcon, MoonIcon, BookmarkSolidIcon, TrashIcon, BookmarkPlusIcon, ZoomIn, ZoomOut, MenuIcon, ChevronLeftIcon, ChevronRightIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

declare global {
  interface Window {
    ePub: any;
  }
}

interface EpubReaderPanelProps {
  quest: Quest;
}

interface TocItem {
    label: string;
    href: string;
    subitems: TocItem[];
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { addNotification } = useNotificationsDispatch();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);

    const bookRef = useRef<any>(null);
    const renditionRef = useRef<any>(null);
    const viewerElementRef = useRef<HTMLDivElement>(null);

    const [isViewerReady, setIsViewerReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [toc, setToc] = useState<TocItem[]>([]);
    const [currentLocationCfi, setCurrentLocationCfi] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookTitle, setBookTitle] = useState('');
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    
    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState<'toc' | 'bookmarks'>('toc');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('epubTheme') as 'light' | 'dark' || 'dark');
    const [fontSize, setFontSize] = useState(() => {
        const savedSize = localStorage.getItem('epubFontSize');
        return savedSize ? parseInt(savedSize, 10) : 100;
    });

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    
    const userProgress = useMemo(() => {
        if (!currentUser) return null;
        return liveQuest.readingProgress?.[currentUser.id];
    }, [liveQuest.readingProgress, currentUser]);

    const totalSecondsRead = useMemo(() => (userProgress?.totalSeconds || 0) + sessionSeconds, [userProgress, sessionSeconds]);

    useEffect(() => {
        const initEpub = async () => {
            if (!quest.epubUrl || !viewerElementRef.current || !window.ePub) {
                if (!window.ePub) setError("EPUB.js library not found.");
                return;
            }

            try {
                const response = await fetch(quest.epubUrl);
                if (!response.ok) throw new Error('Failed to fetch EPUB file.');
                const bookData = await response.arrayBuffer();

                const book = window.ePub(bookData);
                bookRef.current = book;

                const rendition = book.renderTo(viewerElementRef.current, {
                    width: '100%',
                    height: '100%',
                    flow: 'paginated',
                    spread: 'auto',
                });
                renditionRef.current = rendition;

                await book.ready;
                await book.locations.generate(1650); // Generate locations for progress calculation

                setBookTitle(book.package.metadata.title);
                setToc(book.navigation.toc);
                setBookmarks(userProgress?.bookmarks || []);
                
                rendition.on('relocated', (location: any) => {
                    setProgress(Math.round(book.locations.percentageFromCfi(location.start.cfi) * 100));
                    setCurrentLocationCfi(location.start.cfi);
                });

                if (userProgress?.locationCfi) {
                    rendition.display(userProgress.locationCfi);
                } else {
                    rendition.display();
                }

                setIsViewerReady(true);
            } catch (err) {
                console.error("Error loading EPUB:", err);
                setError(err instanceof Error ? err.message : "Failed to load book.");
            } finally {
                setIsLoading(false);
            }
        };

        initEpub();

        return () => {
            bookRef.current?.destroy();
        };
    }, [quest.epubUrl, userProgress]);

    useEffect(() => {
        const rendition = renditionRef.current;
        if (!rendition) return;

        rendition.themes.register('dark', { 'body': { 'background-color': '#1c1917', 'color': '#e7e5e4' } });
        rendition.themes.register('light', { 'body': { 'background-color': '#f5f5f4', 'color': '#1c1917' } });
        rendition.themes.select(theme);
        rendition.themes.fontSize(`${fontSize}%`);
        
        localStorage.setItem('epubTheme', theme);
        localStorage.setItem('epubFontSize', String(fontSize));
    }, [theme, fontSize, isViewerReady]);
    
    // Time & Progress Syncing
    useEffect(() => {
        sessionStartTimeRef.current = Date.now();
        lastSyncTimeRef.current = Date.now();
        setSessionSeconds(0);
        const timer = setInterval(() => setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000)), 1000);
        
        const syncInterval = setInterval(() => syncProgress(false), 30000);
        const handleUnload = () => syncProgress(true);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(timer);
            clearInterval(syncInterval);
            window.removeEventListener('beforeunload', handleUnload);
            syncProgress(true);
        };
    }, [quest.id]);

    const syncProgress = useCallback(async (forceSync = false, bookmarksToSync: Bookmark[] = bookmarks) => {
        if (!currentUser || !currentLocationCfi) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);

        if (secondsToAdd > 0 || forceSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, {
                    secondsToAdd,
                    locationCfi: currentLocationCfi,
                    bookmarks: bookmarksToSync,
                });
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("EPUB Sync failed:", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, currentLocationCfi, bookmarks]);
    
    const isBookmarked = useMemo(() => !!(currentLocationCfi && bookmarks.some(b => b.cfi === currentLocationCfi)), [currentLocationCfi, bookmarks]);

    const addBookmark = async () => {
        if (currentLocationCfi && !isBookmarked && bookRef.current) {
            const newBookmark: Bookmark = { 
                cfi: currentLocationCfi, 
                label: `Page at ${progress}%`, 
                progress: progress 
            };
            const newBookmarks = [...bookmarks, newBookmark];
            setBookmarks(newBookmarks);
            syncProgress(false, newBookmarks);
            addNotification({ type: 'success', message: 'Bookmark added!' });
        }
    };

    const removeBookmark = (cfi: string) => {
        const newBookmarks = bookmarks.filter(bm => bm.cfi !== cfi);
        setBookmarks(newBookmarks);
        syncProgress(false, newBookmarks);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseInt(e.target.value) / 100;
        const cfi = bookRef.current.locations.cfiFromPercentage(percentage);
        renditionRef.current.display(cfi);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    const TocComponent: React.FC<{ items: TocItem[] }> = ({ items }) => (
        <ul className="space-y-1">
            {items.map(item => (
                <li key={item.href}>
                    <button onClick={() => { renditionRef.current.display(item.href); setIsPanelOpen(false); }} className="w-full text-left p-2 rounded hover:bg-stone-700/50 text-stone-300">
                        {item.label}
                    </button>
                    {item.subitems.length > 0 && <div className="pl-4"><TocComponent items={item.subitems} /></div>}
                </li>
            ))}
        </ul>
    );
    
    return (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center epub-container">
            <div className="w-full h-full bg-stone-800 shadow-2xl relative flex flex-col">
                <header className="epub-reader-header p-3 flex justify-between items-center z-20 text-white flex-shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(p => !p)} title="Table of Contents"><MenuIcon className="w-5 h-5"/></Button>
                        <div className="truncate">
                            <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                            <p className="text-sm text-stone-300 truncate">{bookTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={addBookmark} title={isBookmarked ? "Already Bookmarked" : "Add Bookmark"} disabled={isBookmarked || !isViewerReady}>
                            {isBookmarked ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400" /> : <BookmarkPlusIcon className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(p => !p)} title="Settings"><SettingsIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => setReadingQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                    </div>
                </header>

                <div className="flex-grow relative min-h-0">
                    {isLoading && (
                        <div className="absolute inset-0 bg-stone-900/80 z-40 flex flex-col items-center justify-center gap-4 p-8">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                            <p className="text-white mt-4">{error || "Preparing Reader..."}</p>
                        </div>
                    )}
                    <div id="viewer" ref={viewerElementRef} className="h-full w-full" />

                    <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full" onClick={() => renditionRef.current?.prev()}>
                        <ChevronLeftIcon />
                    </Button>
                    <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full" onClick={() => renditionRef.current?.next()}>
                        <ChevronRightIcon />
                    </Button>
                </div>
                
                <AnimatePresence>
                    {isPanelOpen && (
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="absolute top-0 left-0 bottom-0 w-80 bg-stone-800/95 border-r border-stone-700/60 z-30 flex flex-col shadow-2xl">
                            <div className="p-4 border-b border-stone-700/60 flex-shrink-0">
                                <div className="flex p-1 bg-stone-700/50 rounded-lg">
                                    <button onClick={() => setPanelTab('toc')} className={`flex-1 p-2 rounded text-sm font-semibold ${panelTab === 'toc' ? 'bg-emerald-600 text-white' : 'text-stone-300'}`}>Table of Contents</button>
                                    <button onClick={() => setPanelTab('bookmarks')} className={`flex-1 p-2 rounded text-sm font-semibold ${panelTab === 'bookmarks' ? 'bg-emerald-600 text-white' : 'text-stone-300'}`}>Bookmarks</button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4">
                                {panelTab === 'toc' && <TocComponent items={toc} />}
                                {panelTab === 'bookmarks' && (
                                    <ul className="space-y-2">
                                        {bookmarks.map(bm => (
                                            <li key={bm.cfi} className="text-sm hover:bg-stone-700/50 p-2 rounded-md flex justify-between items-center gap-2">
                                                <button onClick={() => { renditionRef.current.display(bm.cfi); setIsPanelOpen(false); }} className="text-left flex-grow overflow-hidden">
                                                    <p className="text-stone-300 flex-grow truncate">{bm.label}</p>
                                                    <span className="text-xs text-stone-400 mt-1 block">At {bm.progress}%</span>
                                                </button>
                                                <Button variant="ghost" size="icon" onClick={() => removeBookmark(bm.cfi)} className="h-6 w-6 text-red-400 hover:text-red-300 flex-shrink-0"><TrashIcon className="w-4 h-4"/></Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isSettingsOpen && (
                     <div className="absolute top-16 right-4 bg-stone-800/90 border border-stone-600 shadow-lg rounded-md p-4 w-60 z-30 text-white space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Theme</h3>
                            <div className="flex justify-around">
                                <button onClick={() => setTheme('light')} className={`p-2 rounded-md w-24 text-center border-2 ${theme === 'light' ? 'border-emerald-400' : 'border-transparent'}`}>
                                    <div className="w-full h-12 mx-auto rounded bg-stone-100 flex items-center justify-center mb-1"><SunIcon className="w-5 h-5 text-stone-900"/></div>
                                    <span className="text-xs">Light</span>
                                </button>
                                <button onClick={() => setTheme('dark')} className={`p-2 rounded-md w-24 text-center border-2 ${theme === 'dark' ? 'border-emerald-400' : 'border-transparent'}`}>
                                    <div className="w-full h-12 mx-auto rounded bg-stone-900 flex items-center justify-center mb-1"><MoonIcon className="w-5 h-5 text-stone-100"/></div>
                                     <span className="text-xs">Dark</span>
                                </button>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Font Size</h3>
                            <div className="flex justify-around items-center">
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setFontSize(s => Math.max(80, s - 10))}><ZoomOut className="w-4 h-4" /></Button>
                                <span className="font-mono">{fontSize}%</span>
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setFontSize(s => Math.min(200, s + 10))}><ZoomIn className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </div>
                )}

                <footer className="epub-reader-footer p-3 flex justify-between items-center z-20 text-white text-sm flex-shrink-0">
                     <div className="flex gap-4 w-1/4">
                        <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                        <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor(totalSecondsRead))}</div>
                     </div>
                     <div className="flex-grow flex items-center gap-3 px-4">
                        <input type="range" min="0" max="100" value={progress} onChange={handleSliderChange} className="epub-progress-slider w-full" disabled={!isViewerReady} />
                        <span className="font-semibold w-12 text-right">{progress}%</span>
                     </div>
                     <div className="w-1/4" />
                </footer>
            </div>
        </div>
    );
};

export default EpubReaderPanel;
