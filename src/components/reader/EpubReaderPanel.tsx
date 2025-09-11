
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// @ts-ignore
import epub, { Book, Rendition, NavItem } from 'epubjs';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, Sun, Moon, PlusIcon, Minus, MenuIcon, Bookmark as BookmarkIcon, BookmarkPlus, TrashIcon, BookOpen, Minimize, Maximize } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../user-interface/Input';

const EPUB_CACHE_NAME = 'epub-cache-v1';

interface EpubReaderPanelProps {
  quest: Quest;
}

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}m`;
};

export const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { addNotification } = useNotificationsDispatch();
    
    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);
    const userProgress = useMemo(() => currentUser ? liveQuest.readingProgress?.[currentUser.id] : undefined, [liveQuest, currentUser]);
    
    const panelRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing Reader...');
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [error, setError] = useState<{ userMessage: string; technicalMessage: string } | null>(null);
    
    const [locations, setLocations] = useState<any[]>([]);
    const [toc, setToc] = useState<NavItem[]>([]);
    const [currentLocation, setCurrentLocation] = useState<any | null>(null);

    const [theme, setTheme] = useState<'light' | 'dark'>(userProgress?.theme as 'light' | 'dark' || 'light');
    const [fontSize, setFontSize] = useState(userProgress?.fontSize || 100);

    const [isImmersiveMode, setIsImmersiveMode] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

    const [bookmarks, setBookmarks] = useState<Bookmark[]>(userProgress?.bookmarks || []);

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(0);

    useEffect(() => {
        initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
    }, [quest.id, userProgress]);

    const totalSecondsRead = useMemo(() => initialTotalSecondsRef.current + sessionSeconds, [sessionSeconds]);

    const debouncedLocation = useDebounce(currentLocation, 2000);
    const debouncedBookmarks = useDebounce(bookmarks, 5000);

    const syncProgress = useCallback(async (forceSync = false) => {
        if (!currentUser || !debouncedLocation?.start?.cfi) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
        
        const dataToSync: any = {
            locationCfi: debouncedLocation.start.cfi,
            bookmarks: debouncedBookmarks,
            fontSize,
            theme,
            sessionSeconds,
        };
        if (secondsToAdd > 0) {
            dataToSync.secondsToAdd = secondsToAdd;
        }
        
        const shouldSync = dataToSync.secondsToAdd > 0 || forceSync;

        if (shouldSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, dataToSync);
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("ePub Sync failed, not updating lastSyncTimeRef", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, debouncedLocation, debouncedBookmarks, fontSize, theme, sessionSeconds]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSessionSeconds(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
        }, 1000);

        const syncInterval = setInterval(() => syncProgress(false), 30000);
        const handleUnload = () => syncProgress(true);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(timer);
            clearInterval(syncInterval);
            window.removeEventListener('beforeunload', handleUnload);
            syncProgress(true); // Final sync on close
        };
    }, [syncProgress]);
    
    const getCachedBook = async (url: string) => {
        try {
            const cache = await caches.open(EPUB_CACHE_NAME);
            const response = await cache.match(url);
            if (response) {
                return response.arrayBuffer();
            }
        } catch (e) {
            console.warn("Could not access cache:", e);
        }
        return null;
    };

    const cacheBook = async (url: string) => {
        setLoadingMessage('Downloading eBook for offline access...');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download eBook file.');

        const contentLength = response.headers.get('content-length');
        if (!contentLength) return response.arrayBuffer(); // No progress info

        const total = parseInt(contentLength, 10);
        let loaded = 0;
        
        const reader = response.body!.getReader();
        const chunks = [];
        
        while(true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            setDownloadProgress((loaded / total) * 100);
        }
        
        const blob = new Blob(chunks);
        const cacheResponse = new Response(blob, { headers: response.headers });
        try {
            const cache = await caches.open(EPUB_CACHE_NAME);
            await cache.put(url, cacheResponse);
        } catch (e) {
            console.warn("Could not write to cache:", e);
        }
        
        setDownloadProgress(null);
        return blob.arrayBuffer();
    };

    useEffect(() => {
        if (!quest.epubUrl || !viewerRef.current) return;
        const viewerElement = viewerRef.current;
        let book: Book;

        const initializeReader = async () => {
            try {
                setLoadingMessage('Checking local cache...');
                let bookData = await getCachedBook(quest.epubUrl!);
                if (!bookData) {
                    bookData = await cacheBook(quest.epubUrl!);
                }

                setLoadingMessage('Unpacking eBook...');
                book = epub(bookData);
                bookRef.current = book;

                setLoadingMessage('Preparing pages...');
                const rendition = book.renderTo(viewerElement, {
                    width: '100%', height: '100%', spread: 'auto', allowScriptedContent: true
                });
                renditionRef.current = rendition;

                rendition.themes.register('light', { body: { color: '#333', 'background-color': '#fafafa' } });
                rendition.themes.register('dark', { body: { color: '#fafafa', 'background-color': '#1c1917' } });
                rendition.themes.select(theme);
                rendition.themes.fontSize(`${fontSize}%`);

                rendition.on('relocated', (location: any) => setCurrentLocation(location));
                
                await book.ready;
                setLoadingMessage('Generating table of contents...');
                if (book.navigation.toc) setToc(book.navigation.toc);
                
                setLoadingMessage('Calculating page locations...');
                setLocations(await book.locations.generate(1024));
                
                const initialLocation = userProgress?.locationCfi || undefined;
                setLoadingMessage('Rendering page...');
                await rendition.display(initialLocation);

                setIsLoading(false);

            } catch (err) {
                console.error("ePub reader error:", err);
                const technicalMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                const userMessage = "This eBook could not be opened. It might be corrupted, use an unsupported format, or contain complex features the reader can't handle.";
                setError({ userMessage, technicalMessage });
                setIsLoading(false);
            }
        };
        
        initializeReader();

        return () => {
            bookRef.current?.destroy();
            renditionRef.current?.destroy();
        };
    }, [quest.epubUrl, fontSize, theme, userProgress, addNotification]);

    const navigate = (direction: 'next' | 'prev') => renditionRef.current?.[direction]();
    const goTo = (href: string) => { renditionRef.current?.display(href); };
    const changeFontSize = (newSize: number) => {
        const clampedSize = Math.max(80, Math.min(200, newSize));
        setFontSize(clampedSize);
        renditionRef.current?.themes.fontSize(`${clampedSize}%`);
    };
    const changeTheme = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        renditionRef.current?.themes.select(newTheme);
    };

    const handleAddBookmark = async () => {
        if (!currentLocation || !bookRef.current) return;
        const cfi = currentLocation.start.cfi;
        const bookContent = bookRef.current.spine.get(cfi);
        if (!bookContent) return;

        try {
            const doc = await bookContent.load(bookRef.current.load.bind(bookRef.current));
            const textContent = doc.body.textContent?.trim().substring(0, 100) + '...';
            const newBookmark: Bookmark = {
                label: `Page ${currentLocation.start.displayed.page} - ${textContent}`,
                cfi: cfi,
                createdAt: new Date().toISOString(),
            };
            setBookmarks(prev => [...prev.filter(b => b.cfi !== cfi), newBookmark]);
            addNotification({ type: 'success', message: 'Bookmark added!' });
        } catch (error) {
            console.error("Error creating bookmark:", error);
            addNotification({ type: 'error', message: 'Could not create bookmark.' });
        }
    };
    const handleRemoveBookmark = (cfi: string) => setBookmarks(prev => prev.filter(b => b.cfi !== cfi));
    
    const progressPercent = useMemo(() => {
        if (!bookRef.current?.locations?.percentageFromCfi || !currentLocation || !locations.length) return 0;
        return bookRef.current.locations.percentageFromCfi(currentLocation.start.cfi) * 100;
    }, [currentLocation, locations]);

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseFloat(e.target.value);
        if (bookRef.current?.locations) {
            const cfi = bookRef.current.locations.cfiFromPercentage(percentage / 100);
            goTo(cfi);
        }
    };

    const toggleFullscreen = () => {
        const elem = panelRef.current;
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
    
    const renderToc = (items: NavItem[], level = 0) => (
        <ul className={level > 0 ? 'pl-4' : ''}>
            {items.map((item, index) => (
                <li key={index}>
                    <button onClick={() => { goTo(item.href); setTimeout(() => setIsTocOpen(false), 150); }} className="w-full text-left py-2 px-4 hover:bg-emerald-800/50 rounded-md">
                        {item.label}
                    </button>
                    {item.subitems && item.subitems.length > 0 && renderToc(item.subitems, level + 1)}
                </li>
            ))}
        </ul>
    );
    
    return (
        <div ref={panelRef} className="fixed inset-0 bg-stone-900 z-[80] flex flex-col">
            {/* Header */}
            <header className={`absolute top-0 left-0 right-0 p-2 flex justify-between items-center z-20 text-white bg-stone-800/80 backdrop-blur-sm transition-transform duration-300 ${!isImmersiveMode ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsTocOpen(p => !p)} title="Table of Contents"><MenuIcon className="w-5 h-5"/></Button>
                    <h3 className="font-bold text-lg truncate max-w-xs">{quest.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsImmersiveMode(p => !p)} title="Immersive Mode"><BookOpen className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsBookmarksOpen(p => !p)} title="Bookmarks"><BookmarkIcon className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(p => !p)} title="Settings"><span className="font-bold text-lg">Aa</span></Button>
                    <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </header>
            
            {/* Main Content */}
            <main className={`absolute inset-0 transition-all duration-300 ${!isImmersiveMode ? 'pt-14 pb-20' : 'pt-0 pb-0'}`} onClick={() => {setIsTocOpen(false); setIsSettingsOpen(false); setIsBookmarksOpen(false);}}>
                <div ref={viewerRef} className="w-full h-full" id="epub-viewer"/>
                {(isLoading || error) && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8 text-center bg-stone-900/90">
                        {isLoading && (
                            <>
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                                <p className="text-xl font-semibold text-white mt-4">{loadingMessage}</p>
                                {downloadProgress !== null && (
                                    <div className="w-64 mt-2 bg-stone-700 rounded-full h-2.5">
                                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                                    </div>
                                )}
                            </>
                        )}
                        {error && (
                            <>
                                <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                                <h3 className="text-2xl font-bold text-red-400 mb-2">Error Loading eBook</h3>
                                <p className="text-stone-300 max-w-md">{error.userMessage}</p>
                                <p className="text-stone-400 text-sm mt-4">For the best compatibility, we recommend validating your ePub file with a tool like the
                                    <a href="https://www.w3.org/publishing/epubcheck/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">
                                        official EPUBCheck validator
                                    </a>.
                                </p>
                                <details className="mt-4 text-left w-full max-w-md bg-stone-800/50 p-3 rounded-lg">
                                    <summary className="cursor-pointer text-stone-400 text-sm">Technical Details</summary>
                                    <pre className="mt-2 text-xs text-red-300 whitespace-pre-wrap font-mono">
                                        {error.technicalMessage}
                                    </pre>
                                </details>
                            </>
                        )}
                    </div>
                )}
                <Button variant="ghost" onClick={() => navigate('prev')} className="absolute left-0 top-0 bottom-0 w-1/5 z-10 flex items-center justify-start p-4 text-white/20 hover:text-white/80 transition-colors"><ChevronLeftIcon className="w-12 h-12"/></Button>
                <Button variant="ghost" onClick={() => navigate('next')} className="absolute right-0 top-0 bottom-0 w-1/5 z-10 flex items-center justify-end p-4 text-white/20 hover:text-white/80 transition-colors"><ChevronRightIcon className="w-12 h-12"/></Button>
            </main>

            {/* Footer */}
            <footer className={`absolute bottom-0 left-0 right-0 p-2 flex flex-col z-20 text-white bg-stone-800/80 backdrop-blur-sm transition-transform duration-300 ${!isImmersiveMode ? 'translate-y-0' : 'translate-y-full'}`}>
                 <div className="flex items-center gap-4 text-xs font-mono w-full">
                    <span>{progressPercent.toFixed(1)}%</span>
                    <input type="range" min="0" max="100" step="0.1" value={progressPercent} onChange={handleProgressChange} className="flex-grow"/>
                    <span>Page {currentLocation?.start?.displayed?.page || '?'} / {currentLocation?.start?.displayed?.total || '?'}</span>
                </div>
                <div className="text-center text-xs font-mono text-stone-400">
                    Session: {formatTime(sessionSeconds)} | Total Read: {formatTime(totalSecondsRead)}
                </div>
            </footer>
            
            {/* Side Panels */}
            {isTocOpen && <div className="absolute inset-0 bg-black/50 z-30" onClick={() => setIsTocOpen(false)} />}
            <div className={`absolute top-0 left-0 h-full bg-stone-900 border-r border-stone-700/60 z-40 transition-transform duration-300 ${isTocOpen ? 'translate-x-0' : '-translate-x-full'} w-80 flex flex-col`}>
                <h3 className="font-bold text-lg p-4 flex-shrink-0">Table of Contents</h3>
                <div className="flex-grow overflow-y-auto text-stone-300">{renderToc(toc)}</div>
            </div>

            {isSettingsOpen && <div className="absolute inset-0 bg-black/50 z-30" onClick={() => setIsSettingsOpen(false)} />}
            <div className={`absolute top-0 right-0 h-full bg-stone-900 border-l border-stone-700/60 z-40 transition-transform duration-300 ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'} w-80 p-4 space-y-4`}>
                <h3 className="font-bold text-lg">Display Settings</h3>
                <div className="flex justify-around items-center">
                    <Button variant={theme === 'light' ? 'default' : 'secondary'} onClick={() => changeTheme('light')}><Sun className="w-5 h-5 mr-2"/> Light</Button>
                    <Button variant={theme === 'dark' ? 'default' : 'secondary'} onClick={() => changeTheme('dark')}><Moon className="w-5 h-5 mr-2"/> Dark</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="icon" onClick={() => changeFontSize(fontSize - 10)}><Minus className="w-5 h-5"/></Button>
                    <Input as="input" type="range" min="80" max="200" step="10" value={fontSize} onChange={(e) => changeFontSize(parseInt(e.target.value))} className="flex-grow" />
                    <Button variant="secondary" size="icon" onClick={() => changeFontSize(fontSize + 10)}><PlusIcon className="w-5 h-5"/></Button>
                </div>
            </div>

            {isBookmarksOpen && <div className="absolute inset-0 bg-black/50 z-30" onClick={() => setIsBookmarksOpen(false)} />}
            <div className={`absolute top-0 right-0 h-full bg-stone-900 border-l border-stone-700/60 z-40 transition-transform duration-300 ${isBookmarksOpen ? 'translate-x-0' : 'translate-x-full'} w-80 flex flex-col`}>
                <div className="p-4 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg">Bookmarks</h3>
                    <Button size="sm" onClick={handleAddBookmark}><BookmarkPlus className="w-4 h-4 mr-2"/> Add</Button>
                </div>
                <div className="flex-grow overflow-y-auto text-stone-300">
                     {bookmarks.length > 0 ? bookmarks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(bm => (
                        <div key={bm.cfi} className="group p-3 border-b border-stone-700/60">
                            <button onClick={() => { goTo(bm.cfi); setIsBookmarksOpen(false); }} className="w-full text-left text-sm text-stone-300 hover:text-white truncate">{bm.label}</button>
                            <div className="flex justify-between items-center text-xs text-stone-500 mt-1">
                                <span>{new Date(bm.createdAt).toLocaleDateString()}</span>
                                <Button variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveBookmark(bm.cfi)}><TrashIcon className="w-3 h-3"/></Button>
                            </div>
                        </div>
                    )) : <p className="text-center text-stone-500 p-4">No bookmarks yet.</p>}
                </div>
            </div>

        </div>
    );
};
