
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactReader, IReactReaderStyle } from 'react-reader';
import { Quest, Bookmark } from '../../types';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { XCircleIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';

// Custom styles to match the application's dark theme
const readerStyles: IReactReaderStyle = {
  container: {
    ...IReactReaderStyle.container,
    height: '100%',
  },
  readerArea: {
    ...IReactReaderStyle.readerArea,
    backgroundColor: '#1c1917', // stone-900
  },
  arrow: {
    ...IReactReaderStyle.arrow,
    color: '#a8a29e', // stone-400
  },
  arrowHover: {
    ...IReactReaderStyle.arrowHover,
    color: '#e7e5e4', // stone-200
  },
  titleArea: {
    ...IReactReaderStyle.titleArea,
    color: '#5eead4', // emerald-300
  },
  tocArea: {
    ...IReactReaderStyle.tocArea,
    backgroundColor: '#292524', // stone-800
  },
  tocButton: {
    ...IReactReaderStyle.tocButton,
    color: '#a8a29e',
  },
  tocButtonExpanded: {
    ...IReactReaderStyle.tocButtonExpanded,
    backgroundColor: '#44403c', // stone-700
  },
  loadingView: {
    ...IReactReaderStyle.loadingView,
    color: '#a8a29e',
  },
};


interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
    const { setReadingEpubQuest } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { updateReadingProgress } = useQuestsDispatch();
    const { quests } = useQuestsState();

    const liveQuest = quests.find(q => q.id === quest.id) || quest;
    const userProgress = currentUser ? liveQuest.readingProgress?.[currentUser.id] : undefined;

    const [epubCfi, setEpubCfi] = useState<string | undefined>(userProgress?.locationCfi);
    const debouncedCfi = useDebounce(epubCfi, 2000);

    const syncProgress = useCallback(async () => {
        if (!currentUser || !debouncedCfi) return;
        try {
            await updateReadingProgress(quest.id, currentUser.id, {
                locationCfi: debouncedCfi,
            });
        } catch (e) {
            console.error("ePub Sync failed", e);
        }
    }, [currentUser, quest.id, updateReadingProgress, debouncedCfi]);

    useEffect(() => {
        syncProgress();
    }, [syncProgress]);

    const handleLocationChanged = (cfi: string) => {
        setEpubCfi(cfi);
    };

    if (!quest.epubUrl) {
        return (
            <div className="fixed inset-0 bg-stone-900 z-[80] flex flex-col items-center justify-center">
                <p className="text-red-400">Error: No eBook URL provided for this quest.</p>
                <Button onClick={() => setReadingEpubQuest(null)} className="mt-4">Close</Button>
            </div>
        );
    }
    
    // Always use the proxy to handle potential CORS issues and ensure consistency.
    const proxiedUrl = `/api/proxy/epub?url=${encodeURIComponent(quest.epubUrl)}`;

    return (
        <div className="fixed inset-0 bg-stone-900 z-[80]">
            <div className="h-full w-full">
                <ReactReader
                    url={proxiedUrl}
                    title={quest.title}
                    location={epubCfi}
                    locationChanged={handleLocationChanged}
                    showToc={true}
                    styles={readerStyles}
                    loadingView={
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                            <p className="text-xl font-semibold text-white">Preparing your eBook...</p>
                        </div>
                    }
                />
            </div>
             <Button 
                variant="secondary" 
                onClick={() => setReadingEpubQuest(null)} 
                className="!absolute top-2 right-2 z-[100]"
                title="Close Reader"
            >
                <XCircleIcon className="w-6 h-6"/>
            </Button>
        </div>
    );
};

export default EpubReaderPanel;