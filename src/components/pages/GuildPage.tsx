import React, { useState, useRef, useEffect, useMemo } from 'react';
import Card from 'components/user-interface/Card';
import { useSystemState } from 'context/SystemContext';
import { useUIState, useUIDispatch } from 'context/UIContext';
import { useAuthState } from 'context/AuthContext';
import Button from 'components/user-interface/Button';
import { User } from 'components/users/types';
import { Guild } from 'components/guilds/types';
import { RewardCategory } from 'components/items/types';
import { TradeOffer } from 'components/trading/types';
import GuildMemberProfilePage from 'components/guilds/GuildMemberProfilePage';
import Avatar from 'components/user-interface/Avatar';
import DonateDialog from 'components/guilds/DonateDialog';
import DynamicIcon from 'components/user-interface/DynamicIcon';
import { EllipsisVerticalIcon } from 'components/user-interface/Icons';
import GiftDialog from 'components/trading/GiftDialog';
import TradeDialog from 'components/trading/TradeDialog';
import { useNotificationsDispatch } from 'context/NotificationsContext';
import { useEconomyDispatch, useEconomyState } from 'context/EconomyContext';
import { useCommunityState } from 'context/CommunityContext';

const GuildPage: React.FC = () => {
    const { settings } = useSystemState();
    const { guilds } = useCommunityState();
    const { rewardTypes, gameAssets, tradeOffers } = useEconomyState();
    const { appMode } = useUIState();
    const { currentUser, users } = useAuthState();
    const { setAppMode, setActivePage } = useUIDispatch();
    const { proposeTrade } = useEconomyDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [viewingMember, setViewingMember] = useState<{ user: User; guild: Guild } | null>(null);
    const [donatingToGuild, setDonatingToGuild] = useState<Guild | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [giftingToUser, setGiftingToUser] = useState<{ user: User; guild: Guild } | null>(null);
    const [tradeToView, setTradeToView] = useState<TradeOffer | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    const guildsToShow = useMemo(() => {
        if (appMode.mode === 'guild') {
            const currentGuild = guilds.find(g => g.id === appMode.guildId);
            return currentGuild ? [currentGuild] : [];
        }
        return guilds.filter(g => g.memberIds.includes(currentUser.id));
    }, [guilds, currentUser.id, appMode]);

    const handleSwitchView = (guildId: string) => {
        setAppMode({ mode: 'guild', guildId: guildId });
        setActivePage('Dashboard');
    };

    const handleProposeTrade = async (recipient: User, guild: Guild) => {
        const newTrade = await proposeTrade(recipient.id, guild.id);
        if (newTrade) {
            setTradeToView(newTrade);
        } else {
            addNotification({
                type: 'error',
                message: 'Failed to create trade offer. Please try again later.'
            });
        }
    };


    if (viewingMember) {
        return <GuildMemberProfilePage user={viewingMember.user} guild={viewingMember.guild} onBack={() => setViewingMember(null)} />;
    }

    const TreasuryDisplay: React.FC<{ guild: Guild }> = ({ guild }) => {
        const treasuryCurrencies = Object.entries(guild.treasury?.purse || {})
            .map(([rewardTypeId, amount]) => {
                const def = rewardTypes.find(rt => rt.id === rewardTypeId);
                return def ? { ...def, amount } : null;
            })
            .filter((item): item is NonNullable<typeof item> => !!item && item.amount > 0);

        const treasuryItems = (guild.treasury?.ownedAssetIds || [])
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter((item): item is NonNullable<typeof item> => !!item);
            
        return (
            <div className="p-6 border-t border-stone-700/60">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg text-stone-200">Guild Treasury</h4>
                    <Button variant="secondary" size="sm" onClick={() => setDonatingToGuild(guild)}>Donate</Button>
                </div>
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h5 className="font-semibold text-stone-400 text-sm mb-2">{settings.terminology.currency}</h5>
                        {treasuryCurrencies.length > 0 ? (
                            <div className="space-y-2">
                                {treasuryCurrencies.map(c => (
                                    <div key={c.id} className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-stone-300">{c.icon} {c.name}</span>
                                        <span className="font-bold text-accent-light">{c.amount}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-stone-500 italic">No currency held.</p>}
                    </div>
                    <div>
                        <h5 className="font-semibold text-stone-400 text-sm mb-2">Items</h5>
                        {treasuryItems.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {treasuryItems.map(item => (
                                    <div key={item.id} title={item.name} className="w-10 h-10 bg-stone-700 rounded-md p-1">
                                        <DynamicIcon iconType={item.iconType} icon={item.icon} imageUrl={item.imageUrl} className="w-full h-full text-2xl" />
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-stone-500 italic">No items held.</p>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {guildsToShow.length > 0 ? (
                <div className="space-y-8">
                    {guildsToShow.map(guild => (
                        <Card key={guild.id} className="p-0 overflow-hidden">
                             <div className="px-6 py-4 flex flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-medieval text-accent">{guild.name}</h3>
                                    <p className="text-stone-400 text-sm">{guild.purpose}</p>
                                </div>
                                <div>
                                    {appMode.mode === 'personal' && (
                                        <Button onClick={() => handleSwitchView(guild.id)}>Switch to this {settings.terminology.group}'s View</Button>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 border-t border-stone-700/60">
                                <h4 className="font-bold text-lg mb-4 text-stone-200">Members</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {guild.memberIds.map(memberId => {
                                        const member = users.find(u => u.id === memberId);
                                        if (!member) return null;
                                        const isCurrentUser = member.id === currentUser.id;
                                        return (
                                            <div key={member.id} className="relative flex flex-col items-center text-center p-2 rounded-lg hover:bg-stone-700/50 transition-colors group">
                                                <button onClick={() => setViewingMember({ user: member, guild })}>
                                                    <Avatar user={member} className="w-20 h-20 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors" />
                                                </button>
                                                <p className="mt-2 text-md font-semibold text-stone-200">{member.gameName}</p>
                                                <p className="text-xs text-stone-400">{member.role}</p>
                                                {!isCurrentUser && (
                                                    <div className="absolute top-1 right-1">
                                                        <button onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)} className="p-2 rounded-full hover:bg-stone-800/80">
                                                            <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                                        </button>
                                                        {openDropdownId === member.id && (
                                                            <div ref={dropdownRef} className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                                <button onClick={() => { setGiftingToUser({ user: member, guild }); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Send Gift</button>
                                                                <button onClick={() => { handleProposeTrade(member, guild); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Propose Trade</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <TreasuryDisplay guild={guild} />
                        </Card>
                    ))}
                </div>
            ) : (
                <Card title={`No ${settings.terminology.groups} Found`}>
                    <p className="text-stone-400">You are not currently a member of any {settings.terminology.group.toLowerCase()}.</p>
                </Card>
            )}
            {donatingToGuild && <DonateDialog guild={donatingToGuild} onClose={() => setDonatingToGuild(null)} />}
            {giftingToUser && <GiftDialog recipient={giftingToUser.user} guild={giftingToUser.guild} onClose={() => setGiftingToUser(null)} />}
            {tradeToView && <TradeDialog tradeOffer={tradeOffers.find(t => t.id === tradeToView.id)!} onClose={() => setTradeToView(null)} />}
        </div>
    );
};

export default GuildPage;