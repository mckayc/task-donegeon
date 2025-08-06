import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, AppSettings, Terminology, RewardCategory, RewardTypeDefinition } from '../../types';
import Button from '../ui/Button';
import { ChevronDownIcon } from '../ui/Icons';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import ConfirmDialog from '../ui/ConfirmDialog';
import { INITIAL_SETTINGS } from '../../data/initialData';
import EmojiPicker from '../ui/EmojiPicker';


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; onSave?: () => void; showSavedIndicator?: boolean; }> = ({ title, children, defaultOpen = false, onSave, showSavedIndicator }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
         <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg backdrop-blur-sm" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', borderColor: 'hsl(var(--color-border))' }}>
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-stone-700/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-2xl font-medieval text-accent">{title}</h3>
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
                    <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && <div className="p-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>{children}</div>}
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
  link_help_guide: 'Sidebar: Help Guide',
  link_chat: 'Sidebar: Chat',
};


const SettingsPage: React.FC = () => {
    const { currentUser, users, settings, rewardTypes, isAiConfigured } = useAppState();
    const { updateSettings, resetSettings, addNotification, factoryReset } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [showSaved, setShowSaved] = useState<string | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isFactoryResetConfirmOpen, setIsFactoryResetConfirmOpen] = useState(false);
    const [isFaviconPickerOpen, setIsFaviconPickerOpen] = useState(false);
    
    const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'testing' | 'valid' | 'invalid'>(isAiConfigured ? 'valid' : 'unknown');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);

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
    
    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const handleFactoryResetConfirm = () => {
        setIsFactoryResetConfirmOpen(false);
        factoryReset();
    };
    
    const currencyRewards = rewardTypes.filter(rt => rt.category === RewardCategory.Currency);
    const otherRewards = rewardTypes.filter(rt => rt.id !== formState.rewardValuation.anchorRewardId);
    const anchorReward = rewardTypes.find(rt => rt.id === formState.rewardValuation.anchorRewardId);
    
    if (currentUser?.role !== Role.DonegeonMaster) {
        return <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))' }}><p>You do not have permission to view this page.</p></div>;
    }

    return (
        <div className="space-y-8 relative">
            <CollapsibleSection title="General Settings" defaultOpen showSavedIndicator={showSaved === 'General Settings'}>
                 <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val) => handleToggleChange('chat.enabled', val, 'General Settings')} label="Enable Sitewide Chat" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>Allow users to send direct messages and participate in guild chats.</p>
                    </div>

                    <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <label className="text-sm font-medium text-stone-300 mr-3 pt-2">Favicon</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsFaviconPickerOpen(prev => !prev)}
                                className="w-14 h-11 text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center justify-center text-2xl"
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
                        <p className="text-sm ml-6 pt-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>Choose an emoji to represent your app in the browser tab.</p>
                    </div>

                    <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={(val) => handleToggleChange('forgivingSetbacks', val, 'General Settings')} label="Forgiving Setbacks" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, time-based setbacks are only applied if a quest remains uncompleted at the end of the day.</p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Notifications" showSavedIndicator={showSaved === 'Notifications'}>
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.loginNotifications.enabled} setEnabled={(val) => handleToggleChange('loginNotifications.enabled', val, 'Notifications')} label="Enable popup notifications on login" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                            When this is turned on, if there are any new notifications when a user enters their account it will show a large popup with all the notifications.
                        </p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Shared Mode" onSave={() => handleManualSave('Shared Mode')} showSavedIndicator={showSaved === 'Shared Mode'}>
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val) => handleToggleChange('sharedMode.enabled', val, 'Shared Mode')} label="Enable Shared Mode" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>This mode is for a device in a shared location (like a family tablet) where multiple people can view and use the app like a kiosk.</p>
                    </div>

                    <div className={`space-y-6 pl-8 mt-4 border-l-2 border-stone-700 ${!formState.sharedMode.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="flex items-start">
                            <ToggleSwitch enabled={formState.sharedMode.quickUserSwitchingEnabled} setEnabled={(val) => handleToggleChange('sharedMode.quickUserSwitchingEnabled', val, 'Shared Mode')} label="Quick User Switching Bar" />
                            <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, a bar with user avatars will appear at the top for one-click switching.</p>
                        </div>
                         <div className="flex items-start">
                            <ToggleSwitch enabled={formState.sharedMode.allowCompletion} setEnabled={(val) => handleToggleChange('sharedMode.allowCompletion', val, 'Shared Mode')} label="Allow Completion in Shared View" />
                            <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, a "Complete" button will appear next to tasks in the shared calendar view. Recommended to keep off for security.</p>
                        </div>
                        <div className="flex items-start">
                             <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val) => handleToggleChange('sharedMode.autoExit', val, 'Shared Mode')} label="Auto Exit to Shared View" />
                             <div className="ml-6 flex-grow">
                                <p className="text-sm" style={{ color: 'hsl(var(--color-text-secondary))' }}>Automatically return to the shared calendar view after a period of inactivity.</p>
                                {formState.sharedMode.autoExit && (
                                    <div className="mt-2">
                                        <Input label="Inactivity Time (minutes)" type="number" name="sharedMode.autoExitMinutes" min="1" value={formState.sharedMode.autoExitMinutes} onChange={handleFormChange} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-stone-200 mb-2">Users in Shared Mode</h4>
                            <p className="text-xs text-stone-400 mb-2">Select which users will be available to log into from the Shared Mode screen.</p>
                             <div className="space-y-2 max-h-40 overflow-y-auto border border-stone-700 p-2 rounded-md">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center">
                                        <input type="checkbox" id={`shared-user-${user.id}`} checked={formState.sharedMode.userIds.includes(user.id)} onChange={() => handleSharedUserToggle(user.id)} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 rounded focus:ring-emerald-500" />
                                        <label htmlFor={`shared-user-${user.id}`} className="ml-3 text-stone-300">{user.gameName} ({user.role})</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Security" showSavedIndicator={showSaved === 'Security'}>
                 <div className="space-y-6">
                     <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val) => handleToggleChange('security.requirePinForUsers', val, 'Security')} label="Require PIN for Users" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If disabled, users will not be prompted for a PIN when switching profiles. This is less secure but faster for trusted environments.</p>
                    </div>
                     <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val) => handleToggleChange('security.requirePasswordForAdmin', val, 'Security')} label={`Require Password for ${formState.terminology.admin} & ${formState.terminology.moderator}`} />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, these roles must use their password to log in. If disabled, they can use their PIN like regular users.</p>
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
                             <p className="text-sm" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                                Allow the use of Gemini AI to power features like the Quest Idea Generator.
                                This requires a valid Gemini API key to be configured by the server administrator.
                            </p>
                             {apiKeyStatus === 'testing' && <p className="text-sm text-yellow-400 mt-2">Testing API key...</p>}
                             {apiKeyStatus === 'invalid' && (
                                <div className="mt-4 p-4 bg-red-900/30 border border-red-700/60 rounded-lg">
                                    <h4 className="font-bold text-red-300">AI Setup Failed</h4>
                                    <p className="text-sm text-red-200/80 mt-1 mb-2">
                                        {apiKeyError}
                                    </p>
                                    <p className="text-xs text-stone-400">
                                        The server administrator must set the <code>API_KEY</code> environment variable in the <code>.env</code> file (for Docker) or in the Vercel project settings.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

             <CollapsibleSection title="Economy & Valuation" onSave={() => handleManualSave('Economy & Valuation')} showSavedIndicator={showSaved === 'Economy & Valuation'}>
                <div className="space-y-4">
                     <ToggleSwitch
                        enabled={formState.rewardValuation.enabled}
                        setEnabled={(val) => handleToggleChange('rewardValuation.enabled', val, 'Economy & Valuation')}
                        label="Enable Economy Valuation & Exchanges"
                    />
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-4 border-t border-stone-700/60 ${!formState.rewardValuation.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Left Column: Anchor & Fees */}
                        <div className="space-y-4">
                             <Input as="select" label="Anchor Currency" name="rewardValuation.anchorRewardId" value={formState.rewardValuation.anchorRewardId} onChange={handleFormChange}>
                                {currencyRewards.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                            </Input>
                            <Input label="Currency Exchange Fee (%)" type="number" step="0.1" name="rewardValuation.currencyExchangeFeePercent" value={formState.rewardValuation.currencyExchangeFeePercent} onChange={handleFormChange} />
                            <Input label="XP Exchange Fee (%)" type="number" step="0.1" name="rewardValuation.xpExchangeFeePercent" value={formState.rewardValuation.xpExchangeFeePercent} onChange={handleFormChange} />
                        </div>
                        {/* Right Column: Exchange Rates */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-stone-200">Exchange Rates</h4>
                            <p className="text-sm text-stone-400 -mt-2">How many of each reward is equal to 1 <span className="font-bold">{anchorReward?.name || 'Anchor'}</span>?</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {otherRewards.map(rt => (
                                    <div key={rt.id} className="flex items-center gap-2 p-2 bg-stone-900/60 rounded-md">
                                        <label htmlFor={`exchange-${rt.id}`} className="text-stone-300 flex-grow">{rt.name} ({rt.icon})</label>
                                        <Input id={`exchange-${rt.id}`} type="number" step="any" value={formState.rewardValuation.exchangeRates[rt.id] || ''} onChange={(e) => handleExchangeRateChange(rt.id, e.target.value)} className="w-28" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title={`Default ${formState.terminology.task} Values`} showSavedIndicator={showSaved === `Default ${formState.terminology.task} Values`}>
                 <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.questDefaults.requiresApproval} setEnabled={(val) => handleToggleChange('questDefaults.requiresApproval', val, `Default ${formState.terminology.task} Values`)} label="Requires Approval" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, new {formState.terminology.tasks.toLowerCase()} will default to requiring approval from a {formState.terminology.moderator} or {formState.terminology.admin}.</p>
                    </div>
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.questDefaults.isOptional} setEnabled={(val) => handleToggleChange('questDefaults.isOptional', val, `Default ${formState.terminology.task} Values`)} label="Is Optional" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, new {formState.terminology.tasks.toLowerCase()} will default to being optional, meaning they don't count against a user if not completed.</p>
                    </div>
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.questDefaults.isActive} setEnabled={(val) => handleToggleChange('questDefaults.isActive', val, `Default ${formState.terminology.task} Values`)} label="Is Active" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, new {formState.terminology.tasks.toLowerCase()} will be active and visible on the board immediately upon creation.</p>
                    </div>
                </div>
            </CollapsibleSection>

             <CollapsibleSection title="Terminology" onSave={() => handleManualSave('Terminology')} showSavedIndicator={showSaved === 'Terminology'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {Object.keys(formState.terminology).map(key => (
                         <Input 
                            key={key}
                            label={terminologyLabels[key as keyof Terminology]}
                            name={`terminology.${key}`}
                            value={formState.terminology[key as keyof Terminology]}
                            onChange={handleFormChange}
                         />
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Advanced">
                <div className="p-4 bg-yellow-900/30 border border-yellow-700/60 rounded-lg">
                    <h4 className="font-bold text-yellow-300">Reset All Settings</h4>
                    <p className="text-sm text-yellow-200/80 mt-1 mb-4">
                        This will revert all options on this page to their default values.
                        <strong className="block mt-2">This will NOT delete users, quests, items, or any other created content.</strong>
                    </p>
                    <Button
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="!bg-yellow-600 hover:!bg-yellow-500"
                    >
                        Reset All Settings to Default
                    </Button>
                </div>
                 <div className="mt-6 p-4 bg-red-900/30 border border-red-700/60 rounded-lg">
                    <h4 className="font-bold text-red-300">Factory Reset</h4>
                    <p className="text-sm text-red-200/80 mt-1 mb-4">
                        This will permanently delete ALL data, including users, quests, items, and settings, and reset the application to its initial state. This action is irreversible.
                    </p>
                    <Button
                        onClick={() => setIsFactoryResetConfirmOpen(true)}
                        className="!bg-red-600 hover:!bg-red-500"
                    >
                        Factory Reset Application
                    </Button>
                </div>
            </CollapsibleSection>

            <ConfirmDialog
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleResetConfirm}
                title="Confirm Settings Reset"
                message="Are you sure you want to reset all application settings to their default values? This cannot be undone, but it will not affect your created content like users or quests."
            />

            <ConfirmDialog
                isOpen={isFactoryResetConfirmOpen}
                onClose={() => setIsFactoryResetConfirmOpen(false)}
                onConfirm={handleFactoryResetConfirm}
                title="Confirm Factory Reset"
                message="Are you absolutely sure? This will delete ALL data and cannot be undone. The application will be reset to the initial setup wizard."
            />
        </div>
    );
};

export default SettingsPage;