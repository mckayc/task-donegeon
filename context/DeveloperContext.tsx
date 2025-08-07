import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { BugReport, BugReportLogEntry, BugReportStatus } from '../types';
import { useAppDispatch } from './AppContext';

// State
interface DeveloperState {
  isRecording: boolean;
  isPickingElement: boolean;
}

// Dispatch
interface DeveloperDispatch {
  startRecording: () => void;
  stopRecording: (title: string) => void;
  addLogEntry: (entry: Omit<BugReportLogEntry, 'timestamp'>) => void;
  startPickingElement: (onPick: (elementInfo: any) => void) => void;
  stopPickingElement: () => void;
}

const DeveloperStateContext = createContext<DeveloperState | undefined>(undefined);
const DeveloperDispatchContext = createContext<DeveloperDispatch | undefined>(undefined);

export const DeveloperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [currentReportLogs, setCurrentReportLogs] = useState<BugReportLogEntry[]>([]);
  const [onPickCallback, setOnPickCallback] = useState<(info: any) => void>(() => () => {});

  const appDispatch = useAppDispatch();

  const startRecording = useCallback(() => {
    setCurrentReportLogs([]);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((title: string) => {
    const newReport: Omit<BugReport, 'id'> = {
        title,
        createdAt: new Date().toISOString(),
        status: BugReportStatus.New,
        logs: currentReportLogs,
    };
    appDispatch.addBugReport(newReport);
    setIsRecording(false);
    setCurrentReportLogs([]);
  }, [currentReportLogs, appDispatch]);

  const addLogEntry = useCallback((entry: Omit<BugReportLogEntry, 'timestamp'>) => {
    if (!isRecording) return;
    setCurrentReportLogs(prev => [...prev, { ...entry, timestamp: new Date().toISOString() }]);
  }, [isRecording]);

  const startPickingElement = useCallback((onPick: (elementInfo: any) => void) => {
    setIsPickingElement(true);
    setOnPickCallback(() => onPick);
  }, []);

  const stopPickingElement = useCallback(() => {
    setIsPickingElement(false);
  }, []);

  const handleElementPick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPickingElement) return;
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    const elementInfo = {
      tag: target.tagName.toLowerCase(),
      id: target.id || undefined,
      classes: target.className || undefined,
      text: target.innerText?.substring(0, 50) || undefined,
    };

    onPickCallback(elementInfo);
    stopPickingElement();
  }, [isPickingElement, onPickCallback, stopPickingElement]);

  const handleElementHighlight = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPickingElement) return;
      const target = e.target as HTMLElement;
      target.style.outline = '2px solid #3b82f6';
      target.style.outlineOffset = '2px';
  }, [isPickingElement]);

  const handleElementUnHighlight = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPickingElement) return;
      (e.target as HTMLElement).style.outline = '';
  }, [isPickingElement]);

  return (
    <DeveloperStateContext.Provider value={{ isRecording, isPickingElement }}>
      <DeveloperDispatchContext.Provider value={{ startRecording, stopRecording, addLogEntry, startPickingElement, stopPickingElement }}>
        {children}
        {isPickingElement && (
            <div 
                className="fixed inset-0 z-[1000] cursor-crosshair"
                onClick={handleElementPick}
                onMouseOver={handleElementHighlight}
                onMouseOut={handleElementUnHighlight}
            />
        )}
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