



import React, { useState, useMemo } from 'react';
import { useAuthState, useGameDataState, useUIState } from '../../context/AppContext';
import { RewardCategory, QuestCompletionStatus, RewardItem } from '../../types';
import Card from '../ui/Card';
import LineChart from '../ui/LineChart';

const ProgressPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { questCompletions, quests, rewardTypes } = useGameDataState();
    const { appMode } = useUIState();
    
    const xpTypes = useMemo(() => {
        const allXpTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);
        return [
            { id: 'total-xp', name: 'Total XP', icon: '⭐' },
            ...allXpTypes
        ];
    }, [rewardTypes]);

    const [selectedXpType, setSelectedXpType] = useState<string>(xpTypes.length > 0 ? xpTypes[0].id : '');

    const chartData = useMemo(() => {
        if (!currentUser) return [];
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        const userCompletions = questCompletions.filter(
            c => c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && c.guildId === currentGuildId
        );

        const dataByDay: { [date: string]: number } = {};
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            dataByDay[date.toISOString().split('T')[0]] = 0;
        }

        userCompletions.forEach(completion => {
            const completionDate = new Date(completion.completedAt);
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            if (completionDate >= thirtyDaysAgo) {
                const quest = quests.find(q => q.id === completion.questId);
                if (!quest) return;
                
                const dateKey = completion.completedAt.split('T')[0];

                if (selectedXpType === 'total-xp') {
                    const totalXpFromQuest = quest.rewards
                        .filter(r => rewardTypes.find(rt => rt.id === r.rewardTypeId)?.category === RewardCategory.XP)
                        .reduce((sum, r) => sum + r.amount, 0);
                    dataByDay[dateKey] = (dataByDay[dateKey] || 0) + totalXpFromQuest;
                } else {
                    const xpReward = quest.rewards.find(r => r.rewardTypeId === selectedXpType);
                    if (xpReward) {
                        dataByDay[dateKey] = (dataByDay[dateKey] || 0) + xpReward.amount;
                    }
                }
            }
        });
        
        let cumulativeTotal = 0;
        return Object.entries(dataByDay)
            .map(([date, value]) => ({ date: new Date(date), value }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(item => {
                cumulativeTotal += item.value;
                return {
                    label: item.date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
                    value: cumulativeTotal
                };
            });

    }, [currentUser, questCompletions, quests, selectedXpType, appMode, rewardTypes]);

    if (!currentUser) return <div>Loading...</div>;

    return (
        <div>
            <Card>
                <div className="flex justify-between items-center px-6 py-4 border-b border-stone-700/60">
                    <h3 className="text-xl font-medieval text-emerald-400">XP Gained (Last 30 Days)</h3>
                    {xpTypes.length > 0 && (
                        <select
                            value={selectedXpType}
                            onChange={(e) => setSelectedXpType(e.target.value)}
                            className="px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition"
                        >
                            {xpTypes.map(xp => <option key={xp.id} value={xp.id}>{xp.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="p-6">
                    {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                        <LineChart data={chartData} color="#10b981" />
                    ) : (
                        <p className="text-stone-400 text-center">No XP of this type has been earned recently in this mode. Go complete some quests!</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ProgressPage;