import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { RewardCategory, QuestCompletionStatus, RewardItem } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import LineChart from '../ui/LineChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ProgressPage: React.FC = () => {
    const { currentUser, questCompletions, quests, rewardTypes, appMode } = useAppState();
    
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>XP Gained (Last 30 Days)</CardTitle>
                    {xpTypes.length > 0 && (
                        <Select value={selectedXpType} onValueChange={setSelectedXpType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select XP Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {xpTypes.map(xp => <SelectItem key={xp.id} value={xp.id}>{xp.icon} {xp.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                        <LineChart data={chartData} color="#10b981" />
                    ) : (
                        <p className="text-muted-foreground text-center">No XP of this type has been earned recently in this mode. Go complete some quests!</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProgressPage;