
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// @ts-ignore - react-reader doesn't have great TS support for module imports via CDN
import { ReactReader } from 'react-reader';
import type { Rendition } from 'epubjs';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';

const EPUB_CACHE_NAME = 'epub-cache-v1';

interface EpubReaderPanelProps {
  quest: Quest;
}

export const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { addNotification } = useNotificationsDispatch();
    
    const liveQuest = useMemo(() => quests.find(q => q.id === quest.id) || quest, [quests, quest]);
    const userProgress = useMemo(() => currentUser ? liveQuest.readingProgress?.[currentUser.id] : undefined, [liveQuest, currentUser]);
    
    const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing Reader...');
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [location, setLocation] = useState<string | number | null>(userProgress?.locationCfi || null);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(userProgress?.bookmarks || []);
    
    // Time Tracking
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionStartTimeRef = useRef(Date.now());
    const lastSyncTimeRef = useRef(Date.now());
    const initialTotalSecondsRef = useRef(0);

    useEffect(() => {
        initialTotalSecondsRef.current = userProgress?.totalSeconds || 0;
    }, [quest.id, userProgress]);
    
    const debouncedLocation = useDebounce(location, 5000);
    const debouncedBookmarks = useDebounce(bookmarks, 5000);

    const syncProgress = useCallback(async (forceSync = false) => {
        if (!currentUser || !debouncedLocation) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);
        
        const dataToSync: any = {
            locationCfi: debouncedLocation,
            bookmarks: debouncedBookmarks,
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
    }, [currentUser, quest.id, updateReadingProgress, debouncedLocation, debouncedBookmarks, sessionSeconds]);

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
        } catch (e) { console.warn("Could not access cache:", e); }
        return null;
    };
    
    const cacheBook = async (url: string) => {
        setLoadingMessage('Downloading eBook for offline access...');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download eBook file.');

        const contentLength = response.headers.get('content-length');
        if (!contentLength) return response.arrayBuffer();

        const total = parseInt(contentLength, 10);
        let loaded = 0;
        const reader = response.body!.getReader();
        const chunks: Uint8Array[] = [];
        
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
        } catch (e) { console.warn("Could not write to cache:", e); }
        
        setDownloadProgress(null);
        return blob.arrayBuffer();
    };

    useEffect(() => {
        if (!quest.epubUrl) {
            setError("No eBook file specified for this quest.");
            setIsLoading(false);
            return;
        }

        const initializeReader = async () => {
            try {
                let bookData = await getCachedBook(quest.epubUrl!);
                if (!bookData) {
                    bookData = await cacheBook(quest.epubUrl!);
                }
                setLoadingMessage('Unpacking eBook...');
                setEpubData(bookData);
                setIsLoading(false);
            } catch (err) {
                console.error("ePub reader error:", err);
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Could not load eBook: ${message}`);
                addNotification({ type: 'error', message: `Could not open eBook. It may be corrupted or in an unsupported format.`});
                setIsLoading(false);
            }
        };
        
        initializeReader();
    }, [quest.epubUrl, addNotification]);

    const locationChanged = (epubcifi: string) => {
        setLocation(epubcifi);
    };

    const handleAddBookmark = useCallback((cfi: string) => {
        const newBookmark: Bookmark = {
            label: `Bookmark`, // react-reader will generate its own label from the content
            cfi: cfi,
            createdAt: new Date().toISOString(),
        };
        setBookmarks(prev => [...prev.filter(b => b.cfi !== cfi), newBookmark]);
        addNotification({ type: 'success', message: 'Bookmark added!' });
    }, [addNotification]);

    const handleRemoveBookmark = useCallback((cfi: string) => {
        setBookmarks(prev => prev.filter(b => b.cfi !== cfi));
    }, []);
    
    return (
        <div className="fixed inset-0 bg-stone-900 z-[80] flex flex-col">
            <div className="absolute top-0 right-0 z-[1001] p-2">
                <Button variant="ghost" size="icon" onClick={() => setReadingEpubQuest(null)} title="Close Reader">
                    <XCircleIcon className="w-8 h-8 text-white/70 hover:text-white"/>
                </Button>
            </div>
            <div className="w-full h-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white bg-stone-900">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                        <p className="text-xl font-semibold">{loadingMessage}</p>
                        {downloadProgress !== null && (
                            <div className="w-64 bg-stone-700 rounded-full h-2.5">
                                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                )}
                {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xl p-4 text-center">{error}</div>}
                {!isLoading && !error && epubData && (
                    <ReactReader
                        url={epubData}
                        title={quest.title}
                        location={location as string | number}
                        locationChanged={locationChanged}
                        showToc={true}
                        bookmarks={bookmarks.map(b => ({ cfi: b.cfi, label: b.label }))}
                        addBookmark={handleAddBookmark}
                        removeBookmark={handleRemoveBookmark}
                    />
                )}
            </div>
        </div>
    );
};
