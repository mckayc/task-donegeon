import React, { useState, useRef, useEffect } from 'react';
import { Guild } from '../../guilds/types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditGuildDialog from '../../guilds/EditGuildDialog';
import { useCommunityDispatch, useCommunityState } from '../../context/CommunityContext';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import GuildList from '../../guilds/GuildList';
import { useSystemState } from '../../context/SystemContext';

const ManageGuildsPage: React.FC = () => {
    const { guilds } = useCommunityState();
    const { settings } = useSystemState();
    const { deleteGuild } = useCommunityDispatch();
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
            <Card
                title={`All Created ${settings.terminology.groups}`}
                headerAction={
                    <Button onClick={handleCreateGuild} size="sm">
                        Create New {settings.terminology.group}
                    </Button>
                }
            >
                <GuildList
                    guilds={guilds}
                    settings={settings}
                    onEditGuild={handleEditGuild}
                    onDeleteRequest={handleDeleteRequest}
                    onCreateGuild={handleCreateGuild}
                />
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
