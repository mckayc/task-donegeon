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
                    <th className="p-4 font-semibold">Scope</th>
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
                            <td className="p-4 text-stone-400">{getGuildName(c.guildId)}</td>
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
                    <th className="p-4 font-semibold">Scope</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {trades.map(t => (
                    <tr key={t.id} className="border-b border-stone-700/40 last:border-b-0">
                        <td className="p-4 font-semibold text-emerald-300">{getUserName(t.initiatorId)}</td>
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
                ) : <p className="text-stone-400 text-center py-8">You have no pending trade offers.</p>
            )}

        </Card>
    );
};

// --- Mobile View Components ---

const MobileQuestApprovalCard: React.FC<any> = ({ completion, notes, handleNoteChange, approveQuestCompletion, rejectQuestCompletion, getQuest, getUserName, getGuildName, setViewingQuest, currentUser }) => {
    const quest = getQuest(completion.questId);
    if (!quest) return null;
    return (
        <li className="bg-stone-800/60 p-4 rounded-lg flex flex-col justify-between">
            <button onClick={() => setViewingQuest(quest)} className="w-full text-left space-y-2">
                <p className="font-bold text-stone-100 flex items-center gap-2 flex-wrap">
                    <span className="text-emerald-300">{getUserName(completion.userId)}</span>
                    <span className="text-stone-300 font-normal"> completed </span>
                    "{quest.title}"
                    <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">{getGuildName(completion.guildId)}</span>
                </p>
                <p className="text-stone-400 text-sm">{completion.note ? `Note: "${completion.note}"` : 'No note provided.'}</p>
            </button>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-stone-700/60">
                <Input placeholder="Add a note (optional)..." value={notes[completion.id] || ''} onChange={(e) => handleNoteChange(completion.id, e.target.value)} className="flex-grow" />
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="destructive" onClick={() => rejectQuestCompletion(completion.id, currentUser.id, notes[completion.id] || '')}>Reject</Button>
                    <Button size="sm" onClick={() => approveQuestCompletion(completion.id, currentUser.id, notes[completion.id] || '')}>Approve</Button>
                </div>
            </div>
        </li>
    );
};

const MobileClaimApprovalCard: React.FC<any> = ({ claim, approveClaim, rejectClaim, getUserName, getGuildName, setViewingQuest, currentUser }) => (
    <li className="bg-stone-800/60 p-4 rounded-lg flex flex-col justify-between">
        <button onClick={() => setViewingQuest(claim.quest)} className="w-full text-left space-y-2">
            <p className="font-bold text-stone-100 flex items-center gap-2 flex-wrap">
                <span className="text-emerald-300">{getUserName(claim.userId)}</span>
                <span className="text-stone-300 font-normal"> claimed </span>
                "{claim.quest.title}"
                <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">{getGuildName(claim.quest.guildId)}</span>
            </p>
            <p className="text-stone-400 text-sm">Claimed at: {new Date(claim.claimedAt).toLocaleString()}</p>
        </button>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-stone-700/60">
            <Button size="sm" variant="destructive" onClick={() => rejectClaim(claim.quest.id, claim.userId, currentUser.id)}>Reject</Button>
            <Button size="sm" onClick={() => approveClaim(claim.quest.id, claim.userId, currentUser.id)}>Approve</Button>
        </div>
    </li>
);

const MobilePurchaseApprovalCard: React.FC<any> = ({ purchase, approvePurchaseRequest, rejectPurchaseRequest, getUserName, getGuildName, rewardTypes, currentUser }) => (
    <li className="bg-stone-800/60 p-4 rounded-lg flex flex-col justify-between">
        <div className="space-y-2">
             <p className="font-bold text-stone-100">
                <span className="text-emerald-300">{getUserName(purchase.userId)}</span> wants to purchase <span className="text-amber-300">"{purchase.assetDetails.name}"</span>
                <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full ml-2">{getGuildName(purchase.guildId)}</span>
            </p>
            <p className="text-stone-400 text-sm mt-1">Cost: {purchase.assetDetails.cost.map((c: RewardItem) => `${c.amount} ${rewardTypes.find((rt: RewardTypeDefinition) => rt.id === c.rewardTypeId)?.name || '?'}`).join(', ')}</p>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-stone-700/60">
            <Button size="sm" variant="destructive" onClick={() => rejectPurchaseRequest(purchase.id, currentUser.id)}>Reject</Button>
            <Button size="sm" onClick={() => approvePurchaseRequest(purchase.id, currentUser.id)}>Approve</Button>
        </div>
    </li>
);

const MobileTradeApprovalCard: React.FC<any> = ({ trade, setTradeToView, getUserName, getGuildName }) => (
    <li className="bg-stone-800/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
        <div className="space-y-2">
            <p className="font-bold text-stone-100">
                <span className="text-emerald-300">{getUserName(trade.initiatorId)}</span> sent you a trade offer.
                    <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full ml-2">{getGuildName(trade.guildId)}</span>
            </p>
            <p className="text-stone-400 text-sm mt-1">{trade.status === TradeStatus.OfferUpdated ? 'The offer has been updated.' : 'A new offer has been proposed.'}</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 justify-end">
            <Button size="sm" onClick={() => setTradeToView(trade)}>View Offer</Button>
        </div>
    </li>
);


