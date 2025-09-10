
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quest } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';

declare global {
  interface Window {
    AEpubReader: any;
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
    const readerRef = useRef<any>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookTitle, setBookTitle] = useState('');
    const [currentLocationHref, setCurrentLocationHref] = useState<string | null>(null);

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
        let isMounted = true;
        let libraryCheckInterval: number | null = null;
        
        const initReader = async () => {
            if (!viewerRef.current || !quest.epubUrl) {
                setError("Reader element not ready or EPUB URL is missing.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(quest.epubUrl);
                if (!response.ok) throw new Error(`Could not load book file: ${response.statusText}`);
                const bookData = await response.arrayBuffer();

                if (!isMounted) return;

                const reader = new window.AEpubReader(viewerRef.current);
                readerRef.current = reader;

                reader.on('relocated', (location: any) => {
                    if (isMounted && location?.end?.percentage) {
                        setProgress(Math.round(location.end.percentage * 100));
                        setCurrentLocationHref(location.start.href);
                    }
                });

                await reader.open(bookData);
                
                if (!isMounted) return;

                const metadata = await reader.book.getMetadata();
                setBookTitle(metadata.title);

                const savedLocation = userProgress?.locationCfi;
                if (savedLocation) {
                    reader.rendition.display(savedLocation);
                }
                
                setIsLoading(false);

            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Failed to load book.");
                    setIsLoading(false);
                }
            }
        };

        libraryCheckInterval = window.setInterval(() => {
            if (window.AEpubReader) {
                if (libraryCheckInterval) clearInterval(libraryCheckInterval);
                initReader();
            }
        }, 100);

        return () => {
            isMounted = false;
            if (libraryCheckInterval) clearInterval(libraryCheckInterval);
            readerRef.current?.destroy();
        };
    }, [quest.epubUrl, userProgress]);
    
    const syncProgress = useCallback(async (forceSync = false) => {
        if (!currentUser || !currentLocationHref) return;
        const now = Date.now();
        const secondsToAdd = Math.round((now - lastSyncTimeRef.current) / 1000);

        if (secondsToAdd > 0 || forceSync) {
            try {
                await updateReadingProgress(quest.id, currentUser.id, {
                    secondsToAdd,
                    locationCfi: currentLocationHref,
                });
                lastSyncTimeRef.current = now;
            } catch (e) {
                console.error("EPUB Sync failed:", e);
            }
        }
    }, [currentUser, quest.id, updateReadingProgress, currentLocationHref]);

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
    }, [quest.id, syncProgress]);
    
    const handleNext = () => readerRef.current?.next();
    const handlePrev = () => readerRef.current?.prev();

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div className="fixed inset-0 bg-stone-900 z-[80] flex flex-col">
            <header className="p-3 flex justify-between items-center z-20 text-white bg-stone-800 flex-shrink-0">
                <div className="truncate">
                    <h3 className="font-bold text-lg truncate">{quest.title}</h3>
                    <p className="text-sm text-stone-300 truncate">{bookTitle}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReadingQuest(null)} title="Close Reader">
                    <XCircleIcon className="w-6 h-6"/>
                </Button>
            </header>
            
            <div className="flex-grow relative min-h-0">
                {(isLoading || error) && (
                    <div className="absolute inset-0 bg-stone-900/80 z-40 flex flex-col items-center justify-center gap-4 p-8">
                        {isLoading && <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>}
                        <p className="text-white mt-4 text-lg font-semibold">{error || "Preparing Reader..."}</p>
                    </div>
                )}
                <div ref={viewerRef} className="h-full w-full bg-white" />
            </div>

            <footer className="p-3 flex justify-between items-center z-20 text-white bg-stone-800 text-sm flex-shrink-0">
                <div className="w-1/4">
                    <p>Total Time: {formatTime(Math.floor(totalSecondsRead))}</p>
                </div>
                <div className="flex-grow flex items-center justify-center gap-4">
                    <Button onClick={handlePrev} disabled={isLoading}>
                        <ChevronLeftIcon className="w-5 h-5"/> Prev
                    </Button>
                    <span className="font-semibold w-20 text-center">{progress}%</span>
                     <Button onClick={handleNext} disabled={isLoading}>
                        Next <ChevronRightIcon className="w-5 h-5"/>
                    </Button>
                </div>
                <div className="w-1/4" />
            </footer>
        </div>
    );
};

export default EpubReaderPanel;