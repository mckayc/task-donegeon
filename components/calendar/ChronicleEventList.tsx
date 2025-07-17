import React, { useMemo } from 'react';
import { ChronicleEvent, AdminAdjustmentType, QuestCompletionStatus, PurchaseRequestStatus } from '../../types';
import { useAppState } from '../../context/AppContext';
import { toYMD } from '../../utils/quests';

const ChronicleEventList: React.FC<{ date: Date }> = ({ date }) => {
    const { questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs, currentUser, appMode, quests, trophies, rewardTypes } = useAppState();

    const dailyEvents = useMemo(() => {
        if (!currentUser) return [];

        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const dateKey = toYMD(date);

        const events: ChronicleEvent[] = [];
        
        const getRewardDisplay = (rewardId: string) => {
            const reward = rewardTypes.find(rt => rt.id === rewardId);
            return { name: reward?.name || 'Unknown', icon: reward?.icon || '❓' };
        };

        questCompletions.forEach(c => {
            if (c.userId === currentUser.id && c.guildId === currentGuildId && toYMD(new Date(c.completedAt)) === dateKey) {
                events.push({
                    id: c.id, date: c.completedAt, type: 'Quest', title: quests.find(q => q.id === c.questId)?.title || 'Unknown Quest',
                    status: c.status, note: c.note, icon: '✅', color: c.status === QuestCompletionStatus.Approved ? 'text-green-400' : 'text-yellow-400'
                });
            }
        });

        purchaseRequests.forEach(p => {
            if (p.userId === currentUser.id && p.guildId === currentGuildId && toYMD(new Date(p.requestedAt)) === dateKey) {
                events.push({
                    id: p.id, date: p.requestedAt, type: 'Purchase', title: `Purchased "${p.assetDetails.name}"`, status: p.status,
                    icon: '💰', color: p.status === PurchaseRequestStatus.Completed ? 'text-green-400' : 'text-yellow-400'
                });
            }
        });
        
        userTrophies.forEach(ut => {
            if (ut.userId === currentUser.id && ut.guildId === currentGuildId && toYMD(new Date(ut.awardedAt)) === dateKey) {
                const trophy = trophies.find(t => t.id === ut.trophyId);
                events.push({
                    id: ut.id, date: ut.awardedAt, type: 'Trophy', title: `Earned: ${trophy?.name || 'Unknown Trophy'}`, status: 'Awarded',
                    icon: trophy?.icon || '🏆', color: 'text-amber-400'
                });
            }
        });

        adminAdjustments.forEach(adj => {
             if (adj.userId === currentUser.id && adj.guildId === currentGuildId && toYMD(new Date(adj.adjustedAt)) === dateKey) {
                const isSetback = adj.type === AdminAdjustmentType.Setback;
                events.push({
                    id: adj.id, date: adj.adjustedAt, type: 'Adjustment', title: `Manual ${isSetback ? 'Setback' : 'Reward'}`,
                    status: adj.type, note: adj.reason, icon: '🛠️', color: isSetback ? 'text-red-400' : 'text-sky-400'
                });
            }
        });
        
        systemLogs.forEach(log => {
             const quest = quests.find(q => q.id === log.questId);
             if (!quest || quest.guildId !== currentGuildId || !log.userIds.includes(currentUser.id)) return;
             if (toYMD(new Date(log.timestamp)) === dateKey) {
                 const isLate = log.type === 'QUEST_LATE';
                 events.push({
                     id: log.id, date: log.timestamp, type: 'System', title: `Quest ${isLate ? 'Late' : 'Incomplete'}: "${quest.title}"`,
                     status: log.type, note: `Setbacks applied: ${log.setbacksApplied.map(s=>`-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ')}`,
                     icon: '⚙️', color: isLate ? 'text-yellow-400' : 'text-red-400'
                 });
             }
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [currentUser, appMode, date, questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs]);

    if(dailyEvents.length === 0) {
        return <p className="text-center text-stone-500 py-8">No recorded activity for this day.</p>;
    }

    return (
        <div className="space-y-3">
            {dailyEvents.map(event => (
                 <div key={event.id} className="bg-stone-800/60 p-3 rounded-lg flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xl ${event.color}`}>
                        {event.icon}
                    </div>
                    <div className="flex-grow">
                        <p className={`font-semibold ${event.color}`}>{event.title}</p>
                        <p className="text-xs text-stone-400">{new Date(event.date).toLocaleTimeString()}</p>
                        {event.note && <p className="text-sm text-stone-300 italic mt-1 whitespace-pre-wrap">"{event.note}"</p>}
                    </div>
                 </div>
            ))}
        </div>
    );
};

export default ChronicleEventList;
