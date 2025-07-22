import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus, AdminAdjustmentType, SystemNotificationType, ChronicleEvent, SystemLog } from '../../types';
import Button from '../ui/Button';

const ChroniclesPage: React.FC = () => {
  const { questCompletions, purchaseRequests, users, quests, gameAssets, currentUser, userTrophies, trophies, appMode, adminAdjustments, rewardTypes, systemLogs, settings, systemNotifications, guilds } = useAppState();
  const [viewMode, setViewMode] = useState<'all' | 'personal'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  if (!currentUser) return null;
  
  const sortedActivities = useMemo(() => {
    if (!currentUser) return [];

    const isDM = currentUser.role === Role.DonegeonMaster;
    const isExplorer = currentUser.role === Role.Explorer;
    const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

    const getQuestTitle = (questId: string) => quests.find(q => q.id === questId)?.title || `Unknown ${settings.terminology.task}`;
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.gameName || 'Unknown User';
    const getTrophyName = (trophyId: string) => trophies.find(t => t.id === trophyId)?.name || `Unknown ${settings.terminology.award}`;
    const getGuildName = (guildId?: string) => guildId ? guilds.find(g => g.id === guildId)?.name : 'Personal';
    const getRewardDisplay = (rewardId: string) => {
        const reward = rewardTypes.find(rt => rt.id === rewardId);
        return { name: reward?.name || 'Unknown', icon: reward?.icon || '❓' };
    };

    const questActivities: ChronicleEvent[] = questCompletions.map(c => {
        const quest = quests.find(q => q.id === c.questId);
        let finalNote = c.note || '';

        if (c.status === QuestCompletionStatus.Approved && quest && quest.rewards.length > 0) {
            const rewardsText = quest.rewards.map(r => `+${r.amount} ${getRewardDisplay(r.rewardTypeId).icon}`).join(' ');
            if (finalNote) {
                finalNote += `\n(${rewardsText})`;
            } else {
                finalNote = rewardsText;
            }
        }
        
        return {
            id: c.id, date: c.completedAt, type: 'Quest', userId: c.userId, title: getQuestTitle(c.questId), status: c.status, note: finalNote,
            icon: quest?.icon || '📜', color: '#3b82f6', guildId: c.guildId, questType: quest?.type
        };
    });

    const purchaseActivities: ChronicleEvent[] = purchaseRequests.map(p => {
        const costText = p.assetDetails.cost.map(c => `-${c.amount} ${getRewardDisplay(c.rewardTypeId).icon}`).join(' ');
        return {
            id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId, title: `Purchased "${p.assetDetails.name}"`, status: p.status, note: costText,
            icon: gameAssets.find(a => a.id === p.assetId)?.icon || '💰', color: '#a855f7', guildId: p.guildId
        };
    });
    
    const trophyActivities: ChronicleEvent[] = userTrophies.map(ut => ({
        id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId, title: `Earned: ${getTrophyName(ut.trophyId)}`, status: "Awarded", note: "Congratulations!",
        icon: trophies.find(t => t.id === ut.trophyId)?.icon || '🏆', color: '#f59e0b', guildId: ut.guildId
    }));

    const adjustmentActivities: ChronicleEvent[] = adminAdjustments.map(adj => {
        let title = `Adjustment for ${getUserName(adj.userId)}`;
        if (adj.type === AdminAdjustmentType.Trophy) {
            title = `Trophy awarded to ${getUserName(adj.userId)}`;
        }
        const rewardsText = adj.rewards.map(r => `+${r.amount} ${getRewardDisplay(r.rewardTypeId).icon}`).join(', ');
        const setbacksText = adj.setbacks.map(s => `-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ');

        return {
            id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId, title, status: adj.type, note: `${adj.reason} \n ${rewardsText} ${setbacksText}`.trim(),
            icon: '🛠️', color: '#64748b', guildId: adj.guildId
        }
    });
    
    const systemLogActivities: ChronicleEvent[] = systemLogs.flatMap((log: SystemLog): ChronicleEvent[] => {
      const quest = quests.find(q => q.id === log.questId);
      if (!quest) return [];
      
      const logType = log.type === 'QUEST_LATE' ? 'became LATE' : 'became INCOMPLETE';
      const setbacksText = log.setbacksApplied.map(s => `-${s.amount} ${getRewardDisplay(s.rewardTypeId).icon}`).join(', ');
      const title = `${settings.terminology.task} ${logType}: "${quest.title}"`
      
      return [{
        id: log.id, date: log.timestamp, type: 'System', userId: 'system', recipientUserIds: log.userIds, title: title,
        status: log.type, note: `Applied to ${log.userIds.map(getUserName).join(', ')}: ${setbacksText}`,
        icon: '⚙️', color: '#ef4444', guildId: quest.guildId,
      }];
    });
    
    const announcementActivities: ChronicleEvent[] = systemNotifications
      .filter(n => n.type === SystemNotificationType.Announcement)
      .map(n => ({
        id: n.id, date: n.timestamp, type: 'Announcement' as const,
        userId: n.senderId, recipientUserIds: n.recipientUserIds,
        title: `Announcement to ${getGuildName(n.guildId)}`,
        status: `Sent by ${n.senderId ? getUserName(n.senderId) : 'System'}`,
        note: n.message, icon: '📢', color: '#10b981', guildId: n.guildId
      }));

    const allActivities = [
        ...questActivities, ...purchaseActivities, ...trophyActivities,
        ...adjustmentActivities, ...systemLogActivities, ...announcementActivities
    ];
    
    // 1. Filter by current scope (Personal vs. Guild)
    const scopedActivities = allActivities.filter(a => a.guildId === currentGuildId);

    // 2. Filter by user relevance if not in "All Activity" mode
    let relevantActivities = scopedActivities;
    if (isExplorer || (isDM && viewMode === 'personal')) {
        relevantActivities = scopedActivities.filter(a => {
            const isActor = a.userId === currentUser.id;
            const isRecipient = a.recipientUserIds?.includes(currentUser.id) ?? false;
            return isActor || isRecipient;
        });
    }
    
    // 3. Sort final list
    return relevantActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs, systemNotifications, users, quests, gameAssets, trophies, currentUser, appMode, rewardTypes, viewMode, settings, guilds]);
  
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
  
  const renderActivityTitle = (activity: ChronicleEvent) => {
      const userName = activity.userId ? users.find(u => u.id === activity.userId)?.gameName || 'Unknown User' : 'System';

      if (currentUser.role !== Role.Explorer) {
           return (
            <span className="text-stone-200" title={activity.title}>
                <span className="text-accent-light">{userName} </span>
                <span className="text-stone-300 font-normal">
                {activity.type === 'Quest' && `completed "${activity.title}"`}
                {activity.type === 'Purchase' && `purchased "${activity.title}"`}
                {activity.type === 'Trophy' && `earned "${activity.title}"`}
                {activity.type === 'Adjustment' && `received an adjustment`}
                {activity.type === 'System' && `triggered: ${activity.title}`}
                {activity.type === 'Announcement' && `sent an announcement`}
                </span>
            </span>
           )
      }

      // Explorer view is simpler
      return <span className="text-stone-200" title={activity.title}>{activity.title}</span>
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
                      <div className="w-8 flex-shrink-0 text-center text-2xl pt-1" style={{ color: activity.color }}>
                          {activity.icon}
                      </div>
                      <div className="flex-grow min-w-0">
                          <p className="font-semibold text-stone-200">
                             {renderActivityTitle(activity)}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">{formatTimestamp(activity.date)}</p>
                      </div>
                      <div className="w-2/5 flex-shrink-0 text-sm text-stone-400 italic" title={activity.note}>
                          {activity.note ? <p className="whitespace-pre-wrap">"{activity.note}"</p> : ''}
                      </div>
                      <div className={`w-28 flex-shrink-0 text-right font-semibold ${statusColor(activity.status)}`}>
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