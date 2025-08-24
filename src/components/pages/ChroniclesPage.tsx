import React, { useState, useMemo, useEffect } from 'react';
import Card from 'components/user-interface/Card';
import { useUIState } from 'context/UIContext';
import { Role } from 'components/users/types';
import { PurchaseRequestStatus } from 'components/items/types';
import { ChronicleEvent } from 'components/chronicles/types';
import Button from 'components/user-interface/Button';
import { useAuthState } from 'context/AuthContext';
import { useEconomyDispatch } from 'context/EconomyContext';

const ChroniclesPage: React.FC = () => {
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const { cancelPurchaseRequest } = useEconomyDispatch();

    const [viewMode, setViewMode] = useState<'all' | 'personal'>(currentUser?.role === Role.Explorer ? 'personal' : 'all');
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [events, setEvents] = useState<ChronicleEvent[]>([]);
    const [totalEvents, setTotalEvents] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, appMode, itemsPerPage]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!currentUser) return;
            setIsLoading(true);
            try {
                const guildId = appMode.mode === 'guild' ? appMode.guildId : 'null';
                const params = new URLSearchParams({
                    page: String(currentPage),
                    limit: String(itemsPerPage),
                    userId: currentUser.id,
                    guildId,
                    viewMode,
                });
                const response = await fetch(`/api/chronicles?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch chronicles');
                const data = await response.json();
                setEvents(data.events || []);
                setTotalEvents(data.total || 0);
            } catch (error) {
                console.error(error);
                setEvents([]);
                setTotalEvents(0);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [currentPage, itemsPerPage, viewMode, appMode, currentUser]);

    if (!currentUser) return null;

    const totalPages = Math.ceil(totalEvents / itemsPerPage);

    const statusColor = (status: any) => {
        switch (status) {
          case "Awarded":
          case "Gifted":
          case "Approved":
          case "Completed":
          case "Exchanged":
            return 'text-green-400';
          case "Requested":
          case "Pending":
            return 'text-yellow-400';
          case 'QUEST_LATE':
            return 'text-yellow-400 font-semibold';
          case 'QUEST_INCOMPLETE':
            return 'text-red-500 font-semibold';
          case "Rejected":
          case "Setback":
            return 'text-red-400';
          case "Cancelled":
            return 'text-stone-400';
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
                {(currentUser.role === Role.DonegeonMaster || currentUser.role === Role.Gatekeeper) && (
                    <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'all' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
                        >
                            All Activity
                        </button>
                        <button
                            onClick={() => setViewMode('personal')}
                            className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'personal' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
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
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
                                <li key={activity.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-stone-800/60 rounded-lg border-l-4" style={{ borderColor: activity.color }}>
                                    {/* Column 1: Title & Icon */}
                                    <p className="font-semibold text-stone-100 flex items-center gap-3 truncate md:col-span-1" title={activity.title}>
                                        <span className="text-2xl flex-shrink-0">{activity.icon}</span>
                                        <span className="truncate">{activity.title}</span>
                                    </p>

                                    {/* Column 2: Note */}
                                    <div className="md:col-span-1 md:text-center min-w-0">
                                        {activity.note && (
                                            <p className="text-sm text-stone-400 italic truncate" title={activity.note}>
                                                "{activity.note}"
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Column 3: Status & Date */}
                                    <div className="md:col-span-1 text-right flex flex-col items-end justify-center">
                                        <div className={`font-semibold flex items-center justify-end gap-2 ${statusColor(activity.status)}`}>
                                            <span>{activity.status}</span>
                                            {activity.type === 'Purchase' && activity.status === 'Pending' && activity.userId === currentUser.id && (
                                                <Button variant="destructive" size="sm" className="!text-xs !py-0.5" onClick={() => cancelPurchaseRequest(activity.originalId)}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1">{formatTimestamp(activity.date)}</p>
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