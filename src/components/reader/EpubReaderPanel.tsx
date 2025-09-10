
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
    
    // On-screen logger state
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const addToLog = useCallback((message: string) => {
        setLogMessages(prev => [...prev.slice(-10), message]); // Keep last 10 messages
    }, []);

    useEffect(() => {
        if(logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logMessages]);


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
        
        addToLog("Initializing EPUB Reader...");

        const initReader = async () => {
            if (!viewerRef.current) {
                addToLog("ERROR: Reader element (viewerRef) not ready.");
                setError("Reader component failed to mount.");
                setIsLoading(false);
                return;
            }
            if (!quest.epubUrl) {
                addToLog("ERROR: EPUB URL is missing in quest data.");
                setError("EPUB URL is missing.");
                setIsLoading(false);
                return;
            }
            
            addToLog("Reader element is ready.");

            try {
                addToLog(`Fetching EPUB file from: ${quest.epubUrl}`);
                const response = await fetch(quest.epubUrl);
                if (!response.ok) {
                    addToLog(`ERROR: HTTP response not OK. Status: ${response.status} ${response.statusText}`);
                    throw new Error(`Could not load book file: ${response.statusText}`);
                }
                const bookData = await response.arrayBuffer();
                addToLog(`EPUB file fetched successfully (${(bookData.byteLength / 1024).toFixed(1)} KB).`);

                if (!isMounted) {
                    addToLog("Component unmounted during fetch. Aborting initialization.");
                    return;
                }

                addToLog("Instantiating AEpubReader...");
                const reader = new window.AEpubReader(viewerRef.current);
                readerRef.current = reader;
                addToLog("AEpubReader instantiated.");

                reader.on('relocated', (location: any) => {
                    if (isMounted && location?.end?.percentage) {
                        setProgress(Math.round(location.end.percentage * 100));
                        setCurrentLocationHref(location.start.href);
                    }
                });

                addToLog("Opening book data...");
                await reader.open(bookData);
                addToLog("Book data opened.");
                
                if (!isMounted) {
                    addToLog("Component unmounted during book open. Aborting.");
                    return;
                }

                addToLog("Fetching book metadata...");
                const metadata = await reader.book.getMetadata();
                setBookTitle(metadata.title);
                addToLog(`Book title: "${metadata.title}"`);

                const savedLocation = userProgress?.locationCfi;
                if (savedLocation) {
                    addToLog(`Applying saved location: ${savedLocation}`);
                    reader.rendition.display(savedLocation);
                } else {
                    addToLog("No saved location found.");
                }
                
                addToLog("Reader is ready!");
                setIsLoading(false);

            } catch (err) {
                if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                    addToLog(`FATAL ERROR: ${errorMessage}`);
                    setError(errorMessage);
                    setIsLoading(false);
                }
            }
        };

        addToLog("Waiting for viewer library to become available...");
        libraryCheckInterval = window.setInterval(() => {
            if (window.AEpubReader) {
                if (libraryCheckInterval) clearInterval(libraryCheckInterval);
                addToLog("Viewer library found.");
                initReader();
            }
        }, 100);

        return () => {
            isMounted = false;
            if (libraryCheckInterval) clearInterval(libraryCheckInterval);
            if (readerRef.current) {
                addToLog("Destroying reader instance.");
                readerRef.current.destroy();
            }
        };
    }, [quest.epubUrl, userProgress, addToLog]);
    
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
                    <div className="absolute inset-0 bg-stone-900/90 z-40 flex flex-col items-center justify-center gap-4 p-8">
                        <div ref={logContainerRef} className="w-full max-w-md h-64 bg-black/50 rounded-lg p-4 font-mono text-xs text-white overflow-y-auto scrollbar-hide">
                            {logMessages.map((msg, index) => (
                                <p key={index} className={`whitespace-pre-wrap ${msg.startsWith('ERROR') || msg.startsWith('FATAL') ? 'text-red-400' : 'text-green-400'}`}>
                                    {`> ${msg}`}
                                </p>
                            ))}
                        </div>
                        {isLoading && !error && <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400 mt-4"></div>}
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
