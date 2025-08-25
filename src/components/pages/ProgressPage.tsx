
import React, { useState, useMemo, useEffect } from 'react';
import { RewardCategory, QuestCompletionStatus, RewardItem } from '../../../types';
import Card from '../user-interface/Card';
import LineChart from '../user-interface/LineChart';
import BarChart from '../user-interface/BarChart';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useProgressionState } from '../../context/ProgressionContext';
import { useCommunityState } from '../../context/CommunityContext';

const StatCard: React.FC<{ title: string; value: string | number; icon: string; subtext?: string }> = ({ title, value, icon, subtext }) => (
    <div className="bg-stone-800/60 p-4 rounded-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center text-2xl text-emerald-300 flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-stone-400">{title}</p>
            <p className="text-2xl font-bold text-stone-100">{value}</p>
            {subtext && <p className="text-xs text-stone-500">{subtext}</p>}
        </div>
    </div>
);


const ProgressPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { settings } = useSystemState();
    const { appMode } = useUIState();
    const { quests, questCompletions } = useQuestsState();
    const { rewardTypes } = useEconomyState();
    const { ranks } = useProgressionState();

    const [chartColor, setChartColor] = useState<string>('hsl(158 84% 39%)');
    const { guilds } = useCommunityState();

    const activeThemeId = useMemo(() => {
        let themeId: string | undefined = settings.theme;
        if (appMode.mode === 'guild') {
            const currentGuild = guilds.find(g => g.id === appMode.guildId);
            themeId = currentGuild?.themeId || currentUser?.theme;
        } else {
            themeId = currentUser?.theme;
        }
        return themeId || 'default';
    }, [settings.theme, currentUser?.theme, appMode, guilds]);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const style = getComputedStyle(document.documentElement);
            const h = style.getPropertyValue('--color-primary-hue')?.trim();
            const s = style.getPropertyValue('--color-primary-saturation')?.trim();
            const l = style.getPropertyValue('--color-primary-lightness')?.trim();
            if (h && s && l) {
                setChartColor(`hsl(${h} ${s} ${l})`);
            }
        }
    }, [activeThemeId]);
    
    const { totalXp, currentRank, weeklyProgressData, monthlyProgressData, questsCompleted, dutiesCompleted, venturesCompleted } = useMemo(() => {
        if (!currentUser) return { totalXp: 0, currentRank: null, weeklyProgressData: [], monthlyProgressData: [], questsCompleted: 0, dutiesCompleted: 0, venturesCompleted: 0 };
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const experience: { [key: string]: number } = appMode.mode === 'guild' ? currentUser.guildBalances[appMode.guildId]?.experience || {} : currentUser.personalExperience;
        const totalXp = Object.values(experience).reduce((sum, amount) => sum + Number(amount), 0);

        const currentRank = [...ranks].sort((a,b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold) || null;
        
        const completionsInScope = questCompletions.filter(c => c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && c.guildId == currentGuildId);
        
        // --- Chart Data ---
        const today = new Date();
        const weeklyData: { [date: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            weeklyData[date.toISOString().split('T')[0]] = 0;
        }

        const monthlyData: { [date: string]: number } = {};
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            monthlyData[date.toISOString().split('T')[0]] = 0;
        }

        completionsInScope.forEach(comp => {
            const quest = quests.find(q => q.id === comp.questId);
            if (!quest) return;
            const xpForThisQuest = quest.rewards.filter(r => rewardTypes.find(rt => rt.id === r.rewardTypeId)?.category === RewardCategory.XP).reduce<number>((sum, r) => sum + Number(r.amount), 0);

            const dateKey = comp.completedAt.split('T')[0];
            if (dateKey in weeklyData) weeklyData[dateKey] += xpForThisQuest;
            if (dateKey in monthlyData) monthlyData[dateKey] += xpForThisQuest;
        });

        const weeklyProgressData = Object.entries(weeklyData).map(([date, value]) => ({ label: new Date(date + 'T00:00:00').toLocaleDateString('default', { weekday: 'short' }), value }));
        const monthlyProgressData = Object.entries(monthlyData).map(([date, value]) => ({ label: new Date(date + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' }), value }));
        
        const questsCompleted = completionsInScope.length;
        const dutiesCompleted = completionsInScope.filter(c => quests.find(q => q.id === c.questId)?.type === 'Duty').length;
        const venturesCompleted = completionsInScope.filter(c => quests.find(q => q.id === c.questId)?.type === 'Venture').length;

        return { totalXp, currentRank, weeklyProgressData, monthlyProgressData, questsCompleted, dutiesCompleted, venturesCompleted };

    }, [currentUser, appMode, questCompletions, quests, rewardTypes, ranks]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total XP" value={totalXp} icon="⭐" subtext={currentRank?.name || 'Unranked'} />
                <StatCard title={`Total ${settings.terminology.tasks}`} value={questsCompleted} icon="🗺️" />
                <StatCard title={settings.terminology.recurringTasks} value={dutiesCompleted} icon="🔄" />
                <StatCard title={settings.terminology.singleTasks} value={venturesCompleted} icon="📍" />
            </div>
            <Card title="Weekly XP Progress">
                <div className="h-80">
                    <BarChart key={`weekly-${activeThemeId}`} data={weeklyProgressData} color={chartColor} />
                </div>
            </Card>
             <Card title="Monthly XP Progress">
                <div className="h-80">
                    <LineChart key={`monthly-${activeThemeId}`} data={monthlyProgressData} color={chartColor} />
                </div>
            </Card>
        </div>
    );
};

export default ProgressPage;
