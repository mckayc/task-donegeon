import React from 'react';
import { IAppData } from '../../types';
import Button from '../ui/Button';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useQuestState } from '../../context/QuestContext';

const BackupPanel: React.FC = () => {
    const appState = useAppState();
    const authState = useAuthState();
    const economyState = useEconomyState();
    const questState = useQuestState();

    const handleBackup = () => {
        const fullData: IAppData = {
            ...appState,
            ...authState,
            ...economyState,
            ...questState
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
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
                <h4 className="font-bold text-lg text-stone-200">Full Application Backup</h4>
                <p className="text-stone-400 text-sm mb-3">
                    Create a complete backup of all users, quests, items, settings, and history. Keep this file in a safe place.
                </p>
            </div>
            <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                <Button onClick={handleBackup}>
                    Download Full Backup
                </Button>
            </div>
        </div>
    );
};

export default BackupPanel;
