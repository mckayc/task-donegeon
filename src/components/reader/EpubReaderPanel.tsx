
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
// FIX: Corrected import for BookmarkIcon to be BookmarkOutlineIcon as per its export alias, and added missing TrashIcon.
import { XCircleIcon, Minimize, Maximize, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, BookOpen, BookmarkOutlineIcon, BookmarkPlusIcon, BookmarkSolidIcon, TrashIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../user-interface/Input';

interface TocItem {
    id: string;
    label: string;
    href: string;
}

interface EpubMetadata {
    title: string;
    author: string;
    toc: TocItem[];
}

const EPUB_CACHE_NAME = 'epub-chapter-cache-v1';

const EpubReaderPanel: React.FC<{ quest: Quest }> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();

    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);
    const userProgress = useMemo(() => currentUser ? liveQuest.readingProgress?.[currentUser.id] : undefined, [liveQuest, currentUser]);

    const [metadata, setMetadata] = useState<EpubMetadata | null>(null);
    const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
    const [chapterHtml, setChapterHtml] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing reader...');
    const [error, setError] = useState<string | null>(null);
    
    // UI State
    const [fontSize, setFontSize] = useState(100); // Percentage
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'toc' | 'bookmarks' | 'settings'>('toc');

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(userProgress?.totalSeconds || 0);

    // Progress
    const [scrollPos, setScrollPos] = useState(0);
    const debouncedScrollPos = useDebounce(scrollPos, 500);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(userProgress?.bookmarks || []);

    const fetchAndCacheChapter = useCallback(async (chapterId: string) => {
        if (!liveQuest.epubUrl) return;
        setIsLoading(true);
        setLoadingMessage('Loading chapter...');

        const cache = await caches.open(EPUB_CACHE_NAME);
        const cacheUrl = `/api/epub/chapter?path=${encodeURIComponent(liveQuest.epubUrl)}&chapterId=${encodeURIComponent(chapterId)}`;
        let response = await cache.match(cacheUrl);

        if (!response) {
            response = await fetch(cacheUrl);
            if (response.ok) {
                await cache.put(cacheUrl, response.clone());
            }
        }
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Failed to load chapter content.' }));
             throw new Error(errorData.error || 'Failed to fetch chapter.');
        }
        
        const html = await response.text();
        setChapterHtml(html);
        setIsLoading(false);
    }, [liveQuest.epubUrl]);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!liveQuest.epubUrl) return;
            setIsLoading(true);
            setLoadingMessage('Fetching book details...');
            setError(null);
            try {
                const response = await fetch(`/api/epub/metadata?path=${encodeURIComponent(liveQuest.epubUrl)}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Could not communicate with the server.' }));
                    throw new Error(errorData.error || 'Failed to fetch book metadata.');
                }
                const data: EpubMetadata = await response.json();
                setMetadata(data);

                const startChapter = userProgress?.epubChapter || data.toc[0]?.id;
                if (startChapter) {
                    setCurrentChapterId(startChapter);
                    await fetchAndCacheChapter(startChapter);
                } else {
                    setError("Book has no chapters.");
                    setIsLoading(false);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsLoading(false);
            }
        };
        fetchMetadata();
    }, [liveQuest.epubUrl, fetchAndCacheChapter, userProgress?.epubChapter]);


    useEffect(() => {
        if (contentRef.current) {
            const savedScroll = userProgress?.epubChapter === currentChapterId ? userProgress?.epubScroll || 0 : 0;
            contentRef.current.scrollTop = savedScroll * contentRef.current.scrollHeight;
        }
    }, [chapterHtml, userProgress, currentChapterId]);

    const syncProgress = useCallback(async (forceSync = false) => {
        if (!currentUser || !currentChapterId) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
        const dataToSync: any = { epubChapter: currentChapterId, epubScroll: debouncedScrollPos, bookmarks, sessionSeconds };
        if (secondsToAdd > 0) dataToSync.secondsToAdd = secondsToAdd;

        const shouldSync = dataToSync.secondsToAdd > 0 || forceSync;
        if (shouldSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, dataToSync);
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("EPUB Sync failed", e);
            }
        }
    }, [currentUser, quest.id, currentChapterId, debouncedScrollPos, bookmarks, sessionSeconds, updateReadingProgress]);

    useEffect(() => {
        const timer = setInterval(() => setSessionSeconds(Math.round((Date.now() - sessionStartTimeRef.current) / 1000)), 1000);
        const syncInterval = setInterval(() => syncProgress(false), 30000);
        window.addEventListener('beforeunload', () => syncProgress(true));
        return () => {
            clearInterval(timer);
            clearInterval(syncInterval);
            window.removeEventListener('beforeunload', () => syncProgress(true));
            syncProgress(true);
        };
    }, [syncProgress]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const scrollPercentage = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
        setScrollPos(scrollPercentage);
    };

    const currentChapterIndex = useMemo(() => metadata?.toc.findIndex(c => c.id === currentChapterId) ?? -1, [metadata, currentChapterId]);

    const navigateChapter = (direction: 'next' | 'prev') => {
        if (!metadata || currentChapterIndex === -1) return;
        const newIndex = direction === 'next' ? currentChapterIndex + 1 : currentChapterIndex - 1;
        if (newIndex >= 0 && newIndex < metadata.toc.length) {
            setCurrentChapterId(metadata.toc[newIndex].id);
        }
    };

    const toggleBookmark = () => {
        if (!currentChapterId || !metadata) return;
        const existingIndex = bookmarks.findIndex(b => b.epubChapter === currentChapterId);
        
        let newBookmarks;
        if (existingIndex > -1) {
            newBookmarks = bookmarks.filter((_, i) => i !== existingIndex);
        } else {
            const chapterLabel = metadata.toc.find(c => c.id === currentChapterId)?.label || 'Unknown Chapter';
            newBookmarks = [...bookmarks, {
                label: chapterLabel,
                epubChapter: currentChapterId,
                epubScroll: scrollPos,
                createdAt: new Date().toISOString()
            }];
        }
        setBookmarks(newBookmarks);
    };
    
    const isBookmarked = useMemo(() => bookmarks.some(b => b.epubChapter === currentChapterId), [bookmarks, currentChapterId]);

    const progressPercent = useMemo(() => {
        if (!metadata || metadata.toc.length === 0) return 0;
        return ((currentChapterIndex + 1) / metadata.toc.length) * 100;
    }, [metadata, currentChapterIndex]);

    const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-stone-900 z-[80] flex flex-col epub-reader">
            <header className="w-full p-3 flex justify-between items-center z-20 text-white bg-stone-800/80 flex-shrink-0 backdrop-blur-sm">
                <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleBookmark} title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}>
                        {isBookmarked ? <BookmarkSolidIcon className="w-5 h-5 text-emerald-400"/> : <BookmarkOutlineIcon className="w-5 h-5"/>}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(p => !p)} title="Settings & Contents"><BookOpen className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
                </div>
            </header>
            
            <div className="flex-grow w-full min-h-0 relative">
                <div 
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto"
                    style={{ 
                        backgroundColor: theme === 'light' ? '#f5f5f4' : '#1c1917',
                        color: theme === 'light' ? '#1c1917' : '#e7e5e4',
                        fontSize: `${fontSize}%`,
                        '--epub-link-color': theme === 'light' ? '#0284c7' : '#38bdf8'
                    } as React.CSSProperties}
                >
                    {(isLoading || error) && (
                         <div className="flex flex-col items-center justify-center h-full gap-4 p-4 text-center">
                            {isLoading && <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>}
                            <p className={`text-xl font-semibold ${error ? 'text-red-400' : 'text-white'}`}>{error ? error : loadingMessage}</p>
                            {error && <Button onClick={() => setReadingEpubQuest(null)}>Close Reader</Button>}
                        </div>
                    )}
                    <style>{`
                        .epub-content a { color: var(--epub-link-color); }
                        .epub-content img { max-width: 100%; height: auto; margin: 1rem auto; display: block; }
                    `}</style>
                    <div className="epub-content max-w-3xl mx-auto p-8" dangerouslySetInnerHTML={{ __html: chapterHtml }} />
                </div>
            </div>

            <footer className="w-full p-3 flex justify-between items-center gap-4 z-20 text-white bg-stone-800/80 flex-shrink-0 backdrop-blur-sm text-sm">
                <div className="w-1/3 flex gap-4 text-left">
                    <div title="Session Time"><span className="font-semibold">Session:</span> {formatTime(sessionSeconds)}</div>
                    <div title="Total Time Read"><span className="font-semibold">Total:</span> {formatTime(Math.floor((userProgress?.totalSeconds || 0) + sessionSeconds))}</div>
                </div>
                <div className="w-1/3 flex justify-center items-center gap-4">
                     <Button variant="secondary" size="icon" onClick={() => navigateChapter('prev')} disabled={currentChapterIndex <= 0}><ChevronLeftIcon className="w-5 h-5"/></Button>
                    <div className="flex-grow">
                        <input type="range" min="0" max={metadata ? metadata.toc.length - 1 : 0} value={currentChapterIndex} 
                            onChange={e => {
                                if(metadata) setCurrentChapterId(metadata.toc[parseInt(e.target.value)].id);
                            }}
                            className="w-full"
                        />
                        <p className="text-xs text-center text-stone-400 truncate">{metadata?.toc[currentChapterIndex]?.label || '...'}</p>
                    </div>
                    <Button variant="secondary" size="icon" onClick={() => navigateChapter('next')} disabled={!metadata || currentChapterIndex >= metadata.toc.length - 1}><ChevronRightIcon className="w-5 h-5"/></Button>
                </div>
                 <div className="w-1/3 text-right">
                    <span>{currentChapterIndex + 1} / {metadata?.toc.length || '...'} ({progressPercent.toFixed(0)}%)</span>
                </div>
            </footer>
            
            {isPanelOpen && (
                <div className="absolute top-16 right-4 w-80 bg-stone-800/90 backdrop-blur-sm border border-stone-700/60 rounded-lg shadow-2xl z-30">
                    <div className="flex border-b border-stone-700/60">
                        <button onClick={() => setActiveTab('toc')} className={`flex-1 p-3 font-semibold ${activeTab === 'toc' ? 'text-emerald-400 bg-stone-700/50' : 'text-stone-300'}`}>Contents</button>
                        <button onClick={() => setActiveTab('bookmarks')} className={`flex-1 p-3 font-semibold ${activeTab === 'bookmarks' ? 'text-emerald-400 bg-stone-700/50' : 'text-stone-300'}`}>Bookmarks</button>
                        <button onClick={() => setActiveTab('settings')} className={`flex-1 p-3 font-semibold ${activeTab === 'settings' ? 'text-emerald-400 bg-stone-700/50' : 'text-stone-300'}`}>Settings</button>
                    </div>
                     <div className="p-4 max-h-96 overflow-y-auto">
                        {activeTab === 'toc' && metadata && (
                            <ul className="space-y-1">
                                {metadata.toc.map(item => (
                                    <li key={item.id}><button onClick={() => setCurrentChapterId(item.id)} className={`w-full text-left p-2 rounded text-sm ${item.id === currentChapterId ? 'bg-emerald-700 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>{item.label}</button></li>
                                ))}
                            </ul>
                        )}
                        {activeTab === 'bookmarks' && (
                            <ul className="space-y-2">
                                {bookmarks.map((bm, i) => (
                                    <li key={i} className="group flex items-center justify-between p-2 rounded bg-stone-700/50">
                                        <button onClick={() => bm.epubChapter && setCurrentChapterId(bm.epubChapter)} className="text-left flex-grow">
                                            <p className="text-sm text-stone-200 truncate">{bm.label}</p>
                                            <p className="text-xs text-stone-400">Added: {new Date(bm.createdAt).toLocaleDateString()}</p>
                                        </button>
                                        <button onClick={() => setBookmarks(bms => bms.filter(b => b.epubChapter !== bm.epubChapter))} className="p-1 text-red-400 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>
                                    </li>
                                ))}
                                {bookmarks.length === 0 && <p className="text-sm text-stone-400 text-center">No bookmarks added yet.</p>}
                            </ul>
                        )}
                        {activeTab === 'settings' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold">Font Size</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">A</span>
                                        <input type="range" min="80" max="150" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full"/>
                                        <span className="text-2xl">A</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Theme</label>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => setTheme('light')} className={`flex-1 p-2 rounded border-2 ${theme === 'light' ? 'border-emerald-500' : 'border-stone-600'}`} style={{backgroundColor: '#f5f5f4', color: '#1c1917'}}>Light</button>
                                        <button onClick={() => setTheme('dark')} className={`flex-1 p-2 rounded border-2 ${theme === 'dark' ? 'border-emerald-500' : 'border-stone-600'}`} style={{backgroundColor: '#1c1917', color: '#e7e5e4'}}>Dark</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EpubReaderPanel;
