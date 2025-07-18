


import React, { useState } from 'react';
import { Guild } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditGuildDialog from '../guilds/EditGuildDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { GuildIcon } from '../ui/Icons';

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
        <div>
            <div className="flex justify-end items-center mb-8">
                <Button onClick={handleCreateGuild}>Create New {settings.terminology.group}</Button>
            </div>

            <div className="space-y-8">
                {guilds.length > 0 ? (
                    guilds.map(guild => (
                        <Card key={guild.id}>
                            <div className="px-6 py-4 border-b border-stone-700/60 flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h3 className="text-2xl font-medieval text-accent">{guild.name}</h3>
                                    <p className="text-stone-400 text-sm">{guild.purpose}</p>
                                    {guild.isDefault && (
                                        <span className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                            Default {settings.terminology.group}
                                        </span>
                                    )}
                                </div>
                                {!guild.isDefault && (
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEditGuild(guild)}>Edit</Button>
                                        <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(guild)}>Delete</Button>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h4 className="font-bold text-lg mb-4 text-stone-200">{guild.memberIds.length} Members</h4>
                            </div>
                        </Card>
                    ))
                ) : (
                    <EmptyState
                        Icon={GuildIcon}
                        title={`No ${settings.terminology.groups} Created`}
                        message={`Create your first ${settings.terminology.group.toLowerCase()} to organize users and quests.`}
                        actionButton={<Button onClick={handleCreateGuild}>Create {settings.terminology.group}</Button>}
                    />
                )}
            </div>

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