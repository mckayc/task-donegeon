import React, { useState, useEffect, useCallback } from 'react';
import Card from '../user-interface/Card';
import { useAppState } from '../../context/AppContext';
import { useUIState } from '../../context/UIStateContext';
import { Role, ChronicleEvent, QuestCompletionStatus, AdminAdjustmentType, PurchaseRequestStatus } from '../../types';
import Button from '../user-interface/Button';
import { useAuthState } from '../../context/AuthContext';

const ChroniclesPage: React.FC = () => {
    const { settings } = useAppState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const [viewMode, setViewMode] = useState<'all' | 'personal'>('all');
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [events, setEvents] = useState<ChronicleEvent[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchChronicles = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: String(itemsPerPage),
                viewMode: currentUser.role === Role.Explorer ? 'personal' : viewMode,
                userId: currentUser.id,
            });

            if (appMode.mode === 'guild') {
                params.append('guildId', appMode.guildId);
            } else {
                params.append('guildId', 'null');
            }

            const response = await fetch(`/api/chronicles?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch chronicles data.');
            
            const data = await response.json();
            setEvents(data.events || []);
            setTotalPages(Math.ceil(data.total / itemsPerPage));
        } catch (error) {
            console.error(error);
            setEvents([]);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, appMode, currentPage, itemsPerPage, viewMode]);

    useEffect(() => {
        fetchChronicles();
    }, [fetchChronicles]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, appMode]);
    
    if (!currentUser) return null;

    const statusColor = (status: any) => {
        switch (status) {
          case "Awarded":
          case QuestCompletionStatus.Approved:
          case PurchaseRequestStatus.Completed:
          case AdminAdjustmentType.Reward:
          case AdminAdjustmentType.Trophy:
            return 'text-green-400';
          case "Requested":
          case QuestCompletionStatus.Pending:
          case PurchaseRequestStatus.Pending:
            return 'text-yellow-400';
          case 'QUEST_LATE':
            return 'text-yellow-400 font-semibold';
          case 'QUEST_INCOMPLETE':
            return 'text-red-500 font-semibold';
          case QuestCompletionStatus.Rejected:
          case PurchaseRequestStatus.Rejected:
          case PurchaseRequestStatus.Cancelled:
          case AdminAdjustmentType.Setback:
            return 'text-red-400';
          default:
            return 'text-stone-400';
        }
    };
  
    const formatTimestamp = (dateString: string): string => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleString('default', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                {currentUser.role === Role.DonegeonMaster && (
                    <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'all' ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}
                        >
                            All Activity
                        </button>
                        <button
                            onClick={() => setViewMode('personal')}
                            className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'personal' ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}
                        >
                            My Activity
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <label htmlFor="items-per-page" className="text-sm font-medium text-stone-400">Show:</label>
                    <select
                        id="items-per-page"
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
            <Card title="Recent Activity">
                {isLoading ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div></div>
                ) : events.length > 0 ? (
                    <>
                        <ul className="space-y-4">
                            {events.map(activity => (
                                <li key={activity.id} className="flex items-start gap-4 p-3 bg-stone-800/60 rounded-lg">
                                    <div className="w-8 flex-shrink-0 text-center text-2xl pt-1" style={{ color: activity.color }}>
                                        {activity.icon}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-stone-200" title={activity.title}>
                                           {activity.title}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-1">{formatTimestamp(activity.date)}</p>
                                    </div>
                                    <div className="w-2/5 flex-shrink-0 text-sm text-stone-400 italic" title={activity.note}>
                                        {activity.note ? <p className="whitespace-pre-wrap">"{activity.note}"</p> : ''}
                                    </div>
                                    <div className={`w-28 flex-shrink-0 text-right font-semibold ${statusColor(activity.status)}`}>
                                        {activity.status}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-stone-700">
                                <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                <span className="text-stone-400">Page {currentPage} of {totalPages}</span>
                                <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-stone-400 text-center py-4">No activities have been recorded yet in this mode.</p>
                )}
            </Card>
        </div>
    );
};

export default ChroniclesPage;