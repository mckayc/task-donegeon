import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BugReport, BugReportStatus } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import TagInput from '../ui/TagInput';

const BugDetailPanel: React.FC<{ report: BugReport; onClose: () => void; }> = ({ report, onClose }) => {
    const { updateBugReport } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    const [questFromBug, setQuestFromBug] = useState<BugReport | null>(null);
    const [deletingReport, setDeletingReport] = useState<BugReport | null>(null);
    const allTags = useMemo(() => Array.from(new Set(['Bug', 'Feature Request', 'UI/UX', 'In Progress', 'Acknowledged', 'Resolved', 'Converted to Quest'])), []);

    const handleTagsChange = (newTags: string[]) => {
        updateBugReport(report.id, { tags: newTags });
    };

    const handleStatusToggle = () => {
        const newStatus = report.status === 'Open' ? 'Closed' : 'Open';
        updateBugReport(report.id, { status: newStatus });
        addNotification({ type: 'info', message: `Report marked as ${newStatus}.` });
    };
    
    const copyLogToClipboard = () => {
        const logText = report.logs.map(log =>
            `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${log.message}` +
            (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
        ).join('\n');
        navigator.clipboard.writeText(logText).then(() => {
            addNotification({ type: 'success', message: 'Log copied to clipboard!' });
        });
    };
    
    const handleTurnToQuest = () => {
        setQuestFromBug(report);
    };

    const handleCloseQuestDialog = () => {
        if (questFromBug) {
            updateBugReport(questFromBug.id, {
                status: 'Closed',
                tags: Array.from(new Set([...questFromBug.tags, 'Converted to Quest']))
            });
            addNotification({ type: 'info', message: 'Report converted to Quest.' });
        }
        setQuestFromBug(null);
    };

    return (
        <>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-stone-900 border-l border-stone-700 shadow-2xl z-50 flex flex-col"
            >
                <div className="p-6 border-b border-stone-700/60 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-stone-100">{report.title}</h3>
                        <p className="text-sm text-stone-400">Reported on {new Date(report.createdAt).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>&times;</Button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide space-y-4">
                     <TagInput
                        selectedTags={report.tags}
                        onTagsChange={handleTagsChange}
                        allTags={allTags}
                        placeholder="Add tags..."
                    />
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
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={copyLogToClipboard}>Copy Log</Button>
                        <Button variant="secondary" onClick={() => setDeletingReport(report)} className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300">Delete</Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleStatusToggle}>{report.status === 'Open' ? 'Close Report' : 'Reopen Report'}</Button>
                        <Button onClick={handleTurnToQuest}>Convert to Quest</Button>
                    </div>
                </div>
            </motion.div>
            {questFromBug && <CreateQuestDialog initialDataFromBug={questFromBug} onClose={handleCloseQuestDialog} />}
            <ConfirmDialog
                isOpen={!!deletingReport}
                onClose={() => setDeletingReport(null)}
                onConfirm={() => {
                    if (deletingReport) {
                        // Implement actual delete logic via dispatch
                        addNotification({ type: 'info', message: 'Delete functionality placeholder.' });
                        onClose();
                    }
                    setDeletingReport(null);
                }}
                title="Delete Bug Report"
                message={`Are you sure you want to permanently delete "${deletingReport?.title}"?`}
            />
        </>
    );
};

const BugTrackingPage: React.FC = () => {
    const { bugReports } = useAppState();
    const appDispatch = useAppDispatch();
    const [detailedReport, setDetailedReport] = useState<BugReport | null>(null);
    const [tagFilter, setTagFilter] = useState<string>('All');
    
    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        bugReports.forEach(r => r.tags.forEach(t => tags.add(t)));
        return ['All', ...Array.from(tags).sort()];
    }, [bugReports]);

    const filteredAndSortedReports = useMemo(() => {
        let reports = [...bugReports];
        if (tagFilter !== 'All') {
            reports = reports.filter(r => r.tags.includes(tagFilter));
        }
        
        reports.sort((a, b) => {
            if (a.status !== b.status) return a.status === 'Open' ? -1 : 1;
            const aInProgress = a.tags.includes('In Progress');
            const bInProgress = b.tags.includes('In Progress');
            if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return reports;
    }, [bugReports, tagFilter]);
    
    const getTagColor = (tag: string) => {
        switch (tag.toLowerCase()) {
            case 'in progress': return 'bg-yellow-500/20 text-yellow-300';
            case 'feature request': return 'bg-purple-500/20 text-purple-300';
            case 'ui/ux': return 'bg-sky-500/20 text-sky-300';
            case 'bug': return 'bg-red-500/20 text-red-300';
            case 'resolved':
            case 'converted to quest':
                 return 'bg-green-500/20 text-green-300';
            default: return 'bg-stone-500/20 text-stone-300';
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Bug Tracker">
                <div className="flex flex-wrap gap-4 mb-4">
                    <Input as="select" label="Filter by Tag" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                        {allAvailableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </Input>
                </div>
                {bugReports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Tags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedReports.map(report => (
                                    <tr
                                        key={report.id}
                                        onClick={() => setDetailedReport(report)}
                                        className={`border-b border-stone-700/40 last:border-b-0 hover:bg-stone-700/50 cursor-pointer transition-opacity ${
                                            report.status === 'Closed' ? 'opacity-60 text-stone-500' : ''
                                        }`}
                                    >
                                        <td className="p-4 font-bold">{report.title}</td>
                                        <td className="p-4">{new Date(report.createdAt).toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {report.tags.map(tag => (
                                                    <span key={tag} className={`px-2 py-1 text-xs font-semibold rounded-full ${getTagColor(tag)}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-stone-400 py-8">No bug reports have been filed yet.</p>
                )}
            </Card>

            <AnimatePresence>
                {detailedReport && (
                    <BugDetailPanel report={detailedReport} onClose={() => setDetailedReport(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BugTrackingPage;
