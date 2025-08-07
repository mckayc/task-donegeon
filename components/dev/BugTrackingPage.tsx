import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BugReport, BugReportStatus, QuestType, Role } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import Input from '../ui/Input';

const BugTrackingPage: React.FC = () => {
    const { settings, bugReports } = useAppState();
    const { addNotification } = useNotificationsDispatch();
    const appDispatch = useAppDispatch();
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
    const [questFromBug, setQuestFromBug] = useState<BugReport | null>(null);

    const handleStatusChange = (reportId: string, status: BugReportStatus) => {
        appDispatch.updateBugReport(reportId, { status });
        addNotification({ type: 'info', message: `Report status updated to ${status}` });
        if (selectedReport?.id === reportId) {
            setSelectedReport(prev => prev ? { ...prev, status } : null);
        }
    };
    
    const handleTurnToQuest = (report: BugReport) => {
        setQuestFromBug(report);
    }
    
    const handleCloseQuestDialog = () => {
        if (questFromBug) {
            handleStatusChange(questFromBug.id, BugReportStatus.Investigating);
        }
        setQuestFromBug(null);
    }

    return (
        <div className="space-y-6">
            <Card title="Bug Tracker">
                {bugReports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugReports.map(report => (
                                    <tr key={report.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{report.title}</td>
                                        <td className="p-4 text-stone-400">{new Date(report.createdAt).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                report.status === 'New' ? 'bg-blue-500/20 text-blue-300' :
                                                report.status === 'Fixed' ? 'bg-green-500/20 text-green-300' :
                                                'bg-stone-500/20 text-stone-300'
                                            }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="p-4 space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => setSelectedReport(report)}>View Log</Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleTurnToQuest(report)}>Create Quest</Button>
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
                                <h3 className="text-xl font-bold text-stone-100">Log for #{selectedReport.id.substring(4, 10)}: {selectedReport.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="bug-status" className="text-sm font-medium text-stone-400">Status:</label>
                                <Input
                                    as="select"
                                    id="bug-status"
                                    value={selectedReport.status}
                                    onChange={(e) => handleStatusChange(selectedReport.id, e.target.value as BugReportStatus)}
                                >
                                    {Object.values(BugReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </Input>
                            </div>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                            <pre className="text-sm text-stone-300 whitespace-pre-wrap font-mono">
                                {selectedReport.logs.map((log, index) => (
                                    <div key={index} className="border-b border-stone-700/50 py-2">
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
        </div>
    );
};

export default BugTrackingPage;