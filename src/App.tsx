import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './components/user-interface/Button';

declare var ePub: any; // Declare ePub to use it from the CDN script

const EpubReader: React.FC = () => {
    const [book, setBook] = useState<any>(null);
    const [rendition, setRendition] = useState<any>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const viewerRef = useRef<HTMLDivElement>(null);

    const bookKey = "epub-reader-current-book";

    useEffect(() => {
        const storedBookmarks = localStorage.getItem(`${bookKey}-bookmarks`);
        if (storedBookmarks) {
            setBookmarks(JSON.parse(storedBookmarks));
        }
    }, []);

    useEffect(() => {
        if (book) {
            const rendition = book.renderTo(viewerRef.current!, {
                width: "100%",
                height: "100%",
                flow: "paginated",
                spread: "auto"
            });

            rendition.on("relocated", (location: any) => {
                const cfi = location.start.cfi;
                localStorage.setItem(bookKey, cfi);
                setLocation(cfi);

                book.locations.generate(1000).then(() => {
                    const currentLocation = book.locations.locationFromCfi(cfi);
                    const percent = book.locations.percentageFromCfi(cfi);
                    setProgress(Math.round(percent * 100));
                });
            });

            const savedLocation = localStorage.getItem(bookKey);
            rendition.display(savedLocation || undefined);
            setRendition(rendition);

        }
    }, [book]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const newBook = ePub(event.target.result as ArrayBuffer);
                    setBook(newBook);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };
    
    const prevPage = () => rendition?.prev();
    const nextPage = () => rendition?.next();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevPage();
            if (e.key === "ArrowRight") nextPage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [rendition]);

    const addBookmark = () => {
        if (location && !bookmarks.includes(location)) {
            const newBookmarks = [...bookmarks, location];
            setBookmarks(newBookmarks);
            localStorage.setItem(`${bookKey}-bookmarks`, JSON.stringify(newBookmarks));
        }
    };

    const removeBookmark = (cfi: string) => {
        const newBookmarks = bookmarks.filter(bm => bm !== cfi);
        setBookmarks(newBookmarks);
        localStorage.setItem(`${bookKey}-bookmarks`, JSON.stringify(newBookmarks));
    }
    
    const goToBookmark = (cfi: string) => {
        rendition?.display(cfi);
        setShowBookmarks(false);
    }

    return (
        <div className="h-screen w-screen bg-stone-800 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-4xl h-[90vh] bg-white shadow-2xl relative">
                {!book ? (
                     <div className="flex flex-col items-center justify-center h-full">
                        <h1 className="text-3xl font-bold text-stone-700">EPUB Reader</h1>
                        <p className="text-stone-500 mt-2 mb-6">Select an EPUB file to begin reading.</p>
                        <Button onClick={() => document.getElementById('epub-file-input')?.click()}>
                            Load Book
                        </Button>
                        <input type="file" id="epub-file-input" accept=".epub" onChange={handleFileChange} className="hidden" />
                    </div>
                ) : (
                    <>
                        <div id="viewer" ref={viewerRef} />
                        <div id="prev" className="arrow" onClick={prevPage}></div>
                        <div id="next" className="arrow" onClick={nextPage}></div>

                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                             <Button variant="secondary" onClick={() => setShowBookmarks(p => !p)} className="h-10 w-10 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                </svg>
                             </Button>
                             <Button variant="secondary" onClick={addBookmark} className="h-10 w-10 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                             </Button>
                        </div>

                         {showBookmarks && (
                            <div className="absolute top-16 right-4 bg-white shadow-lg rounded-md p-4 w-64 border z-20">
                                <h3 className="font-bold text-stone-800 mb-2">Bookmarks</h3>
                                <ul className="max-h-64 overflow-y-auto">
                                    {bookmarks.length > 0 ? bookmarks.map((bm, i) => (
                                        <li key={bm} className="text-sm text-stone-600 hover:bg-stone-100 p-2 rounded-md flex justify-between items-center">
                                            <button onClick={() => goToBookmark(bm)} className="text-left flex-grow">
                                                Bookmark {i + 1}
                                            </button>
                                            <button onClick={() => removeBookmark(bm)} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
                                        </li>
                                    )) : <p className="text-xs text-stone-500">No bookmarks yet.</p>}
                                </ul>
                            </div>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                            {progress}%
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return <EpubReader />;
};

export default App;