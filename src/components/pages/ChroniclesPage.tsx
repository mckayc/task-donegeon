import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import { useAuthState, useGameDataState, useSettingsState, useUIState } from '../../context/AppContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus, AdminAdjustmentType } from '../../types';
import Button from '../ui/Button';

const ChroniclesPage: React.FC = () => {
  const { currentUser, users } = useAuthState();
  const { questCompletions, purchaseRequests, quests, gameAssets, userTrophies, trophies, adminAdjustments, rewardTypes, systemLogs } = useGameDataState();
  const { appMode } = useUIState();
  const { settings } = useSettingsState();
  const [viewMode, setViewMode] = useState<'all' | 'personal'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

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
        id: c.id, date: c.completedAt, type: 'Quest', userId: c.userId, getUserName: () => getUserName(c.userId), text: `${getUserName(c.userId)} completed "${getQuestTitle(c.questId)}"`, title: getQuestTitle(c.questId), status: c.status, note: c.note,
    }));

    const purchaseActivities = purchaseRequests
      .filter(p => p.guildId === currentGuildId)
      .map(p => ({
        id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId, getUserName: () => getUserName(p.userId), text: `${getUserName(p.userId)} purchased "${p.assetDetails.name}"`, title: `Purchased "${p.assetDetails.name}"`, status: p.status, note: undefined,
    }));
    
    const trophyActivities = userTrophies
      .filter(ut => ut.guildId === currentGuildId)
      .map(ut => ({
        id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId, getUserName: () => getUserName(ut.userId), text: `${getUserName(ut.userId)} was awarded the ${settings.terminology.award.toLowerCase()}: "${getTrophyName(ut.trophyId)}"`, title: `Earned: ${getTrophyName(ut.trophyId)}`, status: "Awarded" as const, note: "Congratulations!",
    }));

    const adjustmentActivities = adminAdjustments
        .filter(adj => adj.guildId === currentGuildId)
        .map(adj => {
            let text = `received an adjustment from ${getUserName(adj.adjusterId)}`;
            let title = `Adjustment for ${getUserName(adj.userId)}`;
            if (adj.type === AdminAdjustmentType.Trophy) {
                text = `was awarded the ${settings.terminology.award.toLowerCase()} "${getTrophyName(adj.trophyId || '')}" by ${getUserName(adj.adjusterId)}`;
                title = `Trophy awarded to ${getUserName(adj.userId)}`;
            }
            const rewardsText = adj.rewards.map(r => `+${r.amount} ${getRewardDisplay(r.rewardTypeId).icon}`).join(', ');
            const setbacksText = adj.setbacks.map(s => `-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ');

            return {
                id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId, getUserName: () => getUserName(adj.userId), text, title, status: adj.type, note: `${adj.reason} \n ${rewardsText} ${setbacksText}`.trim()
            }
        });
    
    const systemLogActivities = systemLogs.map(log => {
      const quest = quests.find(q => q.id === log.questId);
      if (!quest || quest.guildId !== currentGuildId) return null;
      
      const logType = log.type === 'QUEST_LATE' ? 'became LATE' : 'became INCOMPLETE';
      const setbacksText = log.setbacksApplied.map(s => `-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ');
      const title = `${settings.terminology.task} ${logType}: "${quest.title}"`
      
      return {
        id: log.id,
        date: log.timestamp,
        type: 'System',
        userId: log.userIds.includes(currentUser.id) ? currentUser.id : 'system', 
        getUserName: () => 'SYSTEM',
        text: title,
        title: title,
        status: log.type,
        note: `Applied to ${log.userIds.map(getUserName).join(', ')}: ${setbacksText}`,
      }
    }).filter((a): a is NonNullable<typeof a> => a !== null);


    const allActivities = [...questActivities, ...purchaseActivities, ...trophyActivities, ...adjustmentActivities, ...systemLogActivities];
    
    let relevantActivities = allActivities;
    if (isExplorer) {
        relevantActivities = allActivities.filter(a => a.userId === currentUser.id);
    } else if (isDM && viewMode === 'personal') {
        relevantActivities = allActivities.filter(a => a.userId === currentUser.id);
    }
    
    return [...relevantActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs, users, quests, gameAssets, trophies, currentUser, appMode, rewardTypes, viewMode, settings]);
  
  const totalPages = Math.ceil(sortedActivities.length / itemsPerPage);
  const paginatedActivities = sortedActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    if (isNaN(date.getTime())) return dateString; // Invalid date
    return date.toLocaleString('default', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
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
        <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-sm font-medium text-stone-400">Show:</label>
            <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
            >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
            </select>
        </div>
      </div>
      <Card title="Recent Activity">
        {sortedActivities.length > 0 ? (
          <>
            <ul className="space-y-4">
              {paginatedActivities.map(activity => (
                  <li key={activity.id} className="flex items-start gap-4 p-3 bg-stone-800/60 rounded-lg">
                      {/* Column 1: Title & Date */}
                      <div className="flex-1 w-2/5">
                          <p className="font-semibold text-stone-200" title={activity.title}>
                             {currentUser.role !== Role.Explorer && activity.type !== 'System' && <span className="text-accent-light">{activity.getUserName()} </span>}
                             <span className="text-stone-300 font-normal">{activity.type === 'Quest' ? `completed ` : ''}"{activity.title}"</span>
                          </p>
                          <p className="text-xs text-stone-400 mt-1">{formatTimestamp(activity.date)}</p>
                      </div>
                      {/* Column 2: Note */}
                      <div className="w-2/5 text-sm text-stone-400 italic" title={activity.note}>
                          {activity.note ? <p className="whitespace-pre-wrap">"{activity.note}"</p> : ''}
                      </div>
                      {/* Column 3: Status */}
                      <div className={`w-1/5 text-right font-semibold ${statusColor(activity.status)}`}>
                          {activity.status}
                      </div>
                  </li>
              ))}
            </ul>
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-stone-700">
                    <Button variant="secondary" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
                    <span className="text-stone-400">Page {currentPage} of {totalPages}</span>
                    <Button variant="secondary" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
          </>
        ) : (
          <p className="text-stone-400 text-center py-4">No activities have been recorded yet in this mode.</p>
        )}
      </Card>
    </div>
  );
};

export default ChroniclesPage;