
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Import Bookmark type from shared types.
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, SettingsIcon, SunIcon, MoonIcon, BookmarkSolidIcon, TrashIcon, BookmarkPlusIcon, ZoomIn, ZoomOut, MenuIcon, BookmarkIcon as BookmarkOutlineIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

declare var WebpubViewer: any;

interface EpubReaderPanelProps {
  quest: Quest;
}

// FIX: Removed local Bookmark interface definition. It is now imported from shared types.
interface TocItem {
    title: string;
    href: string;
    children: TocItem[];
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { addNotification } = useNotificationsDispatch();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);

    const viewerRef = useRef<any>(null);
    const viewerElementRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [toc, setToc] = useState<TocItem[]>([]);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
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

    // Initialize Viewer
    useEffect(() => {
        if (!viewerElementRef.current || !quest.epubUrl) return;
        let viewer: any;
        const init = async () => {
            viewer = new WebpubViewer(viewerElementRef.current, {
                bookUrl: quest.epubUrl,
                proxyUrl: "https://cors-anywhere.herokuapp.com/", // Required for some EPUBs
            });
            viewerRef.current = viewer;

            viewer.on('location', (locationData: any) => {
                setCurrentLocation(locationData);
                setProgress(Math.round(locationData.progress * 100));
            });

            viewer.on('toc', (tocData: TocItem[]) => setToc(tocData));

            viewer.on('error', (error: any) => {
                console.error("Reader Error:", error);
                addNotification({ type: 'error', message: 'Failed to load the book.' });
                setReadingQuest(null);
            });

            await viewer.start();
            setBookTitle(viewer.publication.metadata.title);
            
            const savedLocation = userProgress?.locationCfi;
            if (savedLocation) viewer.goTo(savedLocation);
            
            // FIX: The `userProgress.bookmarks` type now matches the `Bookmark[]` state type.
            setBookmarks(userProgress?.bookmarks || []);
            setIsLoading(false);
        };

        init();
        return () => viewer?.destroy();
    }, [quest.epubUrl]);

    // Apply Theme & Font Size
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        viewer.setProps({
            theme: theme === 'dark' ? 'sepia-mode' : 'day-mode',
            fontSize: `${fontSize}%`,
        });
    }, [theme, fontSize]);

    // Time & Progress Syncing
    useEffect(() => {
        sessionStartTimeRef.current = Date.now();
        lastSyncTimeRef.current = Date.now();
        setSessionSeconds(0);
        const timer = setInterval(() => setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000)), 1000);
        return () => clearInterval(timer);
    }, [quest.id]);

    const syncProgress = useCallback(async (forceSync = false, bookmarksToSync: Bookmark[] = bookmarks) => {
        if (!currentUser || !currentLocation) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);

        const shouldSync = (secondsToAdd > 0) || forceSync;
        if (shouldSync) {
            try {
                // FIX: `updateReadingProgress` now correctly expects `Bookmark[]` for `bookmarksToSync`.
                await updateReadingProgress(quest.id, currentUser.id, {
                    secondsToAdd,
                    locationCfi: currentLocation.href,
                    bookmarks: bookmarksToSync,
                });
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("Sync failed:", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, currentLocation, bookmarks]);

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

    const handleClose = () => setReadingQuest(null);
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (viewerRef.current) {
            viewerRef.current.goTo({ percentage: parseInt(e.target.value) / 100 });
        }
    };
    
    const isBookmarked = useMemo(() => !!(currentLocation && bookmarks.some(b => b.href === currentLocation.href)), [currentLocation, bookmarks]);

    const addBookmark = async () => {
        if (currentLocation && !isBookmarked && viewerRef.current) {
            const label = await viewerRef.current.getLabel(currentLocation);
            const newBookmark: Bookmark = { href: currentLocation.href, label: `Chapter: ${label}`, progress: Math.round(currentLocation.progress * 100) };
            const newBookmarks = [...bookmarks, newBookmark];
            setBookmarks(newBookmarks);
            syncProgress(false, newBookmarks);
            addNotification({ type: 'success', message: 'Bookmark added!' });
        }
    };

    const removeBookmark = (href: string) => {
        const newBookmarks = bookmarks.filter(bm => bm.href !== href);
        setBookmarks(newBookmarks);
        syncProgress(false, newBookmarks);
    };

    const TocComponent: React.FC<{ items: TocItem[] }> = ({ items }) => (
        <ul className="space-y-1">
            {items.map(item => (
                <li key={item.href}>
                    <button onClick={() => { viewerRef.current.goTo(item.href); setIsPanelOpen(false); }} className="w-full text-left p-2 rounded hover:bg-stone-700/50 text-stone-300">
                        {item.title}
                    </button>
                    {item.children.length > 0 && <div className="pl-4"><TocComponent items={item.children} /></div>}
                </li>
            ))}
        </ul>
    );
    
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

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
                        <Button variant="ghost" size="icon" onClick={addBookmark} title={isBookmarked ? "Already Bookmarked" : "Add Bookmark"} disabled={isBookmarked}>
                            {isBookmarked ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400" /> : <BookmarkPlusIcon className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(p => !p)} title="Settings"><SettingsIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={handleClose} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                    </div>
                </header>

                <div className="flex-grow relative min-h-0">
                    {isLoading && (
                        <div className="absolute inset-0 bg-stone-900/80 z-40 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                            <p className="text-xl font-semibold text-white">Preparing Reader...</p>
                        </div>
                    )}
                    <div ref={viewerElementRef} className="h-full w-full" />
                </div>
                
                <AnimatePresence>
                    {isPanelOpen && (
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="absolute top-0 left-0 bottom-0 w-80 bg-stone-800/95 border-r border-stone-700/60 z-30 flex flex-col shadow-2xl"
                        >
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
                                            <li key={bm.href} className="text-sm hover:bg-stone-700/50 p-2 rounded-md flex justify-between items-center gap-2">
                                                <button onClick={() => { viewerRef.current.goTo(bm.href); setIsPanelOpen(false); }} className="text-left flex-grow overflow-hidden">
                                                    <p className="text-stone-300 flex-grow truncate">{bm.label}</p>
                                                    <span className="text-xs text-stone-400 mt-1 block">At {bm.progress}%</span>
                                                </button>
                                                <Button variant="ghost" size="icon" onClick={() => removeBookmark(bm.href)} className="h-6 w-6 text-red-400 hover:text-red-300 flex-shrink-0"><TrashIcon className="w-4 h-4"/></Button>
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
                        <input type="range" min="0" max="100" value={progress} onChange={handleSliderChange} className="epub-progress-slider w-full" disabled={isLoading} />
                        <span className="font-semibold w-12 text-right">{progress}%</span>
                     </div>
                     <div className="w-1/4" />
                </footer>
            </div>
        </div>
    );
};

export default EpubReaderPanel;
