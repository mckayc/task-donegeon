

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../user-interface/Card';
import { useUIState } from '../../context/UIContext';
import { Role, ChronicleEvent, ChronicleEventType } from '../../types';
import Button from '../user-interface/Button';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyDispatch } from '../../context/EconomyContext';
import { FilterIcon, ChevronDownIcon } from '../user-interface/Icons';

const CHRONICLE_EVENT_TYPES = [
    ChronicleEventType.QuestCompletion,
    ChronicleEventType.Checkpoint,
    ChronicleEventType.QuestClaimed,
    ChronicleEventType.QuestClaimApproved,
    ChronicleEventType.QuestClaimRejected,
    ChronicleEventType.QuestClaimCancelled,
    ChronicleEventType.QuestUnclaimed,
    ChronicleEventType.Purchase,
    ChronicleEventType.TrophyAwarded,
    ChronicleEventType.AdminAdjustment,
    ChronicleEventType.AdminAssetManagement,
    ChronicleEventType.GiftReceived,
    ChronicleEventType.Trade,
    ChronicleEventType.Crafting,
    ChronicleEventType.System,
    ChronicleEventType.Announcement,
    ChronicleEventType.ScheduledEvent,
    ChronicleEventType.Donation,
    ChronicleEventType.Triumph,
    ChronicleEventType.Trial,
    ChronicleEventType.QuestAssigned,
].map(type => ({
    type,
    label: type.replace(/([A-Z])/g, ' $1').trim(),
}));

const DEFAULT_FILTERS = CHRONICLE_EVENT_TYPES
    .map(t => t.type)
    .filter(t => t !== ChronicleEventType.QuestAssigned);

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
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const [selectedFilters, setSelectedFilters] = useState<string[]>(() => {
        try {
            const savedFilters = localStorage.getItem('chronicleFilters');
            if (savedFilters) {
                const parsed = JSON.parse(savedFilters);
                // If the saved value is an empty array, it's likely a bug or invalid state.
                // Fall back to the default filters instead.
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
            return DEFAULT_FILTERS; // Fallback for null, empty array, or invalid JSON
        } catch {
            return DEFAULT_FILTERS;
        }
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        localStorage.setItem('chronicleFilters', JSON.stringify(selectedFilters));
    }, [selectedFilters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, appMode, itemsPerPage, selectedFilters]);

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
                    filterTypes: selectedFilters.join(','),
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
    }, [currentPage, itemsPerPage, viewMode, appMode, currentUser, selectedFilters]);

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
          case "Assigned":
            return 'text-yellow-400';
          case 'QUEST_LATE':
            return 'text-yellow-400 font-semibold';
          case 'QUEST_INCOMPLETE':
            return 'text-red-500 font-semibold';
          case "Rejected":
          case "Setback":
            return 'text-red-400';
          case "Cancelled":
          case "Unclaimed":
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

    const handleFilterChange = (type: string) => {
        setSelectedFilters(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleSelectAllFilters = () => {
        if (selectedFilters.length === CHRONICLE_EVENT_TYPES.length) {
            setSelectedFilters([]);
        } else {
            setSelectedFilters(CHRONICLE_EVENT_TYPES.map(t => t.type));
        }
    };

    const isAdminView = currentUser.role !== Role.Explorer && viewMode === 'all';

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    {(currentUser.role === Role.DonegeonMaster || currentUser.role === Role.Gatekeeper) && (
                        <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                            <button onClick={() => setViewMode('all')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'all' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>All Activity</button>
                            <button onClick={() => setViewMode('personal')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'personal' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>My Activity</button>
                        </div>
                    )}
                    <div className="relative" ref={filterRef}>
                        <Button variant="secondary" onClick={() => setIsFilterOpen(p => !p)}>
                            <FilterIcon className="w-4 h-4" /> Filter ({selectedFilters.length}) <ChevronDownIcon className="w-4 h-4" />
                        </Button>
                        {isFilterOpen && (
                            <div className="absolute top-full mt-2 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20 p-4">
                                <button onClick={handleSelectAllFilters} className="w-full text-left mb-2 px-2 py-1 text-sm font-semibold text-accent hover:bg-stone-800 rounded-md">
                                    {selectedFilters.length === CHRONICLE_EVENT_TYPES.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {CHRONICLE_EVENT_TYPES.map(item => (
                                        <label key={item.type} className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-800 cursor-pointer">
                                            <input type="checkbox" checked={selectedFilters.includes(item.type)} onChange={() => handleFilterChange(item.type)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"/>
                                            <span className="text-sm text-stone-300">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="items-per-page" className="text-sm font-medium text-stone-400">Show:</label>
                    <select id="items-per-page" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition text-sm">
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
                                    {/* Column 1: Title, Icon, & Subject */}
                                    <div className="flex items-start gap-3 md:col-span-1 min-w-0">
                                        <span className="text-2xl flex-shrink-0 mt-1">{activity.icon}</span>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-semibold text-stone-100 truncate" title={activity.title}>{activity.title}</p>
                                            {isAdminView && activity.userName && (
                                                <p className="text-xs text-stone-400 font-medium truncate" title={activity.userName}>{activity.userName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: Note */}
                                    <div className="md:col-span-1 md:text-center min-w-0">
                                        {activity.note && (
                                            <p className="text-sm text-stone-400 italic truncate" title={activity.note}>
                                                "{activity.note}"
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Column 3: Rewards, Status, Actor, & Date */}
                                    <div className="md:col-span-1 text-right flex flex-col items-end justify-center">
                                        <div className="font-semibold flex items-center justify-end gap-2">
                                            {activity.rewardsText && <span className="text-stone-300">{activity.rewardsText}</span>}
                                            <span className={statusColor(activity.status)}>{activity.status}</span>
                                            {activity.type === 'Purchase' && activity.status === 'Pending' && activity.userId === currentUser.id && (
                                                <Button variant="destructive" size="sm" className="!text-xs !py-0.5" onClick={() => cancelPurchaseRequest(activity.originalId)}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-xs text-stone-400 mt-1 space-y-0.5">
                                            {activity.actorName && (isAdminView || (activity.actorName !== currentUser.gameName && activity.actorName !== activity.userName)) && (
                                                <p>by {activity.actorName}</p>
                                            )}
                                            <p>{formatTimestamp(activity.date)}</p>
                                        </div>
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
                    <p className="text-stone-400 text-center py-4">No activities match your current filters.</p>
                )}
            </Card>
        </div>
    );
};

export default ChroniclesPage;