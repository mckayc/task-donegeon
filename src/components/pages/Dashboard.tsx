




import React, { useState, useMemo, useCallback, useEffect } from 'react';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { Quest, DashboardLayout, ConditionSet, QuestType, GameAsset, RewardItem } from '../../types';
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
import { useUIState, useUIDispatch } from '../../context/UIContext';
import DashboardCustomizationDialog from '../dashboard/DashboardCustomizationDialog';
// FIX: Moved isQuestAvailableForUser to its correct import from quests utils.
import { getQuestLockStatus, ConditionDependencies } from '../../utils/conditions';
import { isQuestAvailableForUser } from '../../utils/quests';
import QuestConditionStatusDialog from '../quests/QuestConditionStatusDialog';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useSystemState } from '../../context/SystemContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import DynamicIcon from '../user-interface/DynamicIcon';

interface GoalProgress extends RewardItem {
    current: number;
    icon: string;
    name: string;
}

interface GoalCardProps {
    goalData: {
        hasGoal: boolean;
        item: GameAsset | null;
        progress: GoalProgress[];
        isAffordable: boolean;
    };
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const ProgressBar: React.FC<{ progress: GoalProgress }> = ({ progress }) => {
    // FIX: The GoalProgress type extends RewardItem, which has an 'amount' property, not 'required'.
    const percentage = Math.min(100, (progress.current / progress.amount) * 100);
    return (
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-stone-300 flex items-center gap-1">{progress.icon} {progress.name}</span>
                {/* FIX: The GoalProgress type extends RewardItem, which has an 'amount' property, not 'required'. */}
                <span className="font-mono">{progress.current} / {progress.amount}</span>
            </div>
            <div className="w-full bg-stone-700 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const GoalCard: React.FC<GoalCardProps> = ({ goalData, ...cardProps }) => {
    const { setActivePage, setActiveMarketId } = useUIDispatch();

    const handleViewInMarket = () => {
        if (goalData.item?.marketIds?.[0]) {
            setActiveMarketId(goalData.item.marketIds[0]);
        }
        setActivePage('Marketplace');
    };

    if (!goalData || !goalData.hasGoal || !goalData.item) {
        return (
            <Card title="My Goal" {...cardProps}>
                <div className="text-center text-stone-400">
                    <p className="text-4xl mb-2">⭐</p>
                    <p className="font-semibold text-stone-200">Your wishlist is empty.</p>
                    <p className="text-sm">Add items from the Marketplace to track your goals here.</p>
                    <Button onClick={() => setActivePage('Marketplace')} size="sm" className="mt-4">Go to Marketplace</Button>
                </div>
            </Card>
        );
    }

    const { item, progress } = goalData;

    return (
        <Card title="My Goal" {...cardProps}>
            <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 mb-3 bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <DynamicIcon 
                        iconType={item.iconType} 
                        icon={item.icon} 
                        imageUrl={item.imageUrl} 
                        className="w-full h-full object-contain text-5xl"
                        altText={item.name}
                    />
                </div>
                <h4 className="font-bold text-lg text-amber-300">{item.name}</h4>
                <div className="w-full space-y-3 mt-4 text-left">
                    {progress.map(p => <ProgressBar key={p.rewardTypeId} progress={p} />)}
                </div>
                <Button onClick={handleViewInMarket} size="sm" className="mt-4">
                    View in Marketplace
                </Button>
            </div>
        </Card>
    );
};


export const allCardComponents: { [key: string]: { name: string, component: React.FC<any> } } = {
    quickActions: { name: 'Quick Actions', component: QuickActionsCard },
    recentActivity: { name: 'Recent Activity', component: RecentActivityCard },
    rank: { name: 'Rank', component: RankCard },
    goal: { name: 'My Goal', component: GoalCard },
    trophy: { name: 'Latest Trophy', component: TrophyCard },
    inventory: { name: 'Inventory', component: InventoryCard },
    leaderboard: { name: 'Leaderboard', component: LeaderboardCard },
    pendingApprovals: { name: 'My Pending Items', component: PendingApprovalsCard },
    readingActivity: { name: 'Live Reading Activity', component: ReadingActivityCard },
};

export const defaultLayout: DashboardLayout = {
    layoutType: 'two-column-main-left',
    columns: {
        main: {
            order: ['quickActions', 'recentActivity'],
            collapsed: []
        },
        side: {
            order: ['rank', 'goal', 'trophy', 'inventory', 'leaderboard', 'pendingApprovals', 'readingActivity'],
            collapsed: []
        }
    },
    hidden: [],
};

const Dashboard: React.FC = () => {
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
    const [viewingConditionsForQuest, setViewingConditionsForQuest] = useState<Quest | null>(null);
    const [now, setNow] = useState(new Date());
    
    const { currentUser } = useAuthState();
    const { updateUser } = useAuthDispatch();
    const { addNotification } = useNotificationsDispatch();
    const { activePageMeta, appMode, readingQuest, readingPdfQuest } = useUIState();
    const { quests } = useQuestsState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();

    const selectedQuest = useMemo(() => {
        if (!selectedQuestId) return null;
        return quests.find(q => q.id === selectedQuestId);
    }, [selectedQuestId, quests]);

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
        myGoal,
        terminology
    } = useDashboardData();

    const layout = useMemo<DashboardLayout>(() => {
        const userLayout = currentUser?.dashboardLayout;
        if (!userLayout) {
            return defaultLayout;
        }
    
        const allCardIds = new Set(Object.keys(allCardComponents));
        
        // Create a deep copy to avoid mutation issues
        const newLayout: DashboardLayout = JSON.parse(JSON.stringify(userLayout));

        // Ensure all structural properties exist
        newLayout.columns = newLayout.columns || { main: { order: [], collapsed: [] }, side: { order: [], collapsed: [] } };
        newLayout.columns.main = newLayout.columns.main || { order: [], collapsed: [] };
        newLayout.columns.side = newLayout.columns.side || { order: [], collapsed: [] };
        newLayout.hidden = newLayout.hidden || [];

        // Filter out any stale card IDs that no longer exist
        newLayout.columns.main.order = newLayout.columns.main.order.filter(id => allCardIds.has(id));
        newLayout.columns.side.order = newLayout.columns.side.order.filter(id => allCardIds.has(id));
        newLayout.hidden = newLayout.hidden.filter(id => allCardIds.has(id));

        const handledCardIds = new Set([
            ...newLayout.columns.main.order,
            ...newLayout.columns.side.order
        ]);
        
        // Add any new cards from `allCardComponents` that aren't in the user's layout yet
        allCardIds.forEach(id => {
            if (!handledCardIds.has(id)) {
                if (defaultLayout.columns.main.order.includes(id)) {
                    newLayout.columns.main.order.push(id);
                } else if (defaultLayout.columns.side.order.includes(id)) {
                    newLayout.columns.side.order.push(id);
                }
            }
        });
    
        return newLayout;
    }, [currentUser?.dashboardLayout]);

    const visibleMainCards = useMemo(() => layout.columns.main.order.filter(id => !layout.hidden.includes(id)), [layout]);
    const visibleSideCards = useMemo(() => layout.columns.side.order.filter(id => !layout.hidden.includes(id)), [layout]);

    const inactiveConditionalCards = useMemo(() => {
        const inactive: string[] = [];
        if (!myGoal?.hasGoal) {
            inactive.push('goal');
        }
        if (!mostRecentTrophy) {
            inactive.push('trophy');
        }
        if (pendingApprovals.quests.length === 0 && pendingApprovals.purchases.length === 0) {
            inactive.push('pendingApprovals');
        }
        if (!readingQuest && !readingPdfQuest) {
            inactive.push('readingActivity');
        }
        return inactive;
    }, [myGoal, mostRecentTrophy, pendingApprovals, readingQuest, readingPdfQuest]);


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

    const handleReorder = useCallback((column: 'main' | 'side', newVisibleOrder: string[]) => {
        const newLayout = JSON.parse(JSON.stringify(layout));
        const fullOrder = newLayout.columns[column].order;
        const visibleCardsInColumn = fullOrder.filter((id: string) => !newLayout.hidden.includes(id));
    
        // Create a copy to consume
        const newOrderCopy = [...newVisibleOrder];
        
        // Reconstruct the full order array by replacing visible items with their new order
        const newFullOrder = fullOrder.map((cardId: string) => {
            if (visibleCardsInColumn.includes(cardId)) {
                return newOrderCopy.shift()!;
            }
            return cardId;
        });
    
        newLayout.columns[column].order = newFullOrder;
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
            setSelectedQuestId(quest.id);
        }
    };

    const handleStartCompletion = () => {
        if (selectedQuest) {
            setCompletingQuest(selectedQuest);
            setSelectedQuestId(null);
        }
    };

    const handleToggleTodo = () => {
        if (!selectedQuest || !currentUser) return;
        const isCurrentlyTodo = selectedQuest.todoUserIds?.includes(currentUser.id);
        
        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(selectedQuest.id, currentUser.id);
        } else {
            markQuestAsTodo(selectedQuest.id, currentUser.id);
        }
    };
    
    const renderCard = (cardId: string, column: 'main' | 'side', dragControls: ReturnType<typeof useDragControls>) => {
        const CardComponent = allCardComponents[cardId]?.component;
        if (!CardComponent) return null;

        if (inactiveConditionalCards.includes(cardId)) return null;
        
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
            case 'goal': cardProps.goalData = myGoal; break;
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
                    values={visibleMainCards}
                    onReorder={newOrder => handleReorder('main', newOrder)}
                    className={`${mainColClasses} space-y-6`}
                >
                    {visibleMainCards.map(cardId => {
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
                        values={visibleSideCards}
                        onReorder={newOrder => handleReorder('side', newOrder)}
                        className={`${sideColClasses} space-y-6`}
                    >
                        {visibleSideCards.map(cardId => {
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
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuestId(null)}
                    onComplete={handleStartCompletion}
                    onToggleTodo={handleToggleTodo}
                    isTodo={selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id)}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />
            )}
            {isCustomizeDialogOpen && currentUser && (
                <DashboardCustomizationDialog
                    userLayout={layout}
                    onClose={() => setIsCustomizeDialogOpen(false)}
                    onSave={saveLayout}
                    inactiveConditionalCards={inactiveConditionalCards}
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