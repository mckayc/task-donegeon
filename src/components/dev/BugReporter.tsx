
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useDeveloper } from '../../context/DeveloperContext';
import { ChevronDownIcon, ChevronUpIcon } from '../user-interface/Icons';
import { BugReportType } from '../../../types';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import ToggleSwitch from '../user-interface/ToggleSwitch';

const BugReporter: React.FC = () => {
    const { isRecording, startRecording, stopRecording, addLogEntry, isPickingElement, startPickingElement, stopPickingElement, logs, activeBugId, trackClicks, setTrackClicks, trackElementDetails, setTrackElementDetails } = useDeveloper();
    const { bugReports } = useSystemState();
    const { currentUser } = useAuthState();

    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [reportType, setReportType] = useState<BugReportType>(BugReportType.Bug);
    const [isLogVisible, setIsLogVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [activeTab, setActiveTab] = useState<'create' | 'continue'>('create');
    const logContainerRef = useRef<HTMLDivElement>(null);

    const [serverLogCountdown, setServerLogCountdown] = useState(0);
    const [isServerLogging, setIsServerLogging] = useState(false);
    const serverLogIntervalRef = useRef<number | null>(null);

    const activeReportTitle = useMemo(() => {
        if (!isRecording) return '';
        if (activeBugId) {
            return bugReports.find(b => b.id === activeBugId)?.title || 'Continuing Report...';
        }
        return title;
    }, [isRecording, activeBugId, title, bugReports]);

    useEffect(() => {
        if (isLogVisible && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isLogVisible]);
    
    useEffect(() => {
        // Cleanup interval on unmount
        return () => {
            if (serverLogIntervalRef.current) {
                clearInterval(serverLogIntervalRef.current);
            }
        };
    }, []);

    const handleStartServerLog = async (duration: number) => {
        if (!currentUser) return;

        try {
            const response = await fetch('/api/system/log-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, duration }),
            });

            if (!response.ok) {
                throw new Error('Failed to start server logging.');
            }

            setIsServerLogging(true);
            setServerLogCountdown(duration);
            
            addLogEntry({
                type: 'ACTION',
                message: `Started server-side activity logging for ${duration} seconds.`
            });

            if (serverLogIntervalRef.current) {
                clearInterval(serverLogIntervalRef.current);
            }

            serverLogIntervalRef.current = window.setInterval(() => {
                setServerLogCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(serverLogIntervalRef.current!);
                        setIsServerLogging(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            addLogEntry({
                type: 'NOTE',
                message: `Error starting server log: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    };

    const handleStart = () => {
        if (title.trim()) {
            startRecording();
            addLogEntry({ type: 'STATE_CHANGE', message: `Report type set to: ${reportType}` });
        }
    };
    
    const handleContinue = (bugId: string) => {
        startRecording(bugId);
    };

    const handleStop = () => {
        stopRecording(title, reportType);
        setTitle('');
        setNote('');
        setReportType(BugReportType.Bug);
        setIsLogVisible(false);
        setIsMinimized(false);
        if (serverLogIntervalRef.current) {
            clearInterval(serverLogIntervalRef.current);
        }
        setIsServerLogging(false);
        setServerLogCountdown(0);
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

    const handleMinimizeToggle = () => {
        if (isRecording) {
            addLogEntry({ type: 'ACTION', message: isMinimized ? 'Expanded bug reporter bar.' : 'Minimized bug reporter bar.' });
        }
        setIsMinimized(!isMinimized);
    };
    
    const inProgressReports = useMemo(() => bugReports.filter(b => b.status === 'In Progress'), [bugReports]);

    if (isRecording) {
        if (isMinimized) {
            return (
                <div data-bug-reporter-ignore className="fixed bottom-4 right-4 bg-red-900/90 border-2 border-red-600 shadow-2xl z-[99] backdrop-blur-sm rounded-full flex items-center gap-3 p-2 transition-all duration-300">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse ml-2"></div>
                    <span className="font-bold text-white text-sm pr-2 truncate max-w-[200px]" title={`Recording: ${activeReportTitle}`}>Recording: {activeReportTitle}</span>
                    <Button variant="ghost" size="icon" onClick={handleMinimizeToggle} className="h-8 w-8 !rounded-full !bg-white/10 hover:!bg-white/20">
                        <ChevronUpIcon className="w-5 h-5 text-white" />
                    </Button>
                </div>
            );
        }

        return (
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-white">Recording: {activeReportTitle}</span>
                         <Button variant="secondary" size="sm" className="!text-xs !py-1 !px-2 !h-auto" onClick={() => {
                            if (isRecording) {
                                addLogEntry({ type: 'ACTION', message: isLogVisible ? 'Hid bug reporter log.' : 'Showed bug reporter log.' });
                            }
                            setIsLogVisible(p => !p)
                         }}>
                            {isLogVisible ? 'Hide Log' : 'Show Log'}
                        </Button>
                    </div>

                    <div className="flex-grow flex items-center gap-4">
                        <form onSubmit={handleAddNote} className="flex-grow flex items-center gap-2">
                            <Input 
                                value={note} 
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note to the log..."
                                className="h-10"
                            />
                            <Button type="submit" variant="secondary" className="h-10">Add Note</Button>
                        </form>
                         <Button type="button" variant="secondary" onClick={handleElementPick} className={`h-10 ${isPickingElement ? '!bg-blue-600 text-white' : ''} flex-shrink-0`}>
                            {isPickingElement ? 'Cancel Pick' : 'Pick Element'}
                        </Button>
                        <div className="flex items-center gap-3 pl-4 border-l border-red-700/60 flex-shrink-0">
                            <ToggleSwitch
                                label="Track Clicks"
                                enabled={trackClicks}
                                setEnabled={(enabled) => {
                                    setTrackClicks(enabled);
                                    addLogEntry({ type: 'STATE_CHANGE', message: `Click tracking ${enabled ? 'enabled' : 'disabled'}.` });
                                }}
                            />
                            <div className={!trackClicks ? 'opacity-50' : ''}>
                                <ToggleSwitch
                                    label="Log Details"
                                    enabled={trackElementDetails && trackClicks}
                                    setEnabled={(enabled) => {
                                        if (!trackClicks) return;
                                        setTrackElementDetails(enabled);
                                        addLogEntry({ type: 'STATE_CHANGE', message: `Element detail logging ${enabled ? 'enabled' : 'disabled'}.` });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l border-red-700/60 pl-4 flex-shrink-0">
                        <p className="text-xs font-semibold text-white/80 mb-1">Server-Side Logging</p>
                        {isServerLogging ? (
                            <div className="flex items-center gap-2 h-10">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-mono font-semibold">Active: {serverLogCountdown}s</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 h-10">
                                <Button type="button" variant="secondary" onClick={() => handleStartServerLog(15)} className="!text-xs !py-1 !px-2 !h-auto">15s</Button>
                                <Button type="button" variant="secondary" onClick={() => handleStartServerLog(30)} className="!text-xs !py-1 !px-2 !h-auto">30s</Button>
                                <Button type="button" variant="secondary" onClick={() => handleStartServerLog(60)} className="!text-xs !py-1 !px-2 !h-auto">60s</Button>
                                <Button type="button" variant="secondary" onClick={() => handleStartServerLog(120)} className="!text-xs !py-1 !px-2 !h-auto">120s</Button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button onClick={handleStop} className="!bg-red-600 hover:!bg-red-500 text-white h-10">Stop Recording</Button>
                        <Button variant="ghost" size="icon" onClick={handleMinimizeToggle} className="h-10 w-10 !rounded-full !bg-white/10 hover:!bg-white/20">
                            <ChevronDownIcon className="w-6 h-6 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (isMinimized) {
         return (
             <div data-bug-reporter-ignore className="fixed bottom-4 right-4 bg-stone-900/90 border-2 border-stone-700 shadow-2xl z-[99] backdrop-blur-sm rounded-full flex items-center gap-3 p-2 transition-all duration-300">
                <span className="font-bold text-white text-lg pl-2" title="Report a Bug">🐞</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)} className="h-8 w-8 !rounded-full !bg-white/10 hover:!bg-white/20">
                    <ChevronUpIcon className="w-5 h-5 text-white" />
                </Button>
            </div>
        )
    }

    return (
        <div data-bug-reporter-ignore className="fixed bottom-0 left-0 right-0 bg-stone-900/80 border-t border-stone-700/60 shadow-2xl z-[99] backdrop-blur-sm flex flex-col">
            <div className="px-4 pt-2 flex justify-between items-center">
                <nav className="-mb-px flex space-x-4">
                    <button onClick={() => setActiveTab('create')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'create' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                        Create New Report
                    </button>
                    <button onClick={() => setActiveTab('continue')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'continue' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                        Continue Recording ({inProgressReports.length})
                    </button>
                </nav>
                 <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="h-10 w-10 !rounded-full !bg-white/10 hover:!bg-white/20">
                    <ChevronDownIcon className="w-6 h-6 text-white" />
                </Button>
            </div>
            
            <div className="p-4">
                 {activeTab === 'create' && (
                     <div className="flex items-center gap-2">
                        <Input as="select" value={reportType} onChange={e => setReportType(e.target.value as BugReportType)} className="w-48 h-10">
                            {Object.values(BugReportType).map(type => <option key={String(type)} value={String(type)}>{String(type)}</option>)}
                        </Input>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title of the new report..."
                            className="flex-grow h-10"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && title.trim()) {
                                    e.preventDefault();
                                    handleStart();
                                }
                            }}
                        />
                        <Button onClick={handleStart} disabled={!title.trim()} className="h-10">Start Recording</Button>
                    </div>
                 )}
                 {activeTab === 'continue' && (
                    <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                         {inProgressReports.length > 0 ? inProgressReports.map(report => (
                             <div key={report.id} className="p-2 bg-stone-800/50 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-stone-200">{report.title}</p>
                                    <p className="text-xs text-stone-400">Created: {new Date(report.createdAt).toLocaleDateString()}</p>
                                </div>
                                <Button size="sm" onClick={() => handleContinue(report.id)}>Continue</Button>
                             </div>
                         )) : <p className="text-center text-stone-400 py-4">No reports are currently "In Progress".</p>}
                    </div>
                 )}
            </div>
        </div>
    );
};

export default BugReporter;
