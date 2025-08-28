import React, { useState, useEffect, useRef } from 'react';
import { SWLogEntry, swLogger } from '../../utils/swLogger';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

const ServiceWorkerLogger: React.FC = () => {
    const { checkForUpdate } = useSystemDispatch();
    const [logs, setLogs] = useState<SWLogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = swLogger.subscribe(setLogs);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const getEventColor = (event: string) => {
        if (event.includes('SUCCESS') || event.includes('READY') || event.includes('INSTALLED')) return 'text-green-400';
        if (event.includes('FAILED') || event.includes('ERROR')) return 'text-red-400';
        if (event.includes('WAITING') || event.includes('FOUND')) return 'text-yellow-400';
        return 'text-sky-400';
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-stone-400">
                    Real-time logs for the application's update service.
                </p>
                <Button onClick={checkForUpdate} variant="secondary" size="sm">
                    Check for Updates
                </Button>
            </div>
            <div
                ref={logContainerRef}
                className="h-64 bg-stone-900/50 p-3 rounded-lg font-mono text-xs text-stone-300 overflow-y-auto"
            >
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <div key={log.timestamp} className="border-b border-stone-700/50 py-1">
                            <span className="text-stone-500 mr-2">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={`font-bold ${getEventColor(log.event)}`}>
                                {log.event}
                            </span>
                            {log.details && (
                                <pre className="text-stone-400 whitespace-pre-wrap pl-4 text-xs">
                                    {log.details}
                                </pre>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-center text-stone-500 pt-24">No service worker events logged yet...</p>
                )}
            </div>
        </div>
    );
};

export default ServiceWorkerLogger;
