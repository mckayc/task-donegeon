import React, { useState, useMemo, useEffect } from 'react';
import Card from '../user-interface/Card';
import { useAppState } from '../../context/AppContext';
import { useUIState } from '../../context/UIStateContext';
import { Role, ChronicleEvent, QuestCompletionStatus, AdminAdjustmentType, PurchaseRequestStatus, RewardItem } from '../../types';
import Button from '../user-interface/Button';
import { useAuthState } from '../../context/AuthContext';
import { useQuestState } from '../../context/QuestContext';
import { useEconomyState } from '../../context/EconomyContext';

const ChroniclesPage: React.FC = () => {
    const { settings, userTrophies, trophies, adminAdjustments, systemLogs, systemNotifications } = useAppState();
    const { currentUser, users } = useAuthState();
    const { appMode } = useUIState();
    const { quests, questCompletions } = useQuestState();
    const { purchaseRequests, rewardTypes } = useEconomyState();

    const [viewMode, setViewMode] = useState<'all' | 'personal'>(currentUser?.role === Role.Explorer ? 'personal' : 'all');
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, appMode, itemsPerPage]);

    if (!currentUser) return null;

    const allEvents = useMemo(() => {
        const userMap = new Map(users.map(u => [u.id, u.gameName]));
        const questMap = new Map(quests.map(q => [q.id, q]));
        const trophyMap = new Map(trophies.map(t => [t.id, t]));
        const rewardMap = new Map(rewardTypes.map(rt => [rt.id, rt]));

        const getRewardDisplay = (rewardItems: RewardItem[]) => (rewardItems || []).map(r => {
            const reward = rewardMap.get(r.rewardTypeId);
            return `${r.amount} ${reward ? reward.icon : '❓'}`;
        }).join(' ');

        const events: ChronicleEvent[] = [];
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        const shouldInclude = (item: { userId?: string, userIds?: string[], recipientUserIds?: string[], guildId?: string }) => {
            if (item.guildId !== currentGuildId) return false;
            if (viewMode === 'personal') {
                const userIdsToCheck = [item.userId, ...(item.userIds || []), ...(item.recipientUserIds || [])].filter(Boolean);
                return userIdsToCheck.includes(currentUser.id);
            }
            return true;
        };

        // 1. Quest Completions
        questCompletions.forEach(c => {
            if (!shouldInclude({ userId: c.userId, guildId: c.guildId })) return;
            const quest = questMap.get(c.questId);
            let finalNote = c.note || '';
            if (c.status === 'Approved' && quest && quest.rewards.length > 0) {
                const rewardsText = getRewardDisplay(quest.rewards).replace(/(\d+)/g, '+$1');
                finalNote = finalNote ? `${finalNote}\n(${rewardsText})` : rewardsText;
            }
            events.push({
                id: c.id, date: c.completedAt, type: 'Quest',
                title: `${userMap.get(c.userId) || 'Unknown'} completed "${quest?.title || 'Unknown Quest'}"`,
                status: c.status, note: finalNote, icon: quest?.icon || '📜',
                color: '#3b82f6', userId: c.userId, guildId: c.guildId
            });
        });

        // 2. Purchase Requests
        purchaseRequests.forEach(p => {
            if (!shouldInclude({ userId: p.userId, guildId: p.guildId })) return;
            const costText = getRewardDisplay(p.assetDetails.cost).replace(/(\d+)/g, '-$1');
            events.push({
                id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId,
                title: `${userMap.get(p.userId) || 'Unknown'} purchased "${p.assetDetails.name}"`,
                status: p.status, note: costText, icon: '💰',
                color: '#22c55e', guildId: p.guildId
            });
        });

        // 3. User Trophies
        userTrophies.forEach(ut => {
            if (!shouldInclude({ userId: ut.userId, guildId: ut.guildId })) return;
            const trophy = trophyMap.get(ut.trophyId);
            events.push({
                id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId,
                title: `${userMap.get(ut.userId) || 'Unknown'} earned "${trophy?.name || 'Unknown Trophy'}"`,
                status: "Awarded", note: trophy?.description, icon: trophy?.icon || '🏆',
                color: '#f59e0b', guildId: ut.guildId
            });
        });

        // 4. Admin Adjustments
        adminAdjustments.forEach(adj => {
            if (!shouldInclude({ userId: adj.userId, guildId: adj.guildId })) return;
            const rewardsText = getRewardDisplay(adj.rewards).replace(/(\d+)/g, '+$1');
            const setbacksText = getRewardDisplay(adj.setbacks).replace(/(\d+)/g, '-$1');
            events.push({
                id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId,
                title: `${userMap.get(adj.userId) || 'Unknown'} received an adjustment from ${userMap.get(adj.adjusterId) || 'Admin'}`,
                status: adj.type,
                note: `${adj.reason}\n(${rewardsText} ${setbacksText})`.trim(),
                icon: '🛠️',
                color: adj.type === 'Reward' ? '#10b981' : '#ef4444',
                guildId: adj.guildId
            });
        });
        
        // 5. System Logs (Global/Admin view only)
        if (viewMode !== 'personal') {
            systemLogs.forEach(log => {
                const quest = questMap.get(log.questId);
                const userNames = log.userIds.map(id => userMap.get(id) || 'Unknown').join(', ');
                const setbacksText = getRewardDisplay(log.setbacksApplied).replace(/(\d+)/g, '-$1');
                events.push({
                    id: log.id, date: log.timestamp, type: 'System',
                    title: `System: ${quest?.title || 'Unknown Quest'} marked as ${log.type.split('_')[1]}`,
                    status: log.type, note: `For: ${userNames}\n(${setbacksText})`, icon: '⚙️', color: '#64748b'
                });
            });
        }

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [
        currentUser, users, quests, trophies, rewardTypes, appMode, viewMode,
        questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs
    ]);

    const totalPages = Math.ceil(allEvents.length / itemsPerPage);
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return allEvents.slice(start, end);
    }, [allEvents, currentPage, itemsPerPage]);

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
                {paginatedEvents.length > 0 ? (
                    <>
                        <ul className="space-y-4">
                            {paginatedEvents.map(activity => (
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