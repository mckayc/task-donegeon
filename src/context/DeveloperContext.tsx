import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { BugReport, BugReportLogEntry, BugReportStatus, BugReportType, LogEntry } from '../types';
import { useSystemDispatch, useSystemState } from './SystemContext';
import { bugLogger } from '../utils/bugLogger';

// State
interface DeveloperState {
  isRecording: boolean;
  isPickingElement: boolean;
  logs: BugReportLogEntry[];
  activeBugId: string | null;
  trackClicks: boolean;
  trackElementDetails: boolean;
  epubLogs: LogEntry[];
}

// Dispatch
interface DeveloperDispatch {
  startRecording: (bugId?: string) => void;
  stopRecording: (title: string, reportType: BugReportType) => void;
  cancelRecording: () => void;
  addLogEntry: (entry: Omit<BugReportLogEntry, 'timestamp'>) => void;
  startPickingElement: (onPick: (elementInfo: any) => void) => void;
  stopPickingElement: () => void;
  setTrackClicks: (enabled: boolean) => void;
  setTrackElementDetails: (enabled: boolean) => void;
  addEpubLog: (log: Omit<LogEntry, 'timestamp'>) => void;
  clearEpubLogs: () => void;
}

const DeveloperStateContext = createContext<DeveloperState | undefined>(undefined);
const DeveloperDispatchContext = createContext<DeveloperDispatch | undefined>(undefined);

