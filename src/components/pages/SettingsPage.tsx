import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { AppSettings, Terminology, BackupSchedule } from '../../types/app';
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
};

const REAL_WORLD_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];


export const SettingsPage: React.FC = () => {
    const { settings, themes, isUpdateAvailable } = useSystemState();
    const { users } = useAuthState();
    const { updateSettings, resetSettings, applySettingsUpdates, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, factoryReset, installUpdate } = useSystemDispatch();
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

    const handleSaveSchedule = (scheduleData: Omit<BackupSchedule, 'id'>) => {
        const updatedSchedules = [...formState.automatedBackups.schedules];
        if (editingSchedule) {
            const index = updatedSchedules.findIndex(s => s.id === editingSchedule.id);
            if (index !== -1) {
                // IMPORTANT FIX: Merge with the existing schedule object from settings
                // to preserve the `lastBackupTimestamp` which is not present in `scheduleData`.
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
                             <Input label="Default Theme" as="select" value={formState.theme} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSimpleChange('theme', e.target.value)}>
                                 {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Input>
                        </div>
                         <div className="pt-4 border-t border-stone-700/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleSwitch enabled={formState.enableAiFeatures} setEnabled={(val: boolean) => handleSimpleChange('enableAiFeatures', val)} label="Enable AI Features" />
                            <ToggleSwitch enabled={formState.developerMode.enabled} setEnabled={(val: boolean) => handleSettingChange('developerMode', 'enabled', val)} label="Enable Developer Mode" />
                            <ToggleSwitch enabled={formState.loginNotifications.enabled} setEnabled={(val: boolean) => handleSettingChange('loginNotifications', 'enabled', val)} label="Show Login Notifications" />
                            <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val: boolean) => handleSettingChange('chat', 'enabled', val)} label="Enable Chat" />
                        </div>
                        {formState.chat.enabled && (
                             <div className="relative w-max">
                                <label className="block text-sm font-medium text-stone-300 mb-1">Chat Icon</label>
                                <button type="button" onClick={() => setIsEmojiPickerOpen(p => ({...p, chat: !p.chat}))} className="w-20 h-14 text-4xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                    {formState.chat.chatEmoji}
                                </button>
                                {isEmojiPickerOpen.chat && <EmojiPicker onSelect={(emoji) => { handleSettingChange('chat', 'chatEmoji', emoji); setIsEmojiPickerOpen(p => ({...p, chat: false})); }} onClose={() => setIsEmojiPickerOpen(p => ({...p, chat: false}))} />}
                             </div>
                        )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Security">
                    <div className="p-6 space-y-4">
                         <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val: boolean) => handleSettingChange('security', 'requirePinForUsers', val)} label="Require PIN for user switching" />
                         <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val: boolean) => handleSettingChange('security', 'requirePasswordForAdmin', val)} label="Require Password for Donegeon Masters & Gatekeepers" />
                         <ToggleSwitch enabled={formState.security.allowProfileEditing} setEnabled={(val: boolean) => handleSettingChange('security', 'allowProfileEditing', val)} label="Allow users to edit their own profiles" />
                         <div className="pt-4 border-t border-stone-700/60">
                            <ToggleSwitch enabled={formState.security.allowAdminSelfApproval} setEnabled={(val: boolean) => handleSettingChange('security', 'allowAdminSelfApproval', val)} label="Allow Admins to approve their own requests" />
                            <p className="text-xs text-stone-400 mt-1 ml-12">Applies only when more than one admin exists. If there is only one admin, they can always self-approve.</p>
                         </div>
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Shared / Kiosk Mode">
                    <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'enabled', val)} label="Enable Shared Mode" />
                        {formState.sharedMode.enabled && (
                            <div className="p-4 bg-stone-900/40 rounded-lg space-y-4">
                                <UserMultiSelect allUsers={users} selectedUserIds={formState.sharedMode.userIds} onSelectionChange={(val) => handleSettingChange('sharedMode', 'userIds', val)} label="Users in Shared View" />
                                <ToggleSwitch enabled={formState.sharedMode.allowCompletion} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'allowCompletion', val)} label="Allow quest completion from shared view" />
                                {formState.sharedMode.allowCompletion && (
                                    <div className="pl-6 mt-2">
                                        <ToggleSwitch 
                                            enabled={formState.sharedMode.requirePinForCompletion} 
                                            setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'requirePinForCompletion', val)} 
                                            label="Require PIN for quest completion" 
                                        />
                                    </div>
                                )}
                                <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val: boolean) => handleSettingChange('sharedMode', 'autoExit', val)} label="Auto-exit user session after inactivity" />
                                {formState.sharedMode.autoExit && (
                                    <Input label="Auto-exit after (minutes)" type="number" min="1" value={formState.sharedMode.autoExitMinutes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange('sharedMode', 'autoExitMinutes', parseInt(e.target.value) || 2)} />
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                 <CollapsibleSection title="Game Rules">
                    <div className="p-6 space-y-6">
                        {/* --- SETBACKS --- */}
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <label className="font-medium text-stone-200">Enable Setbacks</label>
                                <p className="text-sm text-stone-400 mt-1 max-w-md">Globally enable or disable all negative points (Setbacks) for late or incomplete quests.</p>
                            </div>
                            <div className="flex-shrink-0 pt-1">
                                <ToggleSwitch
                                    enabled={formState.setbacks.enabled}
                                    setEnabled={(val: boolean) => handleSettingChange('setbacks', 'enabled', val)}
                                    label="Enable Setbacks"
                                />
                            </div>
                        </div>
                        
                        <div className={`pl-6 border-l-2 border-stone-700/60 transition-opacity duration-300 ${!formState.setbacks.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                    <label className={`font-medium ${!formState.setbacks.enabled ? 'text-stone-400' : 'text-stone-200'}`}>Forgive Late Setbacks</label>
                                    <p className="text-sm text-stone-400 mt-1 max-w-md">If ON, late setbacks are only applied if a quest is still incomplete at the end of the day. If OFF, they are applied the moment a quest becomes late.</p>
                                </div>
                                <div className="flex-shrink-0 pt-1">
                                    <ToggleSwitch
                                        enabled={formState.setbacks.forgiveLate}
                                        setEnabled={(val: boolean) => handleSettingChange('setbacks', 'forgiveLate', val)}
                                        label="Forgive Late Setbacks"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* --- QUEST DEFAULTS --- */}
                        <div className="pt-6 border-t border-stone-700/60">
                            <h4 className="font-semibold text-stone-200 mb-4">Quest Defaults</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-stone-200">Active by default</span>
                                    <ToggleSwitch enabled={formState.questDefaults.isActive} setEnabled={(val: boolean) => handleSettingChange('questDefaults', 'isActive', val)} label="Active by default" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-stone-200">Optional by default</span>
                                    <ToggleSwitch enabled={formState.questDefaults.isOptional} setEnabled={(val: boolean) => handleSettingChange('questDefaults', 'isOptional', val)} label="Optional by default" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-stone-200">Requires Approval by default</span>
                                    <ToggleSwitch enabled={formState.questDefaults.requiresApproval} setEnabled={(val: boolean) => handleSettingChange('questDefaults', 'requiresApproval', val)} label="Requires Approval by default" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                 <CollapsibleSection title="Economy & Valuation">
                    <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.rewardValuation.enabled} setEnabled={(val: boolean) => handleRewardValuationChange('enabled', val)} label="Enable Reward Valuation & Exchange" />
                        {formState.rewardValuation.enabled && (
                             <div className="p-4 bg-stone-900/40 rounded-lg space-y-4">
                                <p className="text-sm text-stone-300">Assign real-world monetary value to your virtual rewards and set transaction fees for exchanges.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-700/60">
                                    <Input as="select" label="Real-World Currency" value={formState.rewardValuation.realWorldCurrency} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRewardValuationChange('realWorldCurrency', e.target.value)}>
                                        {REAL_WORLD_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </Input>
                                    <Input label="Currency Fee (%)" type="number" min="0" value={formState.rewardValuation.currencyExchangeFeePercent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRewardValuationChange('currencyExchangeFeePercent', parseInt(e.target.value) || 0)} />
                                    <Input label="XP Fee (%)" type="number" min="0" value={formState.rewardValuation.xpExchangeFeePercent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRewardValuationChange('xpExchangeFeePercent', parseInt(e.target.value) || 0)} />
                                </div>
                             </div>
                        )}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Integrations">
                     <div className="p-6 space-y-4">
                         <ToggleSwitch enabled={formState.googleCalendar.enabled} setEnabled={(val: boolean) => handleSettingChange('googleCalendar', 'enabled', val)} label="Enable Google Calendar Integration" />
                          {formState.googleCalendar.enabled && (
                            <div className="p-4 bg-stone-900/40 rounded-lg space-y-4">
                                <Input label="Google Calendar API Key" value={formState.googleCalendar.apiKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange('googleCalendar', 'apiKey', e.target.value)} />
                                <Input label="Google Calendar ID" value={formState.googleCalendar.calendarId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange('googleCalendar', 'calendarId', e.target.value)} />
                                <div className="mt-4 pt-4 border-t border-stone-700/60 prose prose-invert prose-sm text-stone-400 max-w-none">
                                    <h4 className="text-stone-300">How to set up Google Calendar integration:</h4>
                                    <ol>
                                        <li>
                                            Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>, create a new project, search for and enable the "Google Calendar API", then go to "Credentials" and create a new API Key.
                                        </li>
                                        <li>
                                            Go to your <a href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer">Google Calendar</a> and select the calendar you want to share. Open its settings.
                                        </li>
                                        <li>
                                            Under "Access permissions for events", you <strong>must</strong> check the box for "Make available to public".
                                        </li>
                                        <li>
                                            Under the "Integrate calendar" section, find and copy the <strong>Calendar ID</strong> (it often looks like an email address).
                                        </li>
                                        <li>
                                            Paste the API Key and Calendar ID into the fields above and save your settings.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                          )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Terminology">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(terminologyLabels).map(([key, label]) => (
                            <Input key={key} label={label} name={key} value={formState.terminology[key as keyof Terminology]} onChange={handleTerminologyChange} />
                        ))}
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Maintenance">
                     <div className="p-6 space-y-4">
                        {isUpdateAvailable && (
                            <Card className="!border-emerald-500 !bg-emerald-900/30 mb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-emerald-300">Update Available!</h4>
                                        <p className="text-sm text-stone-200 mt-1">A new version of the application is ready to be installed.</p>
                                    </div>
                                    <Button onClick={installUpdate} className="flex-shrink-0">
                                        Install Update Now
                                    </Button>
                                </div>
                            </Card>
                        )}
                        <div className="p-4 border border-stone-600 bg-stone-900/30 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-emerald-300">Apply Feature Updates</h4>
                                <p className="text-sm text-stone-300 mt-1 max-w-xl">Safely adds new features and settings from the latest app version without overwriting your customizations. Use this if new sidebar links or options are not appearing after an update.</p>
                            </div>
                            <Button onClick={() => setConfirmation('applyUpdates')} className="flex-shrink-0">
                                Apply Updates
                            </Button>
                        </div>
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Danger Zone">
                     <div className="p-6 space-y-4">
                         <DangerZoneAction
                            title="Reset All Settings"
                            description={<p>Reverts all application settings to their defaults. User-created content (quests, items, users) will not be affected.</p>}
                            buttonText="Reset Settings"
                            onAction={() => setConfirmation('resetSettings')}
                         />
                         <DangerZoneAction
                            title="Clear All History"
                            description={<p>Permanently deletes all historical records like quest completions and purchases. User accounts and created content are not affected.</p>}
                            buttonText="Clear History"
                            onAction={() => setConfirmation('clearHistory')}
                         />
                         <DangerZoneAction
                            title="Reset All Player Data"
                            description={
                                <div>
                                    <p>Resets progress for all non-admin users. Their currency, XP, and owned items will be cleared. User accounts will not be deleted.</p>
                                    <div className="mt-2">
                                        <label className="flex items-center gap-2 text-sm text-amber-300">
                                            <input
                                                type="checkbox"
                                                checked={includeAdminsInReset}
                                                onChange={(e) => setIncludeAdminsInReset(e.target.checked)}
                                                className="h-4 w-4 rounded text-amber-600 bg-stone-700 border-stone-600 focus:ring-amber-500"
                                            />
                                            Also reset Admin accounts.
                                        </label>
                                    </div>
                                </div>
                            }
                            buttonText="Reset Player Data"
                            onAction={() => setConfirmation('resetPlayers')}
                         />
                         <DangerZoneAction
                            title="Delete All Custom Content"
                            description={<p>Permanently deletes all content you created: quests, items, markets, rewards, ranks, and trophies. User accounts are not affected.</p>}
                            buttonText="Delete Custom Content"
                            onAction={() => setConfirmation('deleteContent')}
                         />
                          <DangerZoneAction
                            title="Factory Reset Application"
                            description={<p>The ultimate reset. Wipes ALL data (users, quests, settings) and returns the app to its initial setup state. This cannot be undone.</p>}
                            buttonText="Factory Reset"
                            onAction={() => setConfirmation('factoryReset')}
                         />
                    </div>
                </CollapsibleSection>
            </Card>
            <ConfirmDialog 
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirm}
                title="Are you absolutely sure?"
                message={confirmation === 'applyUpdates' ? 'This will apply new default settings without overwriting your changes. Proceed?' : "This action is permanent and cannot be undone."}
            />
        </div>
    );
};