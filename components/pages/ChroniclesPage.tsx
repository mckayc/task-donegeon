


import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus, AdminAdjustmentType } from '../../types';

const ChroniclesPage: React.FC = () => {
  const { questCompletions, purchaseRequests, users, quests, gameAssets, currentUser, userTrophies, trophies, appMode, adminAdjustments, rewardTypes, systemLogs, settings } = useAppState();
  const [viewMode, setViewMode] = useState<'all' | 'personal'>('all');

  if (!currentUser) return null;

  const sortedActivities = useMemo(() => {
    const isDM = currentUser.role === Role.DonegeonMaster;
    const isExplorer = currentUser.role === Role.Explorer;
    const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

    const getQuestTitle = (questId: string) => quests.find(q => q.id === questId)?.title || `Unknown ${settings.terminology.task}`;
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.gameName || 'Unknown User';
    const getTrophyName = (trophyId: string) => trophies.find(t => t.id === trophyId)?.name || `Unknown ${settings.terminology.award}`;
    const getRewardDisplay = (rewardId: string) => {
        const reward = rewardTypes.find(rt => rt.id === rewardId);
        return { name: reward?.name || 'Unknown', icon: reward?.icon || '❓' };
    };

    const questActivities = questCompletions
      .filter(c => c.guildId === currentGuildId)
      .map(c => ({
        id: c.id, date: c.completedAt, type: 'Quest', userId: c.userId, getUserName: () => getUserName(c.userId), text: `completed "${getQuestTitle(c.questId)}"`, status: c.status, note: c.note,
    }));

    const purchaseActivities = purchaseRequests
      .filter(p => p.guildId === currentGuildId)
      .map(p => ({
        id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId, getUserName: () => getUserName(p.userId), text: `purchased "${p.assetDetails.name}"`, status: p.status, note: undefined,
    }));
    
    const trophyActivities = userTrophies
      .filter(ut => ut.guildId === currentGuildId)
      .map(ut => ({
        id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId, getUserName: () => getUserName(ut.userId), text: `was awarded the ${settings.terminology.award.toLowerCase()}: "${getTrophyName(ut.trophyId)}"`, status: "Awarded" as const, note: "Congratulations!",
    }));

    const adjustmentActivities = adminAdjustments
        .filter(adj => adj.guildId === currentGuildId)
        .map(adj => {
            let text = `received an adjustment from ${getUserName(adj.adjusterId)}`;
            if (adj.type === AdminAdjustmentType.Trophy) {
                text = `was awarded the ${settings.terminology.award.toLowerCase()} "${getTrophyName(adj.trophyId || '')}" by ${getUserName(adj.adjusterId)}`;
            }
            const rewardsText = adj.rewards.map(r => `+${r.amount} ${getRewardDisplay(r.rewardTypeId).icon}`).join(', ');
            const setbacksText = adj.setbacks.map(s => `-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ');

            return {
                id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId, getUserName: () => getUserName(adj.userId), text: text, status: adj.type, note: `${adj.reason} \n ${rewardsText} ${setbacksText}`.trim()
            }
        });
    
    const systemLogActivities = systemLogs.map(log => {
      const quest = quests.find(q => q.id === log.questId);
      if (!quest || quest.guildId !== currentGuildId) return null;
      
      const logType = log.type === 'QUEST_LATE' ? 'became LATE' : 'became INCOMPLETE';
      const setbacksText = log.setbacksApplied.map(s => `-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ');
      
      return {
        id: log.id,
        date: log.timestamp,
        type: 'System',
        // System logs apply to all assigned users
        userId: log.userIds.includes(currentUser.id) ? currentUser.id : 'system', 
        getUserName: () => 'SYSTEM',
        text: `${settings.terminology.task} "${quest.title}" ${logType}.`,
        status: log.type,
        note: `${settings.terminology.negativePoints} applied to ${log.userIds.map(getUserName).join(', ')}: ${setbacksText}`,
      }
    }).filter(a => a !== null);


    const allActivities = [...questActivities, ...purchaseActivities, ...trophyActivities, ...adjustmentActivities, ...systemLogActivities];
    
    let relevantActivities = allActivities;
    if (isExplorer) {
        relevantActivities = allActivities.filter(a => a.userId === currentUser.id);
    } else if (isDM && viewMode === 'personal') {
        relevantActivities = allActivities.filter(a => a.userId === currentUser.id);
    }
    
    return [...relevantActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs, users, quests, gameAssets, trophies, currentUser, appMode, rewardTypes, viewMode, settings]);

  const statusColor = (status: any) => {
    switch (status) {
      case "Awarded":
      case QuestCompletionStatus.Approved:
      case PurchaseRequestStatus.Completed:
      case AdminAdjustmentType.Reward:
      case AdminAdjustmentType.Trophy:
        return 'text-green-400';
      case QuestCompletionStatus.Pending:
      case PurchaseRequestStatus.Pending:
        return 'text-yellow-400';
      case 'QUEST_LATE':
        return 'text-yellow-400 font-semibold';
      case 'QUEST_INCOMPLETE':
        return 'text-red-500 font-semibold';
      case QuestCompletionStatus.Rejected:
      case PurchaseRequestStatus.Rejected:
      case PurchaseRequestStatus.Cancelled:
      case AdminAdjustmentType.Setback:
        return 'text-red-400';
      default:
        return 'text-stone-400';
    }
  };
  
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Fallback for YYYY-MM-DD format if it still exists
      return dateString;
    }
    return date.toLocaleString('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-medieval text-stone-100">{settings.terminology.history}</h1>
        {currentUser.role === Role.DonegeonMaster && (
            <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'all' ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}
                >
                    All Activity
                </button>
                <button
                    onClick={() => setViewMode('personal')}
                    className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${viewMode === 'personal' ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}
                >
                    My Activity
                </button>
            </div>
        )}
      </div>
      <Card title="Recent Activity">
        {sortedActivities.length > 0 ? (
          <ul className="space-y-4">
            {sortedActivities.map(activity => (
              <li key={activity.id} className="bg-stone-800/60 p-4 rounded-lg flex justify-between items-start">
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-stone-100">
                        {activity.type !== 'System' && currentUser.role !== Role.Explorer && <span className="text-accent-light">{activity.getUserName()}</span>}
                        {activity.type === 'System' && <span className="text-purple-400">{activity.getUserName()}</span>}
                        <span className="text-stone-300 font-normal"> {activity.text}</span>
                      </p>
                      <p className="text-sm text-stone-400 mt-1">
                        {formatTimestamp(activity.date)}
                      </p>
                    </div>
                    <div className={`font-semibold ${statusColor(activity.status)} ml-4`}>
                      {activity.status}
                    </div>
                  </div>
                  {activity.note && (
                    <div className="mt-2 pl-4 border-l-2 border-stone-700 whitespace-pre-wrap">
                        <p className="text-sm text-stone-400 italic">"{activity.note}"</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-stone-400 text-center py-4">No activities have been recorded yet in this mode.</p>
        )}
      </Card>
    </div>
  );
};

export default ChroniclesPage;