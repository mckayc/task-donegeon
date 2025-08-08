import React, { useState, useMemo, ReactNode } from 'react';
import { BugReport, BugReportStatus, BugReportLogEntry } from '../../types';
import { useAppDispatch } from '../../context/AppContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TagInput from '../ui/TagInput';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import { ZapIcon, PencilIcon, CompassIcon, ToggleLeftIcon, MousePointerClickIcon, MessageSquareIcon } from '../ui/Icons';

interface BugDetailDialogProps {
  report: BugReport;
  onClose: () => void;
}

const LogIcon: React.FC<{type: BugReportLogEntry['type']}> = ({ type }) => {
    const iconClass = "w-5 h-5";
    switch(type) {
        case 'ACTION': return <ZapIcon className={iconClass} />;
        case 'NOTE': return <PencilIcon className={iconClass} />;
        case 'NAVIGATION': return <CompassIcon className={iconClass} />;
        case 'STATE_CHANGE': return <ToggleLeftIcon className={iconClass} />;
        case 'ELEMENT_PICK': return <MousePointerClickIcon className={iconClass} />;
        case 'COMMENT': return <MessageSquareIcon className={iconClass} />;
        default: return null;
    }
}

const BugDetailDialog: React.FC<BugDetailDialogProps> = ({ report, onClose }) => {
    const { updateBugReport } = useAppDispatch();
    const { currentUser, users } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const [questFromBug, setQuestFromBug] = useState<BugReport | null>(null);
    const [comment, setComment] = useState('');

    const sortedLogs = useMemo(() => {
        if (!report.logs) return [];
        return [...report.logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [report.logs]);

    const allTags = useMemo(() => Array.from(new Set(['Bug Report', 'Feature Request', 'UI/UX Feedback', 'Content Suggestion', 'In Progress', 'Acknowledged', 'Resolved', 'Converted to Quest'])), []);
    const statuses: BugReportStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

    const handleTagsChange = (newTags: string[]) => {
        updateBugReport(report.id, { tags: newTags });
    };

    const handleStatusChange = (newStatus: BugReportStatus) => {
        updateBugReport(report.id, { status: newStatus });
        addNotification({ type: 'info', message: `Report status updated to ${newStatus}.` });
    };
    
    const copyLogToClipboard = () => {
        const logText = sortedLogs.map(log => {
            const authorText = log.type === 'COMMENT' && log.author ? `${log.author}: ` : '';
            return `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${authorText}${log.message}` +
            (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
        }).join('\n');

        navigator.clipboard.writeText(logText).then(() => {
            addNotification({ type: 'success', message: 'Log & Comments copied to clipboard!' });
            if (report.status === 'Open') {
                handleStatusChange('In Progress');
                addNotification({ type: 'info', message: `Status automatically updated to "In Progress".` });
            }
        });
    };
    
    const handleTurnToQuest = () => {
        setQuestFromBug(report);
    };

    const handleAddComment = () => {
        if (!comment.trim() || !currentUser) return;
        const newEntry: Omit<BugReportLogEntry, 'timestamp'> & { timestamp: string } = {
            type: 'COMMENT',
            message: comment.trim(),
            author: currentUser.gameName,
            timestamp: new Date().toISOString()
        };
        const newLogs = [...report.logs, newEntry];
        updateBugReport(report.id, { logs: newLogs });
        setComment('');
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
                        
                        <div className="space-y-4">
                            {sortedLogs.map((log, index) => {
                                if (log.type === 'COMMENT') {
                                    const authorUser = users.find(u => u.gameName === log.author);
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            {authorUser ? <Avatar user={authorUser} className="w-8 h-8 rounded-full flex-shrink-0" /> : <div className="w-8 h-8 rounded-full bg-stone-600 flex-shrink-0" />}
                                            <div className="flex-grow">
                                                <p className="text-sm">
                                                    <span className="font-bold text-stone-100">{log.author}</span>
                                                    <span className="text-xs text-stone-500 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                                </p>
                                                <div className="mt-1 bg-stone-700/50 p-2 rounded-lg text-stone-200 text-sm whitespace-pre-wrap">
                                                    {log.message}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={index} className="flex items-start gap-3 text-stone-400 text-sm">
                                            <div className="w-8 flex justify-center flex-shrink-0 pt-0.5 text-stone-500"><LogIcon type={log.type} /></div>
                                            <div className="flex-grow">
                                                <p className="font-mono text-xs">
                                                    <span className="font-semibold">{log.type}</span>
                                                    <span className="text-stone-500 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                                </p>
                                                <p className="text-stone-300">{log.message}</p>
                                                {log.element && <p className="text-xs text-sky-400 font-mono mt-1">Element: {`<${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">`}</p>}
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                     <div className="p-4 border-t border-stone-700/60">
                        <h4 className="text-lg font-semibold text-stone-200 mb-2">Add Comment</h4>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            placeholder="Type your comment here..."
                            className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                        />
                        <div className="text-right mt-2">
                            <Button onClick={handleAddComment} disabled={!comment.trim()}>Add Comment</Button>
                        </div>
                    </div>
                    <div className="p-4 border-t border-stone-700/60 flex justify-between items-center">
                        <Button variant="secondary" onClick={copyLogToClipboard}>Copy Log & Comments</Button>
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