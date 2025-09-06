import React, { useState, useMemo, useCallback, useEffect } from 'react';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { Quest, DashboardLayout, ConditionSet } from '../../types';
import RankCard from '../dashboard/RankCard';
import InventoryCard from '../dashboard/InventoryCard';
import LeaderboardCard from '../dashboard/LeaderboardCard';
import QuickActionsCard from '../dashboard/QuickActionsCard';
import RecentActivityCard from '../dashboard/RecentActivityCard';
import PendingApprovalsCard from '../dashboard/PendingApprovalsCard';
import TrophyCard from '../dashboard/TrophyCard';
import ReadingActivityCard from '../dashboard/ReadingActivityCard';
import { useDashboardData } from '../dashboard/hooks/useDashboardData';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { Reorder, useDragControls } from 'framer-motion';
import { useUIState } from '../../context/UIContext';
import DashboardCustomizationDialog from '../dashboard/DashboardCustomizationDialog';
// FIX: Moved isQuestAvailableForUser to its correct import from quests utils.
import { getQuestLockStatus, ConditionDependencies } from '../../utils/conditions';
import { isQuestAvailableForUser } from '../../utils/quests';
import QuestConditionStatusDialog from '../quests/QuestConditionStatusDialog';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useSystemState } from '../../context/SystemContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { QuestType } from '../quests/types';

export const allCardComponents: { [key: string]: { name: string, component: React.FC<any> } } = {
    quickActions: { name: 'Quick Actions', component: QuickActionsCard },
    recentActivity: { name: 'Recent Activity', component: RecentActivityCard },
    rank: { name: 'Rank', component: RankCard },
    trophy: { name: 'Latest Trophy', component: TrophyCard },
    inventory: { name: 'Inventory', component: InventoryCard },
    leaderboard: { name: 'Leaderboard', component: LeaderboardCard },
    pendingApprovals: { name: 'My Pending Items', component: PendingApprovalsCard },
    readingActivity: { name: 'Live Reading Activity', component: ReadingActivityCard },
};

const defaultLayout: DashboardLayout = {
    layoutType: 'two-column-main-left',
    columns: {
        main: {
            order: ['quickActions', 'recentActivity'],
            collapsed: []
        },
        side: {
            order: ['rank', 'trophy', 'inventory', 'leaderboard', 'pendingApprovals', 'readingActivity'],
            collapsed: []
        }
    },
    hidden: [],
};