const MobileApprovalsView: React.FC<any> = (props) => {
    const { pendingCompletions, pendingClaims, pendingPurchases, pendingTrades, currentUser } = props;
    const isAdmin = currentUser.role === Role.DonegeonMaster;

    return (
        <div className="space-y-8">
            <Card title={`Quests Awaiting Verification (${pendingCompletions.length})`}>
                {pendingCompletions.length > 0 ? (
                    <ul className="space-y-4">
                        {pendingCompletions.map((completion: QuestCompletion) => (
                           <MobileQuestApprovalCard key={completion.id} completion={completion} {...props} />
                        ))}
                    </ul>
                ) : <p className="text-stone-400">No quests are currently pending approval.</p>}
            </Card>

            <Card title={`Pending Claims (${pendingClaims.length})`}>
                {pendingClaims.length > 0 ? (
                    <ul className="space-y-4">
                        {pendingClaims.map((claim: any) => (
                            <MobileClaimApprovalCard key={`${claim.quest.id}-${claim.userId}`} claim={claim} {...props} />
                        ))}
                    </ul>
                ) : <p className="text-stone-400">No quests are currently pending claims.</p>}
            </Card>

            {isAdmin && (
                <Card title={`Item Purchases (${pendingPurchases.length})`}>
                    {pendingPurchases.length > 0 ? (
                        <ul className="space-y-4">
                            {pendingPurchases.map((purchase: PurchaseRequest) => (
                                <MobilePurchaseApprovalCard key={purchase.id} purchase={purchase} {...props} />
                            ))}
                        </ul>
                    ) : <p className="text-stone-400">No item purchases are currently pending approval.</p>}
                </Card>
            )}

            <Card title={`Pending Trade Offers (${pendingTrades.length})`}>
                 {pendingTrades.length > 0 ? (
                    <ul className="space-y-4">
                        {pendingTrades.map((trade: TradeOffer) => (
                            <MobileTradeApprovalCard key={trade.id} trade={trade} {...props} />
                        ))}
                    </ul>
                ) : <p className="text-stone-400">You have no pending trade offers.</p>}
            </Card>
        </div>
    );
};


const ApprovalsPage: React.FC = () => {
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { purchaseRequests, tradeOffers, rewardTypes } = useEconomyState();
    const { currentUser, users } = useAuthState();
    const { approveQuestCompletion, rejectQuestCompletion, approveClaim, rejectClaim } = useQuestsDispatch();
    const { approvePurchaseRequest, rejectPurchaseRequest } = useEconomyDispatch();
    const { isMobileView } = useUIState();
    
    const [notes, setNotes] = useState<{ [key: string]: string }>({});
    const [tradeToView, setTradeToView] = useState<TradeOffer | null>(null);
    const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);

    if (!currentUser || (currentUser.role !== Role.DonegeonMaster && currentUser.role !== Role.Gatekeeper)) {
        return (
            <div>
                <h1 className="text-4xl font-medieval text-stone-100 mb-8">Access Denied</h1>
                <Card>
                    <p className="text-stone-300">You do not have permission to view this page.</p>
                </Card>
            </div>
        );
    }
    
    const pendingCompletions = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending);
    const pendingPurchases = purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending);
    const pendingTrades = tradeOffers.filter(t => t.recipientId === currentUser.id && (t.status === TradeStatus.Pending || t.status === TradeStatus.OfferUpdated));

    const pendingClaims = useMemo(() => {
        const claims: { quest: Quest; userId: string; claimedAt: string }[] = [];
        quests.forEach(quest => {
            if (quest.pendingClaims && quest.pendingClaims.length > 0) {
                quest.pendingClaims.forEach(claim => {
                    claims.push({ quest, userId: claim.userId, claimedAt: claim.claimedAt });
                });
            }
        });
        return claims.sort((a, b) => new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime());
    }, [quests]);


    const getQuest = (questId: string) => quests.find(q => q.id === questId);
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.gameName || 'Unknown User';
    const getGuildName = (guildId?: string) => guildId ? guilds.find(g => g.id === guildId)?.name : 'Personal';
    
    const handleNoteChange = (completionId: string, text: string) => {
        setNotes(prev => ({ ...prev, [completionId]: text }));
    };

    const viewProps = {
        pendingCompletions, pendingPurchases, pendingTrades, pendingClaims, notes,
        handleNoteChange, approveQuestCompletion, rejectQuestCompletion,
        approvePurchaseRequest, rejectPurchaseRequest, setTradeToView,
        getQuest, getUserName, getGuildName, rewardTypes, currentUser,
        approveClaim, rejectClaim, setViewingQuest,
    };

    return (
        <div>
            {isMobileView ? <MobileApprovalsView {...viewProps} /> : <DesktopApprovalsView {...viewProps} />}
            {tradeToView && <TradeDialog tradeOffer={tradeToView} onClose={() => setTradeToView(null)} />}
            {viewingQuest && (
                <QuestDetailDialog
                    quest={viewingQuest}
                    onClose={() => setViewingQuest(null)}
                    dialogTitle={`Details for "${viewingQuest.title}"`}
                />
            )}
        </div>
    );
};

export default ApprovalsPage;