import React, { useState } from 'react';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus, TradeStatus, TradeOffer } from '../../types';
import Input from '../user-interface/Input';
import { useAuthState } from '../../context/AuthContext';
import TradeDialog from '../trading/TradeDialog';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';

const ApprovalsPage: React.FC = () => {
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { purchaseRequests, tradeOffers, rewardTypes } = useEconomyState();
    const { currentUser, users } = useAuthState();
    const { approveQuestCompletion, rejectQuestCompletion } = useQuestsDispatch();
    const { approvePurchaseRequest, rejectPurchaseRequest } = useEconomyDispatch();
    
    const [notes, setNotes] = useState<{ [key: string]: string }>({});
    const [tradeToView, setTradeToView] = useState<TradeOffer | null>(null);

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


    const getQuestTitle = (questId: string) => quests.find(q => q.id === questId)?.title || 'Unknown Quest';
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.gameName || 'Unknown User';
    const getGuildName = (guildId?: string) => guildId ? guilds.find(g => g.id === guildId)?.name : 'Personal';
    
    const handleNoteChange = (completionId: string, text: string) => {
        setNotes(prev => ({ ...prev, [completionId]: text }));
    };

    return (
        <div>
            <Card title="Quests Awaiting Verification" className="mb-8">
                {pendingCompletions.length > 0 ? (
                    <ul className="space-y-4">
                        {pendingCompletions.map(completion => (
                            <li key={completion.id} className="bg-stone-800/60 p-4 rounded-lg flex flex-col justify-between">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="font-bold text-stone-100 flex items-center gap-2">
                                            <span className="text-emerald-300">{getUserName(completion.userId)}</span>
                                            <span className="text-stone-300 font-normal"> completed </span>
                                            "{getQuestTitle(completion.questId)}"
                                            <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">{getGuildName(completion.guildId)}</span>
                                        </p>
                                        <p className="text-stone-400 text-sm mt-1">{completion.note ? `Note: "${completion.note}"` : 'No note provided.'}</p>
                                    </div>
                                </div>
                                 <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-stone-700/60">
                                    <Input 
                                        placeholder="Add a rejection note (optional)..."
                                        value={notes[completion.id] || ''}
                                        onChange={(e) => handleNoteChange(completion.id, e.target.value)}
                                        className="flex-grow"
                                    />
                                     <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="destructive" onClick={() => rejectQuestCompletion(completion.id, currentUser.id, notes[completion.id] || '')}>Reject</Button>
                                        <Button size="sm" onClick={() => approveQuestCompletion(completion.id, currentUser.id, notes[completion.id] || '')}>Approve</Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-stone-400">No quests are currently pending approval.</p>}
            </Card>

            {currentUser.role === Role.DonegeonMaster && (
                <>
                <Card title="Item Purchases Requiring Approval" className="mb-8">
                    {pendingPurchases.length > 0 ? (
                        <ul className="space-y-4">
                            {pendingPurchases.map(purchase => (
                                <li key={purchase.id} className="bg-stone-800/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="font-bold text-stone-100">
                                            <span className="text-emerald-300">{getUserName(purchase.userId)}</span> wants to purchase <span className="text-amber-300">"{purchase.assetDetails.name}"</span>
                                            <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full ml-2">{getGuildName(purchase.guildId)}</span>
                                        </p>
                                        <p className="text-stone-400 text-sm mt-1">Cost: {purchase.assetDetails.cost.map(c => `${c.amount} ${rewardTypes.find(rt => rt.id === c.rewardTypeId)?.name || '?'}`).join(', ')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="destructive" onClick={() => rejectPurchaseRequest(purchase.id, currentUser.id)}>Reject</Button>
                                        <Button size="sm" onClick={() => approvePurchaseRequest(purchase.id, currentUser.id)}>Approve</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-stone-400">No item purchases are currently pending approval.</p>}
                </Card>

                <Card title="Pending Trade Offers">
                     {pendingTrades.length > 0 ? (
                        <ul className="space-y-4">
                            {pendingTrades.map(trade => (
                                <li key={trade.id} className="bg-stone-800/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div>
                                        <p className="font-bold text-stone-100">
                                            <span className="text-emerald-300">{getUserName(trade.initiatorId)}</span> sent you a trade offer.
                                             <span className="text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full ml-2">{getGuildName(trade.guildId)}</span>
                                        </p>
                                        <p className="text-stone-400 text-sm mt-1">{trade.status === TradeStatus.OfferUpdated ? 'The offer has been updated.' : 'A new offer has been proposed.'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => setTradeToView(trade)}>View Offer</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-stone-400">You have no pending trade offers.</p>}
                </Card>
                </>
            )}

            {tradeToView && <TradeDialog tradeOffer={tradeToView} onClose={() => setTradeToView(null)} />}
        </div>
    );
};

export default ApprovalsPage;