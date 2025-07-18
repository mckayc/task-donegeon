
import React from 'react';
import { useAuthState, useGameDataState, useSettingsState, useUIState } from '../../context/AppContext';
import Button from '../ui/Button';
import { IAppData } from '../../types';

const BackupPanel: React.FC = () => {
    const authState = useAuthState();
    const gameDataState = useGameDataState();
    const settingsState = useSettingsState();
    const uiState = useUIState();

    const handleBackup = () => {
        // Construct the full data object for backup
        const dataToBackup: IAppData = {
            users: authState.users,
            loginHistory: authState.loginHistory,
            quests: gameDataState.quests,
            markets: gameDataState.markets,
            rewardTypes: gameDataState.rewardTypes,
            questCompletions: gameDataState.questCompletions,
            purchaseRequests: gameDataState.purchaseRequests,
            guilds: gameDataState.guilds,
            ranks: gameDataState.ranks,
            trophies: gameDataState.trophies,
            userTrophies: gameDataState.userTrophies,
            adminAdjustments: gameDataState.adminAdjustments,
            gameAssets: gameDataState.gameAssets,
            systemLogs: gameDataState.systemLogs,
            themes: gameDataState.themes,
            settings: settingsState.settings,
            chatMessages: uiState.chatMessages,
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `donegeon_backup_${timestamp}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-6">
             <div>
                <h4 className="font-bold text-lg text-stone-200">Full Data Backup</h4>
                <p className="text-stone-400 text-sm mb-3">
                    Create a complete backup of your entire game state. This file will contain all users, quests, settings, and history. Keep it in a safe place.
                </p>
            </div>
            <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                <Button onClick={handleBackup}>
                    Download Backup File
                </Button>
            </div>
        </div>
    );
};

export default BackupPanel;
