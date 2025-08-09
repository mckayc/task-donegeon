
import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { Role, AppSettings, Terminology, RewardCategory, RewardTypeDefinition, User } from '../../types';
import Button from '../ui/Button';
import { ChevronDownIcon } from '../ui/Icons';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import ConfirmDialog from '../ui/ConfirmDialog';
import { INITIAL_SETTINGS } from '../../data/initialData';
import EmojiPicker from '../ui/EmojiPicker';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { bugLogger } from '../../utils/bugLogger';
import Card from '../ui/Card';


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; onToggle?: (isOpen: boolean) => void; }> = ({ title, children, defaultOpen = false, onToggle }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleToggle = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        onToggle?.(newIsOpen);
    };

    return (
        <div className="border-t border-stone-700/60 first:border-t-0">
            <button
                className="w-full flex justify-between items-center text-left py-4"
                onClick={handleToggle}
                aria-expanded={isOpen}
            >
                <h3 className="text-xl font-medieval text-accent">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pb-6">{children}</div>}
        </div>
    );
}

const terminologyLabels: { [key in keyof Terminology]: string } = {
  appName: 'App Name',
  task: 'Task (Singular)',
  tasks: 'Tasks (Plural)',
  recurringTask: 'Recurring Task (e.g., Duty)',
  recurringTasks: 'Recurring Tasks (Plural)',
  singleTask: 'Single Task (e.g., Venture)',
  singleTasks: 'Single Tasks (Plural)',
  shoppingCenter: 'Shopping Center (e.g., Marketplace)',
  store: 'Store (e.g., Market)',
  stores: 'Stores (Plural)',
  history: 'History (e.g., Chronicles)',
  group: 'Group (e.g., Guild)',
  groups: 'Groups (Plural)',
  level: 'Level (e.g., Rank)',
  levels: 'Levels (Plural)',
  award: 'Award (e.g., Trophy)',
  awards: 'Awards (Plural)',
  point: 'Point (e.g., Reward)',
  points: 'Points (Plural)',
  xp: 'Experience Points',
  currency: 'Currency',
  negativePoint: 'Negative Point (e.g., Setback)',
  negativePoints: 'Negative Points (Plural)',
  admin: 'Admin (e.g., Donegeon Master)',
  moderator: 'Moderator (e.g., Gatekeeper)',
  user: 'User (e.g., Explorer)',
  link_dashboard: 'Sidebar: Dashboard',
  link_quests: 'Sidebar: Quests',
  link_marketplace: 'Sidebar: Marketplace',
  link_calendar: 'Sidebar: Calendar',
  link_avatar: 'Sidebar: Avatar',
  link_collection: 'Sidebar: Collection',
  link_themes: 'Sidebar: Themes',
  link_guild: 'Sidebar: Guild',
  link_progress: 'Sidebar: Progress',
  link_trophies: 'Sidebar: Trophies',
  link_ranks: 'Sidebar: Ranks',
  link_chronicles: 'Sidebar: Chronicles',
  link_manage_quests: 'Sidebar: Manage Quests',
  link_manage_quest_groups: 'Sidebar: Manage Quest Groups',
  link_manage_items: 'Sidebar: Manage Goods',
  link_manage_markets: 'Sidebar: Manage Markets',
  link_manage_rewards: 'Sidebar: Manage Rewards',
  link_manage_ranks: 'Sidebar: Manage Ranks',
  link_manage_trophies: 'Sidebar: Manage Trophies',
  link_manage_events: 'Sidebar: Manage Events',
  link_theme_editor: 'Sidebar: Theme Editor',
  link_approvals: 'Sidebar: Approvals',
  link_manage_users: 'Sidebar: Manage Users',
  link_manage_guilds: 'Sidebar: Manage Guilds',
  link_suggestion_engine: 'Sidebar: Suggestion Engine',
  link_appearance: 'Sidebar: Appearance',
  link_object_exporter: 'Sidebar: Object Exporter',
  link_asset_manager: 'Sidebar: Asset Manager',
  link_backup_import: 'Sidebar: Backup & Import',
  link_asset_library: 'Sidebar: Asset Library',
  link_settings: 'Sidebar: Settings',
  link_about: 'About',
  link_help_guide: 'Sidebar: Help Guide',
  link_chat: 'Sidebar: Chat',
  link_bug_tracker: 'Sidebar: Bug Tracker',
};


