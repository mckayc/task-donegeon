import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { BugReport, BugReportLogEntry, BugReportType } from '../types';
import { useAppDispatch, useAppState } from './AppContext';
import { bugLogger } from '../utils/bugLogger';

// State
interface DeveloperState {
  isRecording: boolean;
  isPickingElement: boolean;
  logs: BugReportLogEntry[];
  activeBugId: string | null;
  detailedBugReportId: string | null;
}

// Dispatch
interface DeveloperDispatch {
  startRecording: (bugId?: string) => void;
  stopRecording: (title: string, reportType: BugReportType) => void;
  addLogEntry: (entry: Omit<BugReportLogEntry, 'timestamp'>) => void;
  startPickingElement: (onPick: (elementInfo: any) => void) => void;
  stopPickingElement: () => void;
  setDetailedBugReportId: (bugId: string | null) => void;
}

const DeveloperStateContext = createContext<DeveloperState | undefined>(undefined);
const DeveloperDispatchContext = createContext<DeveloperDispatch | undefined>(undefined);

export const DeveloperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [logs, setLogs] = useState<BugReportLogEntry[]>([]);
  const [activeBugId, setActiveBugId] = useState<string | null>(null);
  const [detailedBugReportId, setDetailedBugReportId] = useState<string | null>(null);

  const [onPickCallback, setOnPickCallback] = useState<((info: any) => void) | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const { addBugReport, updateBugReport } = useAppDispatch();
  const { bugReports } = useAppState();

  useEffect(() => {
    const unsubscribe = bugLogger.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  const addLogEntry = useCallback((entry: Omit<BugReportLogEntry, 'timestamp'>) => {
    bugLogger.add(entry);
  }, []);

  const stopPickingElement = useCallback(() => {
      if (highlightedElement) {
          highlightedElement.style.outline = '';
          setHighlightedElement(null);
      }
      setIsPickingElement(false);
      setOnPickCallback(null);
  }, [highlightedElement]);

  const startRecording = useCallback((bugId?: string) => {
    let initialLogs: BugReportLogEntry[] = [];
    if (bugId) {
        const existingReport = bugReports.find(b => b.id === bugId);
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
  }, [bugReports]);

  const stopRecording = useCallback((title: string, reportType: BugReportType) => {
    const finalLogs = bugLogger.stop();
    
    if (activeBugId) {
        updateBugReport(activeBugId, { logs: finalLogs });
        addLogEntry({type: 'STATE_CHANGE', message: 'Recording stopped. Report updated.'});
    } else {
        const newReport = {
            title,
            reportType,
            createdAt: new Date().toISOString(),
            logs: finalLogs,
        };
        addBugReport(newReport);
    }

    setIsRecording(false);
    setActiveBugId(null);
    stopPickingElement();
  }, [addBugReport, updateBugReport, stopPickingElement, activeBugId, addLogEntry]);

  const startPickingElement = useCallback((onPick: (elementInfo: any) => void) => {
    setIsPickingElement(true);
    setOnPickCallback(() => onPick);
  }, []);

  useEffect(() => {
    if (!isPickingElement || !onPickCallback) return;

    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (target?.closest('[data-bug-reporter-ignore]')) {
             if (highlightedElement) {
                highlightedElement.style.outline = '';
                setHighlightedElement(null);
            }
            return;
        }

        if (highlightedElement && highlightedElement !== target) {
            highlightedElement.style.outline = '';
        }

        if (target) {
            target.style.outline = '3px dashed red';
            target.style.outlineOffset = '2px';
            setHighlightedElement(target);
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
            classes: target.className || undefined,
            text: target.innerText?.substring(0, 50) || undefined,
        };

        onPickCallback(elementInfo);
        stopPickingElement();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('click', handleClick, { capture: true });
        if (highlightedElement) {
            highlightedElement.style.outline = '';
        }
    };
  }, [isPickingElement, onPickCallback, stopPickingElement, highlightedElement]);


  return (
    <DeveloperStateContext.Provider value={{ isRecording, isPickingElement, logs, activeBugId, detailedBugReportId }}>
      <DeveloperDispatchContext.Provider value={{ startRecording, stopRecording, addLogEntry, startPickingElement, stopPickingElement, setDetailedBugReportId }}>
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

export const useDeveloper = (): DeveloperDispatch & DeveloperState => {
  const stateContext = useContext(DeveloperStateContext);
  const dispatchContext = useContext(DeveloperDispatchContext);
  if (stateContext === undefined || dispatchContext === undefined) {
    throw new Error('useDeveloper must be used within a DeveloperProvider');
  }
  return { ...stateContext, ...dispatchContext };
};