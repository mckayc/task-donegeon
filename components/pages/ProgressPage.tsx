
import React, { useState, useMemo, useEffect } from 'react';
import { RewardCategory, QuestCompletionStatus } from '../../types';
import Card from '../user-interface/Card';
import LineChart from '../user-interface/LineChart';
import BarChart from '../user-interface/BarChart';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useQuestState } from '../../context/QuestContext';
import { useUIState } from '../../context/UIStateContext';

const StatCard: React.FC<{ title: string; value: string | number; icon: string; subtext?: string }> = ({ title, value, icon, subtext }) => (
    <div className="bg-stone-900/40 p-4 rounded-lg">
        <p className="text-sm text-stone-400">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="text-3xl font-bold text-stone-100">{value}</p>
                {subtext && <p className="text-xs text-stone-400 -mt-1">{subtext}</p>}
            </div>
        </div>
    </div>
);

const ProgressPage: React.FC = () => {
    const { quests, questCompletions } = useQuestState();
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    
    const xpTypes = useMemo(() => {
        const allXpTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);
        return [
            { id: 'total-xp', name: 'Total XP', icon: '⭐' },
            ...allXpTypes
        ];
    }, [rewardTypes]);

    const [selectedXpType, setSelectedXpType] = useState<string>(xpTypes.length > 0 ? xpTypes[0].id : '');
    const [chartColor, setChartColor] = useState<string>('hsl(158 84% 39%)');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (typeof window !== 'undefined') {
                const style = getComputedStyle(document.documentElement);
                const h = style.getPropertyValue('--color-primary-hue').trim();
                const s = style.getPropertyValue('--color-primary-saturation').trim();
                const l = style.getPropertyValue('--color-primary-lightness').trim();
                if (h && s && l) {
                    setChartColor(`hsl(${h} ${s} ${l})`);
                }
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [appMode, currentUser]);

    const { dailyData, cumulativeData, summaryStats } = useMemo(() => {
        const defaultSummary = { totalXp: 0, questsCompleted: 0, xpGained30d: 0, bestDay: { date: '-', xp: 0 } };
        if (!currentUser) return { dailyData: [], cumulativeData: [], summaryStats: defaultSummary };
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        const userCompletions = questCompletions.filter(
            c => c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && c.guildId == currentGuildId
        );

        const dataByDay: { [date: string]: number } = {};
        const questsCompletedByDay: { [date: string]: number } = {};
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dataByDay[dateKey] = 0;
            questsCompletedByDay[dateKey] = 0;
        }

        userCompletions.forEach(completion => {
            const completionDate = new Date(completion.completedAt);
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            if (completionDate >= thirtyDaysAgo) {
                const quest = quests.find(q => q.id === completion.questId);
                if (!quest) return;
                
                const dateKey = completion.completedAt.split('T')[0];
                if (dateKey in questsCompletedByDay) {
                    questsCompletedByDay[dateKey]++;
                }

                let xpForThisQuest = 0;
                if (selectedXpType === 'total-xp') {
                    xpForThisQuest = quest.rewards
                        .filter(r => rewardTypes.find(rt => rt.id === r.rewardTypeId)?.category === RewardCategory.XP)
                        .reduce((sum, r) => sum + r.amount, 0);
                } else {
                    const xpReward = quest.rewards.find(r => r.rewardTypeId === selectedXpType);
                    if (xpReward) {
                        xpForThisQuest = xpReward.amount;
                    }
                }
                if (dateKey in dataByDay) {
                    dataByDay[dateKey] += xpForThisQuest;
                }
            }
        });
        
        const sortedDaily = Object.entries(dataByDay)
            .map(([date, value]) => ({ date: new Date(date), value }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const dailyChartData = sortedDaily.map(item => ({
            label: item.date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
            value: item.value
        }));

        let cumulativeTotal = 0;
        const cumulativeChartData = sortedDaily.map(item => {
            cumulativeTotal += item.value;
            return {
                label: item.date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
                value: cumulativeTotal
            };
        });
        
        const xpGained30d = sortedDaily.reduce((sum, day) => sum + day.value, 0);
        const questsCompleted30d = Object.values(questsCompletedByDay).reduce((sum, count) => sum + count, 0);
        
        const bestDayEntry = sortedDaily.reduce((best, current) => current.value > best.value ? current : best, { date: new Date(), value: 0 });
        
        const currentBalances = appMode.mode === 'personal'
            ? currentUser.personalExperience
            : currentUser.guildBalances[appMode.guildId]?.experience || {};
        
        const totalXp = Object.values(currentBalances).reduce((sum: number, amount: number) => sum + amount, 0);

        return {
            dailyData: dailyChartData,
            cumulativeData: cumulativeChartData,
            summaryStats: {
                totalXp,
                questsCompleted: questsCompleted30d,
                xpGained30d,
                bestDay: {
                    date: bestDayEntry.value > 0 ? bestDayEntry.date.toLocaleDateString('default', { month: 'short', day: 'numeric' }) : '-',
                    xp: bestDayEntry.value
                }
            }
        };

    }, [currentUser, questCompletions, quests, selectedXpType, appMode, rewardTypes]);

    if (!currentUser) return <div>Loading...</div>;

    const hasData = dailyData.some(d => d.value > 0);

    return (
        <div className="space-y-6">
            <Card>
                 <div className="flex justify-between items-center px-6 py-4">
                    <h3 className="text-xl font-medieval text-emerald-400">Progress Overview</h3>
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
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total XP" value={summaryStats.totalXp} icon="⭐" />
                <StatCard title="Quests Completed (30d)" value={summaryStats.questsCompleted} icon="🗺️" />
                <StatCard title="XP Gained (30d)" value={summaryStats.xpGained30d} icon="📈" />
                <StatCard title="Best Day (30d)" value={`${summaryStats.bestDay.xp} XP`} icon="🏆" subtext={summaryStats.bestDay.date}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Daily XP Earned">
                     <div className="p-6">
                        {hasData ? (
                            <BarChart data={dailyData} color={chartColor} />
                        ) : (
                            <p className="text-stone-400 text-center py-10">No XP of this type has been earned recently. Go complete some quests!</p>
                        )}
                    </div>
                </Card>
                 <Card title="Cumulative Growth">
                     <div className="p-6">
                        {hasData ? (
                            <LineChart data={cumulativeData} color={chartColor} />
                        ) : (
                             <p className="text-stone-400 text-center py-10">Waiting for data...</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProgressPage;
