import React, { useState } from 'react';
import { Guild } from '../guilds/types';
import { AppSettings } from '../../types/app';
import EmptyState from '../user-interface/EmptyState';
import { GuildIcon, EllipsisVerticalIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';

interface GuildListProps {
    guilds: Guild[];
    settings: AppSettings;
    onEditGuild: (guild: Guild) => void;
    onDeleteRequest: (guild: Guild) => void;
    onCreateGuild: () => void;
}

const GuildList: React.FC<GuildListProps> = ({ guilds, settings, onEditGuild, onDeleteRequest, onCreateGuild }) => {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    
    if (guilds.length === 0) {
        return (
            <EmptyState
                Icon={GuildIcon}
                title={`No ${settings.terminology.groups} Created`}
                message={`Create your first ${settings.terminology.group.toLowerCase()} to organize users and quests.`}
                actionButton={<Button onClick={onCreateGuild}>Create {settings.terminology.group}</Button>}
            />
        );
    }

    return (
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
                                <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                    <button onClick={() => { onEditGuild(guild); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</button>
                                    {!guild.isDefault && (
                                        <button onClick={() => { onDeleteRequest(guild); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
    );
};

export default GuildList;