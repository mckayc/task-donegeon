
import React, { useState, useMemo, useCallback } from 'react';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { Quest, DashboardLayout } from '../../types';
import RankCard from '../dashboard/RankCard';
import InventoryCard from '../dashboard/InventoryCard';
import LeaderboardCard from '../dashboard/LeaderboardCard';
import QuickActionsCard from '../dashboard/QuickActionsCard';
import RecentActivityCard from '../dashboard/RecentActivityCard';
import PendingApprovalsCard from '../dashboard/PendingApprovalsCard';
import TrophyCard from '../dashboard/TrophyCard';
import ReadingActivityCard from '../dashboard/ReadingActivityCard';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { Reorder, useDragControls } from 'framer-motion';

const cardComponents: { [key: string]: React.FC<any> } = {
    quickActions: QuickActionsCard,
    recentActivity: RecentActivityCard,
    rank: RankCard,
    trophy: TrophyCard,
    inventory: InventoryCard,
    leaderboard: LeaderboardCard,
    pendingApprovals: PendingApprovalsCard,
    readingActivity: ReadingActivityCard,
};

const defaultLayout: DashboardLayout = {
    left: {
        order: ['quickActions', 'recentActivity'],
        collapsed: []
    },
    right: {
        order: ['rank', 'trophy', 'inventory', 'leaderboard', 'pendingApprovals', 'readingActivity'],
        collapsed: []
    }
};


const Dashboard: React.FC = () => {
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const { currentUser } = useAuthState();
    const { updateUser } = useAuthDispatch();

    const { 
        rankData, 
        userCurrencies, 
        userExperience,
        recentActivities,
        pendingApprovals,
        leaderboard, 
        mostRecentTrophy,
        quickActionQuests,
        terminology
    } = useDashboardData();

    const [layout, setLayout] = useState<DashboardLayout>(() => {
        // Deep merge to ensure new cards from defaultLayout are included if not in user's saved layout
        const userLayout = currentUser?.dashboardLayout;
        if (!userLayout) return defaultLayout;
        
        const mergedLayout = JSON.parse(JSON.stringify(defaultLayout));
        
        const mergeColumn = (column: 'left' | 'right') => {
            if (userLayout[column]) {
                const userOrder = userLayout[column].order || [];
                const defaultOrder = defaultLayout[column].order;
                const combinedOrder = [...new Set([...userOrder, ...defaultOrder])];
                mergedLayout[column].order = combinedOrder.filter(id => cardComponents[id]);
                mergedLayout[column].collapsed = userLayout[column].collapsed || [];
            }
        };

        mergeColumn('left');
        mergeColumn('right');
        return mergedLayout;
    });

    const saveLayout = useCallback((newLayout: DashboardLayout) => {
        if (currentUser) {
            setLayout(newLayout);
            // Debounce this in a real app if it becomes too chatty
            updateUser(currentUser.id, { dashboardLayout: newLayout });
        }
    }, [currentUser, updateUser]);

    const handleToggleCollapse = useCallback((column: 'left' | 'right', cardId: string) => {
        const newLayout = { ...layout };
        newLayout[column] = { ...newLayout[column] };
        const collapsed = newLayout[column].collapsed;
        
        if (collapsed.includes(cardId)) {
            newLayout[column].collapsed = collapsed.filter(id => id !== cardId);
        } else {
            newLayout[column].collapsed.push(cardId);
        }
        saveLayout(newLayout);
    }, [layout, saveLayout]);

    const handleReorder = useCallback((column: 'left' | 'right', newOrder: string[]) => {
        const newLayout = { ...layout };
        newLayout[column] = { ...newLayout[column], order: newOrder };
        saveLayout(newLayout);
    }, [layout, saveLayout]);
    
    if (!rankData.currentRank) {
        return <div className="text-center text-stone-400">Loading dashboard...</div>;
    }
    
    const handleQuestSelect = (quest: Quest) => setSelectedQuest(quest);

    const handleStartCompletion = () => {
        if (selectedQuest) {
            setCompletingQuest(selectedQuest);
            setSelectedQuest(null);
        }
    };
    
    const renderCard = (cardId: string, column: 'left' | 'right', dragControls: ReturnType<typeof useDragControls>) => {
        const CardComponent = cardComponents[cardId];
        if (!CardComponent) return null;

        const cardProps: any = {
            isCollapsible: true,
            isCollapsed: layout[column].collapsed.includes(cardId),
            onToggleCollapse: () => handleToggleCollapse(column, cardId),
            dragHandleProps: { onPointerDown: (event: React.PointerEvent) => dragControls.start(event) },
        };
        
        switch (cardId) {
            case 'quickActions': cardProps.quests = quickActionQuests; cardProps.onQuestSelect = handleQuestSelect; break;
            case 'recentActivity': cardProps.activities = recentActivities; cardProps.terminology = terminology; break;
            case 'rank': cardProps.rankData = rankData; cardProps.terminology = terminology; break;
            case 'trophy': cardProps.mostRecentTrophy = mostRecentTrophy; cardProps.terminology = terminology; break;
            case 'inventory': cardProps.userCurrencies = userCurrencies; cardProps.userExperience = userExperience; cardProps.terminology = terminology; break;
            case 'leaderboard': cardProps.leaderboard = leaderboard; break;
            case 'pendingApprovals': cardProps.pendingData = pendingApprovals; cardProps.onQuestSelect = handleQuestSelect; break;
            case 'readingActivity': break; // No specific props needed
        }

        return <CardComponent {...cardProps} />;
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Reorder.Group
                    axis="y"
                    values={layout.left.order}
                    onReorder={(newOrder) => handleReorder('left', newOrder)}
                    className="lg:col-span-2 space-y-6"
                >
                    {layout.left.order.map(cardId => {
                         const controls = useDragControls();
                         return (
                            <Reorder.Item key={cardId} value={cardId} dragListener={false} dragControls={controls}>
                                {renderCard(cardId, 'left', controls)}
                            </Reorder.Item>
                         );
                    })}
                </Reorder.Group>

                <Reorder.Group
                    axis="y"
                    values={layout.right.order}
                    onReorder={(newOrder) => handleReorder('right', newOrder)}
                    className="lg:col-span-1 space-y-6"
                >
                    {layout.right.order.map(cardId => {
                         const controls = useDragControls();
                         return (
                            <Reorder.Item key={cardId} value={cardId} dragListener={false} dragControls={controls}>
                                {renderCard(cardId, 'right', controls)}
                            </Reorder.Item>
                         );
                    })}
                </Reorder.Group>
            </div>
            {selectedQuest && (
                <QuestDetailDialog quest={selectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleStartCompletion} />
            )}
            {completingQuest && (
                <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />
            )}
        </>
    );
};

export default Dashboard;