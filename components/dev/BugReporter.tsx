import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useDeveloper } from '../../context/DeveloperContext';

const BugReporter: React.FC = () => {
    const { isRecording, startRecording, stopRecording, addLogEntry, isPickingElement, startPickingElement, stopPickingElement, logs } = useDeveloper();
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [isLogVisible, setIsLogVisible] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLogVisible && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isLogVisible]);

    const handleStart = () => {
        if (title.trim()) {
            startRecording();
        }
    };
    
    const handleStop = () => {
        if (title.trim()) {
            stopRecording(title);
            setTitle('');
            setNote('');
            setIsLogVisible(false);
        }
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (note.trim()) {
            addLogEntry({ type: 'NOTE', message: note });
            setNote('');
        }
    };
    
    const handleElementPick = () => {
        if (isPickingElement) {
            stopPickingElement();
        } else {
            startPickingElement((elementInfo) => {
                addLogEntry({ type: 'ELEMENT_PICK', message: `User picked element: ${elementInfo.tag}`, element: elementInfo });
            });
        }
    };

    return (
        <>
            {isRecording ? (
                 <div data-bug-reporter-ignore className="fixed bottom-0 left-0 right-0 bg-red-900/80 border-t-2 border-red-600 shadow-2xl z-[99] backdrop-blur-sm flex flex-col transition-all duration-300">
                    {isLogVisible && (
                        <div ref={logContainerRef} className="h-48 bg-black/30 p-4 overflow-y-auto font-mono text-xs text-stone-300 scrollbar-hide">
                            {logs.map((log, index) => (
                                <div key={index} className="border-b border-red-800/50 py-1">
                                    <span className="text-red-300/70 mr-2">{new Date(log.timestamp).toLocaleTimeString()} [{log.type}]</span>
                                    <span className="text-stone-200 whitespace-pre-wrap">{log.message}</span>
                                    {log.element && (
                                        <div className="pl-4 text-sky-300 text-xs">
                                            <p>&lt;{log.element.tag} id="{log.element.id || ''}" class="{log.element.classes || ''}"&gt;</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-bold text-white">Recording Bug: {title}</span>
                             <Button variant="secondary" size="sm" className="!text-xs !py-1 !px-2 !h-auto" onClick={() => setIsLogVisible(p => !p)}>
                                {isLogVisible ? 'Hide Log' : 'Show Log'}
                            </Button>
                        </div>
                        <div className="flex-grow flex items-center gap-2">
                            <form onSubmit={handleAddNote} className="flex-grow flex items-center gap-2">
                                <Input 
                                    value={note} 
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a note to the log..."
                                    className="h-10"
                                />
                                 <Button type="button" variant="secondary" onClick={handleElementPick} className={`h-10 ${isPickingElement ? '!bg-blue-600 text-white' : ''}`}>
                                    {isPickingElement ? 'Cancel Pick' : 'Pick Element'}
                                </Button>
                                <Button type="submit" variant="secondary" className="h-10">Add Note</Button>
                            </form>
                        </div>
                        <Button onClick={handleStop} className="!bg-red-600 hover:!bg-red-500 text-white h-10">Stop Recording</Button>
                    </div>
                </div>
            ) : (
                <div data-bug-reporter-ignore className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-4 bg-stone-900/80 border border-stone-700/60 shadow-2xl p-3 rounded-full flex items-center gap-2 z-[99] backdrop-blur-sm">
                    <span className="font-bold text-stone-300 ml-2">🐞 Report a Bug:</span>
                    <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title of the bug report..."
                        className="w-80 h-10"
                    />
                    <Button onClick={handleStart} disabled={!title.trim()} className="h-10">
                        Start Recording
                    </Button>
                </div>
            )}
            {isPickingElement && (
                <div 
                    data-bug-reporter-ignore
                    className="fixed inset-0 z-[1000] cursor-crosshair pointer-events-none"
                />
            )}
        </>
    );
};

export default BugReporter;