
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { QuestCompletionStatus, Role, PurchaseRequestStatus, TradeStatus, TradeOffer, User } from '../../types';
import Input from '../user-interface/Input';
import { useAuthState } from '../../context/AuthContext';
import TradeDialog from '../trading/TradeDialog';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import Avatar from '../user-interface/Avatar';
import { CheckCircleIcon, XCircleIcon } from '../user-interface/Icons';

type Tab = 'quests' | 'purchases' | 'trades';

const TabButton: React.FC<{ label: string; count: number; isActive: boolean; onClick: () => void; }> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex-grow text-center py-3 px-3 rounded-md font-semibold text-sm transition-colors ${
            isActive ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'
        }`}
    >
        {label}
        {count > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-stone-800">
                {count > 9 ? '9+' : count}
            </span>
        )}
    </button>
);

const ApprovalCard: React.FC<{
    item: any;
    type: Tab;
    user: User;
    title: string;
    note?: string;
    costText?: string;
    onApprove: (id: string, adminNote: string) => void;
    onReject: (id: string, adminNote: string) => void;
    onViewTrade?: (trade: TradeOffer) => void;
}> = ({ item, type, user, title, note, costText, onApprove, onReject, onViewTrade }) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    const x = useMotionValue(0);
    const approveOpacity = useTransform(x, [50, 150], [0, 1]);
    const rejectOpacity = useTransform(x, [-50, -150], [0, 1]);
    
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 100;
        if (info.offset.x > swipeThreshold) {
            onApprove(item.id, '');
        } else if (info.offset.x < -swipeThreshold) {
            onReject(item.id, '');
        }
    };

    const handleConfirmReject = () => {
        onReject(item.id, adminNote);
        setIsRejecting(false);
    };

    return (
        <div className="relative">
             <motion.div
                style={{ opacity: approveOpacity }}
                className="absolute inset-0 bg-green-500 rounded-lg flex items-center justify-start px-6 text-white font-bold"
            >
                <CheckCircleIcon className="w-6 h-6 mr-2" /> Approve
            </motion.div>
            <motion.div
                style={{ opacity: rejectOpacity }}
                className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end px-6 text-white font-bold"
            >
                Reject <XCircleIcon className="w-6 h-6 ml-2" />
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x }}
                onDragEnd={handleDragEnd}
                className="relative bg-stone-800 rounded-lg shadow-md cursor-grab active:cursor-grabbing"
            >
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <Avatar user={user} className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div>
                            <p className="font-bold text-stone-100 text-sm">
                                <span className="text-emerald-300">{user.gameName}</span>
                                <span className="text-stone-300 font-normal"> {
                                    type === 'quests' ? 'completed a quest:' :
                                    type === 'purchases' ? 'requests to purchase:' :
                                    'sent you a trade offer'
                                }</span>
                            </p>
                             <p className="text-stone-200 font-semibold text-base">"{title}"</p>
                        </div>
                    </div>

                    {(note || costText) && (
                        <div className="mt-3 pl-12 text-sm">
                            {note && <p className="text-stone-400 italic">"{note}"</p>}
                            {costText && <p className="text-amber-300">{costText}</p>}
                        </div>
                    )}
                </div>
                
                 <AnimatePresence>
                    {isRejecting && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 border-t border-stone-700/60 space-y-2">
                                <Input as="textarea" placeholder="Reason for rejection (optional)..." value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setIsRejecting(false)}>Cancel</Button>
                                    <Button size="sm" variant="destructive" onClick={handleConfirmReject}>Confirm Reject</Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="bg-black/20 p-2 flex justify-end gap-2 rounded-b-lg">
                    {type === 'trades' && onViewTrade ? (
                        <Button size="sm" onClick={() => onViewTrade(item)}>View Offer</Button>
                    ) : (
                        <>
                            <Button size="sm" variant="destructive" onClick={() => setIsRejecting(true)}>Reject</Button>
                            <Button size="sm" onClick={() => onApprove(item.id, '')}>Approve</Button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};


const ApprovalsPage: React.FC = () => {
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { purchaseRequests, tradeOffers, rewardTypes } = useEconomyState();
    const { currentUser, users } = useAuthState();
    const { approveQuestCompletion, rejectQuestCompletion } = useQuestsDispatch();
    const { approvePurchaseRequest, rejectPurchaseRequest } = useEconomyDispatch();
    
    const [activeTab, setActiveTab] = useState<Tab>('quests');
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
    const getUser = (userId: string) => users.find(u => u.id === userId);

    const questCount = pendingCompletions.length;
    const purchaseCount = currentUser.role === Role.DonegeonMaster ? pendingPurchases.length : 0;
    const tradeCount = pendingTrades.length;
    
    const handleApproveQuest = (id: string, note: string) => approveQuestCompletion(id, currentUser.id, note);
    const handleRejectQuest = (id: string, note: string) => rejectQuestCompletion(id, currentUser.id, note);
    const handleApprovePurchase = (id: string) => approvePurchaseRequest(id, currentUser.id);
    const handleRejectPurchase = (id: string) => rejectPurchaseRequest(id, currentUser.id);

    const renderContent = () => {
        switch (activeTab) {
            case 'quests':
                return pendingCompletions.length > 0 ? (
                    pendingCompletions.map(c => {
                        const user = getUser(c.userId);
                        if (!user) return null;
                        return (
                            <ApprovalCard
                                key={c.id}
                                item={c}
                                type="quests"
                                user={user}
                                title={getQuestTitle(c.questId)}
                                note={c.note}
                                onApprove={handleApproveQuest}
                                onReject={handleRejectQuest}
                            />
                        );
                    })
                ) : <p className="text-stone-400 text-center py-8">No quests are currently pending approval.</p>;
            case 'purchases':
                 return pendingPurchases.length > 0 ? (
                    pendingPurchases.map(p => {
                        const user = getUser(p.userId);
                        if (!user) return null;
                        const costText = `Cost: ${p.assetDetails.cost.map(c => `${c.amount} ${rewardTypes.find(rt => rt.id === c.rewardTypeId)?.name || '?'}`).join(', ')}`;
                        return (
                            <ApprovalCard
                                key={p.id}
                                item={p}
                                type="purchases"
                                user={user}
                                title={p.assetDetails.name}
                                costText={costText}
                                onApprove={handleApprovePurchase}
                                onReject={handleRejectPurchase}
                            />
                        );
                    })
                ) : <p className="text-stone-400 text-center py-8">No purchases are currently pending approval.</p>;
            case 'trades':
                return pendingTrades.length > 0 ? (
                    pendingTrades.map(t => {
                        const user = getUser(t.initiatorId);
                        if (!user) return null;
                        const title = t.status === TradeStatus.OfferUpdated ? 'Offer Updated' : 'New Trade Offer';
                        return (
                            <ApprovalCard
                                key={t.id}
                                item={t}
                                type="trades"
                                user={user}
                                title={title}
                                onApprove={() => {}} // Not applicable
                                onReject={() => {}} // Not applicable
                                onViewTrade={setTradeToView}
                            />
                        );
                    })
                ) : <p className="text-stone-400 text-center py-8">You have no pending trade offers.</p>;
            default:
                return null;
        }
    };

    return (
        <div className="md:max-w-2xl mx-auto">
             <div className="mb-6">
                <h1 className="text-4xl font-medieval text-stone-100">Approvals</h1>
            </div>
            <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg mb-6">
                <TabButton label="Quests" count={questCount} isActive={activeTab === 'quests'} onClick={() => setActiveTab('quests')} />
                {currentUser.role === Role.DonegeonMaster && (
                    <TabButton label="Purchases" count={purchaseCount} isActive={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} />
                )}
                 <TabButton label="Trades" count={tradeCount} isActive={activeTab === 'trades'} onClick={() => setActiveTab('trades')} />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            {tradeToView && <TradeDialog tradeOffer={tradeToView} onClose={() => setTradeToView(null)} />}
        </div>
    );
};

export default ApprovalsPage;
