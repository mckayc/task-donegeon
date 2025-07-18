
import React, { useState } from 'react';
import Card from '../ui/Card';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import { Guild, User } from '../../types';
import GuildMemberProfilePage from '../guilds/GuildMemberProfilePage';
import Avatar from '../ui/Avatar';

const GuildPage: React.FC = () => {
    const { currentUser, users, guilds, settings } = useAppState();
    const { setAppMode, setActivePage } = useAppDispatch();
    const [viewingMember, setViewingMember] = useState<{ user: User; guild: Guild } | null>(null);

    if (!currentUser) return null;

    const myGuilds = guilds.filter(g => g.memberIds.includes(currentUser.id));

    const handleSwitchView = (guildId: string) => {
        setAppMode({ mode: 'guild', guildId: guildId });
        setActivePage('Dashboard');
    };

    if (viewingMember) {
        return <GuildMemberProfilePage user={viewingMember.user} guild={viewingMember.guild} onBack={() => setViewingMember(null)} />;
    }

    return (
        <div>
            {myGuilds.length > 0 ? (
                <div className="space-y-8">
                    {myGuilds.map(guild => (
                        <Card key={guild.id}>
                             <div className="px-6 py-4 border-b border-stone-700/60 flex flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-medieval text-accent">{guild.name}</h3>
                                    <p className="text-stone-400 text-sm">{guild.purpose}</p>
                                </div>
                                <div>
                                    <Button onClick={() => handleSwitchView(guild.id)}>Switch to this {settings.terminology.group}'s View</Button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h4 className="font-bold text-lg mb-4 text-stone-200">Members</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {guild.memberIds.map(memberId => {
                                        const member = users.find(u => u.id === memberId);
                                        if (!member) return null;
                                        return (
                                            <button 
                                                key={member.id} 
                                                className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-stone-700/50 transition-colors group"
                                                onClick={() => setViewingMember({ user: member, guild })}
                                            >
                                                <Avatar user={member} className="w-20 h-20 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors" />
                                                <p className="mt-2 text-md font-semibold text-stone-200">{member.gameName}</p>
                                                <p className="text-xs text-stone-400">{member.role}</p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card title={`No ${settings.terminology.groups} Found`}>
                    <p className="text-stone-400">You are not currently a member of any {settings.terminology.group.toLowerCase()}.</p>
                </Card>
            )}
        </div>
    );
};

export default GuildPage;
