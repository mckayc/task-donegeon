import React, { useState, useEffect, useMemo } from 'react';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { Quest, QuestCompletionStatus, Role, PurchaseRequestStatus, TradeStatus, TradeOffer, QuestCompletion, PurchaseRequest, RewardTypeDefinition, RewardItem } from '../../types';
import Input from '../user-interface/Input';
import { useAuthState } from '../../context/AuthContext';
import TradeDialog from '../trading/TradeDialog';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import { useUIState } from '../../context/UIContext';

// --- Helpers ---
const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

// --- Desktop View Components ---

const QuestApprovalTable: React.FC<{
    completions: QuestCompletion[];
    notes: { [key: string]: string };
    handleNoteChange: (id: string, text: string) => void;
    onApprove: (id: string, note?: string) => void;
    onReject: (id: string, note?: string) => void;
    getUserName: (id: string) => string;
    getQuest: (id: string) => Quest | undefined;
    getGuildName: (id?: string) => string;
    onViewQuest: (quest: Quest) => void;
}> = ({ completions, notes, handleNoteChange, onApprove, onReject, getUserName, getQuest, getGuildName, onViewQuest }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="border-b border-stone-700/60">
                <tr>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Quest</th>
                    <th className="p-4 font-semibold">Submitted At</th>
                    <th className="p-4 font-semibold">Time Taken</th>
                    <th className="p-4 font-semibold">User Note</th>
                    <th className="p-4 font-semibold w-1/4">Admin Note</th>
                    <th className="p-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {completions.map(c => {
                    const quest = getQuest(c.questId);
                    return (
                        <tr key={c.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4 font-semibold text-emerald-300">{getUserName(c.userId)}</td>
                            <td className="p-4 text-stone-200">
                                {quest ? (
                                    <button onClick={() => onViewQuest(quest)} className="hover:underline text-left">
                                        {quest.title}
                                    </button>
                                ) : 'Unknown Quest'}
                            </td>
                            <td className="p-4 text-stone-400">{new Date(c.completedAt).toLocaleString()}</td>
                             <td className="p-4 text-stone-400 font-mono">
                                {c.timerDurationSeconds ? formatDuration(c.timerDurationSeconds) : 'N/A'}
                            </td>
                            <td className="p-4 text-stone-400 italic truncate max-w-xs" title={c.note}>"{c.note || 'None'}"</td>
                            <td className="p-4">
                                <Input 
                                    placeholder="Optional note..."
                                    value={notes[c.id] || ''}
                                    onChange={(e) => handleNoteChange(c.id, e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    <Button size="sm" variant="destructive" onClick={() => onReject(c.id, notes[c.id])}>Reject</Button>
                                    <Button size="sm" onClick={() => onApprove(c.id, notes[c.id])}>Approve</Button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const ClaimApprovalTable: React.FC<{
    claims: { quest: Quest; userId: string; claimedAt: string }[];
    onApprove: (questId: string, userId: string) => void;
    onReject: (questId: string, userId: string) => void;
    getUserName: (id: string) => string;
    getGuildName: (id?: string) => string;
    onViewQuest: (quest: Quest) => void;
}> = ({ claims, onApprove, onReject, getUserName, getGuildName, onViewQuest }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="border-b border-stone-700/60">
                <tr>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Quest</th>
                    <th className="p-4 font-semibold">Scope</th>
                    <th className="p-4 font-semibold">Claimed At</th>
                    <th className="p-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {claims.map(claim => (
                    <tr key={`${claim.quest.id}-${claim.userId}`} className="border-b border-stone-700/40 last:border-b-0">
                        <td className="p-4 font-semibold text-emerald-300">{getUserName(claim.userId)}</td>
                        <td className="p-4 text-stone-200">
                            <button onClick={() => onViewQuest(claim.quest)} className="hover:underline text-left">
                                {claim.quest.title}
                            </button>
                        </td>
                        <td className="p-4 text-stone-400">{getGuildName(claim.quest.guildId)}</td>
                        <td className="p-4 text-stone-400">{new Date(claim.claimedAt).toLocaleString()}</td>
                        <td className="p-4">
                            <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={() => onReject(claim.quest.id, claim.userId)}>Reject</Button>
                                <Button size="sm" onClick={() => onApprove(claim.quest.id, claim.userId)}>Approve</Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const PurchaseApprovalTable: React.FC<{
    purchases: PurchaseRequest[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    getUserName: (id: string) => string;
    getGuildName: (id?: string) => string;
    rewardTypes: RewardTypeDefinition[];
}> = ({ purchases, onApprove, onReject, getUserName, getGuildName, rewardTypes }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="border-b border-stone-700/60">
                <tr>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Item</th>
                    <th className="p-4 font-semibold">Cost</th>
                    <th className="p-4 font-semibold">Requested At</th>
                    <th className="p-4 font-semibold">Scope</th>
                    <th className="p-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {purchases.map(p => (
                    <tr key={p.id} className="border-b border-stone-700/40 last:border-b-0">
                        <td className="p-4 font-semibold text-emerald-300">{getUserName(p.userId)}</td>
                        <td className="p-4 text-amber-300">{p.assetDetails.name}</td>
                        <td className="p-4 text-stone-300">{p.assetDetails.cost.map(c => `${c.amount} ${rewardTypes.find(rt => rt.id === c.rewardTypeId)?.name || '?'}`).join(', ')}</td>
                        <td className="p-4 text-stone-400">{new Date(p.requestedAt).toLocaleString()}</td>
                        <td className="p-4 text-stone-400">{getGuildName(p.guildId)}</td>
                        <td className="p-4">
                            <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={() => onReject(p.id)}>Reject</Button>
                                <Button size="sm" onClick={() => onApprove(p.id)}>Approve</Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TradeApprovalTable: React.FC<{
    trades: TradeOffer[];
    onView: (trade: TradeOffer) => void;
    getUserName: (id: string) => string;
    getGuildName: (id?: string) => string;
}> = ({ trades, onView, getUserName, getGuildName }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="border-b border-stone-700/60">
                <tr>
                    <th className="p-4 font-semibold">From</th>
                    <th className="p-4 font-semibold">Offered At</th>
                    <th className="p-4 font-semibold">Scope</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {trades.map(t => (
                    <tr key={t.id} className="border-b border-stone-700/40 last:border-b-0">
                        <td className="p-4 font-semibold text-emerald-300">{getUserName(t.initiatorId)}</td>
                        <td className="p-4 text-stone-400">{new Date(t.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-stone-400">{getGuildName(t.guildId)}</td>
                        <td className="p-4 text-yellow-400">{t.status === TradeStatus.OfferUpdated ? 'Offer Updated' : 'New Offer'}</td>
                        <td className="p-4">
                            <Button size="sm" onClick={() => onView(t)}>View Offer</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const DesktopApprovalsView: React.FC<any> = ({
    pendingCompletions, pendingPurchases, pendingTrades, pendingClaims, notes,
    handleNoteChange, approveQuestCompletion, rejectQuestCompletion,
    approvePurchaseRequest, rejectPurchaseRequest, setTradeToView,
    getQuest, getUserName, getGuildName, rewardTypes, currentUser,
    approveClaim, rejectClaim, setViewingQuest
}) => {
    const [activeTab, setActiveTab] = useState('quests');
    
    const isAdmin = currentUser.role === Role.DonegeonMaster;
    
    const tabs = [
        { id: 'quests', label: 'Quests', count: pendingCompletions.length, show: true },
        { id: 'claims', label: 'Pending Claims', count: pendingClaims.length, show: true },
        { id: 'purchases', label: 'Purchases', count: pendingPurchases.length, show: isAdmin },
        { id: 'trades', label: 'Trades', count: pendingTrades.length, show: true },
    ].filter(t => t.show);

    return (
        <Card title="Approvals Queue">
            <div className="border-b border-stone-700 mb-6">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                ? 'border-emerald-500 text-emerald-400'
                                : 'border-transparent text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'quests' && (
                pendingCompletions.length > 0 ? (
                    <QuestApprovalTable
                        completions={pendingCompletions}
                        notes={notes}
                        handleNoteChange={handleNoteChange}
                        onApprove={(id, note) => approveQuestCompletion(id, currentUser.id, note)}
                        onReject={(id, note) => rejectQuestCompletion(id, currentUser.id, note)}
                        getUserName={getUserName}
                        getQuest={getQuest}
                        getGuildName={getGuildName}
                        onViewQuest={setViewingQuest}
                    />
                ) : <p className="text-stone-400 text-center py-8">No quests are currently pending approval.</p>
            )}
            
            {activeTab === 'claims' && (
                pendingClaims.length > 0 ? (
                    <ClaimApprovalTable
                        claims={pendingClaims}
                        onApprove={(questId, userId) => approveClaim(questId, userId, currentUser.id)}
                        onReject={(questId, userId) => rejectClaim(questId, userId, currentUser.id)}
                        getUserName={getUserName}
                        getGuildName={getGuildName}
                        onViewQuest={setViewingQuest}
                    />
                ) : <p className="text-stone-400 text-center py-8">No quests are currently pending claims.</p>
            )}

            {activeTab === 'purchases' && isAdmin && (
                pendingPurchases.length > 0 ? (
                    <PurchaseApprovalTable
                        purchases={pendingPurchases}
                        onApprove={(id) => approvePurchaseRequest(id, currentUser.id)}
                        onReject={(id) => rejectPurchaseRequest(id, currentUser.id)}
                        getUserName={getUserName}
                        getGuildName={getGuildName}
                        rewardTypes={rewardTypes}
                    />
                ) : <p className="text-stone-400 text-center py-8">No item purchases are currently pending approval.</p>
            )}
            
            {activeTab === 'trades' && (
                 pendingTrades.length > 0 ? (
                    <TradeApprovalTable
                        trades={pendingTrades}
                        onView={setTradeToView}
                        getUserName={getUserName}
                        getGuildName={getGuildName}
                    />
                 ) : <p className="text-stone-400 text-center py-8">You have no new trade offers.</p>
            )}
        </Card>
    );
};


// --- Mobile View Components ---

const MobileListItem: React.FC<{
    item: any;
    type: 'quest' | 'purchase' | 'trade' | 'claim';
    onApprove: (item: any, note?: string) => void;
    onReject?: (item: any, note?: string) => void;
    onView?: (item: any) => void;
    getUserName: (id: string) => string;
}> = ({ item, type, onApprove, onReject, onView, getUserName }) => {
    const [note, setNote] = useState('');
    
    let title, submittedAt, user, icon;

    switch (type) {
        case 'quest':
            title = item.quest.title;
            submittedAt = item.completedAt;
            user = item.user;
            icon = item.quest.icon;
            break;
        case 'purchase':
            title = item.assetDetails.name;
            submittedAt = item.requestedAt;
            user = item.user;
            icon = '💰';
            break;
        case 'trade':
            title = 'New Trade Offer';
            submittedAt = item.createdAt;
            user = item.initiator;
            icon = '↔️';
            break;
        case 'claim':
            title = item.quest.title;
            submittedAt = item.claimedAt;
            user = item.user;
            icon = '🙋';
            break;
    }

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-stone-100">{icon} {title}</p>
                    <p className="text-sm text-stone-400">
                        From: <span className="font-semibold text-emerald-300">{user.gameName}</span>
                    </p>
                    <p className="text-xs text-stone-500">
                        {new Date(submittedAt).toLocaleString()}
                    </p>
                </div>
                 {type === 'quest' && item.timerDurationSeconds !== undefined && (
                     <p className="font-mono font-bold text-lg text-emerald-400">{formatDuration(item.timerDurationSeconds)}</p>
                 )}
            </div>
             {item.note && <p className="text-sm italic text-stone-300 bg-stone-900/50 p-2 rounded-md">"{item.note}"</p>}
            
             {type === 'quest' && onReject && (
                 <Input 
                    placeholder="Add an admin note (optional)..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="text-sm h-9"
                 />
            )}
            
            <div className="flex justify-end gap-2">
                {onView && <Button variant="secondary" onClick={() => onView(item)}>View</Button>}
                {onReject && <Button variant="destructive" onClick={() => onReject(item, note)}>Reject</Button>}
                <Button onClick={() => onApprove(item, note)}>Approve</Button>
            </div>
        </div>
    );
};


const MobileApprovalsView: React.FC<any> = ({
    pendingCompletions, pendingPurchases, pendingTrades, pendingClaims,
    approveQuestCompletion, rejectQuestCompletion, approvePurchaseRequest,
    rejectPurchaseRequest, setTradeToView, getUserName, currentUser,
    approveClaim, rejectClaim,
}) => {
    const isAdmin = currentUser.role === Role.DonegeonMaster;

    const allItems = [
        ...pendingCompletions.map((item: any) => ({ ...item, type: 'quest' })),
        ...(isAdmin ? pendingPurchases.map((item: any) => ({ ...item, type: 'purchase' })) : []),
        ...pendingTrades.map((item: any) => ({ ...item, type: 'trade' })),
        ...pendingClaims.map((item: any) => ({ ...item, type: 'claim' })),
    ].sort((a, b) => new Date(b.completedAt || b.requestedAt || b.createdAt || b.claimedAt).getTime() - new Date(a.completedAt || a.requestedAt || a.createdAt || a.claimedAt).getTime());

    if (allItems.length === 0) {
        return <p className="text-stone-400 text-center py-8">No items are currently pending approval.</p>;
    }

    return (
        <div className="space-y-4">
            {allItems.map(item => (
                <MobileListItem
                    key={`${item.type}-${item.id || item.quest.id + item.userId}`}
                    item={item}
                    type={item.type}
                    onApprove={(i, note) => {
                        if (i.type === 'quest') approveQuestCompletion(i.id, currentUser.id, note);
                        if (i.type === 'purchase') approvePurchaseRequest(i.id, currentUser.id);
                        if (i.type === 'trade') setTradeToView(i);
                        if (i.type === 'claim') approveClaim(i.quest.id, i.userId, currentUser.id);
                    }}
                    onReject={(i, note) => {
                        if (i.type === 'quest') rejectQuestCompletion(i.id, currentUser.id, note);
                        if (i.type === 'purchase') rejectPurchaseRequest(i.id, currentUser.id);
                        if (i.type === 'claim') rejectClaim(i.quest.id, i.userId, currentUser.id);
                    }}
                    onView={(i) => {
                        if (i.type === 'trade') setTradeToView(i);
                    }}
                    getUserName={getUserName}
                />
            ))}
        </div>
    );
};

const ApprovalsPage = () => {
    const { currentUser, users } = useAuthState();
    const { approveQuestCompletion, rejectQuestCompletion, approveClaim, rejectClaim } = useQuestsDispatch();
    const { approvePurchaseRequest, rejectPurchaseRequest, acceptTrade, cancelOrRejectTrade } = useEconomyDispatch();
    const { quests, questCompletions } = useQuestsState();
    const { purchaseRequests, tradeOffers, rewardTypes } = useEconomyState();
    const { guilds } = useCommunityState();
    const { isMobileView } = useUIState();
    const [notes, setNotes] = useState<{ [key: string]: string }>({});
    const [tradeToView, setTradeToView] = useState<TradeOffer | null>(null);
    const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);

    const { pendingCompletions, pendingPurchases, pendingTrades, pendingClaims } = useMemo(() => {
        const userMap = new Map(users.map(u => [u.id, u]));

        const pc = questCompletions
            .filter(c => c.status === QuestCompletionStatus.Pending)
            .map(c => ({ ...c, user: userMap.get(c.userId), quest: quests.find(q => q.id === c.questId) }))
            .filter(c => c.user && c.quest);
            
        const pp = purchaseRequests
            .filter(p => p.status === PurchaseRequestStatus.Pending)
            .map(p => ({ ...p, user: userMap.get(p.userId) }))
            .filter(p => p.user);
            
        const pt = tradeOffers
            .filter(t => t.recipientId === currentUser?.id && (t.status === TradeStatus.Pending || t.status === TradeStatus.OfferUpdated))
            .map(t => ({ ...t, initiator: userMap.get(t.initiatorId) }))
            .filter(t => t.initiator);
            
        const claims = quests.flatMap(q => 
            (q.pendingClaims || []).map(claim => ({
                quest: q,
                userId: claim.userId,
                user: userMap.get(claim.userId),
                claimedAt: claim.claimedAt,
            }))
        ).filter(c => c.user);

        return { pendingCompletions: pc, pendingPurchases: pp, pendingTrades: pt, pendingClaims: claims };
    }, [users, quests, questCompletions, purchaseRequests, tradeOffers, currentUser]);
    
    const handleNoteChange = (completionId: string, text: string) => {
        setNotes(prev => ({ ...prev, [completionId]: text }));
    };

    const getUserName = (id: string) => users.find(u => u.id === id)?.gameName || 'Unknown User';
    const getQuest = (id: string) => quests.find(q => q.id === id);
    const getGuildName = (id?: string) => id ? guilds.find(g => g.id === id)?.name || 'Guild Scope' : 'Personal Scope';

    if (!currentUser) return null;

    const props = {
        pendingCompletions, pendingPurchases, pendingTrades, pendingClaims, notes,
        handleNoteChange, approveQuestCompletion, rejectQuestCompletion,
        approvePurchaseRequest, rejectPurchaseRequest, setTradeToView,
        getQuest, getUserName, getGuildName, rewardTypes, currentUser,
        approveClaim, rejectClaim, setViewingQuest
    };

    return (
        <>
            {isMobileView ? <MobileApprovalsView {...props} /> : <DesktopApprovalsView {...props} />}
            {tradeToView && <TradeDialog tradeOffer={tradeToView} onClose={() => setTradeToView(null)} />}
            {viewingQuest && <QuestDetailDialog quest={viewingQuest} onClose={() => setViewingQuest(null)} />}
        </>
    );
};

export default ApprovalsPage;