export const SettingsPage: React.FC = () => {
    const { settings, guilds } = useAppState();
    const { users } = useAuthState();
    const { rewardTypes } = useEconomyState();
    const { updateSettings, resetSettings, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, factoryReset } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    // Create a local copy of settings for form manipulation
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    useEffect(() => {
        // This effect ensures that if the global settings are updated by a sync,
        // the local form state reflects that change. This prevents stale data.
        setFormState(JSON.parse(JSON.stringify(settings)));
    }, [settings]);

    const handleSettingChange = (section: keyof AppSettings, key: any, value: any) => {
        setFormState(prev => {
            const newState = { ...prev };
            (newState[section] as any)[key] = value;
            return newState;
        });
    };

    const handleSimpleChange = (key: keyof AppSettings, value: any) => {
         setFormState(prev => ({ ...prev, [key]: value }));
    };

    const handleTerminologyChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, terminology: { ...p.terminology, [name as keyof Terminology]: value } }));
    };
    
    const handleRewardValuationChange = (key: keyof AppSettings['rewardValuation'], value: any) => {
        setFormState(p => ({ ...p, rewardValuation: { ...p.rewardValuation, [key]: value } }));
    };

    const handleRateChange = (rewardTypeId: string, rate: string) => {
        const numericRate = parseFloat(rate) || 0;
        setFormState(p => ({
            ...p,
            rewardValuation: {
                ...p.rewardValuation,
                exchangeRates: {
                    ...p.rewardValuation.exchangeRates,
                    [rewardTypeId]: numericRate,
                }
            }
        }));
    };

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Settings saved successfully!' });
    };

    const handleConfirm = () => {
        if (!confirmation) return;
        switch(confirmation) {
            case 'resetSettings': resetSettings(); break;
            case 'clearHistory': clearAllHistory(); break;
            case 'resetPlayers': resetAllPlayerData(); break;
            case 'deleteContent': deleteAllCustomContent(); break;
            case 'factoryReset': factoryReset(); break;
        }
        setConfirmation(null);
    };
    
    const currencyRewardTypes = rewardTypes.filter(rt => rt.category === RewardCategory.Currency);
    const nonAnchorRewards = rewardTypes.filter(rt => rt.id !== formState.rewardValuation.anchorRewardId);

    return (
        <div className="space-y-8 relative">
             <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', borderBottom: '1px solid hsl(var(--color-border))' }}>
                <div className="flex justify-end items-center">
                    <Button onClick={handleSave}>Save All Settings</Button>
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                <CollapsibleSection title="General">
                    <div className="p-6 space-y-4">
                        <Input label="Application Name" value={formState.terminology.appName} onChange={handleTerminologyChange} name="appName" />
                        <div className="flex items-end gap-4">
                             <div className="relative">
                                <label className="block text-sm font-medium text-stone-300 mb-1">Browser Favicon</label>
                                <button type="button" onClick={() => setIsEmojiPickerOpen(prev => !prev)} className="w-20 h-14 text-4xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                    {formState.favicon}
                                </button>
                                {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji) => { handleSimpleChange('favicon', emoji); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                             </div>
                             <Input label="Default Theme" as="select" value={formState.theme} onChange={e => handleSimpleChange('theme', e.target.value)}>
                                 {/* Assuming themes are in AppState */}
                                 {useAppState().themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Input>
                        </div>
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Security">
                    <div className="p-6 space-y-4">
                         <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={val => handleSettingChange('security', 'requirePinForUsers', val)} label="Require PIN for user switching" />
                         <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={val => handleSettingChange('security', 'requirePasswordForAdmin', val)} label="Require Password for Donegeon Masters & Gatekeepers" />
                         <ToggleSwitch enabled={formState.security.allowProfileEditing} setEnabled={val => handleSettingChange('security', 'allowProfileEditing', val)} label="Allow users to edit their own profiles" />
                    </div>
                </CollapsibleSection>
                 <CollapsibleSection title="Game Rules">
                    <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={val => handleSimpleChange('forgivingSetbacks', val)} label="Forgiving Setbacks" />
                        <p className="text-xs text-stone-400 -mt-3 ml-12">If ON, setbacks are only applied if a quest is incomplete at the end of the day. If OFF, they are applied the moment a quest becomes late.</p>
                        
                        <div className="pt-4 border-t border-stone-700/60">
                            <h4 className="font-semibold text-stone-200 mb-2">Quest Defaults</h4>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <ToggleSwitch enabled={formState.questDefaults.isActive} setEnabled={val => handleSettingChange('questDefaults', 'isActive', val)} label="Active by default" />
                                <ToggleSwitch enabled={formState.questDefaults.isOptional} setEnabled={val => handleSettingChange('questDefaults', 'isOptional', val)} label="Optional by default" />
                                <ToggleSwitch enabled={formState.questDefaults.requiresApproval} setEnabled={val => handleSettingChange('questDefaults', 'requiresApproval', val)} label="Requires Approval by default" />
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Advanced">
                    <div className="p-6 space-y-4">
                        <h4 className="font-semibold text-stone-200 mb-2">Automated Backups</h4>
                        <ToggleSwitch enabled={formState.automatedBackups.enabled} setEnabled={val => handleSettingChange('automatedBackups', 'enabled', val)} label="Enable Automated Server Backups" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Backup Frequency (Hours)" type="number" min="1" value={formState.automatedBackups.frequencyHours} onChange={e => handleSettingChange('automatedBackups', 'frequencyHours', parseInt(e.target.value) || 24)} />
                            <Input label="Max Backups to Keep" type="number" min="1" value={formState.automatedBackups.maxBackups} onChange={e => handleSettingChange('automatedBackups', 'maxBackups', parseInt(e.target.value) || 7)} />
                        </div>
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Terminology">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(terminologyLabels).map(([key, label]) => (
                            <Input key={key} label={label} name={key} value={formState.terminology[key as keyof Terminology]} onChange={handleTerminologyChange} />
                        ))}
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Danger Zone">
                     <div className="p-6 space-y-4">
                         <div className="p-4 border border-red-700/60 bg-red-900/30 rounded-lg space-y-4">
                             <Button onClick={() => setConfirmation('resetSettings')} variant="destructive">Reset All Settings</Button>
                             <Button onClick={() => setConfirmation('clearHistory')} variant="destructive">Clear All History</Button>
                             <Button onClick={() => setConfirmation('resetPlayers')} variant="destructive">Reset All Player Data</Button>
                             <Button onClick={() => setConfirmation('deleteContent')} variant="destructive">Delete All Custom Content</Button>
                             <Button onClick={() => setConfirmation('factoryReset')} variant="destructive">Factory Reset Application</Button>
                         </div>
                    </div>
                </CollapsibleSection>
            </Card>
            <ConfirmDialog 
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirm}
                title="Are you absolutely sure?"
                message="This action is permanent and cannot be undone."
            />
        </div>
    );
};
