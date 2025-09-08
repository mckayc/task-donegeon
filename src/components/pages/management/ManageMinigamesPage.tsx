
import React, { useState } from 'react';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import Card from '../../user-interface/Card';
import Button from '../../user-interface/Button';
import { Minigame } from '../../../../types';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import GameStatsDialog from '../../games/GameStatsDialog';
import EditMinigameDialog from '../../admin/EditMinigameDialog';

const ManageMinigamesPage: React.FC = () => {
    const { settings, minigames } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const [gameForStats, setGameForStats] = useState<Minigame | null>(null);
    const [gameToDelete, setGameToDelete] = useState<Minigame | null>(null);
    const [editingGame, setEditingGame] = useState<Minigame | null>(null);

    const handleDelete = () => {
        if (!gameToDelete) return;
        // This is a placeholder for future admin functionality.
        // Core games should not be deletable by users.
        setGameToDelete(null);
    };

    return (
        <>
            <Card title={settings.terminology.link_manage_minigames}>
                <p className="text-stone-400 mb-4 -mt-2">View statistics for available games. New games are added via application updates.</p>
                <div className="space-y-3">
                    {minigames.map(game => (
                        <div key={game.id} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{game.icon}</div>
                                <div>
                                    <h4 className="font-bold text-lg text-stone-100">{game.name}</h4>
                                    <p className="text-sm text-stone-400">{game.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setGameForStats(game)}>Stats</Button>
                                <Button variant="secondary" size="sm" onClick={() => setEditingGame(game)}>Edit</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            {gameForStats && (
                <GameStatsDialog game={gameForStats} onClose={() => setGameForStats(null)} />
            )}
            {editingGame && (
                <EditMinigameDialog game={editingGame} onClose={() => setEditingGame(null)} />
            )}
            <ConfirmDialog
                isOpen={!!gameToDelete}
                onClose={() => setGameToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Minigame"
                message={`Are you sure you want to delete "${gameToDelete?.name}"? All score data will be lost.`}
            />
        </>
    );
};

export default ManageMinigamesPage;