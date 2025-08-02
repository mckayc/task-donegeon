import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus } from '../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ApprovalsPage: React.FC = () => {
    const { 
      questCompletions, users, quests, currentUser,
      purchaseRequests, guilds, gameAssets
    } = useAppState();

    const {
        approveQuestCompletion, rejectQuestCompletion,
        approvePurchaseRequest, rejectPurchaseRequest
    } = useAppDispatch();
    
    const [notes, setNotes] = useState<{ [key: string]: string }>({});

    if (!currentUser || (currentUser.role !== Role.DonegeonMaster && currentUser.role !== Role.Gatekeeper)) {
        return (
            <div>
                <h1 className="text-4xl font-display mb-8">Access Denied</h1>
                <Card>
                  <CardContent className="p-6">
                    <p>You do not have permission to view this page.</p>
                  </CardContent>
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
        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quests Awaiting Verification</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingCompletions.length > 0 ? (
                    <ul className="space-y-4">
                        {pendingCompletions.map(completion => (
                            <li key={completion.id} className="bg-card p-4 rounded-lg flex flex-col justify-between">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="font-semibold flex items-center gap-2 flex-wrap">
                                            <span className="text-primary">{getUserName(completion.userId)}</span>
                                            <span className="text-foreground/80 font-normal"> completed </span>
                                            "{getQuestTitle(completion.questId)}"
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                                                {getGuildName(completion.guildId)}
                                            </span>
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Submitted: {new Date(completion.completedAt).toLocaleString()}
                                        </p>
                                        {completion.note && <p className="text-sm italic text-foreground/90 mt-2">Note: "{completion.note}"</p>}
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-3">
                                    <div className="flex-grow">
                                      <Label htmlFor={`note-${completion.id}`} className="sr-only">Approver Note</Label>
                                      <Input
                                          id={`note-${completion.id}`}
                                          placeholder="Add an optional note..."
                                          value={notes[completion.id] || ''}
                                          onChange={(e) => handleNoteChange(completion.id, e.target.value)}
                                          className="flex-grow"
                                      />
                                    </div>
                                    <div className="flex space-x-3 flex-shrink-0 justify-end mt-2 sm:mt-0">
                                        <Button onClick={() => approveQuestCompletion(completion.id, notes[completion.id])} size="sm">Approve</Button>
                                        <Button onClick={() => rejectQuestCompletion(completion.id, notes[completion.id])} variant="destructive" size="sm">Reject</Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">There are no quests pending approval.</p>
                )}
              </CardContent>
            </Card>

            {currentUser.role === Role.DonegeonMaster && (
              <Card>
                <CardHeader>
                  <CardTitle>Purchases Awaiting Fulfillment</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingPurchases.length > 0 ? (
                      <ul className="space-y-4">
                          {pendingPurchases.map(purchase => {
                            const asset = gameAssets.find(a => a.id === purchase.assetId);
                            return (
                              <li key={purchase.id} className="bg-card p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                  <div className="flex-grow">
                                      <p className="font-semibold flex items-center gap-2 flex-wrap">
                                          <span className="text-primary">{getUserName(purchase.userId)}</span>
                                          <span className="text-foreground/80 font-normal"> requests to purchase </span>
                                          "{purchase.assetDetails.name}"
                                           <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                                                {getGuildName(purchase.guildId)}
                                            </span>
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                          Requested: {new Date(purchase.requestedAt).toLocaleString()}
                                      </p>
                                  </div>
                                  <div className="flex space-x-3 flex-shrink-0">
                                      <Button onClick={() => approvePurchaseRequest(purchase.id)} size="sm">Approve</Button>
                                      <Button onClick={() => rejectPurchaseRequest(purchase.id)} variant="destructive" size="sm">Reject</Button>
                                  </div>
                              </li>
                            )
                          })}
                      </ul>
                  ) : (
                      <p className="text-muted-foreground text-center py-4">There are no purchases pending fulfillment.</p>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
    );
};

export default ApprovalsPage;