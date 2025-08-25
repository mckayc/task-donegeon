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

    start(initialLogs: BugReportLogEntry[] = []) {
        this.isRecordingGlobally = true;
        this.globalLogs = [...initialLogs];
        this.notify();
    }

    stop(): BugReportLogEntry[] {
        this.isRecordingGlobally = false;
        const finalLogs = [...this.globalLogs];
        return finalLogs;
    }

    add(entry: Omit<BugReportLogEntry, 'timestamp'>) {
        if (!this.isRecordingGlobally) return;

        const lastLog = this.globalLogs.length > 0 ? this.globalLogs[this.globalLogs.length - 1] : null;

        // Check for duplication of type and message. Element info is too complex to compare simply.
        if (lastLog && lastLog.type === entry.type && lastLog.message === entry.message && !lastLog.element && !entry.element) {
            const match = lastLog.message.match(/ \[\d+\]$/);
            if (match) {
                const count = parseInt(match[0].slice(2, -1)) + 1;
                lastLog.message = lastLog.message.replace(/ \[\d+\]$/, ` [${count}]`);
            } else {
                lastLog.message = `${lastLog.message} [2]`;
            }
            lastLog.timestamp = new Date().toISOString();
        } else {
            const newEntry = { ...entry, timestamp: new Date().toISOString() };
            this.globalLogs.push(newEntry);
        }
        
        this.notify();
    }

    isRecording(): boolean {
        return this.isRecordingGlobally;
    }

    getLogs(): BugReportLogEntry[] {
        return [...this.globalLogs];
    }
}

export const bugLogger = new BugLogger();
