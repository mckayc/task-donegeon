export type SWLogEntry = {
    timestamp: string;
    event: string;
    details?: any;
};

type Subscriber = (logs: SWLogEntry[]) => void;

class SWLogger {
    private logs: SWLogEntry[] = [];
    private subscribers: Subscriber[] = [];

    log(event: string, details?: any) {
        const newLog: SWLogEntry = {
            timestamp: new Date().toISOString(),
            event,
            details: details ? JSON.stringify(details, null, 2) : undefined,
        };
        // Keep logs to a reasonable size
        this.logs = [...this.logs.slice(-99), newLog];
        this.notify();
    }

    getLogs(): SWLogEntry[] {
        return [...this.logs];
    }

    subscribe(callback: Subscriber): () => void {
        this.subscribers.push(callback);
        callback(this.getLogs()); // Immediately send current logs
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    private notify() {
        this.subscribers.forEach(sub => sub(this.getLogs()));
    }
}

export const swLogger = new SWLogger();
