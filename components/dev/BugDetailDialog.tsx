import React, { useState, useMemo, ReactNode } from 'react';
import { BugReport, BugReportStatus, BugReportLogEntry } from '../../types';
import { useAppDispatch } from '../../context/AppContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import TagInput from '../user-interface/TagInput';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import Avatar from '../user-interface/Avatar';
import { ZapIcon, PencilIcon, CompassIcon, ToggleLeftIcon, MousePointerClickIcon, MessageSquareIcon } from '../user-interface/Icons';
import { useShiftSelect } from '../../hooks/useShiftSelect';

interface BugDetailDialogProps {
  report: BugReport;
  onClose: () => void;
  allTags: string[];
  getTagColor: (tag: string) => string;
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

export const BugDetailDialog: React.FC<BugDetailDialogProps> = ({ report, onClose, allTags, getTagColor }) => {
    const { updateBugReport } = useAppDispatch();
    const { currentUser, users } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const [questFromBug, setQuestFromBug] = useState<BugReport | null>(null);
    const [comment, setComment] = useState('');
    const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

    const sortedLogs = useMemo(() => {
        if (!report.logs) return [];
        return [...report.logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [report.logs]);
    
    const shortId = useMemo(() => `bug-${report.id.substring(4, 11)}`, [report.id]);

    const statuses: BugReportStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

    const logTimestamps = useMemo(() => sortedLogs.map(log => log.timestamp), [sortedLogs]);
    const handleCheckboxClick = useShiftSelect(logTimestamps, selectedLogs, setSelectedLogs);

    const handleTagsChange = (newTags: string[]) => {
        updateBugReport(report.id, { tags: newTags });
    };

    const handleStatusChange = (newStatus: BugReportStatus) => {
        updateBugReport(report.id, { status: newStatus });
        addNotification({ type: 'info', message: `Report status updated to ${newStatus}.` });
    };
    
    const handleCopy = (logTimestampsToCopy: string[]) => {
        if (logTimestampsToCopy.length === 0) return;

        const logsToCopy = sortedLogs.filter(log => logTimestampsToCopy.includes(log.timestamp));

        const titleLine = `Report ID: #${shortId}\nTitle: ${report.title}\n\n--- LOGS ---\n`;
        const logText = logsToCopy.map(log => {
            const authorText = log.type === 'COMMENT' && log.author ? `${log.author}: ` : '';
            return `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${authorText}${log.message}` +
            (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
        }).join('\n');
        
        const fullTextToCopy = titleLine + logText;

        navigator.clipboard.writeText(fullTextToCopy).then(() => {
            addNotification({ type: 'success', message: 'Log content copied to clipboard!' });

            const timestampsToUpdate = new Set(logTimestampsToCopy);
            const newLogs = report.logs.map(log => 
                timestampsToUpdate.has(log.timestamp)
                ? { ...log, lastCopiedAt: new Date().toISOString() }
                : log
            );

            const existingTags = report.tags || [];
            const copyTagPrefix = 'Copy #';
            const lastCopyTag = existingTags.slice().reverse().find(t => t.startsWith(copyTagPrefix));
            let count = 1;
            if (lastCopyTag) {
                const match = lastCopyTag.match(/Copy #(\d+)/);
                if (match) {
                    count = parseInt(match[1], 10) + 1;
                }
            }
            const newCopyTag = `${copyTagPrefix}${count}`;
            const newTags = [...existingTags, newCopyTag];
            
            const updates: Partial<BugReport> = { logs: newLogs, tags: newTags };

            if (report.status === 'Open') {
                updates.status = 'In Progress';
                addNotification({ type: 'info', message: `Status automatically updated to "In Progress".` });
            }

            updateBugReport(report.id, updates);
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

    const handleSelectAllLogs = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLogs(sortedLogs.map(log => log.timestamp));
        } else {
            setSelectedLogs([]);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-stone-700/60 flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-medieval text-accent">{report.title}</h2>
                            <p className="text-sm font-mono text-stone-500 mt-1">ID: #{shortId}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>&times;</Button>
                    </div>

                    <div className="flex-grow p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
                        
                        <div className="w-full md:w-2/3 flex flex-col space-y-4 overflow-hidden min-h-0">
                             <div className="flex items-center gap-4 flex-shrink-0">
                                <label className="flex items-center gap-2 text-sm text-stone-300">
                                    <input type="checkbox" onChange={handleSelectAllLogs} checked={selectedLogs.length === sortedLogs.length && sortedLogs.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                    <span>Select All</span>
                                </label>
                                <Button size="sm" variant="secondary" onClick={() => handleCopy(selectedLogs)} disabled={selectedLogs.length === 0}>Copy Selected ({selectedLogs.length})</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleCopy(sortedLogs.map(l => l.timestamp))}>Copy Full Log</Button>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                                {sortedLogs.map((log, index) => {
                                    const isSelected = selectedLogs.includes(log.timestamp);
                                    const authorUser = log.type === 'COMMENT' ? users.find(u => u.gameName === log.author) : undefined;
                                    return (
                                        <div key={index} className={`flex items-start gap-3 text-stone-400 text-sm p-2 rounded-md transition-colors ${isSelected ? 'bg-emerald-900/40' : ''} ${log.lastCopiedAt ? 'opacity-60' : ''}`}>
                                            <input type="checkbox" checked={isSelected} onChange={(e) => handleCheckboxClick(e, log.timestamp)} className="mt-1 flex-shrink-0 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                            
                                            {log.type === 'COMMENT' ? (
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        {authorUser ? (
                                                            <Avatar user={authorUser} className="w-6 h-6 rounded-full flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full flex-shrink-0 bg-stone-700 flex items-center justify-center text-xs font-bold">
                                                                {log.author ? log.author.charAt(0) : '?'}
                                                            </div>
                                                        )}
                                                        <p className="text-sm">
                                                            <span className="font-bold text-stone-100">{log.author}</span>
                                                            <span className="text-xs text-stone-500 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 bg-stone-700/50 p-2 rounded-lg text-stone-200 text-sm whitespace-pre-wrap ml-8">
                                                        {log.message}
                                                    </div>
                                                </div>
                                            ) : (
                                                 <>
                                                    <div className="w-8 flex justify-center flex-shrink-0 pt-0.5 text-stone-500"><LogIcon type={log.type} /></div>
                                                    <div className="flex-grow">
                                                        <p className="font-mono text-xs">
                                                            <span className="font-semibold">{log.type}</span>
                                                            <span className="text-stone-500 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                                        </p>
                                                        <p className="text-stone-300">{log.message}</p>
                                                        {log.element && <p className="text-xs text-sky-400 font-mono mt-1">Element: {`<${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">`}</p>}
                                                    </div>
                                                 </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 border-l border-stone-700/60 pl-6 -mr-2">
                            <div>
                                <Input as="select" label="Status" value={report.status} onChange={e => handleStatusChange(e.target.value as BugReportStatus)}>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </Input>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Tags</label>
                                <TagInput
                                    selectedTags={report.tags || []}
                                    onTagsChange={handleTagsChange}
                                    allTags={allTags}
                                />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-stone-200 mb-2">Add Comment</h4>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    rows={4}
                                    placeholder="Type your comment here..."
                                    className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                                />
                                <div className="text-right mt-2">
                                    <Button onClick={handleAddComment} disabled={!comment.trim()}>Add Comment</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-stone-700/60 flex justify-between items-center flex-shrink-0">
                        <Button onClick={handleTurnToQuest}>Convert to Quest</Button>
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                </div>
            </div>
            {questFromBug && <CreateQuestDialog initialDataFromBug={questFromBug} onClose={handleCloseQuestDialog} />}
        </>
    );
};