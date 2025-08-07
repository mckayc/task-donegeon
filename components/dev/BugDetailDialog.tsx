import React, { useState, useMemo } from 'react';
import { BugReport, BugReportStatus } from '../../types';
import { useAppDispatch } from '../../context/AppContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TagInput from '../ui/TagInput';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { bugLogger } from '../../utils/bugLogger';

interface BugDetailDialogProps {
  report: BugReport;
  onClose: () => void;
}

const BugDetailDialog: React.FC<BugDetailDialogProps> = ({ report, onClose }) => {
    const { updateBugReport } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    const [questFromBug, setQuestFromBug] = useState<BugReport | null>(null);

    const allTags = useMemo(() => Array.from(new Set(['Bug', 'Feature Request', 'UI/UX', 'In Progress', 'Acknowledged', 'Resolved', 'Converted to Quest'])), []);
    const statuses: BugReportStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

    const handleTagsChange = (newTags: string[]) => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Changed tags for "${report.title}".` });
        }
        updateBugReport(report.id, { tags: newTags });
    };

    const handleStatusChange = (newStatus: BugReportStatus) => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Changed status of "${report.title}" to ${newStatus}.` });
        }
        updateBugReport(report.id, { status: newStatus });
        addNotification({ type: 'info', message: `Report status updated to ${newStatus}.` });
    };
    
    const copyLogToClipboard = () => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Copied log for "${report.title}".` });
        }
        const logText = report.logs.map(log =>
            `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${log.message}` +
            (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
        ).join('\n');
        navigator.clipboard.writeText(logText).then(() => {
            addNotification({ type: 'success', message: 'Log copied to clipboard!' });
        });
    };
    
    const handleTurnToQuest = () => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Initiated 'Convert to Quest' for "${report.title}".` });
        }
        setQuestFromBug(report);
    };

    const handleCloseQuestDialog = () => {
        if (questFromBug) {
            updateBugReport(questFromBug.id, {
                status: 'Resolved',
                tags: Array.from(new Set([...(questFromBug.tags || []), 'Converted to Quest']))
            });
            addNotification({ type: 'info', message: 'Report converted to Quest and resolved.' });
        }
        setQuestFromBug(null);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-stone-700/60 flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-medieval text-accent">{report.title}</h2>
                            <p className="text-sm text-stone-400">Reported on {new Date(report.createdAt).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>&times;</Button>
                    </div>

                    <div className="p-6 flex-grow overflow-y-auto scrollbar-hide space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input as="select" label="Status" value={report.status} onChange={e => handleStatusChange(e.target.value as BugReportStatus)}>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Input>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Tags</label>
                                <TagInput
                                    selectedTags={report.tags || []}
                                    onTagsChange={handleTagsChange}
                                    allTags={allTags}
                                />
                            </div>
                        </div>
                        
                        <pre className="text-sm text-stone-300 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-md">
                            {report.logs.map((log, index) => (
                                <div key={index} className="border-b border-stone-700/50 py-2 last:border-b-0">
                                    <span className="text-stone-500">{new Date(log.timestamp).toLocaleTimeString()} [{log.type}]</span>
                                    <p>{log.message}</p>
                                    {log.element && <p className="text-xs text-sky-400">Element: {`<${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">`}</p>}
                                </div>
                            ))}
                        </pre>
                    </div>
                    <div className="p-4 border-t border-stone-700/60 flex justify-between items-center">
                        <Button variant="secondary" onClick={copyLogToClipboard}>Copy Log</Button>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={onClose}>Close</Button>
                            <Button onClick={handleTurnToQuest}>Convert to Quest</Button>
                        </div>
                    </div>
                </div>
            </div>
            {questFromBug && <CreateQuestDialog initialDataFromBug={questFromBug} onClose={handleCloseQuestDialog} />}
        </>
    );
};

export default BugDetailDialog;
