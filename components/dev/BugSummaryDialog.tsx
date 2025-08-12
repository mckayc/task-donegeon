import React from 'react';
import Button from '../user-interface/Button';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface BugSummaryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    isLoading: boolean;
}

const BugSummaryDialog: React.FC<BugSummaryDialogProps> = ({ isOpen, onClose, content, isLoading }) => {
    const { addNotification } = useNotificationsDispatch();

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            addNotification({ type: 'success', message: 'Summary copied to clipboard!' });
        }, () => {
            addNotification({ type: 'error', message: 'Failed to copy summary.' });
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60">
                    <h2 className="text-2xl font-medieval text-accent">AI Bug & Feature Summary</h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-stone-200">{content}</pre>
                    )}
                </div>
                <div className="p-4 border-t border-stone-700/60 flex justify-between items-center">
                    <Button variant="secondary" onClick={handleCopy} disabled={isLoading || !content}>
                        Copy Summary
                    </Button>
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default BugSummaryDialog;
