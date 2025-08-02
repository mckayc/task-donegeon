import React, { useMemo } from 'react';
import { Guild, Rank, User, Trophy } from '../../types';
import { useAppState } from '../../context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Avatar from '../ui/Avatar';

interface GuildMemberProfilePageProps {
  user: User;
  guild: Guild;
  onBack: () => void;
}

const GuildMemberProfilePage: React.FC<GuildMemberProfilePageProps> = ({ user, guild, onBack }) => {
    const { ranks, rewardTypes, trophies, userTrophies, gameAssets } = useAppState();

    const personalBalances = useMemo(() => {
        return { purse: user.personalPurse, experience: user.personalExperience };
    }, [user]);

    const rankData = useMemo(() => {
        const sortedRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        const totalXp = Object.values(personalBalances.experience).reduce((sum: number, amount: number) => sum + amount, 0);
        
        let currentRank: Rank | null = sortedRanks[0] || null;
        for (let i = sortedRanks.length - 1; i >= 0; i--) {
            if (totalXp >= sortedRanks[i].xpThreshold) {
                currentRank = sortedRanks[i];
                break;
            }
        }
        return { currentRank, totalXp };
    }, [personalBalances.experience, ranks]);
    
    const personalCurrencies = useMemo(() => {
        return rewardTypes
            .filter(rt => rt.category === 'Currency' && (personalBalances.purse[rt.id] || 0) > 0)
            .map(c => ({ ...c, amount: personalBalances.purse[c.id] || 0 }));
    }, [personalBalances.purse, rewardTypes]);

    const personalExperienceItems = useMemo(() => {
        return rewardTypes
            .filter(rt => rt.category === 'XP' && (personalBalances.experience[rt.id] || 0) > 0)
            .map(xp => ({ ...xp, amount: personalBalances.experience[xp.id] || 0 }));
    }, [personalBalances.experience, rewardTypes]);

    const personalTrophies = useMemo(() => {
        return userTrophies
            .filter(ut => ut.userId === user.id && ut.guildId === undefined)
            .map(ut => trophies.find(t => t.id === ut.trophyId))
            .filter((t): t is Trophy => !!t);
    }, [userTrophies, trophies, user.id]);

    const ownedItems = useMemo(() => {
        return user.ownedAssetIds
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter(asset => asset && asset.category.toLowerCase() !== 'avatar');
    }, [user.ownedAssetIds, gameAssets]);

    return (
        <div>
            <Button variant="secondary" onClick={onBack} className="mb-6">
                &larr; Back to {guild.name}
            </Button>
            
            <Card>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-b border-border">
                    <Avatar user={user} className="w-24 h-24 rounded-full overflow-hidden bg-card border-4 border-accent" />
                    <div className="text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-foreground">{user.gameName}</h2>
                        <p className="text-muted-foreground">{user.role}</p>
                        {rankData.currentRank && (
                             <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                                <span className="text-xl">{rankData.currentRank.icon}</span>
                                <span className="font-semibold text-accent-light">{rankData.currentRank.name}</span>
                                <span className="text-sm text-muted-foreground">({rankData.totalXp} XP)</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rewards */}
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-4">Personal Inventory</h3>
                        <div className="space-y-4">
                             <div>
                                <h4 className="font-bold text-lg text-foreground mb-2 border-b border-border pb-1">Currency</h4>
                                <div className="space-y-2 mt-2">
                                    {personalCurrencies.length > 0 ? personalCurrencies.map(c => 
                                        <div key={c.id} className="flex items-baseline justify-between">
                                            <span className="text-foreground flex items-center gap-2"><span>{c.icon}</span><span>{c.name}</span></span>
                                            <span className="font-semibold text-accent-light">{c.amount}</span>
                                        </div>
                                    ) : <p className="text-muted-foreground text-sm italic">None</p>}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-bold text-lg text-foreground mb-2 border-b border-border pb-1">Experience</h4>
                                <div className="space-y-2 mt-2">
                                    {personalExperienceItems.length > 0 ? personalExperienceItems.map(xp => 
                                        <div key={xp.id} className="flex items-baseline justify-between">
                                            <span className="text-foreground flex items-center gap-2"><span>{xp.icon}</span><span>{xp.name}</span></span>
                                            <span className="font-semibold text-sky-400">{xp.amount}</span>
                                        </div>
                                    ) : <p className="text-muted-foreground text-sm italic">None</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Trophies */}
                    <div>
                         <h3 className="text-xl font-bold text-foreground mb-4">Personal Trophies</h3>
                         {personalTrophies.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {personalTrophies.map(trophy => (
                                    <div key={trophy.id} className="bg-background/70 p-3 rounded-lg flex flex-col items-center text-center" title={trophy.description}>
                                        <div className="w-12 h-12 mb-2 rounded-full flex items-center justify-center bg-amber-900/50">
                                            <span className="text-3xl">{trophy.icon}</span>
                                        </div>
                                        <p className="font-semibold text-sm text-amber-300 truncate w-full">{trophy.name}</p>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-muted-foreground text-sm italic">No personal trophies earned yet.</p>}
                    </div>
                </div>
                
                 <div className="p-6 border-t border-border">
                    <h3 className="text-xl font-bold text-foreground mb-4">Item Collection</h3>
                     {ownedItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                             {ownedItems.map(asset => asset && (
                                <div key={asset.id} className="bg-background/60 p-3 rounded-lg flex flex-col items-center text-center">
                                    <div className="w-16 h-16 mb-2 bg-card rounded-lg flex items-center justify-center overflow-hidden">
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                    </div>
                                    <p className="font-semibold text-sm text-foreground truncate w-full">{asset.name}</p>
                                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                                </div>
                            ))}
                        </div>
                     ) : <p className="text-muted-foreground text-sm italic">No items collected.</p>}
                </div>
            </Card>
        </div>
    );
};

export default GuildMemberProfilePage;