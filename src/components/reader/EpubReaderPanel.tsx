
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
// FIX: Imported missing icons BookmarkPlusIcon and TrashIcon.
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, MenuIcon, SettingsIcon, BookmarkIcon, BookmarkSolidIcon, SunIcon, MoonIcon, BookmarkPlusIcon, TrashIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';

declare global {
    interface Window {
        ePub: any;
    }
}

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);

    const viewerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<any>(null);
    const renditionRef = useRef<any>(null);

    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookTitle, setBookTitle] = useState('');
    const [toc, setToc] = useState<{ label: string, href: string }[]>([]);
    const [currentLocationCfi, setCurrentLocationCfi] = useState<string | null>(null);

    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'toc' | 'bookmarks'>('toc');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    
    // Reader Settings
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [fontSize, setFontSize] = useState(100); // in percent

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(0);

    const userProgress = useMemo(() => {
        if (!currentUser) return null;
        return liveQuest.readingProgress?.[currentUser.id];
    }, [liveQuest.readingProgress, currentUser]);

    const totalSecondsRead = useMemo(() => (userProgress?.totalSeconds || 0) + sessionSeconds, [userProgress, sessionSeconds]);
    const bookmarks = useMemo(() => userProgress?.bookmarks || [], [userProgress]);

    useEffect(() => {
        let isMounted = true;
        let checkInterval: number;

        const initReader = async () => {
            if (typeof window.ePub === 'undefined') {
                checkInterval = window.setInterval(async () => {
                    if (typeof window.ePub !== 'undefined') {
                        clearInterval(checkInterval);
                        await proceedWithInit();
                    }
                }, 100);
            } else {
                await proceedWithInit();
            }
        };
        
        const proceedWithInit = async () => {
            if (!viewerRef.current || !quest.epubUrl) {
                setError("Reader element or EPUB URL is not available.");
                return;
            }

            try {
                const book = window.ePub(quest.epubUrl);
                bookRef.current = book;

                const rendition = book.renderTo(viewerRef.current, {
                    width: "100%",
                    height: "100%",
                    flow: "paginated",
                    spread: "auto",
                });
                renditionRef.current = rendition;
                
                rendition.on("relocated", (location: any) => {
                    if (isMounted) {
                        setProgress(Math.round(location.start.percentage * 100));
                        setCurrentLocationCfi(location.start.cfi);
                    }
                });

                await book.ready;
                if (!isMounted) return;

                const meta = await book.loaded.metadata;
                setBookTitle(meta.title);

                const nav = await book.loaded.navigation;
                setToc(nav.toc);

                // Apply theme and font size
                rendition.themes.register("dark", { body: { color: "#d4d4d8", background: "#1c1917" } });
                rendition.themes.register("light", { body: { color: "#1c1917", background: "#fafaf9" } });
                rendition.themes.select(theme);
                rendition.themes.fontSize(`${fontSize}%`);

                await rendition.display();
                
                const savedLocation = userProgress?.locationCfi;
                if (savedLocation) {
                    rendition.display(savedLocation);
                }
                
                setIsReady(true);

            } catch (err) {
                 if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                    setError(`Could not load book: ${errorMessage}`);
                }
            }
        };
        
        initReader();

        return () => {
            isMounted = false;
            if (checkInterval) clearInterval(checkInterval);
            bookRef.current?.destroy();
        };
    }, [quest.epubUrl]);
    
    const syncProgress = useCallback(async (forceSync = false) => {
        if (!currentUser || !currentLocationCfi) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);

        if (secondsToAdd > 0 || forceSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, {
                    secondsToAdd,
                    locationCfi: currentLocationCfi,
                    bookmarks: bookmarks, // Always sync bookmarks
                });
                lastSyncTimeRef.current = now;
            } catch (e) { console.error("EPUB Sync failed:", e); }
        }
    }, [currentUser, quest.id, updateReadingProgress, currentLocationCfi, bookmarks]);

    // Time & Progress Syncing
    useEffect(() => {
        initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
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
    }, [quest.id, syncProgress, userProgress]);
    
    const handleNav = (href: string) => {
        renditionRef.current?.display(href);
        setIsPanelOpen(false);
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseInt(e.target.value, 10) / 100;
        const cfi = bookRef.current.locations.cfiFromPercentage(percentage);
        renditionRef.current?.display(cfi);
        setProgress(parseInt(e.target.value, 10));
    };

    const handleAddBookmark = () => {
        if (!currentUser || !currentLocationCfi) return;
        const newBookmark: Bookmark = {
            cfi: currentLocationCfi,
            label: `Page at ${progress}%`,
            progress: progress,
        };
        updateReadingProgress(quest.id, currentUser.id, { bookmarks: [...bookmarks, newBookmark] });
    };

    const handleRemoveBookmark = (cfi: string) => {
        if (!currentUser) return;
        updateReadingProgress(quest.id, currentUser.id, { bookmarks: bookmarks.filter(b => b.cfi !== cfi) });
    };
    
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        renditionRef.current?.themes.select(newTheme);
    };

    const handleFontSizeChange = (size: number) => {
        setFontSize(size);
        renditionRef.current?.themes.fontSize(`${size}%`);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div className="fixed inset-0 bg-stone-900 z-[80] flex flex-col">
            <header className="p-3 flex justify-between items-center z-20 text-white bg-stone-800 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(p => !p)} title="Table of Contents"><MenuIcon className="w-6 h-6"/></Button>
                <div className="truncate text-center">
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                    <p className="text-sm text-stone-300 truncate">{bookTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Button ref={settingsButtonRef} variant="ghost" size="icon" onClick={() => setIsSettingsOpen(p => !p)} title="Settings"><SettingsIcon className="w-6 h-6"/></Button>
                        {isSettingsOpen && (
                             <div className="absolute bottom-full right-0 mb-2 w-60 bg-stone-700 p-4 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                                <h4 className="font-bold text-sm mb-2">Theme</h4>
                                <div className="flex gap-2 mb-4">
                                    <Button onClick={() => handleThemeChange('light')} variant={theme === 'light' ? 'default' : 'secondary'} size="sm" className="flex-1"><SunIcon className="w-4 h-4 mr-1"/> Light</Button>
                                    <Button onClick={() => handleThemeChange('dark')} variant={theme === 'dark' ? 'default' : 'secondary'} size="sm" className="flex-1"><MoonIcon className="w-4 h-4 mr-1"/> Dark</Button>
                                </div>
                                <h4 className="font-bold text-sm mb-2">Font Size ({fontSize}%)</h4>
                                <input type="range" min="80" max="200" step="10" value={fontSize} onChange={e => handleFontSizeChange(parseInt(e.target.value))} className="w-full" />
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setReadingQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </header>
            
            <div className="flex-grow relative min-h-0">
                <div ref={viewerRef} className="h-full w-full epub-container" />
                {!isReady && <div className="absolute inset-0 bg-stone-900/90 z-40 flex flex-col items-center justify-center gap-4 p-8">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                    <p className="text-xl font-semibold text-white">{error || 'Preparing Reader...'}</p>
                </div>}
            </div>

            <footer className="p-3 flex justify-between items-center z-20 text-white bg-stone-800 text-sm flex-shrink-0">
                <div className="w-1/4">
                    <p title="Total Time Read">Total: {formatTime(Math.floor(totalSecondsRead))}</p>
                    <p title="Current Session Time">Session: {formatTime(sessionSeconds)}</p>
                </div>
                <div className="w-1/2 flex items-center justify-center gap-4">
                    <Button variant="ghost" onClick={() => renditionRef.current?.prev()} disabled={!isReady}><ChevronLeftIcon className="w-5 h-5"/> Prev</Button>
                    <input type="range" min="0" max="100" value={progress} onChange={handleProgressChange} disabled={!isReady} className="w-full" />
                    <Button variant="ghost" onClick={() => renditionRef.current?.next()} disabled={!isReady}>Next <ChevronRightIcon className="w-5 h-5"/></Button>
                </div>
                <div className="w-1/4 text-right">
                    <span className="font-semibold">{isReady ? `${progress}%` : '--%'}</span>
                </div>
            </footer>
            
            {/* Side Panel */}
            <div className={`fixed top-0 left-0 h-full z-30 transition-transform duration-300 ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-72 h-full bg-stone-800 shadow-xl flex flex-col">
                    <div className="p-4 border-b border-stone-700">
                        <div className="flex justify-center gap-2">
                           <Button onClick={() => setActiveTab('toc')} variant={activeTab === 'toc' ? 'default' : 'secondary'} className="flex-1">Contents</Button>
                           <Button onClick={() => setActiveTab('bookmarks')} variant={activeTab === 'bookmarks' ? 'default' : 'secondary'} className="flex-1">Bookmarks</Button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {activeTab === 'toc' && (
                            <ul>{toc.map((item, i) => <li key={i}><button onClick={() => handleNav(item.href)} className="w-full text-left p-3 text-stone-300 hover:bg-stone-700">{item.label}</button></li>)}</ul>
                        )}
                         {activeTab === 'bookmarks' && (
                            <div className="p-4 space-y-3">
                                <Button onClick={handleAddBookmark} className="w-full"><BookmarkPlusIcon className="w-5 h-5 mr-2"/> Add Current Page</Button>
                                {bookmarks.map((bm, i) => (
                                    <div key={i} className="group p-2 bg-stone-700/50 rounded-md flex justify-between items-center">
                                        <button onClick={() => handleNav(bm.cfi)} className="text-left flex-grow">
                                            <p className="text-stone-200">{bm.label}</p>
                                        </button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveBookmark(bm.cfi)}>
                                            <TrashIcon className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isPanelOpen && <div className="fixed inset-0 bg-black/60 z-20" onClick={() => setIsPanelOpen(false)}></div>}
        </div>
    );
};

export default EpubReaderPanel;
