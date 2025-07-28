import React from 'react';
import Button from './Button';

interface ConnectionErrorProps {
    error: string;
    onRetry: () => void;
}

const ConnectionError: React.FC<ConnectionErrorProps> = ({ error, onRetry }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
            <div className="max-w-xl w-full bg-stone-800 border border-red-700/60 rounded-xl shadow-2xl p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50 mb-4">
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.007H12v-.007z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-medieval text-red-300">Failed to Connect to Server</h2>
                <p className="mt-4 text-stone-300">
                    The application could not retrieve data from the server. This might be a temporary issue.
                </p>
                <div className="mt-4 p-3 bg-stone-900/50 rounded-md text-left text-sm text-red-200/80 font-mono">
                    <strong>Details:</strong> {error}
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <Button onClick={onRetry}>
                        Retry Connection
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionError;
