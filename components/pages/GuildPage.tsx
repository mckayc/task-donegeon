import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Guild, User } from '../../types';
import GuildMemberProfilePage from '../guilds/GuildMemberProfilePage';
import Avatar from '../ui/avatar';

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
                             <CardHeader className="flex flex-row flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-display text-accent">{guild.name}</CardTitle>
                                    <CardDescription>{guild.purpose}</CardDescription>
                                </div>
                                <div>
                                    <Button onClick={() => handleSwitchView(guild.id)}>Switch to this {settings.terminology.group}'s View</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <h4 className="font-bold text-lg mb-4 text-foreground">Members</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {guild.memberIds.map(memberId => {
                                        const member = users.find(u => u.id === memberId);
                                        if (!member) return null;
                                        return (
                                            <button 
                                                key={member.id} 
                                                className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-accent/10 transition-colors group"
                                                onClick={() => setViewingMember({ user: member, guild })}
                                            >
                                                <Avatar user={member} className="w-20 h-20 bg-card rounded-full border-2 border-border group-hover:border-accent transition-colors" />
                                                <p className="mt-2 text-md font-semibold text-foreground">{member.gameName}</p>
                                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>No {settings.terminology.groups} Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">You are not currently a member of any {settings.terminology.group.toLowerCase()}.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default GuildPage;