import React, { useState, useMemo, useCallback } from 'react';
import Button from '../user-interface/Button';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useAppState } from '../../context/AppContext';
import { BugReport, BugReportStatus } from '../../types';
import Input from '../user-interface/Input';
import { useDebounce } from '../../hooks/useDebounce';
import { useShiftSelect } from '../../hooks/useShiftSelect';

interface BugSummaryDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const BugSummaryDialog: React.FC<BugSummaryDialogProps> = ({ isOpen, onClose }) => {
    const { addNotification } = useNotificationsDispatch();
    const { bugReports } = useAppState();

    const [step, setStep] = useState<'selection' | 'summary'>('selection');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<BugReportStatus | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState({ text: '', jsonData: '' });
    const [activeTab, setActiveTab] = useState<'human' | 'json'>('human');
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredReports = useMemo(() => {
        return bugReports.filter(r => {
            const statusMatch = statusFilter === 'All' || r.status === statusFilter;
            const searchMatch = !debouncedSearchTerm || r.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            return statusMatch && searchMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [bugReports, statusFilter, debouncedSearchTerm]);

    const reportIds = useMemo(() => filteredReports.map(r => r.id), [filteredReports]);
    const handleCheckboxClick = useShiftSelect(reportIds, selectedIds, setSelectedIds);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedIds(e.target.checked ? reportIds : []);
    };
    
    const quickSelect = (status: BugReportStatus) => {
        const idsToSelect = bugReports.filter(r => r.status === status).map(r => r.id);
        setSelectedIds(idsToSelect);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setStep('summary');
        
        const selectedReports = bugReports.filter(r => selectedIds.includes(r.id));
        const jsonData = JSON.stringify(selectedReports, null, 2);
        
        setSummary(prev => ({ ...prev, jsonData }));

        const simplifiedReports = selectedReports.map(r => ({
            id: r.id,
            title: r.title,
            status: r.status,
            tags: r.tags,
            logs: r.logs.map(l => `[${l.type}] ${l.message}`).slice(-10) // Only include last 10 log messages for brevity
        }));

        const prompt = `You are a helpful project manager assistant. Based on the following bug reports, provide a concise summary in Markdown format. The summary should have two main sections: '✅ Completed Work' for 'Resolved' items, and '⏳ Pending Work' for 'Open' and 'In Progress' items. Under each section, use bullet points for the items, mentioning the title and key tags. Provide a brief, one-sentence high-level overview at the very top. Here is the data: ${JSON.stringify(simplifiedReports)}`;

         try {
            const response = await fetch('/api/ai/summarize-bugs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bugReports: simplifiedReports })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate summary.');
            }

            const jsonResponse: { summary: string } = await response.json();
            setSummary(prev => ({ ...prev, text: jsonResponse.summary || 'Could not parse the summary.' }));

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setSummary(prev => ({ ...prev, text: `Error: ${message}` }));
            addNotification({ type: 'error', message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (content: string, type: 'Summary' | 'JSON') => {
        navigator.clipboard.writeText(content).then(() => {
            addNotification({ type: 'success', message: `${type} copied to clipboard!` });
        }, () => {
            addNotification({ type: 'error', message: `Failed to copy ${type}.` });
        });
    };
    
    const statuses: BugReportStatus[] = ['In Progress', 'Open', 'Resolved', 'Closed'];

    const renderSelectionStep = () => (
        <>
            <div className="flex-grow p-6 overflow-hidden flex flex-col">
                <div className="flex-shrink-0 space-y-4 mb-4">
                     <div className="flex items-center gap-2">
                        <Input as="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                            <option value="All">All Statuses</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Input>
                        <Input placeholder="Search by title..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow" />
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => quickSelect('In Progress')}>Select All 'In Progress'</Button>
                        <Button size="sm" variant="secondary" onClick={() => quickSelect('Open')}>Select All 'Open'</Button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto scrollbar-hide pr-2">
                     <table className="w-full text-left">
                        <thead className="sticky top-0 bg-stone-800">
                            <tr>
                                <th className="p-2 w-12"><input type="checkbox" onChange={handleSelectAll} checked={reportIds.length > 0 && selectedIds.length === reportIds.length} /></th>
                                <th className="p-2 font-semibold">Title</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map(report => (
                                <tr key={report.id}>
                                    <td className="p-2"><input type="checkbox" checked={selectedIds.includes(report.id)} onChange={e => handleCheckboxClick(e, report.id)} /></td>
                                    <td className="p-2 text-sm">{report.title}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="p-4 border-t border-stone-700/60 flex justify-between items-center flex-shrink-0">
                <span className="text-sm font-semibold text-stone-300">{selectedIds.length} report(s) selected</span>
                <div>
                    <Button variant="secondary" onClick={onClose} className="mr-4">Cancel</Button>
                    <Button onClick={handleGenerate} disabled={selectedIds.length === 0}>Generate Summary</Button>
                </div>
            </div>
        </>
    );
    
    const renderSummaryStep = () => (
        <>
             <div className="flex-grow p-6 overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-stone-700 mb-4 flex-shrink-0">
                            <nav className="-mb-px flex space-x-6">
                                <button onClick={() => setActiveTab('human')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'human' ? 'border-accent text-accent-light' : 'border-transparent text-stone-400'}`}>Human-Readable Summary</button>
                                <button onClick={() => setActiveTab('json')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'json' ? 'border-accent text-accent-light' : 'border-transparent text-stone-400'}`}>JSON for AI</button>
                            </nav>
                        </div>
                        <div className="flex-grow overflow-y-auto scrollbar-hide">
                            {activeTab === 'human' && <pre className="whitespace-pre-wrap font-sans text-stone-200">{summary.text}</pre>}
                            {activeTab === 'json' && <pre className="whitespace-pre-wrap font-mono text-xs text-stone-300 bg-stone-900/50 p-2 rounded">{summary.jsonData}</pre>}
                        </div>
                    </>
                )}
            </div>
            <div className="p-4 border-t border-stone-700/60 flex justify-between items-center flex-shrink-0">
                 <Button variant="secondary" onClick={() => setStep('selection')}>&larr; Back to Selection</Button>
                <div>
                    {activeTab === 'human' && <Button variant="secondary" onClick={() => handleCopy(summary.text, 'Summary')} disabled={isLoading || !summary.text}>Copy Summary</Button>}
                    {activeTab === 'json' && <Button variant="secondary" onClick={() => handleCopy(summary.jsonData, 'JSON')} disabled={isLoading || !summary.jsonData}>Copy JSON</Button>}
                    <Button onClick={onClose} className="ml-4">Close</Button>
                </div>
            </div>
        </>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-accent">AI Bug & Feature Summary</h2>
                </div>
                {step === 'selection' ? renderSelectionStep() : renderSummaryStep()}
            </div>
        </div>
    );
};

export default BugSummaryDialog;
