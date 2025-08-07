import React from 'react';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import Button from '../ui/Button';
import { IAppData } from '../../types';

const BackupPanel: React.FC = () => {
    const appState = useAppState();
    const authState = useAuthState();

    const handleBackup = () => {
        // Construct the full IAppData object for backup
        const dataToBackup: IAppData = {
            users: authState.users,
            loginHistory: authState.loginHistory,
            quests: appState.quests,
            questGroups: appState.questGroups,
            markets: appState.markets,
            rewardTypes: appState.rewardTypes,
            questCompletions: appState.questCompletions,
            purchaseRequests: appState.purchaseRequests,
            guilds: appState.guilds,
            ranks: appState.ranks,
            trophies: appState.trophies,
            userTrophies: appState.userTrophies,
            adminAdjustments: appState.adminAdjustments,
            gameAssets: appState.gameAssets,
            systemLogs: appState.systemLogs,
            settings: appState.settings,
            themes: appState.themes,
            chatMessages: appState.chatMessages,
            systemNotifications: appState.systemNotifications,
            scheduledEvents: appState.scheduledEvents,
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