const Dashboard: React.FC = () => {
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
    const [viewingConditionsForQuest, setViewingConditionsForQuest] = useState<Quest | null>(null);
    const [now, setNow] = useState(new Date());
    
    const { currentUser } = useAuthState();
    const { updateUser } = useAuthDispatch();
    const { addNotification } = useNotificationsDispatch();
    const { activePageMeta, appMode } = useUIState();

    // Dependencies for condition checking
    const progressionState = useProgressionState();
    const economyState = useEconomyState();
    const communityState = useCommunityState();
    const questsState = useQuestsState();
    const systemState = useSystemState();

    const conditionDependencies = useMemo<ConditionDependencies & { allConditionSets: ConditionSet[] }>(() => ({
        ...progressionState, ...economyState, ...communityState, ...questsState, allConditionSets: systemState.settings.conditionSets, appMode
    }), [progressionState, economyState, communityState, questsState, systemState.settings.conditionSets, appMode]);


    useEffect(() => {
        if (activePageMeta?.from === 'header-customize-dashboard') {
            setIsCustomizeDialogOpen(true);
        }
    }, [activePageMeta]);
    
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { 
        rankData, 
        userCurrencies, 
        userExperience,
        totalEarnedXp,
        totalEarnedCurrencies,
        recentActivities,
        pendingApprovals,
        leaderboard, 
        mostRecentTrophy,
        quickActionQuests,
        terminology
    } = useDashboardData();

    const layout = useMemo<DashboardLayout>(() => {
        const userLayout = currentUser?.dashboardLayout;
        if (!userLayout) return defaultLayout;

        const mergedLayout = JSON.parse(JSON.stringify(defaultLayout));
        mergedLayout.layoutType = userLayout.layoutType || defaultLayout.layoutType;

        const allKnownCardIds = new Set(Object.keys(allCardComponents));

        const mergeColumn = (column: 'main' | 'side') => {
            if (userLayout.columns && userLayout.columns[column]) {
                const userOrder = userLayout.columns[column].order || [];
                const defaultOrder = defaultLayout.columns[column].order;
                const combinedOrder = [...new Set([...userOrder, ...defaultOrder])];
                mergedLayout.columns[column].order = combinedOrder.filter(id => allKnownCardIds.has(id) && !(userLayout.hidden || []).includes(id));
                mergedLayout.columns[column].collapsed = userLayout.columns[column].collapsed || [];
            }
        };

        mergeColumn('main');
        mergeColumn('side');
        
        mergedLayout.hidden = userLayout.hidden?.filter(id => allKnownCardIds.has(id)) || [];

        return mergedLayout;
    }, [currentUser?.dashboardLayout]);

    const saveLayout = useCallback((newLayout: DashboardLayout) => {
        if (currentUser) {
            updateUser(currentUser.id, { dashboardLayout: newLayout });
        }
    }, [currentUser, updateUser]);

    const handleToggleCollapse = useCallback((column: 'main' | 'side', cardId: string) => {
        const newLayout = JSON.parse(JSON.stringify(layout));
        const collapsed = newLayout.columns[column].collapsed;
        
        if (collapsed.includes(cardId)) {
            newLayout.columns[column].collapsed = collapsed.filter((id: string) => id !== cardId);
        } else {
            newLayout.columns[column].collapsed.push(cardId);
        }
        saveLayout(newLayout);
    }, [layout, saveLayout]);

    const handleReorder = useCallback((column: 'main' | 'side', newOrder: string[]) => {
        const newLayout = JSON.parse(JSON.stringify(layout));
        newLayout.columns[column].order = newOrder;
        saveLayout(newLayout);
    }, [layout, saveLayout]);
    
    if (!rankData.currentRank || !currentUser) {
        return <div className="text-center text-stone-400">Loading dashboard...</div>;
    }
    
    const handleQuestSelect = (quest: Quest) => {
        const isAvailable = isQuestAvailableForUser(
            quest,
            questsState.questCompletions.filter(c => c.userId === currentUser.id),
            now,
            systemState.scheduledEvents,
            appMode
        );

        if (!isAvailable && quest.type === QuestType.Duty) {
            addNotification({
                type: 'info',
                message: `This duty is not scheduled for today and cannot be completed.`
            });
            return;
        }

        const lockStatus = getQuestLockStatus(quest, currentUser, conditionDependencies);
        if (lockStatus.isLocked) {
            setViewingConditionsForQuest(quest);
        } else {
            setSelectedQuest(quest);
        }
    };

    const handleStartCompletion = () => {
        if (selectedQuest) {
            setCompletingQuest(selectedQuest);
            setSelectedQuest(null);
        }
    };
    
    const renderCard = (cardId: string, column: 'main' | 'side', dragControls: ReturnType<typeof useDragControls>) => {
        const CardComponent = allCardComponents[cardId]?.component;
        if (!CardComponent) return null;

        if (cardId === 'trophy' && !mostRecentTrophy) return null;
        
        const cardProps: any = {
            isCollapsible: true,
            isCollapsed: layout.columns[column].collapsed.includes(cardId),
            onToggleCollapse: () => handleToggleCollapse(column, cardId),
            dragHandleProps: { onPointerDown: (event: React.PointerEvent) => dragControls.start(event) },
        };
        
        switch (cardId) {
            case 'quickActions': cardProps.quests = quickActionQuests; cardProps.onQuestSelect = handleQuestSelect; break;
            case 'recentActivity': cardProps.activities = recentActivities; cardProps.terminology = terminology; break;
            case 'rank':
                cardProps.rankData = rankData;
                cardProps.terminology = terminology;
                cardProps.currentXp = userExperience.reduce((sum, xp) => sum + xp.amount, 0);
                cardProps.totalEarnedXp = totalEarnedXp;
                cardProps.currentUserCurrencies = userCurrencies;
                cardProps.totalEarnedCurrencies = totalEarnedCurrencies;
                break;
            case 'trophy': cardProps.mostRecentTrophy = mostRecentTrophy; cardProps.terminology = terminology; break;
            case 'inventory': cardProps.userCurrencies = userCurrencies; cardProps.userExperience = userExperience; cardProps.terminology = terminology; break;
            case 'leaderboard': cardProps.leaderboard = leaderboard; break;
            case 'pendingApprovals': cardProps.pendingData = pendingApprovals; cardProps.onQuestSelect = handleQuestSelect; break;
            case 'readingActivity': break; // No extra props needed
        }

        return <CardComponent {...cardProps} />;
    };
    
    const gridClasses = {
        'single-column': 'grid-cols-1',
        'two-column-main-left': 'grid-cols-1 lg:grid-cols-3 gap-6',
        'two-column-main-right': 'grid-cols-1 lg:grid-cols-3 gap-6',
    }[layout.layoutType] || 'grid-cols-1 lg:grid-cols-3 gap-6';

    const mainColClasses = {
        'single-column': 'col-span-1',
        'two-column-main-left': 'lg:col-span-2',
        'two-column-main-right': 'lg:col-span-2 lg:order-2',
    }[layout.layoutType] || 'lg:col-span-2';

    const sideColClasses = {
        'single-column': 'col-span-1',
        'two-column-main-left': 'lg:col-span-1',
        'two-column-main-right': 'lg:col-span-1 lg:order-1',
    }[layout.layoutType] || 'lg:col-span-1';

    return (
        <>
            <div className={`grid ${gridClasses}`}>
                <Reorder.Group
                    axis="y"
                    values={layout.columns.main.order}
                    onReorder={(newOrder) => handleReorder('main', newOrder as string[])}
                    className={`${mainColClasses} space-y-6`}
                >
                    {layout.columns.main.order.map(cardId => {
                         const controls = useDragControls();
                         const card = renderCard(cardId, 'main', controls);
                         if (!card) return null;
                         return (
                            <Reorder.Item key={cardId} value={cardId} dragListener={false} dragControls={controls}>
                                {card}
                            </Reorder.Item>
                         );
                    })}
                </Reorder.Group>

                {layout.layoutType !== 'single-column' && (
                    <Reorder.Group
                        axis="y"
                        values={layout.columns.side.order}
                        onReorder={(newOrder) => handleReorder('side', newOrder as string[])}
                        className={`${sideColClasses} space-y-6`}
                    >
                        {layout.columns.side.order.map(cardId => {
                            const controls = useDragControls();
                            const card = renderCard(cardId, 'side', controls);
                            if (!card) return null;
                            return (
                                <Reorder.Item key={cardId} value={cardId} dragListener={false} dragControls={controls}>
                                    {card}
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                )}
            </div>
            
            {selectedQuest && (
                <QuestDetailDialog quest={selectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleStartCompletion} />
            )}
            {completingQuest && (
                <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />
            )}
            {isCustomizeDialogOpen && currentUser && (
                <DashboardCustomizationDialog
                    userLayout={layout}
                    onClose={() => setIsCustomizeDialogOpen(false)}
                    onSave={saveLayout}
                />
            )}
            {viewingConditionsForQuest && (
                <QuestConditionStatusDialog
                    quest={viewingConditionsForQuest}
                    user={currentUser}
                    onClose={() => setViewingConditionsForQuest(null)}
                />
            )}
        </>
    );
};

export default Dashboard;