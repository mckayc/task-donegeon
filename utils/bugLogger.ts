import { BugReportLogEntry } from '../types';

type Subscriber = (logs: BugReportLogEntry[]) => void;

class BugLogger {
    private isRecordingGlobally = false;
    private globalLogs: BugReportLogEntry[] = [];
    private subscribers: Subscriber[] = [];

    subscribe(callback: Subscriber) {
        this.subscribers.push(callback);
        // Immediately provide the current logs to the new subscriber
        callback([...this.globalLogs]);
        return () => this.unsubscribe(callback);
    }

    private unsubscribe(callback: Subscriber) {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
    }

    private notify() {
        this.subscribers.forEach(sub => sub([...this.globalLogs]));
    }

    start() {
        this.isRecordingGlobally = true;
        this.globalLogs = [];
        this.notify();
    }

    stop(): BugReportLogEntry[] {
        this.isRecordingGlobally = false;
        const finalLogs = [...this.globalLogs];
        return finalLogs;
    }

    add(entry: Omit<BugReportLogEntry, 'timestamp'>) {
        if (this.isRecordingGlobally) {
            const newEntry = { ...entry, timestamp: new Date().toISOString() };
            this.globalLogs.push(newEntry);
            this.notify();
        }
    }

    isRecording(): boolean {
        return this.isRecordingGlobally;
    }

    getLogs(): BugReportLogEntry[] {
        return [...this.globalLogs];
    }
}

export const bugLogger = new BugLogger();
