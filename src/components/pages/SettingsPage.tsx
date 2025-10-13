
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { AppSettings, Terminology } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import CollapsibleSection from '../user-interface/CollapsibleSection';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import ServiceWorkerLogger from '../settings/ServiceWorkerLogger';
import NumberInput from '../user-interface/NumberInput';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

const TerminologySettings: React.FC<{
    terminology: Terminology;
    onChange: (key: keyof Terminology, value: string) => void;
}> = ({ terminology, onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const terminologyGroups = useMemo(() => {
        const groups: { [key: string]: (keyof Terminology)[] } = {
            'Core Concepts': ['appName', 'task', 'tasks', 'point', 'points', 'xp', 'currency'],
            'Quest Types': ['recurringTask', 'recurringTasks', 'singleTask', 'singleTasks', 'journey', 'journeys'],
            'Economy': ['store', 'stores', 'shoppingCenter'],
            'Progression': ['level', 'levels', 'award', 'awards'],
            'Social': ['group', 'groups', 'history', 'chronicles'],
            'Roles': ['admin', 'moderator', 'user', 'users'],
            'Penalties': ['negativePoint', 'negativePoints'],
            'Sidebar Links': Object.keys(terminology).filter(k => k.startsWith('link_')) as (keyof Terminology)[]
        };

        if (!searchTerm) return groups;

        const lowerSearch = searchTerm.toLowerCase();
        const filteredGroups: { [key: string]: (keyof Terminology)[] } = {};

        Object.entries(groups).forEach(([groupName, keys]) => {
            const filteredKeys = keys.filter(key => 
                key.toLowerCase().includes(lowerSearch) || 
                (terminology[key] || '').toLowerCase().includes(lowerSearch)
            );
            if (filteredKeys.length > 0) {
                filteredGroups[groupName] = filteredKeys;
            }
        });
        return filteredGroups;
    }, [terminology, searchTerm]);

    return (
        <div className="space-y-4">
            <Input
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {Object.entries(terminologyGroups).map(([groupName, keys]) => (
                <div key={groupName}>
                    <h4 className="font-semibold text-stone-300 mb-2">{groupName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {keys.map(key => (
                            <Input
                                key={key}
                                label={key.replace(/([A-Z])/g, ' $1').replace('link_', '').replace(/_/g, ' ')}
                                id={`term-${key}`}
                                value={terminology[key]}
                                onChange={(e) => onChange(key, e.target.value)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const SettingsPage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { users } = useAuthState();
    const {
        updateSettings, resetSettings, applySettingsUpdates, clearAllHistory,
        resetAllPlayerData, deleteAllCustomContent, factoryReset
    } = useSystemDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);
    
    const [isTestingApiKey, setIsTestingApiKey] = useState(false);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [apiKeySuccess, setApiKeySuccess] = useState(false);


    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(settings) !== JSON.stringify(localSettings);
    }, [settings, localSettings]);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);
    
    useEffect(() => {
        if (hasUnsavedChanges) {
            const onBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', onBeforeUnload);
            return () => window.removeEventListener('beforeunload', onBeforeUnload);
        }
    }, [hasUnsavedChanges]);

    const handleSave = () => {
        updateSettings(localSettings);
    };
    
    const handleRevert = () => {
        setLocalSettings(settings);
    };

    const handleConfirm = () => {
        if (!confirmAction) return;
        switch (confirmAction) {
            case 'resetSettings': resetSettings(); break;
            case 'applyUpdates': applySettingsUpdates(); break;
            case 'clearHistory': clearAllHistory(); break;
            case 'resetPlayers': resetAllPlayerData(false); break;
            case 'resetPlayersAndAdmins': resetAllPlayerData(true); break;
            case 'deleteContent': deleteAllCustomContent(); break;
            case 'factoryReset': factoryReset(); break;
        }
        setConfirmAction(null);
    };
    
    const handleTestApiKey = async () => {
        setIsTestingApiKey(true);
        setApiKeyError(null);
        setApiKeySuccess(false);

        try {
            const response = await fetch('/api/ai/test', { method: 'POST' });
            const result = await response.json();
            if (response.ok && result.success) {
                setApiKeySuccess(true);
                addNotification({ type: 'success', message: 'Gemini API key is valid and connected!' });
            } else {
                throw new Error(result.error || 'Test failed with an unknown error.');
            }
        } catch(e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            setApiKeyError(message);
            addNotification({ type: 'error', message });
        } finally {
            setIsTestingApiKey(false);
        }
    };

    const confirmationMessages: { [key: string]: string } = {
        resetSettings: "Are you sure you want to reset all settings to their defaults? This cannot be undone.",
        applyUpdates: "This will merge new default settings with your current configuration. Your customizations will be preserved where possible. Continue?",
        clearHistory: "Are you sure you want to permanently delete all historical data (quest completions, purchases, etc.)? This cannot be undone.",
        resetPlayers: "Are you sure you want to reset all player data (XP, currency, items, trophies)? Admin accounts will NOT be affected. This is permanent.",
        resetPlayersAndAdmins: "Are you sure you want to reset ALL user data, including admins? This is permanent.",
        deleteContent: "Are you sure you want to delete ALL custom content (quests, items, markets, etc.)? This action is permanent and will reset the app to its initial state.",
        factoryReset: "This will delete EVERYTHING, including user accounts, and reset the app to the first-run wizard. Are you absolutely sure? This is irreversible."
    };

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2 bg-stone-800/80 backdrop-blur-sm border-b border-stone-700/60">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-medieval text-stone-100">Application Settings</h1>
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && <p className="text-sm text-amber-400">You have unsaved changes.</p>}
                        <Button onClick={handleRevert} variant="secondary" disabled={!hasUnsavedChanges}>Revert</Button>
                        <Button onClick={handleSave} disabled={!hasUnsavedChanges}>Save Changes</Button>
                    </div>
                </div>
            </div>

            <Card className="p-0">
                <CollapsibleSection title="Terminology">
                    <TerminologySettings
                        terminology={localSettings.terminology}
                        onChange={(key, value) => setLocalSettings(p => ({ ...p, terminology: { ...p.terminology, [key]: value } }))}
                    />
                </CollapsibleSection>

                <CollapsibleSection title="AI & Google APIs">
                    <div className="space-y-4">
                        <ToggleSwitch
                            enabled={localSettings.enableAiFeatures}
                            setEnabled={val => setLocalSettings(p => ({ ...p, enableAiFeatures: val }))}
                            label="Enable AI Features (Suggestion Engine, AI Tutors)"
                        />
                        <p className="text-xs text-stone-400 -mt-2">
                            Requires a valid <code>API_KEY</code> environment variable to be set for your server.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleTestApiKey} disabled={isTestingApiKey} variant="secondary">
                                {isTestingApiKey ? 'Testing...' : 'Test Gemini API Key'}
                            </Button>
                            {apiKeySuccess && !isTestingApiKey && <span className="text-green-400 text-sm">Key is valid!</span>}
                            {apiKeyError && !isTestingApiKey && <span className="text-red-400 text-sm">{apiKeyError}</span>}
                        </div>
                    </div>
                </CollapsibleSection>
                
                 <CollapsibleSection title="Security">
                    <div className="space-y-4">
                        <ToggleSwitch
                            enabled={localSettings.security.requirePinForUsers}
                            setEnabled={val => setLocalSettings(p => ({ ...p, security: { ...p.security, requirePinForUsers: val } }))}
                            label="Require PIN for user login"
                        />
                         <ToggleSwitch
                            enabled={localSettings.security.requirePasswordForAdmin}
                            setEnabled={val => setLocalSettings(p => ({ ...p, security: { ...p.security, requirePasswordForAdmin: val } }))}
                            label="Require Password for Admin/Gatekeeper login"
                        />
                         <ToggleSwitch
                            enabled={localSettings.security.allowProfileEditing}
                            setEnabled={val => setLocalSettings(p => ({ ...p, security: { ...p.security, allowProfileEditing: val } }))}
                            label="Allow users to edit their own profiles"
                        />
                        <ToggleSwitch
                            enabled={localSettings.security.allowAdminSelfApproval}
                            setEnabled={val => setLocalSettings(p => ({ ...p, security: { ...p.security, allowAdminSelfApproval: val } }))}
                            label="Allow Admins to approve their own quests (if they are the only admin)"
                        />
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Shared / Kiosk Mode">
                    <div className="space-y-4">
                        <ToggleSwitch
                            enabled={localSettings.sharedMode.enabled}
                            setEnabled={val => setLocalSettings(p => ({ ...p, sharedMode: { ...p.sharedMode, enabled: val } }))}
                            label="Enable Shared/Kiosk Mode Features"
                        />
                        <div className="pl-6 space-y-4">
                            <UserMultiSelect 
                                allUsers={users}
                                selectedUserIds={localSettings.sharedMode.userIds}
                                onSelectionChange={ids => setLocalSettings(p => ({ ...p, sharedMode: { ...p.sharedMode, userIds: ids } }))}
                                label="Users to show on Kiosk login screen"
                            />
                             <ToggleSwitch
                                enabled={localSettings.sharedMode.autoExit}
                                setEnabled={val => setLocalSettings(p => ({ ...p, sharedMode: { ...p.sharedMode, autoExit: val } }))}
                                label="Auto-logout on inactivity (Kiosk Mode only)"
                            />
                            {localSettings.sharedMode.autoExit && <NumberInput label="Logout after (minutes)" value={localSettings.sharedMode.autoExitMinutes} onChange={val => setLocalSettings(p => ({...p, sharedMode: {...p.sharedMode, autoExitMinutes: val}}))} min={1} />}
                        </div>
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Developer & PWA">
                     <div className="space-y-4">
                        <ToggleSwitch
                            enabled={localSettings.developerMode.enabled}
                            setEnabled={val => setLocalSettings(p => ({ ...p, developerMode: { ...p.developerMode, enabled: val } }))}
                            label="Enable Developer Mode (shows Bug Reporter for Admins)"
                        />
                        <ServiceWorkerLogger />
                     </div>
                </CollapsibleSection>

                <CollapsibleSection title="Danger Zone">
                    <div className="space-y-4">
                        <Button variant="destructive" onClick={() => setConfirmAction('resetSettings')}>Reset All Settings</Button>
                        <Button variant="destructive" onClick={() => setConfirmAction('applyUpdates')}>Merge Feature Updates</Button>
                        <Button variant="destructive" onClick={() => setConfirmAction('clearHistory')}>Clear All History</Button>
                        <Button variant="destructive" onClick={() => setConfirmAction('resetPlayers')}>Reset Player Data</Button>
                        <Button variant="destructive" onClick={() => setConfirmAction('deleteContent')}>Delete All Custom Content</Button>
                        <Button variant="destructive" className="!bg-red-700" onClick={() => setConfirmAction('factoryReset')}>Factory Reset Application</Button>
                    </div>
                </CollapsibleSection>
            </Card>

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title="Confirm Action"
                message={confirmAction ? confirmationMessages[confirmAction] : ''}
            />
        </div>
    );
};
