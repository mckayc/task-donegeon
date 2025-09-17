

import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { AppSettings, Terminology, BackupSchedule, ThemeDefinition } from '../../types';
import Button from '../user-interface/Button';
import { ChevronDownIcon } from '../user-interface/Icons';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { INITIAL_SETTINGS } from '../../data/initialData';
import EmojiPicker from '../user-interface/EmojiPicker';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Card from '../user-interface/Card';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import { version } from '../../../package.json';
import ServiceWorkerLogger from '../settings/ServiceWorkerLogger';
import CollapsibleSection from '../user-interface/CollapsibleSection';


const DangerZoneAction: React.FC<{
    title: string;
    description: ReactNode;
    buttonText: string;
    onAction: () => void;
}> = ({ title, description, buttonText, onAction }) => (
    <div className="p-4 border border-red-700/60 bg-red-900/30 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h4 className="font-bold text-red-300">{title}</h4>
            <div className="text-sm text-stone-300 mt-1 max-w-xl">{description}</div>
        </div>
        <Button onClick={onAction} variant="destructive" className="flex-shrink-0">
            {buttonText}
        </Button>
    </div>
);

const terminologyLabels: { [key in keyof Terminology]: string } = {
  appName: 'App Name',
  // Singular
  task: 'Task (Singular)',
  recurringTask: 'Recurring Task (e.g., Duty)',
  singleTask: 'Single Task (e.g., Venture)',
  journey: 'Journey',
  store: 'Store (e.g., Market)',
  history: 'History (e.g., Chronicles)',
  group: 'Group (e.g., Guild)',
  level: 'Level (e.g., Rank)',
  award: 'Award (e.g., Trophy)',
  point: 'Point (e.g., Reward)',
  xp: 'Experience Points',
  currency: 'Currency',
  negativePoint: 'Negative Point (e.g., Setback)',
  // Plural
  tasks: 'Tasks (Plural)',
  recurringTasks: 'Recurring Tasks (Plural)',
  singleTasks: 'Single Tasks (Plural)',
  journeys: 'Journeys',
  shoppingCenter: 'Shopping Center (e.g., Marketplace)',
  stores: 'Stores (Plural)',
  groups: 'Groups (Plural)',
  levels: 'Levels (Plural)',
  awards: 'Awards (Plural)',
  points: 'Points (Plural)',
  negativePoints: 'Negative Points (Plural)',
  users: 'Users (Plural)',
  // Roles
  admin: 'Admin (e.g., Donegeon Master)',
  moderator: 'Moderator (e.g., Gatekeeper)',
  user: 'User (e.g., Explorer)',
  // Sidebar Links
  link_dashboard: 'Sidebar: Dashboard',
  link_quests: 'Sidebar: Quests',
  link_marketplace: 'Sidebar: Marketplace',
  link_calendar: 'Sidebar: Calendar',
  link_avatar: 'Sidebar: Avatar',
  link_collection: 'Sidebar: Collection',
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
  link_manage_rotations: 'Sidebar: Manage Rotations',
  link_manage_condition_sets: 'Sidebar: Manage Condition Sets',
  link_triumphs_trials: 'Sidebar: Triumphs & Trials',
  link_appearance: 'Sidebar: Appearance',
  link_approvals: 'Sidebar: Approvals',
  link_manage_users: 'Sidebar: Manage Users',
  link_manage_guilds: 'Sidebar: Manage Guilds',
  link_suggestion_engine: 'Sidebar: Suggestion Engine',
  link_object_exporter: 'Sidebar: Object Exporter',
  link_asset_manager: 'Sidebar: Asset Manager',
  link_backup_import: 'Sidebar: Backup & Import',
  link_asset_library: 'Sidebar: Asset Library',
  link_settings: 'Sidebar: Settings',
  link_about: 'About',
  link_help_guide: 'Help Guide',
  link_chat: 'Sidebar: Chat',
  link_bug_tracker: 'Sidebar: Bug Tracker',
  link_themes: 'Sidebar: Themes',
  link_test_cases: 'Sidebar: Test Cases',
  link_manage_minigames: 'Sidebar: Manage Minigames',
  // FIX: Add missing 'link_statistics' property to satisfy the Terminology type.
  link_statistics: 'Sidebar: Statistics',
};

