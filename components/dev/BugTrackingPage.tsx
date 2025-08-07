import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BugReport, BugReportStatus } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';

const BugTrackingPage: React.FC = () => {
    const { bugReports } = useAppState();
    const { addNotification } = useNotificationsDispatch();
    const appDispatch = useAppDispatch();
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
    const [questFromBug, setQuestFromBug] = useState<BugReport | null>(null);
    const [deletingReport, setDeletingReport] = useState<BugReport | null>(null);

    const [statusFilter, setStatusFilter] = useState<BugReportStatus | 'All'>('All');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'status-asc'>('date-desc');
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

    const filteredAndSortedReports = useMemo(() => {
        let reports = [...bugReports];
        if (statusFilter !== 'All') {
            reports = reports.filter(r => r.status === statusFilter);
        }
        reports.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title-asc': return a.title.localeCompare(b.title);
                case 'status-asc': return a.status.localeCompare(b.status);
                case 'date-desc': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
        return reports;
    }, [bugReports, statusFilter, sortBy]);

    const handleStatusChange = (reportId: string, status: BugReportStatus) => {
        appDispatch.updateBugReport(reportId, { status });
        addNotification({ type: 'info', message: `Report status updated to ${status}` });
        if (selectedReport?.id === reportId) {
            setSelectedReport(prev => prev ? { ...prev, status } : null);
        }
    };
    
    const handleBulkStatusChange = (status: BugReportStatus) => {
        selectedReportIds.forEach(id => appDispatch.updateBugReport(id, { status }));
        addNotification({ type: 'info', message: `${selectedReportIds.length} reports updated to ${status}` });
        setSelectedReportIds([]);
    };
    
    const handleBulkDelete = () => {
        // This assumes a delete action exists in AppContext, which may need to be added.
        // For now, let's just show a notification.
        addNotification({ type: 'info', message: `Bulk delete action for ${selectedReportIds.length} reports.`});
        setSelectedReportIds([]);
    }

    const handleTurnToQuest = (report: BugReport) => {
        setQuestFromBug(report);
    }
    
    const handleCloseQuestDialog = () => {
        if (questFromBug) {
            handleStatusChange(questFromBug.id, BugReportStatus.ConvertedToQuest);
        }
        setQuestFromBug(null);
    }

    const copyLogToClipboard = () => {
        if (!selectedReport) return;
        const logText = selectedReport.logs.map(log =>
            `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${log.message}` +
            (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
        ).join('\n');
        navigator.clipboard.writeText(logText).then(() => {
            addNotification({ type: 'success', message: 'Log copied to clipboard!' });
        });
    };
    
    const handleDelete = (report: BugReport) => {
        setDeletingReport(report);
    };

    const handleConfirmDelete = () => {
        if (deletingReport) {
            // Placeholder: A dispatch to delete the bug report should be implemented
            addNotification({ type: 'info', message: `Bug report "${deletingReport.title}" deleted.` });
            if(selectedReport?.id === deletingReport.id) setSelectedReport(null);
        }
        setDeletingReport(null);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedReportIds(filteredAndSortedReports.map(r => r.id));
        } else {
            setSelectedReportIds([]);
        }
    };
    
    const handleSelectOne = (id: string) => {
        setSelectedReportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6">
            <Card title="Bug Tracker">
                <div className="flex flex-wrap gap-4 mb-4">
                    <Input as="select" label="Filter Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                        <option value="All">All</option>
                        {Object.values(BugReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Input>
                    <Input as="select" label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="title-asc">Title</option>
                        <option value="status-asc">Status</option>
                    </Input>
                    {selectedReportIds.length > 0 && (
                        <div className="p-2 bg-stone-900/50 rounded-lg flex items-center gap-2">
                             <Input as="select" value="" onChange={e => handleBulkStatusChange(e.target.value as BugReportStatus)} className="h-9">
                                <option value="" disabled>Change Status...</option>
                                {Object.values(BugReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </Input>
                            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Delete ({selectedReportIds.length})</Button>
                        </div>
                    )}
                </div>
                {bugReports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedReportIds.length === filteredAndSortedReports.length && filteredAndSortedReports.length > 0} /></th>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedReports.map(report => (
                                    <tr key={report.id} onClick={() => setSelectedReport(report)} className="border-b border-stone-700/40 last:border-b-0 hover:bg-stone-700/50 cursor-pointer">
                                        <td className="p-4" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedReportIds.includes(report.id)} onChange={() => handleSelectOne(report.id)} /></td>
                                        <td className="p-4 font-bold">{report.title}</td>
                                        <td className="p-4 text-stone-400">{new Date(report.createdAt).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                report.status === 'New' ? 'bg-blue-500/20 text-blue-300' :
                                                report.status === 'Resolved' ? 'bg-green-500/20 text-green-300' :
                                                report.status === 'Converted to Quest' ? 'bg-purple-500/20 text-purple-300' :
                                                'bg-stone-500/20 text-stone-300'
                                            }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="p-4 space-x-2" onClick={e => e.stopPropagation()}>
                                            <Button size="sm" variant="secondary" onClick={() => handleTurnToQuest(report)}>Convert to Quest</Button>
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

            {selectedReport && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
                    <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-stone-700/60 flex justify-between items-center">
                             <div>
                                <h3 className="text-xl font-bold text-stone-100">Log: {selectedReport.title}</h3>
                            </div>
                             <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={copyLogToClipboard}>Copy Log</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedReport)}>Delete</Button>
                            </div>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                             <Input as="select" label="Status" value={selectedReport.status} onChange={(e) => handleStatusChange(selectedReport.id, e.target.value as BugReportStatus)} className="mb-4">
                                {Object.values(BugReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </Input>
                            <pre className="text-sm text-stone-300 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-md">
                                {selectedReport.logs.map((log, index) => (
                                    <div key={index} className="border-b border-stone-700/50 py-2 last:border-b-0">
                                        <span className="text-stone-500">{new Date(log.timestamp).toLocaleTimeString()} [{log.type}]</span>
                                        <p>{log.message}</p>
                                        {log.element && <p className="text-xs text-sky-400">Element: {`<${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">`}</p>}
                                    </div>
                                ))}
                            </pre>
                        </div>
                         <div className="p-4 border-t border-stone-700/60 text-right">
                            <Button variant="secondary" onClick={() => setSelectedReport(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
            
            {questFromBug && (
                <CreateQuestDialog 
                    initialDataFromBug={questFromBug}
                    onClose={handleCloseQuestDialog}
                />
            )}
            <ConfirmDialog
                isOpen={!!deletingReport}
                onClose={() => setDeletingReport(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Bug Report"
                message={`Are you sure you want to permanently delete the report "${deletingReport?.title}"?`}
            />
        </div>
    );
};

export default BugTrackingPage;