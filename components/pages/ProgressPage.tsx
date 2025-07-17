

import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { RewardCategory, QuestCompletionStatus, RewardItem } from '../../types';
import Card from '../ui/Card';
import LineChart from '../ui/LineChart';
import { toYMD } from '../../utils/quests';

const ProgressPage: React.FC = () => {
    const { currentUser, questCompletions, quests, rewardTypes, appMode } = useAppState();
    
    const xpTypes = useMemo(() => {
        return rewardTypes.filter(rt => rt.category === RewardCategory.XP);
    }, [rewardTypes]);

    const [selectedXpType, setSelectedXpType] = useState<string>('total-xp');

    const chartData = useMemo(() => {
        if (!currentUser || !selectedXpType) return [];
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        const userCompletions = questCompletions.filter(
            c => c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && c.guildId === currentGuildId
        );

        const dataByDay: { [date: string]: number } = {};
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            dataByDay[toYMD(date)] = 0;
        }

        userCompletions.forEach(completion => {
            const dateKey = toYMD(new Date(completion.completedAt));
            if (dataByDay[dateKey] !== undefined) {
                const quest = quests.find(q => q.id === completion.questId);
                if (!quest) return;

                if (selectedXpType === 'total-xp') {
                    const totalXpInQuest = quest.rewards.reduce((total, reward) => {
                        const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                        return (rewardDef?.category === RewardCategory.XP) ? total + reward.amount : total;
                    }, 0);
                    if (totalXpInQuest > 0) {
                        dataByDay[dateKey] = (dataByDay[dateKey] || 0) + totalXpInQuest;
                    }
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
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, value]) => {
                cumulativeTotal += value;
                return {
                    label: new Date(date).toLocaleDateString('default', { timeZone: 'UTC', month: 'short', day: 'numeric' }),
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
                            <option value="total-xp">Total XP</option>
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