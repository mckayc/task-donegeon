import React, { useState } from 'react';
import { Guild } from '../../types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import EditGuildDialog from '../guilds/EditGuildDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { GuildIcon } from '@/components/ui/Icons';

const ManageGuildsPage: React.FC = () => {
    const { guilds, settings } = useAppState();
    const { deleteGuild } = useAppDispatch();
    const [isGuildDialogOpen, setIsGuildDialogOpen] = useState(false);
    const [editingGuild, setEditingGuild] = useState<Guild | null>(null);
    const [deletingGuild, setDeletingGuild] = useState<Guild | null>(null);

    const handleCreateGuild = () => {
        setEditingGuild(null);
        setIsGuildDialogOpen(true);
    };

    const handleEditGuild = (guild: Guild) => {
        setEditingGuild(guild);
        setIsGuildDialogOpen(true);
    };

    const handleDeleteRequest = (guild: Guild) => {
        setDeletingGuild(guild);
    };
    
    const handleConfirmDelete = () => {
        if(deletingGuild) {
            deleteGuild(deletingGuild.id);
        }
        setDeletingGuild(null);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{`All Created ${settings.terminology.groups}`}</CardTitle>
                    <Button onClick={handleCreateGuild} size="sm">
                        Create New {settings.terminology.group}
                    </Button>
                </CardHeader>
                <CardContent>
                {guilds.length > 0 ? (
                     <div className="space-y-4">
                        {guilds.map(guild => (
                            <div key={guild.id} className="bg-background/50 rounded-lg overflow-hidden border">
                                <div className="px-6 py-4 border-b flex justify-between items-start flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">{guild.name}</h3>
                                        <p className="text-muted-foreground text-sm">{guild.purpose}</p>
                                        {guild.isDefault && (
                                            <span className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                                                Default {settings.terminology.group}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <Button size="sm" variant="secondary" onClick={() => handleEditGuild(guild)}>Edit</Button>
                                        {!guild.isDefault && (
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(guild)}>Delete</Button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-semibold text-sm mb-2 text-foreground">{guild.memberIds.length} Members</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <EmptyState
                        Icon={GuildIcon}
                        title={`No ${settings.terminology.groups} Created`}
                        message={`Create your first ${settings.terminology.group.toLowerCase()} to organize users and quests.`}
                        actionButton={<Button onClick={handleCreateGuild}>Create {settings.terminology.group}</Button>}
                    />
                )}
                </CardContent>
            </Card>

            {isGuildDialogOpen && (
                <EditGuildDialog
                    guild={editingGuild}
                    onClose={() => setIsGuildDialogOpen(false)}
                />
            )}
            
            {deletingGuild && (
                <ConfirmDialog
                    isOpen={!!deletingGuild}
                    onClose={() => setDeletingGuild(null)}
                    onConfirm={handleConfirmDelete}
                    title={`Delete ${settings.terminology.group}`}
                    message={`Are you sure you want to delete the ${settings.terminology.group.toLowerCase()} "${deletingGuild.name}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default ManageGuildsPage;