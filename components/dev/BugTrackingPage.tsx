import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BugReport, BugReportStatus } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import BugDetailDialog from './BugDetailDialog';
import { bugLogger } from '../../utils/bugLogger';
import { EllipsisVerticalIcon } from '../ui/Icons';
import { useShiftSelect } from '../../hooks/useShiftSelect';

const BugTrackingPage: React.FC = () => {
    const { bugReports } = useAppState();
    const { updateBugReport, deleteBugReports } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [detailedReportId, setDetailedReportId] = useState<string | null>(null);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<BugReportStatus>('In Progress');
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const detailedReport = useMemo(() => {
        if (!detailedReportId) return null;
        return bugReports.find(r => r.id === detailedReportId) || null;
    }, [detailedReportId, bugReports]);
    
    const statuses: BugReportStatus[] = ['In Progress', 'Open', 'Resolved', 'Closed'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setSelectedReports([]);
    }, [activeTab]);

    const filteredReports = useMemo(() => {
        return bugReports.filter(r => r.status === activeTab);
    }, [bugReports, activeTab]);

    const reportIds = useMemo(() => filteredReports.map(r => r.id), [filteredReports]);
    const handleCheckboxClick = useShiftSelect(reportIds, selectedReports, setSelectedReports);
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedReports(filteredReports.map(r => r.id));
        } else {
            setSelectedReports([]);
        }
    };

    const handleBulkStatusChange = (newStatus: BugReportStatus) => {
        if (selectedReports.length > 0 && newStatus) {
            selectedReports.forEach(id => updateBugReport(id, { status: newStatus }));
            addNotification({ type: 'success', message: `Updated status for ${selectedReports.length} reports.` });
            setSelectedReports([]);
        }
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteBugReports(deletingIds);
        }
        setDeletingIds([]);
        setSelectedReports(prev => prev.filter(id => !deletingIds.includes(id)));
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
    
    return (
        <div className="space-y-6">
            <Card title="Bug Tracker">
                 <div className="border-b border-stone-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        {statuses.map(status => (
                            <button
                                key={status}
                                onClick={() => setActiveTab(status)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === status
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-stone-400 hover:text-stone-200'
                                }`}
                            >
                                {status} ({bugReports.filter(r => r.status === status).length})
                            </button>
                        ))}
                    </nav>
                </div>

                 {selectedReports.length > 0 && (
                    <div className="p-3 bg-stone-900/50 rounded-lg flex items-center gap-4 mb-4">
                        <span className="font-semibold text-stone-300">{selectedReports.length} selected</span>
                        <Input as="select" label="" value="" onChange={e => handleBulkStatusChange(e.target.value as BugReportStatus)} className="h-9 text-sm">
                            <option value="" disabled>Change status to...</option>
                             {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Input>
                         <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedReports)}>Delete</Button>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-stone-700/60">
                            <tr>
                                <th className="p-4 w-12">
                                    <input type="checkbox" onChange={handleSelectAll} checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                </th>
                                <th className="p-4 font-semibold">Title</th>
                                <th className="p-4 font-semibold">Tags</th>
                                <th className="p-4 font-semibold">Created At</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map(report => (
                                <tr key={report.id} className="border-b border-stone-700/40 last:border-b-0">
                                    <td className="p-4">
                                        <input type="checkbox" checked={selectedReports.includes(report.id)} onChange={e => handleCheckboxClick(e, report.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                    </td>
                                    <td className="p-4 font-bold">
                                        <button onClick={() => setDetailedReportId(report.id)} className="hover:underline hover:text-accent transition-colors">{report.title}</button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(report.tags || []).map(tag => (
                                                <span key={tag} className={`px-2 py-1 text-xs font-semibold rounded-full ${getTagColor(tag)}`}>{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-stone-400">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 relative">
                                         <button onClick={() => setOpenDropdownId(openDropdownId === report.id ? null : report.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                            <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                        </button>
                                        {openDropdownId === report.id && (
                                            <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                <button onClick={() => { setDetailedReportId(report.id); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">View Details</button>
                                                <button onClick={() => { setDeletingIds([report.id]); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredReports.length === 0 && (
                        <p className="text-center text-stone-400 py-8">No reports with status "{activeTab}".</p>
                    )}
                </div>
            </Card>
            
            {detailedReport && (
                <BugDetailDialog report={detailedReport} onClose={() => setDetailedReportId(null)} />
            )}

            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Reports' : 'Report'}`}
                message={`Are you sure you want to permanently delete ${deletingIds.length} report(s)?`}
            />
        </div>
    );
};

export default BugTrackingPage;