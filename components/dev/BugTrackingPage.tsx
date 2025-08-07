import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BugReport, BugReportStatus } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import BugDetailDialog from './BugDetailDialog';
import { bugLogger } from '../../utils/bugLogger';

const BugTrackingPage: React.FC = () => {
    const { bugReports } = useAppState();
    const { updateBugReport } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [detailedReport, setDetailedReport] = useState<BugReport | null>(null);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<BugReportStatus | 'All'>('All');
    const [bulkAction, setBulkAction] = useState<{ action: 'change_status', status?: BugReportStatus } | null>(null);

    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        bugReports.forEach(r => (r.tags || []).forEach(t => tags.add(t)));
        return ['All', ...Array.from(tags).sort()];
    }, [bugReports]);
    
    const statuses: BugReportStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

    const filteredAndSortedReports = useMemo(() => {
        let reports = [...bugReports];
        if (tagFilter !== 'All') {
            reports = reports.filter(r => (r.tags || []).includes(tagFilter));
        }
        if (statusFilter !== 'All') {
            reports = reports.filter(r => r.status === statusFilter);
        }
        
        reports.sort((a, b) => {
            const statusOrder: Record<BugReportStatus, number> = { 'Open': 1, 'In Progress': 2, 'Resolved': 3, 'Closed': 4 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                 return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return reports;
    }, [bugReports, tagFilter, statusFilter]);
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedReports(filteredAndSortedReports.map(r => r.id));
        } else {
            setSelectedReports([]);
        }
    };
    
    const handleSelectOne = (id: string) => {
        setSelectedReports(prev => 
            prev.includes(id) ? prev.filter(reportId => reportId !== id) : [...prev, id]
        );
    };

    const handleBulkStatusChange = (newStatus: BugReportStatus) => {
        if (selectedReports.length > 0 && newStatus) {
            setBulkAction({ action: 'change_status', status: newStatus });
        }
    };
    
    const handleConfirmBulkAction = () => {
        if (!bulkAction) return;

        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Performed bulk action '${bulkAction.action}' on ${selectedReports.length} reports.` });
        }

        if (bulkAction.action === 'change_status' && bulkAction.status) {
            selectedReports.forEach(id => updateBugReport(id, { status: bulkAction.status! }));
            addNotification({ type: 'success', message: `Updated status for ${selectedReports.length} reports.` });
        }
        
        setSelectedReports([]);
        setBulkAction(null);
    };

    const getTagColor = (tag: string) => {
        switch (tag.toLowerCase()) {
            case 'in progress': return 'bg-yellow-500/20 text-yellow-300';
            case 'feature request': return 'bg-purple-500/20 text-purple-300';
            case 'ui/ux feedback': return 'bg-sky-500/20 text-sky-300';
            case 'bug report': return 'bg-red-500/20 text-red-300';
            case 'resolved':
            case 'converted to quest':
                 return 'bg-green-500/20 text-green-300';
            default: return 'bg-stone-500/20 text-stone-300';
        }
    };
    
    const getStatusColor = (status: BugReportStatus) => {
        switch(status) {
            case 'Open': return 'bg-red-500/20 text-red-300';
            case 'In Progress': return 'bg-yellow-500/20 text-yellow-300';
            case 'Resolved': return 'bg-sky-500/20 text-sky-300';
            case 'Closed': return 'bg-green-500/20 text-green-300';
            default: return 'bg-stone-500/20 text-stone-300';
        }
    }

    return (
        <div className="space-y-6">
            <Card title="Bug Tracker">
                <div className="flex flex-wrap gap-4 mb-4">
                    <Input as="select" label="Filter by Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                        <option value="All">All Statuses</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Input>
                    <Input as="select" label="Filter by Tag" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                        {allAvailableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </Input>
                </div>
                 {selectedReports.length > 0 && (
                    <div className="p-3 bg-stone-900/50 rounded-lg flex items-center gap-4 mb-4">
                        <span className="font-semibold text-stone-300">{selectedReports.length} selected</span>
                        <Input as="select" label="Change status to..." value="" onChange={e => handleBulkStatusChange(e.target.value as BugReportStatus)}>
                            <option value="" disabled>Select status...</option>
                             {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Input>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-stone-700/60">
                            <tr>
                                <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedReports.length === filteredAndSortedReports.length && filteredAndSortedReports.length > 0} /></th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Title</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedReports.map(report => (
                                <tr
                                    key={report.id}
                                    onClick={() => {
                                        if (bugLogger.isRecording()) {
                                            bugLogger.add({ type: 'ACTION', message: `Opened bug detail dialog for "${report.title}".` });
                                        }
                                        setDetailedReport(report);
                                    }}
                                    className="border-b border-stone-700/40 last:border-b-0 hover:bg-stone-700/50 cursor-pointer"
                                >
                                    <td className="p-4" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedReports.includes(report.id)} onChange={() => handleSelectOne(report.id)} /></td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>{report.status}</span></td>
                                    <td className="p-4 font-bold">{report.title}</td>
                                    <td className="p-4">{new Date(report.createdAt).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(report.tags || []).map(tag => (
                                                <span key={tag} className={`px-2 py-1 text-xs font-semibold rounded-full ${getTagColor(tag)}`}>{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {detailedReport && (
                <BugDetailDialog report={detailedReport} onClose={() => setDetailedReport(null)} />
            )}

            <ConfirmDialog
                isOpen={!!bulkAction}
                onClose={() => setBulkAction(null)}
                onConfirm={handleConfirmBulkAction}
                title="Confirm Bulk Action"
                message={`Are you sure you want to perform this action on ${selectedReports.length} report(s)?`}
            />
        </div>
    );
};

export default BugTrackingPage;