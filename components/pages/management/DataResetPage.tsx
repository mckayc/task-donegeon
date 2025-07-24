import React, { useState } from 'react';
import { useAppDispatch, useAppState } from '../../../context/AppContext';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';

const DataResetPage: React.FC = () => {
    const { settings } = useAppState();
    const { clearAllHistory, resetAllPlayerData, deleteAllCustomContent, factoryReset } = useAppDispatch();
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const handleAction = (action: () => void, title: string, message: string) => {
        setConfirmAction(() => action); // Use callback form to ensure the correct function is stored
        setConfirmTitle(title);
        setConfirmMessage(message);
    };

    const onConfirm = () => {
        if (confirmAction) {
            confirmAction();
        }
        setConfirmAction(null);
    };

    const resetOptions = [
        {
            title: `Clear All ${settings.terminology.history}`,
            description: `This will permanently delete all ${settings.terminology.history} entries, including ${settings.terminology.task} completions, purchase requests, and system logs. User ${settings.terminology.points}, items, and created content will NOT be affected. This is useful for clearing out old data or resolving history-related bugs.`,
            buttonText: `Clear ${settings.terminology.history}`,
            action: () => handleAction(
                clearAllHistory,
                `Clear All ${settings.terminology.history}?`,
                `Are you sure? This will delete all historical records. This action cannot be undone.`
            )
        },
        {
            title: `Reset All Player Data`,
            description: `This will reset all non-admin players to their starting state. Their ${settings.terminology.currency}, ${settings.terminology.xp}, owned items, and avatars will be wiped. User accounts themselves will NOT be deleted. This is useful for starting a new "season" or fixing corrupted player data.`,
            buttonText: 'Reset Player Data',
            action: () => handleAction(
                resetAllPlayerData,
                'Reset All Player Data?',
                `Are you sure? This will reset all non-admin player progress. This action cannot be undone.`
            )
        },
        {
            title: 'Delete All Custom Content',
            description: `This deletes all content created by admins, including custom ${settings.terminology.tasks}, ${settings.terminology.stores}, items, ${settings.terminology.awards}, and ${settings.terminology.levels}. Users and their data will NOT be affected. This is for starting over with content creation.`,
            buttonText: 'Delete Custom Content',
            action: () => handleAction(
                deleteAllCustomContent,
                'Delete All Custom Content?',
                `Are you sure? This will delete all of your created quests, items, etc. This action cannot be undone.`
            )
        },
        {
            title: 'Factory Reset',
            description: `This is the ultimate reset. It performs all of the above actions and completely wipes the database, returning the app to the initial setup wizard. Use this only if the app is severely broken or you want to start completely fresh.`,
            buttonText: 'Perform Factory Reset',
            action: () => handleAction(
                factoryReset,
                'Perform Full Factory Reset?',
                `WARNING: This is irreversible. All users, content, and history will be permanently deleted. The app will return to the first-run setup screen. Are you absolutely sure?`
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Card title="Danger Zone: Data Reset">
                <p className="text-amber-300 bg-amber-900/30 p-4 rounded-lg border border-amber-700/60 mb-6">
                    <strong>Warning:</strong> The actions below are destructive and cannot be undone. It is highly recommended to create and download a backup from the "Backup & Import" tab before proceeding.
                </p>
                <div className="space-y-6">
                    {resetOptions.map(opt => (
                        <div key={opt.title} className="p-4 bg-stone-900/50 border border-stone-700/60 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-lg text-red-400">{opt.title}</h4>
                                <p className="text-stone-400 text-sm max-w-2xl">{opt.description}</p>
                            </div>
                            <Button className="!bg-red-600 hover:!bg-red-500 flex-shrink-0" onClick={opt.action}>
                                {opt.buttonText}
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>
            
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={onConfirm}
                title={confirmTitle}
                message={confirmMessage}
            />
        </div>
    );
};

export default DataResetPage;