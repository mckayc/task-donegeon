import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Import useQuestsState to resolve missing name error.
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
// FIX: Add ConditionSet to types import and import ConditionDependencies.
import { Quest, Role, ConditionSet } from '../../types';
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
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useCommunityState } from '../../context/CommunityContext';
import PendingApprovalsCard from '../dashboard/PendingApprovalsCard';
// FIX: Import ConditionDependencies from utils/conditions.
import { getQuestLockStatus, ConditionDependencies } from '../../utils/conditions';
import QuestConditionStatusDialog from '../quests/QuestConditionStatusDialog';
import ReadingActivityCard from '../dashboard/ReadingActivityCard';
import { Reorder, useDragControls } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';
// FIX: Import useProgressionState and useEconomyState to resolve missing name errors and to be used in conditionDependencies.
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';

const Dashboard: React.FC = () => {
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();
    // FIX: Call useQuestsState to get quest data.
    const { quests, questCompletions, questGroups } = useQuestsState();
    // FIX: Call useProgressionState to get progression data and store the whole state.
    const progressionState = useProgressionState();
    const { trophies } = progressionState;
    // FIX: Add calls to other necessary state hooks for condition dependencies.
    const economyState = useEconomyState();
    const communityState = useCommunityState();
    const systemState = useSystemState();
    const { settings } = systemState;
    
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const { updateUser } = useAuthDispatch();

    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [contributingQuest, setContributingQuest] = useState<Quest | null>(null);
    const [viewingConditionsForQuest, setViewingConditionsForQuest] = useState<Quest | null>(null);

    const {
        rankData,
        userCurrencies,
        userExperience,
        mostRecentTrophy,
        leaderboard,
        quickActionQuests,
        recentActivities,
        pendingApprovals,
        weeklyProgressData,
        terminology,
    } = useDashboardData();

    // Chart color logic
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
            const primaryHsl = style.getPropertyValue('--primary').trim();
            if (primaryHsl) {
                setChartColor(`hsl(${primaryHsl})`);
            }
        }
    }, [activeThemeId]);
    
    // --- Dashboard Layout State & Logic ---
    const defaultLayout = useMemo(() => ({
        left: { order: ['rank', 'inventory', 'trophy', 'leaderboard'], collapsed: [] },
        right: { order: ['reading', 'pending', 'quick-actions', 'activity', 'progress'], collapsed: [] }
    }), []);
    
    const [layout, setLayout] = useState(() => {
        if (currentUser?.dashboardLayout?.left && currentUser.dashboardLayout.right) {
            const saved = currentUser.dashboardLayout;
            const valid = saved.left.order && saved.right.order && saved.left.collapsed !== undefined && saved.right.collapsed !== undefined;
            return valid ? saved : defaultLayout;
        }
        return defaultLayout;
    });

    const debouncedLayout = useDebounce(layout, 1500);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (currentUser && debouncedLayout) {
            updateUser(currentUser.id, { dashboardLayout: debouncedLayout });
        }
    }, [debouncedLayout, currentUser, updateUser]);

    const handleToggleCollapse = (column: 'left' | 'right', cardId: string) => {
        setLayout(prev => {
            const collapsed = prev[column].collapsed;
            const newCollapsed = collapsed.includes(cardId) ? collapsed.filter(id => id !== cardId) : [...collapsed, cardId];
            return { ...prev, [column]: { ...prev[column], collapsed: newCollapsed } };
        });
    };

    // FIX: Define conditionDependencies to be passed to getQuestLockStatus.
    const conditionDependencies = useMemo<ConditionDependencies & { allConditionSets: ConditionSet[] }>(() => ({
        ...progressionState, ...economyState, ...communityState, quests, questGroups, questCompletions, appMode, allConditionSets: settings.conditionSets
    }), [progressionState, economyState, communityState, quests, questGroups, questCompletions, appMode, settings.conditionSets]);

    if (!currentUser) return <div>Loading adventurer's data...</div>;

    const isAdmin = currentUser.role === Role.DonegeonMaster;
    const finalMostRecentTrophy = mostRecentTrophy ? trophies.find(t => t.id === mostRecentTrophy.id) || null : null;
    const hasPending = pendingApprovals.quests.length > 0 || pendingApprovals.purchases.length > 0;

    const handleQuestSelect = (quest: Quest) => {
        const lockStatus = getQuestLockStatus(quest, currentUser, conditionDependencies);
        if (lockStatus.isLocked) {
            setViewingConditionsForQuest(quest);
        } else {
            setSelectedQuest(quest);
        }
    };
    
     const ReorderableCard: React.FC<{ cardId: string; column: 'left' | 'right'; children: React.ReactElement }> = ({ cardId, column, children }) => {
        const dragControls = useDragControls();
        const propsToInject = {
            isCollapsible: true,
            isCollapsed: layout[column].collapsed.includes(cardId),
            onToggleCollapse: () => handleToggleCollapse(column, cardId),
            dragHandleProps: { onPointerDown: (e: React.PointerEvent) => dragControls.start(e) }
        };
        return (
            <Reorder.Item 
                key={cardId} 
                value={cardId} 
                dragListener={false} 
                dragControls={dragControls}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: '0px 10px 20px rgba(0,0,0,0.2)' }}
            >
                {React.cloneElement(children, propsToInject)}
            </Reorder.Item>
        );
    };

    const WeeklyProgressCard: React.FC<any> = (props) => (
        <Card title="Weekly Progress" {...props}>
            <div className="h-80">
                {weeklyProgressData.some(d => d.value > 0) ? (
                    <BarChart key={activeThemeId} data={weeklyProgressData} color={chartColor} />
                ) : (
                    <p className="text-stone-400 text-center pt-16">No XP earned this week. Time for a quest!</p>
                )}
            </div>
        </Card>
    );

    const allCards = useMemo(() => ({
        rank: <RankCard rankData={rankData} terminology={terminology} />,
        inventory: <InventoryCard userCurrencies={userCurrencies} userExperience={userExperience} terminology={terminology} />,
        trophy: <TrophyCard mostRecentTrophy={finalMostRecentTrophy} terminology={terminology} />,
        leaderboard: <LeaderboardCard leaderboard={leaderboard} />,
        reading: isAdmin ? <ReadingActivityCard /> : null,
        pending: hasPending ? <PendingApprovalsCard pendingData={pendingApprovals} onQuestSelect={handleQuestSelect} /> : null,
        'quick-actions': <QuickActionsCard quests={quickActionQuests} onQuestSelect={handleQuestSelect} />,
        activity: <RecentActivityCard activities={recentActivities} terminology={terminology} />,
        progress: <WeeklyProgressCard />,
    }), [rankData, terminology, userCurrencies, userExperience, finalMostRecentTrophy, leaderboard, isAdmin, hasPending, pendingApprovals, quickActionQuests, recentActivities, weeklyProgressData, chartColor, activeThemeId]);
    
    // Filter out null cards and ensure order integrity
    const getAvailableCards = (order: string[]) => order.filter(id => allCards[id as keyof typeof allCards]);
    
    const availableLeftCardIds = getAvailableCards(layout.left.order);
    const availableRightCardIds = getAvailableCards(layout.right.order);

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Reorder.Group
                    axis="y"
                    values={availableLeftCardIds}
                    onReorder={(newOrder) => setLayout(prev => ({ ...prev, left: { ...prev.left, order: newOrder } }))}
                    className="lg:col-span-1 space-y-6"
                >
                   {availableLeftCardIds.map(cardId => (
                       <ReorderableCard key={cardId} cardId={cardId} column="left">
                           {allCards[cardId as keyof typeof allCards]!}
                       </ReorderableCard>
                   ))}
                </Reorder.Group>

                 <Reorder.Group
                    axis="y"
                    values={availableRightCardIds}
                    onReorder={(newOrder) => setLayout(prev => ({ ...prev, right: { ...prev.right, order: newOrder } }))}
                    className="lg:col-span-2 space-y-6"
                >
                    {availableRightCardIds.map(cardId => (
                       <ReorderableCard key={cardId} cardId={cardId} column="right">
                           {allCards[cardId as keyof typeof allCards]!}
                       </ReorderableCard>
                   ))}
                </Reorder.Group>
            </div>
            {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => {
                        setCompletingQuest(selectedQuest);
                        setSelectedQuest(null);
                    }}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />
            )}
            {contributingQuest && (
                <ContributeToQuestDialog quest={contributingQuest} onClose={() => setContributingQuest(null)} />
            )}
             {viewingConditionsForQuest && (
                <QuestConditionStatusDialog
                    quest={viewingConditionsForQuest}
                    user={currentUser}
                    onClose={() => setViewingConditionsForQuest(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;