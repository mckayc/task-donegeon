import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Epub, { Book, Rendition, NavItem } from 'epubjs';
import { Quest, Bookmark } from '../../types';
import Button from '../user-interface/Button';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { 
    XCircleIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    List, 
    BookmarkPlus, 
    Bookmark as BookmarkIcon,
    Maximize,
    Minimize,
} from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import Input from '../user-interface/Input';

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
  const { setReadingEpubQuest } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { updateReadingProgress } = useQuestsDispatch();
  const { quests } = useQuestsState();

  const liveQuest = quests.find(q => q.id === quest.id) || quest;
  
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activePanel, setActivePanel] = useState<'toc' | 'bookmarks' | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');

  const userProgress = useMemo(() => {
      if (!currentUser) return null;
      return liveQuest.readingProgress?.[currentUser.id];
  }, [liveQuest.readingProgress, currentUser]);

  const closeReader = useCallback(() => {
    setReadingEpubQuest(null);
  }, [setReadingEpubQuest]);

  // Initialize and load the book
  useEffect(() => {
    if (!quest.epubUrl || !viewerRef.current || !currentUser) return;
    
    // Clear previous state
    setActivePanel(null);
    setToc([]);
    setBookmarks([]);
    
    setIsLoading(true);
    setError(null);
    
    const book = Epub(quest.epubUrl);
    bookRef.current = book;
    
    const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        spread: "auto",
        allowScriptedContent: true, // For interactive epubs
    });
    renditionRef.current = rendition;

    // FIX: Correctly load the Table of Contents using book.navigation.load() which returns a promise.
    book.ready
      .then(() => book.navigation.load())
      .then((nav) => {
        if (nav && nav.toc) {
          setToc(nav.toc);
        }

        const savedLocation = userProgress?.locationCfi;
        const savedBookmarks = userProgress?.bookmarks || [];
        setBookmarks(savedBookmarks);

        return rendition.display(savedLocation || undefined);
      })
      .then(() => {
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(
          `Failed to load EPUB: ${err.message}. The file may be corrupt or unsupported.`
        );
        setIsLoading(false);
      });

    rendition.on('relocated', (location: any) => {
        const cfi = location.start.cfi;
        setCurrentLocation(cfi);
        if (currentUser) {
             updateReadingProgress(quest.id, currentUser.id, { locationCfi: cfi });
        }
    });

    return () => {
        bookRef.current?.destroy();
        bookRef.current = null;
        renditionRef.current = null;
    };
  }, [quest.id, quest.epubUrl, currentUser?.id]); // Removed updateReadingProgress from dependency array as it's stable

  // Sync initial state from context after book loads
  useEffect(() => {
      if (!isLoading && userProgress) {
          setBookmarks(userProgress.bookmarks || []);
          // Note: Initial location is handled in the main useEffect to avoid race conditions.
      }
  }, [isLoading, userProgress]);

  // Fullscreen handler
  useEffect(() => {
    const onFullscreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!panelRef.current) return;
    if (!document.fullscreenElement) {
        panelRef.current.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
  };

  const handleNav = (direction: 'next' | 'prev') => {
    renditionRef.current?.[direction]();
  };
  
  const handleTocClick = (href: string) => {
    renditionRef.current?.display(href);
    setActivePanel(null);
  };

  const handleAddBookmark = () => {
    if (!currentLocation || !currentUser) return;
    
    const newBookmark: Bookmark = {
        cfi: currentLocation,
        label: newBookmarkLabel.trim() || `Location - ${new Date().toLocaleTimeString()}`,
        createdAt: new Date().toISOString(),
    };
    
    const updatedBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.cfi.localeCompare(b.cfi, undefined, { numeric: true }));
    setBookmarks(updatedBookmarks);
    updateReadingProgress(quest.id, currentUser.id, { bookmarks: updatedBookmarks });
    
    setNewBookmarkLabel('');
    setShowAddBookmark(false);
  };

  const handleRemoveBookmark = (cfi: string) => {
    if (!currentUser) return;
    const updatedBookmarks = bookmarks.filter(b => b.cfi !== cfi);
    setBookmarks(updatedBookmarks);
    updateReadingProgress(quest.id, currentUser.id, { bookmarks: updatedBookmarks });
  };
  
  const PanelContent: React.FC = () => {
    if (activePanel === 'toc') {
        return (
            <div className="p-4">
                <h3 className="font-bold text-lg text-emerald-300 mb-2">Table of Contents</h3>
                {toc.length > 0 ? (
                    <ul className="space-y-1">
                        {toc.map(item => (
                            <li key={item.id}>
                                <button onClick={() => handleTocClick(item.href)} className="w-full text-left text-stone-300 hover:text-white hover:underline p-1 rounded">
                                    {item.label.trim()}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-stone-400">No table of contents found in this book.</p>}
            </div>
        );
    }
    if (activePanel === 'bookmarks') {
        return (
            <div className="p-4">
                <h3 className="font-bold text-lg text-emerald-300 mb-2">Bookmarks</h3>
                {bookmarks.length > 0 ? (
                    <ul className="space-y-2">
                        {bookmarks.map(bm => (
                            <li key={bm.cfi} className="flex justify-between items-center bg-stone-700/50 p-2 rounded-md">
                                <button onClick={() => handleTocClick(bm.cfi)} className="text-left flex-grow">
                                    <p className="text-stone-200">{bm.label}</p>
                                    <p className="text-xs text-stone-400">Added: {new Date(bm.createdAt).toLocaleDateString()}</p>
                                </button>
                                <Button variant="destructive" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveBookmark(bm.cfi)}>
                                    <XCircleIcon className="w-4 h-4"/>
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-stone-400 text-sm">No bookmarks saved yet.</p>}
            </div>
        );
    }
    return null;
  };
  
  return (
    <>
      <div ref={panelRef} className="fixed inset-0 bg-stone-900 z-[80] flex flex-col items-center justify-center epub-container">
        <header className="w-full p-2 flex justify-between items-center z-20 text-white bg-stone-800/80 flex-shrink-0">
            <h3 className="font-bold text-lg truncate flex-grow pl-2">{quest.title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(activePanel === 'toc' ? null : 'toc')} title="Table of Contents"><List className="w-5 h-5"/></Button>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(activePanel === 'bookmarks' ? null : 'bookmarks')} title="Bookmarks"><BookmarkIcon className="w-5 h-5"/></Button>
                <Button variant="ghost" size="icon" onClick={() => setShowAddBookmark(true)} title="Add Bookmark"><BookmarkPlus className="w-5 h-5"/></Button>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Fullscreen">{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</Button>
                <Button variant="ghost" size="icon" onClick={closeReader} title="Close Reader"><XCircleIcon className="w-6 h-6"/></Button>
            </div>
        </header>

        <div className="flex-grow w-full relative min-h-0">
             {(isLoading || error) && (
                 <div className="absolute inset-0 z-40 bg-stone-900 flex flex-col items-center justify-center gap-4">
                    {isLoading && <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>}
                    <p className={`text-xl font-semibold ${error ? 'text-red-400' : 'text-white'}`}>
                        {error ? error : 'Summoning the Scribe...'}
                    </p>
                </div>
            )}
            <div ref={viewerRef} id="viewer" className="h-full" />
            <Button variant="ghost" onClick={() => handleNav('prev')} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-16 w-16 !rounded-full bg-black/30 text-white hover:bg-black/50 opacity-20 hover:opacity-100 transition-opacity">
                <ChevronLeftIcon className="w-8 h-8"/>
            </Button>
            <Button variant="ghost" onClick={() => handleNav('next')} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 h-16 w-16 !rounded-full bg-black/30 text-white hover:bg-black/50 opacity-20 hover:opacity-100 transition-opacity">
                <ChevronRightIcon className="w-8 h-8"/>
            </Button>

            {/* Side Panel for TOC/Bookmarks */}
            <div className={`absolute top-0 bottom-0 left-0 w-72 bg-stone-800/95 backdrop-blur-sm z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${activePanel ? 'translate-x-0' : '-translate-x-full'}`}>
                <PanelContent />
            </div>
             {activePanel && <div onClick={() => setActivePanel(null)} className="absolute inset-0 bg-black/50 z-30" />}
        </div>
      </div>
      {showAddBookmark && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90]">
              <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-xl p-6 max-w-sm w-full">
                <h3 className="font-bold text-lg text-emerald-300 mb-4">Add Bookmark</h3>
                <Input label="Bookmark Label (Optional)" value={newBookmarkLabel} onChange={(e) => setNewBookmarkLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()} autoFocus />
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={() => setShowAddBookmark(false)}>Cancel</Button>
                    <Button onClick={handleAddBookmark}>Save</Button>
                </div>
              </div>
          </div>
      )}
    </>
  );
};

export default EpubReaderPanel;
