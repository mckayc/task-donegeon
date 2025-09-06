
import React, { useState } from 'react';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { Quest } from '../quests/types';
import RankCard from '../dashboard/RankCard';
import InventoryCard from '../dashboard/InventoryCard';
import LeaderboardCard from '../dashboard/LeaderboardCard';
import QuickActionsCard from '../dashboard/QuickActionsCard';
import RecentActivityCard from '../dashboard/RecentActivityCard';
import PendingApprovalsCard from '../dashboard/PendingApprovalsCard';
import TrophyCard from '../dashboard/TrophyCard';
import ReadingActivityCard from '../dashboard/ReadingActivityCard';
import { useDashboardData } from './dashboard/hooks/useDashboardData';

const Dashboard: React.FC = () => {
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);

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
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <QuickActionsCard quests={quickActionQuests} onQuestSelect={handleQuestSelect} />
                    <RecentActivityCard activities={recentActivities} terminology={terminology} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <RankCard rankData={rankData} terminology={terminology} />
                    <TrophyCard mostRecentTrophy={mostRecentTrophy} terminology={terminology} />
                    <InventoryCard userCurrencies={userCurrencies} userExperience={userExperience} terminology={terminology} />
                    <LeaderboardCard leaderboard={leaderboard} />
                    <PendingApprovalsCard pendingData={pendingApprovals} onQuestSelect={handleQuestSelect} />
                    <ReadingActivityCard />
                </div>
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