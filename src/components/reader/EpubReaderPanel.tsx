
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
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
    Pipette, // Eyedropper icon
} from 'lucide-react';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';
import ToggleSwitch from '../user-interface/ToggleSwitch';

// react-reader doesn't export NavItem type, so we define a minimal one.
interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
}

interface EpubReaderPanelProps {
  quest: Quest;
}

const EpubReaderPanel: React.FC<EpubReaderPanelProps> = ({ quest }) => {
  const { setReadingEpubQuest } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { updateReadingProgress } = useQuestsDispatch();
  const { quests } = useQuestsState();
  const { settings } = useSystemState();

  const liveQuest = quests.find(q => q.id === quest.id) || quest;
  
  const renditionRef = useRef<any>(null); // react-reader's rendition object
  const viewRef = useRef<any>(null); // To store the iframe's view object
  const panelRef = useRef<HTMLDivElement>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [readerState, setReaderState] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activePanel, setActivePanel] = useState<'toc' | 'bookmarks' | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  
  // Dev Panel State
  const [devLogs, setDevLogs] = useState<string[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const [isDevPanelCollapsed, setIsDevPanelCollapsed] = useState(true);
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [compatibilityMode, setCompatibilityMode] = useState(false);

  const logDev = useCallback((message: string) => {
    if (settings.developerMode.enabled) {
        const timestamp = new Date().toLocaleTimeString();
        setDevLogs(prev => [...prev.slice(-20), `${timestamp}: ${message}`]);
    }
  }, [settings.developerMode.enabled]);
  
  useEffect(() => {
    logDev(`Initializing reader for URL: ${quest.epubUrl}`);
  }, [quest.epubUrl, logDev, compatibilityMode]); // Rerun on mode change
  
  const stopPickingElement = useCallback(() => {
      if (highlightedElementRef.current) {
          highlightedElementRef.current.style.outline = '';
          highlightedElementRef.current = null;
      }
      setIsPickingElement(false);
  }, []);

  // Effect to manage the element picker listeners inside the iframe
  useEffect(() => {
    // This is the key fix: use viewRef.current?.document which is the iframe's document
    const doc = viewRef.current?.document;
    if (!doc || !isPickingElement) {
        if (document.body.style.cursor === 'crosshair') {
            document.body.style.cursor = 'default';
        }
        return;
    }

    const highlight = (e: MouseEvent) => {
        unhighlight();
        const target = e.target as HTMLElement;
        if (target) {
            target.style.outline = '2px solid red';
            highlightedElementRef.current = target;
        }
    };

    const unhighlight = () => {
        if (highlightedElementRef.current) {
            highlightedElementRef.current.style.outline = '';
            highlightedElementRef.current = null;
        }
    };

    const inspect = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLElement;
        
        if (target) {
            const styles = window.getComputedStyle(target);
            const relevantStyles = {
                color: styles.color,
                backgroundColor: styles.backgroundColor,
                fontSize: styles.fontSize,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                width: styles.width,
                height: styles.height
            };
            logDev(`INSPECTED ELEMENT:\n  - Tag: <${target.tagName.toLowerCase()}>\n  - ID: ${target.id || 'none'}\n  - Classes: ${target.className || 'none'}\n  - Styles: ${JSON.stringify(relevantStyles, null, 2)}`);
        }
        
        stopPickingElement();
    };

    doc.body.addEventListener('mouseover', highlight);
    doc.body.addEventListener('mouseout', unhighlight);
    doc.body.addEventListener('click', inspect, { once: true });
    // Apply crosshair to the main document body, as the cursor style propagates to the iframe unless overridden.
    document.body.style.cursor = 'crosshair';

    return () => {
        doc.body.removeEventListener('mouseover', highlight);
        doc.body.removeEventListener('mouseout', unhighlight);
        doc.body.removeEventListener('click', inspect);
        document.body.style.cursor = 'default';
        unhighlight();
    };
  }, [isPickingElement, logDev, stopPickingElement]);


  const userProgress = useMemo(() => {
      if (!currentUser) return null;
      return liveQuest.readingProgress?.[currentUser.id];
  }, [liveQuest.readingProgress, currentUser]);

  useEffect(() => {
    if (userProgress?.bookmarks) {
        setBookmarks(userProgress.bookmarks);
    }
  }, [userProgress]);


  const closeReader = useCallback(() => {
    stopPickingElement();
    setReadingEpubQuest(null);
  }, [setReadingEpubQuest, stopPickingElement]);

  const handleLocationChanged = (cfi: string) => {
      setCurrentLocation(cfi);
      logDev(`Location changed to ${cfi}`);
      if (currentUser) {
          updateReadingProgress(quest.id, currentUser.id, { locationCfi: cfi });
      }
  };

  const handleTocChanged = (newToc: NavItem[]) => {
      setToc(newToc);
      logDev(`TOC loaded with ${newToc.length} items.`);
  };
  
  useEffect(() => {
    const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
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
  
  const handleTocClick = (href: string) => {
    renditionRef.current?.goTo(href);
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
      <div ref={panelRef} data-bug-reporter-ignore className="fixed inset-0 bg-stone-900 z-[110] flex flex-col items-center justify-center epub-container">
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
            <div className="h-full">
                <ReactReader
                    key={compatibilityMode ? 'paginated' : 'scrolled'} // Force re-mount on mode change
                    url={quest.epubUrl!}
                    location={userProgress?.locationCfi}
                    locationChanged={handleLocationChanged}
                    tocChanged={handleTocChanged}
                    epubOptions={{
                        flow: compatibilityMode ? 'paginated' : 'scrolled-doc',
                        manager: 'default'
                    }}
                    getRendition={(rendition) => {
                        logDev("Rendition object received.");
                        renditionRef.current = rendition;
                        
                        rendition.on('started', () => {
                            logDev('Rendition started.');
                            // Start a timeout to catch stalls
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            timeoutRef.current = window.setTimeout(() => {
                                logDev("RENDERING TIMED OUT. The EPUB may be corrupted or contain unsupported formatting.");
                                setError("Rendering timed out. The EPUB may be corrupted or contain unsupported formatting.");
                                setReaderState('error');
                            }, 10000); // 10 second timeout
                        });

                        rendition.on('rendered', (section: any, view: any) => {
                            logDev(`Section rendered: ${section.href}`);
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            setReaderState('success');
                            setIsRendered(true);
                            viewRef.current = view;
                        });

                        rendition.on('displayError', (err: any) => {
                             logDev(`Display Error: ${err.message || err}`);
                             if (timeoutRef.current) clearTimeout(timeoutRef.current);
                             setError(`Display Error: ${err.message || 'Unknown render error.'}`);
                             setReaderState('error');
                        });
                    }}
                    loadingView={<></>} // Hide default loader; we use our own.
                />
            </div>

            {readerState !== 'success' && (
                 <div className="absolute inset-0 z-40 bg-stone-900 flex flex-col items-center justify-center gap-4 text-center p-8">
                    {readerState === 'loading' && (
                        <>
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                            <p className="text-xl font-semibold text-white">Summoning the Scribe...</p>
                        </>
                    )}
                    {readerState === 'error' && (
                        <>
                            <p className="text-2xl font-semibold text-red-400">Failed to load EPUB file.</p>
                            <div className="prose prose-sm prose-invert text-stone-300">
                                <p>{error}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className={`absolute top-0 bottom-0 left-0 w-72 bg-stone-800/95 backdrop-blur-sm z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${activePanel ? 'translate-x-0' : '-translate-x-full'}`}>
                <PanelContent />
            </div>
             {activePanel && <div onClick={() => setActivePanel(null)} className="absolute inset-0 bg-black/50 z-30" />}
        </div>
      </div>
      
      {settings.developerMode.enabled && (
          <div className="fixed bottom-4 left-4 z-[111] bg-black/80 text-white rounded-lg font-mono text-xs border border-yellow-500 transition-all duration-300" data-bug-reporter-ignore>
              <div className="flex justify-between items-center p-2">
                  <h4 className="font-bold text-yellow-300">EPUB Reader Dev Info</h4>
                  <button onClick={() => setIsDevPanelCollapsed(!isDevPanelCollapsed)} className="p-1 hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {isDevPanelCollapsed ? '+' : '-'}
                  </button>
              </div>
              {!isDevPanelCollapsed && (
                  <div className="p-2 border-t border-yellow-500/50 max-w-sm">
                      <div className="space-y-2">
                        <ToggleSwitch
                            enabled={compatibilityMode}
                            setEnabled={(enabled) => {
                                logDev(`Switching to ${enabled ? 'Compatibility (Paginated)' : 'Standard (Scrolled)'} rendering mode.`);
                                setCompatibilityMode(enabled);
                                setReaderState('loading');
                                setError(null);
                                setDevLogs([]);
                                setIsRendered(false);
                            }}
                            label="Compatibility Mode"
                        />
                        <p className="text-xs text-stone-500 -mt-2">If a book fails to display, try enabling this mode. It uses a different rendering method that may be more stable.</p>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => setIsPickingElement(p => !p)} 
                            className="w-full flex items-center gap-2"
                            disabled={!isRendered}
                        >
                            <Pipette className="w-4 h-4"/>
                            {isPickingElement ? 'Cancel Inspection' : 'Inspect Element'}
                        </Button>
                      </div>
                      <div className="max-h-60 overflow-y-auto mt-2">
                        <p><span className="font-semibold">URL:</span> <span className="text-cyan-400 break-all">{quest.epubUrl}</span></p>
                        <p><span className="font-semibold">Location:</span> <span className="text-cyan-400">{currentLocation || 'N/A'}</span></p>
                        <hr className="my-2 border-stone-600"/>
                        <h5 className="font-semibold mb-1">Logs:</h5>
                        <div className="space-y-1">
                            {devLogs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)}
                        </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {showAddBookmark && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[120]">
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
