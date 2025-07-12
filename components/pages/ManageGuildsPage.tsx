import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Guild } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditGuildDialog from '../guilds/EditGuildDialog';

const ManageGuildsPage: React.FC = () => {
    const { guilds } = useAppState();
    const { deleteGuild } = useAppDispatch();
    const [isGuildDialogOpen, setIsGuildDialogOpen] = useState(false);
    const [editingGuild, setEditingGuild] = useState<Guild | null>(null);

    const handleCreateGuild = () => {
        setEditingGuild(null);
        setIsGuildDialogOpen(true);
    };

    const handleEditGuild = (guild: Guild) => {
        setEditingGuild(guild);
        setIsGuildDialogOpen(true);
    };

    const handleDeleteGuild = (guildId: string) => {
        if (window.confirm('Are you sure you want to delete this guild? This is permanent.')) {
            deleteGuild(guildId);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-medieval text-stone-100">Manage Guilds</h1>
                <Button onClick={handleCreateGuild}>Create New Guild</Button>
            </div>

            <div className="space-y-8">
                {guilds.map(guild => (
                    <Card key={guild.id}>
                        <div className="px-6 py-4 border-b border-stone-700/60 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-medieval text-emerald-400">{guild.name}</h3>
                                <p className="text-stone-400 text-sm">{guild.purpose}</p>
                                {guild.isDefault && (
                                    <span className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                        Default Guild
                                    </span>
                                )}
                            </div>
                            {!guild.isDefault && (
                                <div className="flex space-x-2 flex-shrink-0">
                                    <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEditGuild(guild)}>Edit</Button>
                                    <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteGuild(guild.id)}>Delete</Button>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-lg mb-4 text-stone-200">{guild.memberIds.length} Members</h4>
                        </div>
                    </Card>
                ))}
            </div>

            {isGuildDialogOpen && (
                <EditGuildDialog
                    guild={editingGuild}
                    onClose={() => setIsGuildDialogOpen(false)}
                />
            )}
        </div>
    );
};

export default ManageGuildsPage;
