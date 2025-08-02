import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAppState } from '../../context/AppContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus, AdminAdjustmentType, SystemNotificationType, ChronicleEvent, SystemLog } from '../../types';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Label } from '@/components/ui/Label';

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

    const purchaseActivities: ChronicleEvent[] = purchaseRequests.flatMap(p => {
        const costText = p.assetDetails.cost.map(c => `-${c.amount} ${getRewardDisplay(c.rewardTypeId).icon}`).join(' ');
        const asset = gameAssets.find(a => a.id === p.assetId);
        const icon = asset?.icon || '💰';
        
        // Instant purchase (no approval) - single event
        if (p.status === PurchaseRequestStatus.Completed && !p.actedAt) {
            return [{
                id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId,
                title: `Purchased: "${p.assetDetails.name}"`, status: PurchaseRequestStatus.Completed,
                note: costText, icon, color: '#22c55e', guildId: p.guildId
            }];
        }

        const events: ChronicleEvent[] = [];

        // Request Event (for all approval-based purchases)
        events.push({
            id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId,
            title: `Requested Purchase: "${p.assetDetails.name}"`,
            status: p.status === PurchaseRequestStatus.Pending ? PurchaseRequestStatus.Pending : 'Requested',
            note: costText, icon, color: '#eab308', guildId: p.guildId,
        });

        // Action Event (if it has been approved, rejected, or cancelled)
        if (p.actedAt && p.status !== PurchaseRequestStatus.Pending) {
            let actionTitle: string, actionColor: string, actionNote: string;
            switch(p.status) {
                case PurchaseRequestStatus.Completed:
                    actionTitle = `Purchase Approved: "${p.assetDetails.name}"`;
                    actionColor = '#22c55e';
                    actionNote = `Paid: ${costText}. ` + (asset?.payouts && asset.payouts.length > 0 ? 'Exchange successful.' : 'Item added to collection.');
                    break;
                case PurchaseRequestStatus.Rejected:
                    actionTitle = `Purchase Rejected: "${p.assetDetails.name}"`;
                    actionColor = '#ef4444';
                    actionNote = 'Funds have been returned.';
                    break;
                case PurchaseRequestStatus.Cancelled:
                     actionTitle = `Purchase Cancelled: "${p.assetDetails.name}"`;
                     actionColor = '#ef4444';
                     actionNote = 'Funds have been returned.';
                     break;
                default:
                    return events; // Should not happen
            }
            
            events.push({
                id: `${p.id}-action`, date: p.actedAt, type: 'Purchase', userId: p.userId,
                title: actionTitle, status: p.status, note: actionNote,
                icon, color: actionColor, guildId: p.guildId
            });
        }
        
        return events;
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
      case "Requested":
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
        return 'text-muted-foreground';
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
            let actionText = '';
            switch(activity.type) {
                case 'Quest':
                    actionText = `completed "${activity.title}"`;
                    break;
                case 'Purchase':
                    // The title is now self-descriptive (e.g., "Requested Purchase: ...", "Purchase Approved: ...")
                    actionText = activity.title; 
                    break;
                case 'Trophy':
                    actionText = `earned "${activity.title}"`;
                    break;
                case 'Adjustment':
                    actionText = `received an adjustment`;
                    break;
                case 'System':
                    actionText = `triggered: ${activity.title}`;
                    break;
                case 'Announcement':
                    actionText = `sent an announcement`;
                    break;
                default:
                    actionText = activity.title;
            }

           return (
            <span className="text-foreground" title={activity.title}>
                <span className="text-accent-light">{userName} </span>
                <span className="text-foreground/80 font-normal">
                    {actionText}
                </span>
            </span>
           )
      }

      // Explorer view is now also just use the full title
      return <span className="text-foreground" title={activity.title}>{activity.title}</span>
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-4">
              {currentUser.role === Role.DonegeonMaster && (
                  <div className="flex space-x-2 p-1 bg-background rounded-lg">
                      <Button onClick={() => setViewMode('all')} variant={viewMode === 'all' ? 'default' : 'ghost'} size="sm">All Activity</Button>
                      <Button onClick={() => setViewMode('personal')} variant={viewMode === 'personal' ? 'default' : 'ghost'} size="sm">My Activity</Button>
                  </div>
              )}
              <div className="flex items-center gap-2">
                  <Label htmlFor="items-per-page" className="text-sm font-medium">Show:</Label>
                   <Select onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }} defaultValue={String(itemsPerPage)}>
                      <SelectTrigger id="items-per-page" className="w-[80px]">
                        <SelectValue placeholder="Show..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
              </div>
            </div>
        </CardHeader>
        <CardContent>
        {sortedActivities.length > 0 ? (
          <>
            <ul className="space-y-4">
              {paginatedActivities.map(activity => (
                  <li key={activity.id} className="flex items-start gap-4 p-3 bg-card rounded-lg">
                      <div className="w-8 flex-shrink-0 text-center text-2xl pt-1" style={{ color: activity.color }}>
                          {activity.icon}
                      </div>
                      <div className="flex-grow min-w-0">
                          <p className="font-semibold text-foreground">
                             {renderActivityTitle(activity)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(activity.date)}</p>
                      </div>
                      <div className="w-2/5 flex-shrink-0 text-sm text-muted-foreground italic" title={activity.note}>
                          {activity.note ? <p className="whitespace-pre-wrap">"{activity.note}"</p> : ''}
                      </div>
                      <div className={`w-28 flex-shrink-0 text-right font-semibold ${statusColor(activity.status)}`}>
                          {activity.status}
                      </div>
                  </li>
              ))}
            </ul>
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button variant="secondary" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
                    <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button variant="secondary" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-4">No activities have been recorded yet in this mode.</p>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChroniclesPage;