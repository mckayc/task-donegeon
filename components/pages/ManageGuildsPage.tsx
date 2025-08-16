import React, { useState, useRef, useEffect } from 'react';
import { Guild } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import EditGuildDialog from '../guilds/EditGuildDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import EmptyState from '../user-interface/EmptyState';
import { GuildIcon, EllipsisVerticalIcon } from '../user-interface/Icons';

const ManageGuildsPage: React.FC = () => {
    const { guilds, settings } = useAppState();
    const { deleteGuild } = useAppDispatch();
    const [isGuildDialogOpen, setIsGuildDialogOpen] = useState(false);
    const [editingGuild, setEditingGuild] = useState<Guild | null>(null);
    const [deletingGuild, setDeletingGuild] = useState<Guild | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
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
                {guilds.length > 0 ? (
                     <div className="space-y-4">
                        {guilds.map(guild => (
                            <div key={guild.id} className="bg-stone-900/40 rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-stone-700/60 flex flex-wrap gap-4 justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-100">{guild.name}</h3>
                                        <p className="text-stone-400 text-sm">{guild.purpose}</p>
                                        {guild.isDefault && (
                                            <span className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                                Default {settings.terminology.group}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setOpenDropdownId(openDropdownId === guild.id ? null : guild.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                            <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                        </button>
                                        {openDropdownId === guild.id && (
                                            <div ref={dropdownRef} className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleEditGuild(guild); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                {!guild.isDefault && (
                                                    <button onClick={() => { handleDeleteRequest(guild); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-semibold text-sm mb-2 text-stone-300">{guild.memberIds.length} Members</h4>
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