export const DeveloperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [logs, setLogs] = useState<BugReportLogEntry[]>([]);
  const [activeBugId, setActiveBugId] = useState<string | null>(null);
  const [trackClicks, setTrackClicks] = useState(true);
  const [trackElementDetails, setTrackElementDetails] = useState(false);
  const [epubLogs, setEpubLogs] = useState<LogEntry[]>([]);

  const onPickCallbackRef = useRef<((info: any) => void) | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);

  const { addBugReport, updateBugReport } = useSystemDispatch();
  const { bugReports } = useSystemState();
  
  const actionsDispatchRef = useRef({ addBugReport, updateBugReport });
  useEffect(() => { actionsDispatchRef.current = { addBugReport, updateBugReport }; }, [addBugReport, updateBugReport]);

  const bugReportsRef = useRef(bugReports);
  useEffect(() => { bugReportsRef.current = bugReports; }, [bugReports]);

  const activeBugIdRef = useRef(activeBugId);
  useEffect(() => { activeBugIdRef.current = activeBugId; }, [activeBugId]);

  useEffect(() => {
    const unsubscribe = bugLogger.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  const stopPickingElement = useCallback(() => {
      if (highlightedElementRef.current) {
          highlightedElementRef.current.style.outline = '';
          highlightedElementRef.current = null;
      }
      setIsPickingElement(false);
      onPickCallbackRef.current = null;
  }, []);

  const startRecording = useCallback((bugId?: string) => {
    let initialLogs: BugReportLogEntry[] = [];
    if (bugId) {
        const existingReport = bugReportsRef.current.find((b: BugReport) => b.id === bugId);
        if (existingReport) {
            initialLogs = existingReport.logs;
            setActiveBugId(bugId);
        }
    } else {
        setActiveBugId(null);
    }
    bugLogger.start(initialLogs);
    setIsRecording(true);
    bugLogger.add({ type: 'STATE_CHANGE', message: bugId ? `Continued recording for report ID ${bugId}.` : 'Recording started.' });
  }, []);

  const stopRecording = useCallback((title: string, reportType: BugReportType) => {
    bugLogger.add({type: 'STATE_CHANGE', message: 'Recording stopped. Report updated.'});
    const finalLogs = bugLogger.stop();
    
    if (activeBugIdRef.current) {
        actionsDispatchRef.current.updateBugReport(activeBugIdRef.current, { logs: finalLogs });
    } else {
        const newReport = {
            title,
            createdAt: new Date().toISOString(),
            logs: finalLogs,
            status: 'Open' as BugReportStatus,
            tags: [reportType],
        };
        actionsDispatchRef.current.addBugReport(newReport);
    }

    setIsRecording(false);
    setActiveBugId(null);
    stopPickingElement();
  }, [stopPickingElement]);

  const cancelRecording = useCallback(() => {
    bugLogger.stop(); // Stop and discard logs
    setIsRecording(false);
    setActiveBugId(null);
    stopPickingElement();
  }, [stopPickingElement]);

  const addLogEntry = useCallback((entry: Omit<BugReportLogEntry, 'timestamp'>) => {
    bugLogger.add(entry);
  }, []);
  
  const addEpubLog = useCallback((log: Omit<LogEntry, 'timestamp'>) => {
    setEpubLogs(prev => [...prev, { ...log, timestamp: new Date().toISOString() }]);
  }, []);

  const clearEpubLogs = useCallback(() => {
    setEpubLogs([]);
  }, []);

  const startPickingElement = useCallback((onPick: (elementInfo: any) => void) => {
    setIsPickingElement(true);
    onPickCallbackRef.current = onPick;
  }, []);

  useEffect(() => {
    if (!isPickingElement) return;

    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (target?.closest('[data-bug-reporter-ignore]')) {
             if (highlightedElementRef.current) {
                highlightedElementRef.current.style.outline = '';
                highlightedElementRef.current = null;
            }
            return;
        }

        if (highlightedElementRef.current && highlightedElementRef.current !== target) {
            highlightedElementRef.current.style.outline = '';
        }

        if (target) {
            target.style.outline = '3px dashed red';
            target.style.outlineOffset = '2px';
            highlightedElementRef.current = target;
        }
    };

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target as HTMLElement;
        if (target?.closest('[data-bug-reporter-ignore]')) {
            stopPickingElement();
            return;
        }

        const elementInfo = {
            tag: target.tagName.toLowerCase(),
            id: target.id || undefined,
            classes: typeof target.className === 'string' ? target.className : undefined,
            text: target.innerText?.substring(0, 50) || undefined,
        };

        if (onPickCallbackRef.current) {
            onPickCallbackRef.current(elementInfo);
        }
        stopPickingElement();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('click', handleClick, { capture: true });
        if (highlightedElementRef.current) {
            highlightedElementRef.current.style.outline = '';
        }
    };
  }, [isPickingElement, stopPickingElement]);

  const state = useMemo(() => ({ isRecording, isPickingElement, logs, activeBugId, trackClicks, trackElementDetails, epubLogs }), [isRecording, isPickingElement, logs, activeBugId, trackClicks, trackElementDetails, epubLogs]);

  const dispatch = useMemo(() => ({
    startRecording,
    stopRecording,
    cancelRecording,
    addLogEntry,
    startPickingElement,
    stopPickingElement,
    setTrackClicks,
    setTrackElementDetails,
    addEpubLog,
    clearEpubLogs,
  }), [startRecording, stopRecording, cancelRecording, addLogEntry, startPickingElement, stopPickingElement, setTrackClicks, setTrackElementDetails, addEpubLog, clearEpubLogs]);

  return (
    <DeveloperStateContext.Provider value={state}>
      <DeveloperDispatchContext.Provider value={dispatch}>
        {children}
      </DeveloperDispatchContext.Provider>
    </DeveloperStateContext.Provider>
  );
};

export const useDeveloperState = (): DeveloperState => {
  const context = useContext(DeveloperStateContext);
  if (context === undefined) throw new Error('useDeveloperState must be used within a DeveloperProvider');
  return context;
};

export const useDeveloperDispatch = (): DeveloperDispatch => {
    const context = useContext(DeveloperDispatchContext);
    if(context === undefined) throw new Error('useDeveloperDispatch must be used within a DeveloperProvider');
    return context;
};

export const useDeveloper = (): DeveloperDispatch & DeveloperState => {
  const stateContext = useContext(DeveloperStateContext);
  const dispatchContext = useContext(DeveloperDispatchContext);
  if (stateContext === undefined || dispatchContext === undefined) {
    throw new Error('useDeveloper must be used within a DeveloperProvider');
  }
  return { ...stateContext, ...dispatchContext };
};