const REAL_WORLD_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];


export const SettingsPage: React.FC = () => {
    const { settings, themes, isUpdateAvailable } = useSystemState();
    const { users } = useAuthState();
    const { updateSettings, resetSettings, applySettingsUpdates, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, factoryReset, installUpdate, checkForUpdate } = useSystemDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    // Create a local copy of settings for form manipulation
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<{ general: boolean, chat: boolean }>({ general: false, chat: false });
    const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
    const [includeAdminsInReset, setIncludeAdminsInReset] = useState(false);

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

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Settings saved successfully!' });
    };

    const handleConfirm = () => {
        if (!confirmation) return;
        switch(confirmation) {
            case 'resetSettings': resetSettings(); break;
            case 'applyUpdates': applySettingsUpdates(); break;
            case 'clearHistory': clearAllHistory(); break;
            case 'resetPlayers': resetAllPlayerData(includeAdminsInReset); break;
            case 'deleteContent': deleteAllCustomContent(); break;
            case 'factoryReset': factoryReset(); break;
        }
        setConfirmation(null);
    };

    const handleSaveSchedule = (scheduleData: Omit<BackupSchedule, 'id' | 'lastBackupTimestamp'>) => {
        const updatedSchedules = [...formState.automatedBackups.schedules];
        if (editingSchedule) {
            const index = updatedSchedules.findIndex(s => s.id === editingSchedule.id);
            if (index !== -1) {
                updatedSchedules[index] = { ...updatedSchedules[index], ...scheduleData };
            }
        } else {
            updatedSchedules.push({ ...scheduleData, id: `schedule-${Date.now()}` });
        }
        updateSettings({ ...formState, automatedBackups: { ...formState.automatedBackups, schedules: updatedSchedules } });
        setEditingSchedule(null);
    };

    const handleDeleteSchedule = () => {
        if (!deletingSchedule) return;
        const updatedSchedules = formState.automatedBackups.schedules.filter(s => s.id !== deletingSchedule.id);
        updateSettings({ ...formState, automatedBackups: { ...formState.automatedBackups, schedules: updatedSchedules } });
        setDeletingSchedule(null);
    };

    const [deletingSchedule, setDeletingSchedule] = useState<BackupSchedule | null>(null);

    const getPreviewStyle = (theme: ThemeDefinition) => ({
        fontFamily: theme.styles['--font-display'],
        backgroundColor: `hsl(${theme.styles['--color-bg-primary-hsl']})`,
        color: `hsl(${theme.styles['--color-text-primary-hsl']})`,
    });
    
    const getAccentStyle = (theme: ThemeDefinition) => ({
        backgroundColor: `hsl(${theme.styles['--color-primary-hue']} ${theme.styles['--color-primary-saturation']} ${theme.styles['--color-primary-lightness']})`
    });
    
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
                                <button type="button" onClick={() => setIsEmojiPickerOpen(p => ({...p, general: !p.general}))} className="w-20 h-14 text-4xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                    {formState.favicon}
                                </button>
                                {isEmojiPickerOpen.general && <EmojiPicker onSelect={(emoji: string) => { handleSimpleChange('favicon', emoji); setIsEmojiPickerOpen(p => ({...p, general: false})); }} onClose={() => setIsEmojiPickerOpen(p => ({...p, general: false}))} />}
                             </div>
                              <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Default Theme</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {themes.map(theme => {
                                        const isActive = formState.theme === theme.id;
                                        return (
                                            <button
                                                key={theme.id}
                                                type="button"
                                                title={theme.name}
                                                onClick={() => handleSimpleChange('theme', theme.id)}
                                                className={`w-20 h-14 rounded-lg transition-all duration-200 border-4 ${isActive ? 'border-white shadow-lg scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                                style={getPreviewStyle(theme)}
                                            >
                                                <div className="w-full h-full flex items-end justify-end p-1.5">
                                                    <div className="w-5 h-5 rounded-full" style={getAccentStyle(theme)}></div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                         <div className="pt-4 border-t border-stone-700/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleSwitch enabled={formState.enableAiFeatures} setEnabled={(val: boolean) => handleSimpleChange('enableAiFeatures', val)} label="Enable AI Features" />
                            <ToggleSwitch enabled={formState.developerMode.enabled} setEnabled={(val: boolean) => handleSettingChange('developerMode', 'enabled', val)} label="Enable Developer Mode" />
                            <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val: boolean) => handleSettingChange('chat', 'enabled', val)} label="Enable Chat" />
                         </div>
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Terminology">
                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(terminologyLabels).map(([key, label]) => (
                            <Input
                                key={key}
                                label={label}
                                name={key}
                                value={formState.terminology[key as keyof Terminology]}
                                onChange={handleTerminologyChange}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
                 <CollapsibleSection title="Security">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val: boolean) => handleSettingChange('security', 'requirePinForUsers', val)} label="Require PIN for all users" />
                        <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val: boolean) => handleSettingChange('security', 'requirePasswordForAdmin', val)} label="Require Password for Admins" />
                        <ToggleSwitch enabled={formState.security.allowProfileEditing} setEnabled={(val: boolean) => handleSettingChange('security', 'allowProfileEditing', val)} label="Allow users to edit profiles" />
                        <ToggleSwitch enabled={formState.security.allowAdminSelfApproval} setEnabled={(val: boolean) => handleSettingChange('security', 'allowAdminSelfApproval', val)} label="Allow Admins to self-approve quests" />
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Shared (Kiosk) Mode">
                     <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'enabled', val)} label="Enable Shared Mode" />
                        {formState.sharedMode.enabled && (
                            <div className="pl-6 border-l-2 border-stone-700/60 space-y-4">
                                <UserMultiSelect
                                    allUsers={users}
                                    selectedUserIds={formState.sharedMode.userIds}
                                    onSelectionChange={(ids) => handleSettingChange('sharedMode', 'userIds', ids)}
                                    label="Users Visible in Shared Mode"
                                />
                                <ToggleSwitch enabled={formState.sharedMode.requirePinForCompletion} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'requirePinForCompletion', val)} label="Require PIN to complete a quest" />
                                <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'autoExit', val)} label="Auto-exit after inactivity" />
                                {formState.sharedMode.autoExit && (
                                    <Input label="Auto-exit timer (minutes)" type="number" value={formState.sharedMode.autoExitMinutes} onChange={(e: ChangeEvent<HTMLInputElement>) => handleSettingChange('sharedMode', 'autoExitMinutes', Number(e.target.value))} />
                                )}
                                <div className="pt-4 border-t border-stone-700/60" />
                                <ToggleSwitch enabled={formState.sharedMode.showBattery || false} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'showBattery', val)} label="Show Battery Status" />
                                <ToggleSwitch enabled={formState.sharedMode.autoDim || false} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'autoDim', val)} label="Enable Auto-Dimming" />
                                {formState.sharedMode.autoDim && (
                                    <div className="pl-6 border-l-2 border-stone-700/60 space-y-4 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="Dimming Start Time" type="time" value={formState.sharedMode.autoDimStartTime || '21:00'} onChange={(e: ChangeEvent<HTMLInputElement>) => handleSettingChange('sharedMode', 'autoDimStartTime', e.target.value)} />
                                            <Input label="Dimming Stop Time" type="time" value={formState.sharedMode.autoDimStopTime || '06:00'} onChange={(e: ChangeEvent<HTMLInputElement>) => handleSettingChange('sharedMode', 'autoDimStopTime', e.target.value)} />
                                        </div>
                                        <Input label="Dim after inactivity (seconds)" type="number" value={formState.sharedMode.autoDimInactivitySeconds || 30} onChange={(e: ChangeEvent<HTMLInputElement>) => handleSettingChange('sharedMode', 'autoDimInactivitySeconds', Number(e.target.value))} />
                                        <div>
                                            <label className="block text-sm font-medium text-stone-300 mb-1">Dimness Level ({Math.round((formState.sharedMode.autoDimLevel || 0.5) * 100)}%)</label>
                                            <input type="range" min="0.2" max="0.8" step="0.05" value={formState.sharedMode.autoDimLevel || 0.5} onChange={(e: ChangeEvent<HTMLInputElement>) => handleSettingChange('sharedMode', 'autoDimLevel', Number(e.target.value))} className="w-full" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Reward Valuation">
                     <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.rewardValuation.enabled} setEnabled={(val) => handleRewardValuationChange('enabled', val)} label="Enable Real-World Value Calculation" />
                         {formState.rewardValuation.enabled && (
                            <div className="pl-6 border-l-2 border-stone-700/60 space-y-4">
                                <Input as="select" label="Real-World Currency" value={formState.rewardValuation.realWorldCurrency} onChange={(e) => handleRewardValuationChange('realWorldCurrency', e.target.value)}>
                                    {REAL_WORLD_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </Input>
                                <Input label="Currency Exchange Fee (%)" type="number" min="0" value={formState.rewardValuation.currencyExchangeFeePercent} onChange={(e) => handleRewardValuationChange('currencyExchangeFeePercent', parseInt(e.target.value) || 0)} />
                                <Input label="XP Exchange Fee (%)" type="number" min="0" value={formState.rewardValuation.xpExchangeFeePercent} onChange={(e) => handleRewardValuationChange('xpExchangeFeePercent', parseInt(e.target.value) || 0)} />
                            </div>
                         )}
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Application Updates">
                    <div className="p-6 space-y-4">
                         <div className="p-4 bg-stone-900/50 rounded-lg">
                            <p className="font-semibold text-stone-200">Current Version: <span className="font-mono font-normal text-emerald-300">{version}</span></p>
                            {isUpdateAvailable ? (
                                <div className="mt-2 text-amber-300 bg-amber-900/40 p-3 rounded-md">
                                    <p className="font-bold">An update is ready to install!</p>
                                    <Button onClick={installUpdate} size="sm" className="mt-2">Install Now & Reload</Button>
                                </div>
                            ) : (
                                <p className="text-sm text-stone-400">Your application is up to date.</p>
                            )}
                        </div>
                        <ServiceWorkerLogger />
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Danger Zone">
                    <div className="p-6 space-y-4">
                        <DangerZoneAction title="Apply Setting Updates" description={<><p>After updating the application, some new features might require new default settings.</p><p>This action safely merges new default settings from the latest version into your current configuration, preserving all your existing customizations.</p></>} buttonText="Apply Updates" onAction={() => setConfirmation('applyUpdates')} />
                        <DangerZoneAction title="Reset All Settings" description="This will revert all settings on this page, including Terminology and Security, to their original defaults. This does NOT affect user data or created content." buttonText="Reset All Settings" onAction={() => setConfirmation('resetSettings')} />
                        <DangerZoneAction title="Clear All History" description="Permanently delete all historical records, including quest completions, purchases, adjustments, and notifications. This is useful for cleaning up test data." buttonText="Clear History" onAction={() => setConfirmation('clearHistory')} />
                        <DangerZoneAction title="Reset Player Data" description={<><p>Reset all players' currencies, XP, and owned items to zero. This does NOT delete the users themselves.</p><div className="mt-2"><ToggleSwitch enabled={includeAdminsInReset} setEnabled={setIncludeAdminsInReset} label="Include Donegeon Masters in Reset" /></div></>} buttonText="Reset Player Data" onAction={() => setConfirmation('resetPlayers')} />
                        <DangerZoneAction title="Delete All Custom Content" description="Permanently delete all user-created content, including quests, items, markets, ranks, trophies, guilds, and themes. Core/default content will be restored." buttonText="Delete Content" onAction={() => setConfirmation('deleteContent')} />
                        <DangerZoneAction title="Factory Reset" description={<><p>This is the nuclear option. It will <strong className="text-red-300">permanently delete all users, content, and settings</strong>, reverting the application to its first-run state. Use with extreme caution.</p><p className="text-amber-300 text-sm mt-1">It is highly recommended to create a backup before performing a factory reset.</p></>} buttonText="Factory Reset Application" onAction={() => setConfirmation('factoryReset')} />
                    </div>
                </CollapsibleSection>
            </Card>

            <ConfirmDialog 
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirm}
                title="Confirm Destructive Action"
                message="Are you sure you want to proceed? This action cannot be undone."
            />
        </div>
    );
};