import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, AppSettings, Terminology, RewardCategory, RewardTypeDefinition, AutomatedBackupProfile } from '../../types';
import { Button } from '@/components/ui/Button';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import ToggleSwitch from '../ui/ToggleSwitch';
import ConfirmDialog from '../ui/ConfirmDialog';
import { INITIAL_SETTINGS } from '../../data/initialData';
import EmojiPicker from '../ui/EmojiPicker';


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; onSave?: () => void; showSavedIndicator?: boolean; className?: string; }> = ({ title, children, defaultOpen = false, onSave, showSavedIndicator, className }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
         <div className={`relative bg-card border rounded-xl shadow-lg backdrop-blur-sm ${className || ''}`}>
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-accent/10 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-2xl font-display text-accent">{title}</h3>
                <div className="flex items-center gap-4">
                    {onSave && (
                        <Button onClick={(e) => { e.stopPropagation(); onSave(); }} size="sm" variant="secondary">
                            Save
                        </Button>
                    )}
                    {showSavedIndicator && (
                        <span className="text-sm font-semibold text-green-400 saved-animation flex items-center gap-1">
                            ✓ Saved!
                        </span>
                    )}
                    <ChevronDown className={`w-6 h-6 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && <div className="p-6 border-t">{children}</div>}
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
  link_ai_studio: 'Sidebar: AI Studio',
  link_appearance: 'Sidebar: Appearance',
  link_object_exporter: 'Sidebar: Object Exporter',
  link_asset_manager: 'Sidebar: Asset Manager',
  link_backup_import: 'Sidebar: Backup & Import',
  link_asset_library: 'Sidebar: Asset Library',
  link_settings: 'Sidebar: Settings',
  link_about: 'About',
  link_help_guide: 'Help Guide',
  link_chat: 'Sidebar: Chat',
};


const SettingsPage: React.FC = () => {
    const { currentUser, users, settings, rewardTypes, isAiConfigured } = useAppState();
    const { updateSettings, resetSettings, addNotification } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [showSaved, setShowSaved] = useState<string | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isFaviconPickerOpen, setIsFaviconPickerOpen] = useState(false);
    
    const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'testing' | 'valid' | 'invalid'>(isAiConfigured ? 'valid' : 'unknown');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);

    useEffect(() => {
        // If global settings update (e.g. from a sync), refresh the form state
        setFormState(JSON.parse(JSON.stringify(settings)));
    }, [settings]);


    useEffect(() => {
        // Self-correct if AI is enabled in settings but the server key is bad/missing
        if (formState.enableAiFeatures) {
            const verifyKeyOnLoad = async () => {
                try {
                    const response = await fetch('/api/ai/test', { method: 'POST' });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Server-side API key is no longer valid.');
                    }
                    setApiKeyStatus('valid');
                } catch(e) {
                     const message = e instanceof Error ? e.message : 'Unknown error during verification.';
                     setApiKeyStatus('invalid');
                     setApiKeyError(message);
                     // Correct the state
                     const newState = { ...formState, enableAiFeatures: false };
                     setFormState(newState);
                     updateSettings(newState);
                     addNotification({ type: 'error', message: 'AI features disabled due to invalid API key.' });
                }
            };
            verifyKeyOnLoad();
        }
    }, [formState.enableAiFeatures]); // Only needs to re-run if this specific setting changes


    const triggerSavedAnimation = (sectionTitle: string) => {
        setShowSaved(sectionTitle);
        setTimeout(() => {
            setShowSaved(null);
        }, 2000); // Animation lasts 2 seconds
    };
    
    const handleManualSave = (sectionTitle: string) => {
        updateSettings(formState);
        triggerSavedAnimation(sectionTitle);
    };
    
    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const keys = name.split('.');
        
        setFormState(prev => {
            let newState = JSON.parse(JSON.stringify(prev));
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
            currentLevel[keys[keys.length - 1]] = finalValue;
            return newState;
        });
    };

     const handleExchangeRateChange = (rewardTypeId: string, value: string) => {
        const numericValue = parseFloat(value) || 0;
        setFormState(prev => {
            const newRates = { ...prev.rewardValuation.exchangeRates, [rewardTypeId]: numericValue };
            return {
                ...prev,
                rewardValuation: {
                    ...prev.rewardValuation,
                    exchangeRates: newRates
                }
            };
        });
    };
    
    const handleToggleChange = (path: string, enabled: boolean, sectionTitle: string) => {
        const newState = JSON.parse(JSON.stringify(formState));
        const keys = path.split('.');
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]] = current[keys[i]] || {};
        }
        current[keys[keys.length - 1]] = enabled;

        if (path === 'sharedMode.enabled' && enabled && newState.sharedMode.userIds.length === 0) {
            newState.sharedMode.userIds = users.map(u => u.id);
        }

        setFormState(newState);
        updateSettings(newState); // Auto-save
        triggerSavedAnimation(sectionTitle);
    };
    
    const testAndSetAiFeatures = async (enable: boolean) => {
        if (!enable) {
            // Toggling off is simple
            const newState = { ...formState, enableAiFeatures: false };
            setFormState(newState);
            updateSettings(newState);
            setApiKeyStatus('unknown');
            setApiKeyError(null);
            triggerSavedAnimation('AI Features');
            return;
        }
    
        // Toggling on requires a test
        setApiKeyStatus('testing');
        setApiKeyError(null);
        try {
            const response = await fetch('/api/ai/test', { method: 'POST' });
            const data = await response.json();
            if (response.ok && data.success) {
                setApiKeyStatus('valid');
                const newState = { ...formState, enableAiFeatures: true };
                setFormState(newState);
                updateSettings(newState);
                addNotification({ type: 'success', message: 'AI features enabled successfully!' });
            } else {
                setApiKeyStatus('invalid');
                setApiKeyError(data.error || 'An unknown error occurred during testing.');
                const newState = { ...formState, enableAiFeatures: false };
                setFormState(newState);
            }
        } catch(e) {
            setApiKeyStatus('invalid');
            const message = e instanceof Error ? e.message : 'Could not connect to the server to test the API key.';
            setApiKeyError(message);
            const newState = { ...formState, enableAiFeatures: false };
            setFormState(newState);
        }
    };
    
    const handleSharedUserToggle = (userId: string) => {
        const newIds = formState.sharedMode.userIds.includes(userId)
            ? formState.sharedMode.userIds.filter(id => id !== userId)
            : [...formState.sharedMode.userIds, userId];
            
        const newState = {
            ...formState,
            sharedMode: { ...formState.sharedMode, userIds: newIds }
        };
        setFormState(newState);
    };

    const handleResetConfirm = () => {
        resetSettings();
        setFormState(JSON.parse(JSON.stringify(INITIAL_SETTINGS)));
        setIsResetConfirmOpen(false);
    };
    
    const handleResetEconomy = () => {
        const defaultEconomySettings = INITIAL_SETTINGS.rewardValuation;
        setFormState(prev => ({
            ...prev,
            rewardValuation: JSON.parse(JSON.stringify(defaultEconomySettings))
        }));
        updateSettings({ rewardValuation: defaultEconomySettings });
        triggerSavedAnimation('Economy & Valuation');
    };

    const currencyRewards = rewardTypes.filter(rt => rt.category === RewardCategory.Currency);
    const otherRewards = rewardTypes.filter(rt => rt.id !== formState.rewardValuation.anchorRewardId);
    const anchorReward = rewardTypes.find(rt => rt.id === formState.rewardValuation.anchorRewardId);
    
    if (currentUser?.role !== Role.DonegeonMaster) {
        return <div className="p-6 rounded-lg bg-card"><p>You do not have permission to view this page.</p></div>;
    }

    return (
        <div className="space-y-8 relative">
            <CollapsibleSection title="General Settings" defaultOpen showSavedIndicator={showSaved === 'General Settings'} className={isFaviconPickerOpen ? 'z-10' : ''}>
                 <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val) => handleToggleChange('chat.enabled', val, 'General Settings')} label="Enable Sitewide Chat" />
                        <p className="text-sm ml-6 text-muted-foreground">Allow users to send direct messages and participate in guild chats.</p>
                    </div>

                    <div className="pt-4 border-t flex items-start border-border">
                        <Label className="text-sm font-medium mr-3 pt-2">Favicon</Label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsFaviconPickerOpen(prev => !prev)}
                                className="w-14 h-11 text-left px-4 py-2 bg-background border border-input rounded-md flex items-center justify-center text-2xl"
                            >
                                {formState.favicon}
                            </button>
                            {isFaviconPickerOpen && (
                                <EmojiPicker
                                    onSelect={(emoji) => {
                                        const newState = { ...formState, favicon: emoji };
                                        setFormState(newState);
                                        updateSettings(newState); // Auto-save
                                        triggerSavedAnimation('General Settings');
                                        setIsFaviconPickerOpen(false);
                                    }}
                                    onClose={() => setIsFaviconPickerOpen(false)}
                                />
                            )}
                        </div>
                        <p className="text-sm ml-6 pt-2 text-muted-foreground">Choose an emoji to represent your app in the browser tab.</p>
                    </div>

                    <div className="pt-4 border-t flex items-start border-border">
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={(val) => handleToggleChange('forgivingSetbacks', val, 'General Settings')} label="Forgiving Setbacks" />
                        <p className="text-sm ml-6 text-muted-foreground">If enabled, time-based setbacks are only applied if a quest remains uncompleted at the end of the day.</p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Automated Server Backups" showSavedIndicator={showSaved === 'Automated Server Backups'}>
                <p className="text-sm text-muted-foreground mb-4">Configure automatic backups to the server's file system. This is highly recommended for Docker/self-hosted instances.</p>
                <div className="space-y-4">
                    {formState.automatedBackups.profiles.map((profile, index) => (
                        <div key={index} className="p-4 bg-background rounded-lg border">
                             <ToggleSwitch
                                enabled={profile.enabled}
                                setEnabled={(val) => handleToggleChange(`automatedBackups.profiles.${index}.enabled`, val, 'Automated Server Backups')}
                                label={`Profile ${index + 1}: Enabled`}
                            />
                            <div className={`grid grid-cols-2 gap-4 mt-4 ${!profile.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="space-y-2">
                                  <Label htmlFor={`backup-freq-${index}`}>Frequency</Label>
                                  <Select onValueChange={(value: string) => handleFormChange({ target: { name: `automatedBackups.profiles.${index}.frequency`, value } } as any)} defaultValue={profile.frequency}>
                                    <SelectTrigger id={`backup-freq-${index}`}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="hourly">Hourly</SelectItem>
                                      <SelectItem value="daily">Daily</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`backup-keep-${index}`}>Keep</Label>
                                    <Input id={`backup-keep-${index}`} type="number" name={`automatedBackups.profiles.${index}.keep`} value={profile.keep} onChange={handleFormChange} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Notifications" showSavedIndicator={showSaved === 'Notifications'}>
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.loginNotifications.enabled} setEnabled={(val) => handleToggleChange('loginNotifications.enabled', val, 'Notifications')} label="Enable popup notifications on login" />
                        <p className="text-sm ml-6 text-muted-foreground">
                            When this is turned on, if there are any new notifications when a user enters their account it will show a large popup with all the notifications.
                        </p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Shared Mode" onSave={() => handleManualSave('Shared Mode')} showSavedIndicator={showSaved === 'Shared Mode'}>
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val) => handleToggleChange('sharedMode.enabled', val, 'Shared Mode')} label="Enable Shared Mode" />
                        <p className="text-sm ml-6 text-muted-foreground">This mode is for a device in a shared location (like a family tablet) where multiple people can view and use the app like a kiosk.</p>
                    </div>

                    <div className={`space-y-6 pl-8 mt-4 border-l-2 border-border ${!formState.sharedMode.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="flex items-start">
                            <ToggleSwitch enabled={formState.sharedMode.quickUserSwitchingEnabled} setEnabled={(val) => handleToggleChange('sharedMode.quickUserSwitchingEnabled', val, 'Shared Mode')} label="Quick User Switching Bar" />
                            <p className="text-sm ml-6 text-muted-foreground">If enabled, a bar with user avatars will appear at the top for one-click switching.</p>
                        </div>
                         <div className="flex items-start">
                            <ToggleSwitch enabled={formState.sharedMode.allowCompletion} setEnabled={(val) => handleToggleChange('sharedMode.allowCompletion', val, 'Shared Mode')} label="Allow Completion in Shared View" />
                            <p className="text-sm ml-6 text-muted-foreground">If enabled, a "Complete" button will appear on quests in the shared view, prompting for a PIN to confirm.</p>
                        </div>
                        <div className="flex items-start">
                             <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val) => handleToggleChange('sharedMode.autoExit', val, 'Shared Mode')} label="Auto Exit to Shared View" />
                             <div className="ml-6 flex-grow">
                                <p className="text-sm text-muted-foreground">Automatically return to the shared calendar view after a period of inactivity.</p>
                                {formState.sharedMode.autoExit && (
                                    <div className="mt-2 space-y-2">
                                        <Label htmlFor="auto-exit-minutes">Inactivity Time (minutes)</Label>
                                        <Input id="auto-exit-minutes" type="number" name="sharedMode.autoExitMinutes" min="1" value={formState.sharedMode.autoExitMinutes} onChange={handleFormChange} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground mb-2">Users in Shared Mode</h4>
                            <p className="text-xs text-muted-foreground mb-2">Select which users will be available to log into from the Shared Mode screen.</p>
                             <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center">
                                        <input type="checkbox" id={`shared-user-${user.id}`} checked={formState.sharedMode.userIds.includes(user.id)} onChange={() => handleSharedUserToggle(user.id)} className="h-4 w-4 text-primary bg-background border-input rounded focus:ring-ring" />
                                        <label htmlFor={`shared-user-${user.id}`} className="ml-3 text-foreground">{user.gameName} ({user.role})</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Security" showSavedIndicator={showSaved === 'Security'}>
                 <div className="space-y-6">
                     <div className="pt-4 border-t flex items-start border-border">
                        <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val) => handleToggleChange('security.requirePinForUsers', val, 'Security')} label="Require PIN for Users" />
                        <p className="text-sm ml-6 text-muted-foreground">If disabled, users will not be prompted for a PIN when switching profiles. This is less secure but faster for trusted environments.</p>
                    </div>
                     <div className="pt-4 border-t flex items-start border-border">
                        <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val) => handleToggleChange('security.requirePasswordForAdmin', val, 'Security')} label={`Require Password for ${formState.terminology.admin} & ${formState.terminology.moderator}`} />
                        <p className="text-sm ml-6 text-muted-foreground">If enabled, these roles must use their password to log in. If disabled, they can use their PIN like regular users.</p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="AI Features">
                <div className="space-y-4">
                    <div className="flex items-start">
                        <ToggleSwitch
                            enabled={formState.enableAiFeatures}
                            setEnabled={testAndSetAiFeatures}
                            label="Enable AI-Powered Features"
                        />
                        <div className="ml-6 flex-grow">
                             <p className="text-sm text-muted-foreground">
                                Allow the use of Gemini AI to power features like the Quest Idea Generator.
                                This requires a valid Gemini API key to be configured by the server administrator.
                            </p>
                             {apiKeyStatus === 'testing' && <p className="text-sm text-yellow-400 mt-2">Testing API key...</p>}
                             {apiKeyStatus === 'invalid' && (
                                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <h4 className="font-bold text-destructive">AI Setup Failed</h4>
                                    <p className="text-sm text-destructive/80 mt-1 mb-2">
                                        {apiKeyError}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        The server administrator must set the