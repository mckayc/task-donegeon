import { BugReportLogEntry } from '../types';

let isRecordingGlobally = false;
let globalLogs: BugReportLogEntry[] = [];

export const bugLogger = {
  start: () => {
    isRecordingGlobally = true;
    globalLogs = [];
  },
  stop: (): BugReportLogEntry[] => {
    isRecordingGlobally = false;
    return globalLogs;
  },
  add: (entry: Omit<BugReportLogEntry, 'timestamp'>) => {
    if (isRecordingGlobally) {
      const newEntry = { ...entry, timestamp: new Date().toISOString() };
      globalLogs.push(newEntry);
    }
  },
  isRecording: (): boolean => isRecordingGlobally,
};
