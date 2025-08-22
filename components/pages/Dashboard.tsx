

import React, { useState, useEffect, useMemo } from 'react';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { Quest, QuestType, QuestKind, Trophy } from '../../types';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import ContributeToQuestDialog from '../quests/ContributeToQuestDialog';
import { useDashboardData } from '../dashboard/hooks/useDashboardData';
import RankCard from '../dashboard/RankCard';
import InventoryCard from '../dashboard/InventoryCard';
import TrophyCard from '../dashboard/TrophyCard';
import LeaderboardCard from '../dashboard/LeaderboardCard';
import QuickActionsCard from '../dashboard/QuickActionsCard';
import RecentActivityCard from '../dashboard/RecentActivityCard';
import BarChart from '../user-interface/BarChart';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useProgressionState } from '../../context/ProgressionContext';

const Dashboard: React.FC = () => {
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { trophies } = useProgressionState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [contributingQuest, setContributingQuest] = useState<Quest | null>(null);
    
    const {
        rankData,
        userCurrencies,
        userExperience,
        mostRecentTrophy,
        leaderboard,
        quickActionQuests,
        recentActivities,
        weeklyProgressData,
        terminology,
    } = useDashboardData();
    
    // Chart color logic must remain here as it depends on DOM styles
    const [chartColor, setChartColor] = useState<string>('hsl(158 84% 39%)');
    const { settings } = useSystemState();
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
            const h = style.getPropertyValue('--color-primary-hue').trim();
            const s = style.getPropertyValue('--color-primary-saturation').trim();
            const l = style.getPropertyValue('--color-primary-lightness').trim();
            if (h && s && l) {
                setChartColor(`hsl(${h} ${s} ${l})`);
            }
        }
    }, [activeThemeId]);

    if (!currentUser) return <div>Loading adventurer's data...</div>;
    
    const handleQuestSelect = (quest: Quest) => setSelectedQuest(quest);

    const handleStartAction = (questToAction: Quest) => {
        setSelectedQuest(null);
        if (questToAction.kind === QuestKind.GuildCollaborative) {
            setContributingQuest(questToAction);
        } else {
            setCompletingQuest(questToAction);
        }
    };

    const handleToggleTodo = async (questToToggle: Quest) => {
        if (!currentUser || questToToggle.type !== QuestType.Venture) return;
        const isTodo = questToToggle.todoUserIds?.includes(currentUser.id);
        
        const updatedQuest = isTodo
          ? await unmarkQuestAsTodo(questToToggle.id, currentUser.id)
          : await markQuestAsTodo(questToToggle.id, currentUser.id);
        
        if (updatedQuest && selectedQuest) {
            setSelectedQuest(updatedQuest);
        }
    };
    
    const finalMostRecentTrophy = mostRecentTrophy ? trophies.find(t => t.id === mostRecentTrophy.id) || null : null;

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <RankCard rankData={rankData} terminology={terminology} />
                    <InventoryCard userCurrencies={userCurrencies} userExperience={userExperience} terminology={terminology} />
                    <TrophyCard mostRecentTrophy={finalMostRecentTrophy} terminology={terminology} />
                    <LeaderboardCard leaderboard={leaderboard} />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <QuickActionsCard quests={quickActionQuests} onQuestSelect={handleQuestSelect} />
                    <RecentActivityCard activities={recentActivities} terminology={terminology} />
                    <Card title="Weekly Progress">
                        <div className="h-80">
                           {weeklyProgressData.some(d => d.value > 0) ? (
                                <BarChart key={activeThemeId} data={weeklyProgressData} color={chartColor} />
                            ) : (
                                <p className="text-stone-400 text-center pt-16">No XP earned this week. Time for a quest!</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
             {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartAction(selectedQuest)}
                    onToggleTodo={() => handleToggleTodo(selectedQuest)}
                    isTodo={!!(selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id))}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />
            )}
            {contributingQuest && (
                <ContributeToQuestDialog quest={contributingQuest} onClose={() => setContributingQuest(null)} />
            )}
        </div>
    );
};

export default Dashboard;
