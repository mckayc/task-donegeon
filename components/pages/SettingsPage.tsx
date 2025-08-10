
import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { AppSettings, Terminology, RewardCategory, RewardTypeDefinition } from '../../types';
import Button from '../user-interface/Button';
import { ChevronDownIcon } from '../user-interface/Icons';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { INITIAL_SETTINGS } from '../../data/initialData';
import EmojiPicker from '../user-interface/EmojiPicker';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useEconomyState } from '../../context/EconomyContext';
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
    const { settings } = useAppState();
    const { users } = useAuthState();
    const { rewardTypes } = useEconomyState();
    const { updateSettings, resetSettings, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, factoryReset } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    // Create a local copy of settings for form manipulation
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<{ general: boolean, chat: boolean }>({ general: false, chat: false });

    useEffect(() => {
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
                                <button type="button" onClick={() => setIsEmojiPickerOpen(p => ({...p, general: !p.general}))} className="w-20 h-14 text-4xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                    {formState.favicon}
                                </button>
                                {isEmojiPickerOpen.general && <EmojiPicker onSelect={(emoji: string) => { handleSimpleChange('favicon', emoji); setIsEmojiPickerOpen(p => ({...p, general: false})); }} onClose={() => setIsEmojiPickerOpen(p => ({...p, general: false}))} />}
                             </div>
                             <Input label="Default Theme" as="select" value={formState.theme} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSimpleChange('theme', e.target.value)}>
                                 {useAppState().themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Input>
                        </div>
                         <div className="pt-4 border-t border-stone-700/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleSwitch enabled={formState.enableAiFeatures} setEnabled={(val) => handleSimpleChange('enableAiFeatures', val)} label="Enable AI Features" />
                            <ToggleSwitch enabled={formState.developerMode.enabled} setEnabled={(val) => handleSettingChange('developerMode', 'enabled', val)} label="Enable Developer Mode" />
                            <ToggleSwitch enabled={formState.loginNotifications.enabled} setEnabled={(val) => handleSettingChange('loginNotifications', 'enabled', val)} label="Show Login Notifications" />
                            <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val) => handleSettingChange('chat', 'enabled', val)} label="Enable Chat" />
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
                         <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val) => handleSettingChange('security', 'requirePinForUsers', val)} label="Require PIN for user switching" />
                         <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val) => handleSettingChange('security', 'requirePasswordForAdmin', val)} label="Require Password for Donegeon Masters & Gatekeepers" />
                         <ToggleSwitch enabled={formState.security.allowProfileEditing} setEnabled={(val) => handleSettingChange('security', 'allowProfileEditing', val)} label="Allow users to edit their own profiles" />
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Shared / Kiosk Mode">
                    <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val) => handleSettingChange('sharedMode', 'enabled', val)} label="Enable Shared Mode" />
                        {formState.sharedMode.enabled && (
                            <div className="p-4 bg-stone-900/40 rounded-lg space-y-4">
                                <UserMultiSelect allUsers={users} selectedUserIds={formState.sharedMode.userIds} onSelectionChange={(val) => handleSettingChange('sharedMode', 'userIds', val)} label="Users in Shared View" />
                                <ToggleSwitch enabled={formState.sharedMode.allowCompletion} setEnabled={(val) => handleSettingChange('sharedMode', 'allowCompletion', val)} label="Allow quest completion from shared view" />
                                <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val) => handleSettingChange('sharedMode', 'autoExit', val)} label="Auto-exit user session after inactivity" />
                                {formState.sharedMode.autoExit && (
                                    <Input label="Auto-exit after (minutes)" type="number" min="1" value={formState.sharedMode.autoExitMinutes} onChange={(e) => handleSettingChange('sharedMode', 'autoExitMinutes', parseInt(e.target.value) || 2)} />
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                 <CollapsibleSection title="Game Rules">
                    <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={(val) => handleSimpleChange('forgivingSetbacks', val)} label="Forgiving Setbacks" />
                        <p className="text-xs text-stone-400 -mt-3 ml-12">If ON, setbacks are only applied if a quest is incomplete at the end of the day. If OFF, they are applied the moment a quest becomes late.</p>
                        <div className="pt-4 border-t border-stone-700/60">
                            <h4 className="font-semibold text-stone-200 mb-2">Quest Defaults</h4>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <ToggleSwitch enabled={formState.questDefaults.isActive} setEnabled={(val) => handleSettingChange('questDefaults', 'isActive', val)} label="Active by default" />
                                <ToggleSwitch enabled={formState.questDefaults.isOptional} setEnabled={(val) => handleSettingChange('questDefaults', 'isOptional', val)} label="Optional by default" />
                                <ToggleSwitch enabled={formState.questDefaults.requiresApproval} setEnabled={(val) => handleSettingChange('questDefaults', 'requiresApproval', val)} label="Requires Approval by default" />
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                 <CollapsibleSection title="Economy & Valuation">
                    <div className="p-6 space-y-4">
                        <ToggleSwitch enabled={formState.rewardValuation.enabled} setEnabled={(val) => handleRewardValuationChange('enabled', val)} label="Enable Reward Valuation & Exchange" />
                        {formState.rewardValuation.enabled && (
                             <div className="p-4 bg-stone-900/40 rounded-lg space-y-4">
                                 <Input as="select" label="Anchor Currency (Value = 1)" value={formState.rewardValuation.anchorRewardId} onChange={(e) => handleRewardValuationChange('anchorRewardId', e.target.value)}>
                                    {currencyRewardTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </Input>
                                 <h4 className="font-semibold text-stone-200 pt-2 border-t border-stone-700/60">Exchange Rates</h4>
                                 <p className="text-xs text-stone-400 -mt-2">How much of each reward type is 1 unit of your Anchor Currency worth?</p>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {nonAnchorRewards.map(reward => (
                                        <Input
                                            key={reward.id}
                                            label={reward.name}
                                            type="number"
                                            step="0.01"
                                            value={formState.rewardValuation.exchangeRates[reward.id] || ''}
                                            onChange={(e) => handleRateChange(reward.id, e.target.value)}
                                        />
                                    ))}
                                 </div>
                                 <h4 className="font-semibold text-stone-200 pt-2 border-t border-stone-700/60">Transaction Fees</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Currency Exchange Fee (%)" type="number" min="0" value={formState.rewardValuation.currencyExchangeFeePercent} onChange={(e) => handleRewardValuationChange('currencyExchangeFeePercent', parseInt(e.target.value) || 0)} />
                                    <Input label="XP Exchange Fee (%)" type="number" min="0" value={formState.rewardValuation.xpExchangeFeePercent} onChange={(e) => handleRewardValuationChange('xpExchangeFeePercent', parseInt(e.target.value) || 0)} />
                                </div>
                             </div>
                        )}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Integrations">
                     <div className="p-6 space-y-4">
                         <ToggleSwitch enabled={formState.googleCalendar.enabled} setEnabled={(val) => handleSettingChange('googleCalendar', 'enabled', val)} label="Enable Google Calendar Integration" />
                          {formState.googleCalendar.enabled && (
                            <div className="p-4 bg-stone-900/40 rounded-lg space-y-4">
                                <Input label="Google Calendar API Key" value={formState.googleCalendar.apiKey} onChange={(e) => handleSettingChange('googleCalendar', 'apiKey', e.target.value)} />
                                <Input label="Google Calendar ID" value={formState.googleCalendar.calendarId} onChange={(e) => handleSettingChange('googleCalendar', 'calendarId', e.target.value)} />
                            </div>
                          )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Advanced">
                    <div className="p-6 space-y-4">
                        <h4 className="font-semibold text-stone-200 mb-2">Automated Backups</h4>
                        <ToggleSwitch enabled={formState.automatedBackups.enabled} setEnabled={(val) => handleSettingChange('automatedBackups', 'enabled', val)} label="Enable Automated Server Backups" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Backup Frequency (Hours)" type="number" min="1" value={formState.automatedBackups.frequencyHours} onChange={(e) => handleSettingChange('automatedBackups', 'frequencyHours', parseInt(e.target.value) || 24)} />
                            <Input label="Max Backups to Keep" type="number" min="1" value={formState.automatedBackups.maxBackups} onChange={(e) => handleSettingChange('automatedBackups', 'maxBackups', parseInt(e.target.value) || 7)} />
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
