import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAppState } from '../../context/AppContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus } from '../../types';
import Input from '../ui/Input';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useQuestState, useQuestDispatch } from '../../context/QuestContext';

const ApprovalsPage: React.FC = () => {
    const { guilds } = useAppState();
    const { quests, questCompletions } = useQuestState();
    const { purchaseRequests, gameAssets } = useEconomyState();
    const { currentUser, users } = useAuthState();

    const {
        approveQuestCompletion, rejectQuestCompletion
    } = useQuestDispatch();
    const {
        approvePurchaseRequest, rejectPurchaseRequest
    } = useEconomyDispatch();
    
    const [notes, setNotes] = useState<{ [key: string]: string }>({});

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
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                                {getGuildName(completion.guildId)}
                                            </span>
                                        </p>
                                        <p className="text-sm text-stone-400 mt-1">
                                            Submitted: {new Date(completion.completedAt).toLocaleString()}
                                        </p>
                                        {completion.note && <p className="text-sm italic text-stone-300 mt-2">Note: "{completion.note}"</p>}
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-3">
                                    <Input
                                        placeholder="Add an optional note..."
                                        value={notes[completion.id] || ''}
                                        onChange={(e) => handleNoteChange(completion.id, e.target.value)}
                                        className="flex-grow"
                                    />
                                    <div className="flex space-x-3 flex-shrink-0 justify-end mt-2 sm:mt-0">
                                        <Button onClick={() => approveQuestCompletion(completion.id, notes[completion.id])} className="text-sm py-1 px-4">Approve</Button>
                                        <Button onClick={() => rejectQuestCompletion(completion.id, notes[completion.id])} variant="secondary" className="text-sm py-1 px-4 !bg-red-900/50 hover:!bg-red-800/60 text-red-300">Reject</Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-stone-400 text-center py-4">There are no quests pending approval.</p>
                )}
            </Card>

            {currentUser.role === Role.DonegeonMaster && (
              <Card title="Purchases Awaiting Fulfillment">
                  {pendingPurchases.length > 0 ? (
                      <ul className="space-y-4">
                          {pendingPurchases.map(purchase => {
                            const asset = gameAssets.find(a => a.id === purchase.assetId);
                            return (
                              <li key={purchase.id} className="bg-stone-800/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                  <div className="flex-grow">
                                      <p className="font-bold text-stone-100 flex items-center gap-2">
                                          <span className="text-emerald-300">{getUserName(purchase.userId)}</span>
                                          <span className="text-stone-300 font-normal"> requests to purchase </span>
                                          "{purchase.assetDetails.name}"
                                           <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                                {getGuildName(purchase.guildId)}
                                            </span>
                                      </p>
                                      <p className="text-sm text-stone-400 mt-1">
                                          Requested: {new Date(purchase.requestedAt).toLocaleString()}
                                      </p>
                                  </div>
                                  <div className="flex space-x-3 flex-shrink-0">
                                      <Button onClick={() => approvePurchaseRequest(purchase.id)} className="text-sm py-1 px-4">Approve</Button>
                                      <Button onClick={() => rejectPurchaseRequest(purchase.id)} variant="secondary" className="text-sm py-1 px-4 !bg-red-900/50 hover:!bg-red-800/60 text-red-300">Reject</Button>
                                  </div>
                              </li>
                            )
                          })}
                      </ul>
                  ) : (
                      <p className="text-stone-400 text-center py-4">There are no purchases pending fulfillment.</p>
                  )}
              </Card>
            )}
        </div>
    );
};

export default ApprovalsPage;