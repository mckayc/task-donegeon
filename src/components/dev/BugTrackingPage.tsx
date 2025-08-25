
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { BugReport, BugReportStatus, BugReportLogEntry } from '../../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Input from '../user-interface/Input';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { BugDetailDialog } from './BugDetailDialog';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, PlayIcon, CheckCircleIcon, ArchiveBoxIcon, FolderOpenIcon } from '../user-interface/Icons';
import { useShiftSelect } from '../../hooks/useShiftSelect';
import CreateBugReportDialog from './CreateBugReportDialog';

const BugTrackingPage: React.FC = () => {
    const { bugReports } = useSystemState();
    const { updateBugReport, deleteBugReports, importBugReports } = useSystemDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [detailedReportId, setDetailedReportId] = useState<string | null>(null);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<BugReportStatus>('In Progress');
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importingFileContent, setImportingFileContent] = useState<BugReport[] | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);


    const detailedReport = useMemo(() => {
        if (!detailedReportId) return null;
        return bugReports.find(r => r.id === detailedReportId) || null;
    }, [detailedReportId, bugReports]);
    
    const statuses: BugReportStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

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

    const handleStatusChange = (reportId: string, newStatus: BugReportStatus) => {
        updateBugReport(reportId, { status: newStatus });
        addNotification({ type: 'info', message: `Report status updated.` });
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteBugReports(deletingIds);
        }
        setDeletingIds([]);
        setSelectedReports(prev => prev.filter(id => !deletingIds.includes(id)));
    };
    
    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bugReports, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `bug_reports_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addNotification({ type: 'success', message: 'All bug reports exported.' });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const reports = JSON.parse(e.target?.result as string);
                    if (!Array.isArray(reports) || (reports.length > 0 && (!reports[0].id || !reports[0].title || !reports[0].logs))) {
                        throw new Error("Invalid bug report file format.");
                    }
                    setImportingFileContent(reports);
                } catch (err) {
                    addNotification({ type: 'error', message: err instanceof Error ? err.message : 'Invalid JSON file.' });
                }
            };
            reader.readAsText(file);
        }
        if(event.target) event.target.value = ''; // Reset file input
    };

    const handleConfirmImport = async (mode: 'merge' | 'replace') => {
        if (!importingFileContent) return;
        try {
            await importBugReports(importingFileContent, mode);
        } finally {
            setImportingFileContent(null);
        }
    };

    const getTagColor = (tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.startsWith('ai submissions:')) {
            return 'bg-cyan-500/20 text-cyan-300';
        }
        if (lowerTag.startsWith('copy #')) {
            return 'bg-indigo-500/20 text-indigo-300';
        }
        switch (lowerTag) {
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

    const allBugReportTags = useMemo(() => {
        const defaultTags = ['Bug Report', 'Feature Request', 'UI/UX Feedback', 'Content Suggestion', 'In Progress', 'Acknowledged', 'Resolved', 'Converted to Quest'];
        const allTagsFromReports = bugReports.flatMap(r => r.tags || []);
        const submissionTagPrefix = 'ai submissions:';
        const filteredTags = allTagsFromReports.filter(tag => !tag.toLowerCase().startsWith(submissionTagPrefix));
        return Array.from(new Set([...defaultTags, ...filteredTags])).sort();
    }, [bugReports]);
    
    return (
        <div className="space-y-6">
            <Card
                title="Bug Tracker"
                headerAction={
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>Create New Issue</Button>
                        <Button size="sm" variant="secondary" onClick={handleExport}>Export All</Button>
                        <Button size="sm" onClick={() => fileInputRef.current?.click()}>Import</Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                    </div>
                }
            >
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
                    <div className="p-3 bg-stone-900/50 rounded-lg flex justify-start items-center gap-4 mb-4">
                        <span className="font-semibold text-stone-300">{selectedReports.length} selected</span>
                        <Input as="select" label="" value="" onChange={e => handleBulkStatusChange(e.target.value as BugReportStatus)} className="h-9 text-sm w-48">
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
                            {filteredReports.map(report => {
                                const allLogsCopied = report.logs?.length > 0 && report.logs.every((log: BugReportLogEntry) => log.lastCopiedAt);

                                return (
                                    <tr 
                                        key={report.id} 
                                        className={`border-b border-stone-700/40 last:border-b-0 ${allLogsCopied ? 'border-l-4 border-green-500' : ''}`}
                                        title={allLogsCopied ? "All log entries for this report have been processed." : ""}
                                    >
                                        <td className={`p-4 transition-opacity ${allLogsCopied ? 'opacity-50' : ''}`}>
                                            <input type="checkbox" checked={selectedReports.includes(report.id)} onChange={e => handleCheckboxClick(e, report.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                        </td>
                                        <td className={`p-4 font-bold transition-opacity ${allLogsCopied ? 'opacity-50' : ''}`}>
                                            <button onClick={() => setDetailedReportId(report.id)} className="hover:underline hover:text-accent transition-colors">{report.title}</button>
                                        </td>
                                        <td className={`p-4 transition-opacity ${allLogsCopied ? 'opacity-50' : ''}`}>
                                            <div className="flex flex-wrap gap-1">
                                                {(report.tags || []).map((tag: string) => (
                                                    <span key={tag} className={`px-2 py-1 text-xs font-semibold rounded-full ${getTagColor(tag)}`}>{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={`p-4 text-stone-400 transition-opacity ${allLogsCopied ? 'opacity-50' : ''}`}>{new Date(report.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" title="View Details" onClick={() => setDetailedReportId(report.id)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                
                                                {report.status === 'Open' && (
                                                    <Button variant="ghost" size="icon" title="Mark as In Progress" onClick={() => handleStatusChange(report.id, 'In Progress')} className="h-8 w-8 text-yellow-400 hover:text-yellow-300">
                                                        <PlayIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {report.status === 'In Progress' && (
                                                    <Button variant="ghost" size="icon" title="Mark as Resolved" onClick={() => handleStatusChange(report.id, 'Resolved')} className="h-8 w-8 text-green-400 hover:text-green-300">
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {report.status === 'Resolved' && (
                                                    <Button variant="ghost" size="icon" title="Close Report" onClick={() => handleStatusChange(report.id, 'Closed')} className="h-8 w-8 text-stone-400 hover:text-white">
                                                        <ArchiveBoxIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {report.status === 'Closed' && (
                                                    <Button variant="ghost" size="icon" title="Re-open Report" onClick={() => handleStatusChange(report.id, 'Open')} className="h-8 w-8 text-sky-400 hover:text-sky-300">
                                                        <FolderOpenIcon className="w-4 h-4" />
                                                    </Button>
                                                )}

                                                <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeletingIds([report.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredReports.length === 0 && (
                        <p className="text-center text-stone-400 py-8">No reports with status "{activeTab}".</p>
                    )}
                </div>
            </Card>
            
            {detailedReport && (
                <BugDetailDialog report={detailedReport} onClose={() => setDetailedReportId(null)} allTags={allBugReportTags} getTagColor={getTagColor} />
            )}

            {isCreateDialogOpen && <CreateBugReportDialog onClose={() => setIsCreateDialogOpen(false)} />}
            
            {importingFileContent && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                        <h2 className="text-2xl font-medieval text-amber-400 mb-4">Import Bug Reports</h2>
                        <p className="text-stone-300 mb-6">Found {importingFileContent.length} reports in the file. How would you like to import them?</p>
                        <ul className="text-sm text-stone-400 list-disc list-inside space-y-2 mb-6">
                            <li><strong>Merge:</strong> Add new reports from the file. Reports with IDs that already exist in your system will be skipped.</li>
                            <li><strong>Replace:</strong> <span className="font-bold text-red-400">Deletes all</span> current bug reports and replaces them with the content of this file.</li>
                        </ul>
                        <div className="flex justify-end space-x-4">
                            <Button variant="secondary" onClick={() => setImportingFileContent(null)}>Cancel</Button>
                            <Button variant="secondary" onClick={() => handleConfirmImport('merge')}>Merge</Button>
                            <Button variant="destructive" onClick={() => handleConfirmImport('replace')}>Replace All</Button>
                        </div>
                    </div>
                </div>
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
