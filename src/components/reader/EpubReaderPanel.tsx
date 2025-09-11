
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReadkIt from 'readk-it';
import JSZip from 'jszip';
import { Quest, Bookmark } from '../../types';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useUIDispatch } from '../../context/UIContext';
import Button from '../user-interface/Button';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, BookmarkPlusIcon, MenuIcon, BookmarkSolidIcon, SettingsIcon, Eye, TrashIcon } from '../user-interface/Icons';
import { useDebounce } from '../../hooks/useDebounce';

const EPUB_CACHE_NAME = 'epub-cache-v1';

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
    const { quests } = useQuestsState();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);
    const userProgress = useMemo(() => currentUser ? liveQuest.readingProgress?.[currentUser.id] : undefined, [liveQuest, currentUser]);

    const readerContainerRef = useRef<HTMLDivElement>(null);
    const renditionRef = useRef<any>(null);
    const bookRef = useRef<any>(null);
    const isReadyRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing Reader...');
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toc, setToc] = useState<any[]>([]);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Reader settings
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('epubTheme') as 'light' | 'dark') || 'dark');
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('epubFontSize') || '100', 10));
    const [isImmersive, setIsImmersive] = useState(false);

    // Bookmarks
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const debouncedLocation = useDebounce(currentLocation, 2000);

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(userProgress?.totalSeconds || 0);

    const totalSecondsRead = useMemo(() => initialTotalSecondsRef.current + sessionSeconds, [sessionSeconds]);

    // Effect for mounting and unmounting the reader
    useEffect(() => {
        const mountReader = async () => {
            if (!readerContainerRef.current || !quest.epubUrl) {
                setError("EPUB URL or reader container is missing.");
                return;
            }
            
            console.log('Readk.it: Mounting reader...');
            setLoadingMessage('Fetching eBook...');

            try {
                const cache = await caches.open(EPUB_CACHE_NAME);
                let response = await cache.match(quest.epubUrl);

                if (!response) {
                    console.log('Readk.it: EPUB not in cache, downloading...');
                    setLoadingMessage('Downloading eBook for offline use...');
                    const res = await fetch(quest.epubUrl);
                    if (!res.ok) throw new Error(`Failed to download EPUB file (status: ${res.status})`);

                    const contentLength = res.headers.get('content-length');
                    if (!contentLength) {
                        console.warn('Readk.it: Content-Length header not found, cannot show download progress.');
                        const clonedRes = res.clone();
                        await cache.put(quest.epubUrl, clonedRes);
                        response = res;
                    } else {
                        const total = parseInt(contentLength, 10);
                        let loaded = 0;
                        const reader = res.body!.getReader();
                        const stream = new ReadableStream({
                            start(controller) {
                                function push() {
                                    reader.read().then(({ done, value }) => {
                                        if (done) { controller.close(); return; }
                                        loaded += value.length;
                                        setDownloadProgress((loaded / total) * 100);
                                        controller.enqueue(value);
                                        push();
                                    });
                                }
                                push();
                            }
                        });
                        response = new Response(stream);
                        await cache.put(quest.epubUrl, response.clone());
                    }
                } else {
                     console.log('Readk.it: Loading EPUB from cache.');
                }
                
                setDownloadProgress(null);
                setLoadingMessage('Unpacking eBook...');
                const bookData = await response.arrayBuffer();

                const book = new ReadkIt(bookData, { jszip: JSZip });
                bookRef.current = book;
                
                console.log('Readk.it: Book loaded. Rendering...');
                setLoadingMessage('Rendering pages...');

                const rendition = book.renderTo(readerContainerRef.current, {
                    width: '100%',
                    height: '100%',
                    flow: 'paginated',
                    spread: 'auto'
                });
                renditionRef.current = rendition;

                rendition.on('started', () => {
                    console.log('Readk.it: Rendition started.');
                    const initialLocation = userProgress?.locationCfi || undefined;
                    rendition.display(initialLocation);
                });

                rendition.on('displayed', () => {
                    console.log('Readk.it: Content displayed.');
                    setIsLoading(false);
                    isReadyRef.current = true;
                });
                
                rendition.on('locationsChanged', (location: any) => {
                    if (isReadyRef.current) {
                        setCurrentLocation(location);
                        setProgress(Math.round(location.start.percentage * 100));
                    }
                });
                
                const nav = await book.navigation;
                setToc(nav.toc);
                setBookmarks(userProgress?.bookmarks || []);

            } catch (err: any) {
                console.error("Error loading EPUB:", err);
                setError(`Failed to load book: ${err.message}`);
                setIsLoading(false);
            }
        };

        mountReader();
        
        return () => {
            console.log("Readk.it: Unmounting reader.");
            isReadyRef.current = false;
            bookRef.current?.destroy();
            renditionRef.current?.destroy();
        };
    }, [quest.epubUrl, userProgress]);
    
    const syncProgress = useCallback(async (forceSync = false) => {
        if (!currentUser || !debouncedLocation) return;
        
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);

        if (secondsToAdd > 0 || forceSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, {
                    locationCfi: debouncedLocation.start.cfi,
                    bookmarks: bookmarks,
                    secondsToAdd: secondsToAdd > 0 ? secondsToAdd : undefined,
                    sessionSeconds: sessionSeconds
                });
                lastSyncTimeRef.current = now;
                console.log('Readk.it: Progress synced.', { cfi: debouncedLocation.start.cfi, seconds: secondsToAdd });
            } catch (e) {
                console.error("EPUB Sync failed, not updating lastSyncTimeRef", e);
            }
        }
    }, [currentUser, quest.id, debouncedLocation, bookmarks, updateReadingProgress, sessionSeconds]);

    // Save location on change
    useEffect(() => {
        if (debouncedLocation && isReadyRef.current) {
            syncProgress();
        }
    }, [debouncedLocation, syncProgress]);
    
    // Save bookmarks immediately
     useEffect(() => {
        if (isReadyRef.current) {
             syncProgress(true);
        }
    }, [bookmarks, syncProgress]);
    
    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        }, 1000);

        const syncInterval = setInterval(() => syncProgress(false), 30000);
        window.addEventListener('beforeunload', () => syncProgress(true));

        return () => {
            clearInterval(timer);
            clearInterval(syncInterval);
            window.removeEventListener('beforeunload', () => syncProgress(true));
            syncProgress(true); // Final sync on close
        };
    }, [syncProgress]);


    // Reader control functions
    const prevPage = () => renditionRef.current?.prev();
    const nextPage = () => renditionRef.current?.next();
    const goTo = (href: string) => {
        renditionRef.current?.display(href);
        setIsPanelOpen(false);
    };
    
    const changeTheme = useCallback((newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('epubTheme', newTheme);
        renditionRef.current?.themes.select(newTheme);
    }, []);

    const changeFontSize = useCallback((newSize: number) => {
        const size = Math.max(80, Math.min(200, newSize));
        setFontSize(size);
        localStorage.setItem('epubFontSize', String(size));
        renditionRef.current?.themes.fontSize(`${size}%`);
    }, []);

    useEffect(() => {
        if (renditionRef.current) {
            renditionRef.current.themes.register('dark', { body: { 'background': '#1c1917', 'color': '#e7e5e4' } });
            renditionRef.current.themes.register('light', { body: { 'background': '#f3f4f6', 'color': '#1f2937' } });
            changeTheme(theme);
            changeFontSize(fontSize);
        }
    }, [isLoading, changeTheme, changeFontSize, theme, fontSize]);
    
    const addBookmark = () => {
        if (!currentLocation) return;
        const cfi = currentLocation.start.cfi;
        if (bookmarks.some(b => b.cfi === cfi)) {
            // Remove bookmark
            setBookmarks(prev => prev.filter(b => b.cfi !== cfi));
        } else {
            // Add bookmark
            const newBookmark: Bookmark = {
                label: `Page ${currentLocation.start.displayed.page}`,
                cfi,
                createdAt: new Date().toISOString(),
            };
            setBookmarks(prev => [...prev, newBookmark]);
        }
    };
    
    const isBookmarked = useMemo(() => {
        return currentLocation && bookmarks.some(b => b.cfi === currentLocation.start.cfi);
    }, [currentLocation, bookmarks]);


    return (
        <div className={`fixed inset-0 bg-stone-900 z-[80] flex flex-col items-center justify-center transition-all duration-300 ${isImmersive ? 'immersive' : ''}`}>
            {/* Header */}
            <header className="w-full p-3 flex justify-between items-center z-20 text-white bg-stone-800/80 flex-shrink-0 transition-transform duration-300 transform" style={{ transform: isImmersive ? 'translateY(-100%)' : 'translateY(0)' }}>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(true)} title="Table of Contents"><MenuIcon className="w-6 h-6"/></Button>
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" onClick={() => setIsImmersive(p => !p)} title="Immersive Mode"><Eye className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(p => !p)} title="Settings"><SettingsIcon className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </header>

            {/* Main Reader View */}
            <main className="flex-grow w-full h-full relative" id="epub-reader-main">
                {(isLoading || error) && (
                    <div className="absolute inset-0 z-40 bg-stone-900 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                        <p className={`text-xl font-semibold ${error ? 'text-red-400' : 'text-white'}`}>{error || loadingMessage}</p>
                        {downloadProgress !== null && (
                            <div className="w-64 bg-stone-700 rounded-full h-2.5 mt-2">
                                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={readerContainerRef} className="w-full h-full" />
            </main>

            {/* Footer */}
            <footer className="w-full p-3 flex justify-between items-center gap-4 z-20 text-white bg-stone-800/80 flex-shrink-0 transition-transform duration-300 transform" style={{ transform: isImmersive ? 'translateY(100%)' : 'translateY(0)' }}>
                <div className="flex items-center gap-4 w-1/3">
                    <div title="Session Time" className="text-sm"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                    <div title="Total Time Read" className="text-sm"><span className="font-semibold">Total:</span> {formatTime(totalSecondsRead)}</div>
                </div>
                <div className="flex-grow flex justify-center items-center gap-2">
                    <Button variant="secondary" size="icon" onClick={prevPage} disabled={isLoading}><ChevronLeftIcon className="w-5 h-5"/></Button>
                    <div className="flex-grow flex items-center gap-2">
                        <span className="text-xs">{currentLocation?.start.displayed.page || '...'}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={e => setProgress(Number(e.target.value))}
                            onMouseUp={e => renditionRef.current?.display(`epubcfi(/6/${(bookRef.current?.locations.cfiFromPercentage(Number((e.target as HTMLInputElement).value) / 100) || '').split('(')[1]}`)}
                            className="w-full"
                            disabled={isLoading}
                        />
                         <span className="text-xs">{currentLocation?.end.displayed.page || '...'}</span>
                    </div>
                    <Button variant="secondary" size="icon" onClick={nextPage} disabled={isLoading}><ChevronRightIcon className="w-5 h-5"/></Button>
                </div>
                 <div className="w-1/3 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={addBookmark} disabled={isLoading} title="Bookmark this page">
                        {isBookmarked ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400" /> : <BookmarkPlusIcon className="w-5 h-5"/>}
                    </Button>
                </div>
            </footer>
            
            {/* Settings Panel */}
            {isSettingsOpen && (
                <div className="absolute bottom-20 right-4 bg-stone-700/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-30 w-64 border border-stone-600">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Theme</span>
                            <div className="flex gap-2">
                                <Button size="icon" className={`h-8 w-8 rounded-full !bg-gray-100 ${theme === 'light' ? 'ring-2 ring-emerald-400' : ''}`} onClick={() => changeTheme('light')}><SunIcon className="w-4 h-4 text-black" /></Button>
                                <Button size="icon" className={`h-8 w-8 rounded-full !bg-stone-800 ${theme === 'dark' ? 'ring-2 ring-emerald-400' : ''}`} onClick={() => changeTheme('dark')}><MoonIcon className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <div>
                             <label className="flex justify-between text-sm font-semibold"><span>Font Size</span> <span>{fontSize}%</span></label>
                             <input type="range" min="80" max="200" step="10" value={fontSize} onChange={e => changeFontSize(Number(e.target.value))} className="w-full"/>
                        </div>
                    </div>
                </div>
            )}

            {/* Side Panel for TOC & Bookmarks */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-stone-900 border-r border-stone-700 shadow-xl z-50 transition-transform duration-300 ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-stone-700/60 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-stone-200">Contents</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(false)}><XCircleIcon /></Button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-emerald-400 mb-2">Table of Contents</h4>
                        <ul className="space-y-1">
                            {toc.map((item, i) => (
                                <li key={i}><button onClick={() => goTo(item.href)} className="text-left text-stone-300 hover:text-white hover:underline text-sm">{item.label}</button></li>
                            ))}
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-stone-700/60">
                        <h4 className="font-semibold text-emerald-400 mb-2">Bookmarks</h4>
                         <ul className="space-y-1">
                            {bookmarks.map((b, i) => (
                                <li key={i} className="flex justify-between items-center group">
                                    <button onClick={() => goTo(b.cfi)} className="text-left text-stone-300 hover:text-white hover:underline text-sm">{b.label}</button>
                                    <Button variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setBookmarks(prev => prev.filter(bm => bm.cfi !== b.cfi))}><TrashIcon className="w-3 h-3" /></Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            {isPanelOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsPanelOpen(false)} />}
        </div>
    );
};

export default EpubReaderPanel;
