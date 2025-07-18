

import React, { useState, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, AppSettings, Terminology } from '../../types';
import Button from '../ui/Button';
import { ChevronDownIcon } from '../ui/Icons';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import ConfirmDialog from '../ui/ConfirmDialog';
import { INITIAL_SETTINGS } from '../../data/initialData';


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
  link_manage_items: 'Sidebar: Manage Items',
  link_manage_markets: 'Sidebar: Manage Markets',
  link_manage_rewards: 'Sidebar: Manage Rewards',
  link_manage_ranks: 'Sidebar: Manage Ranks',
  link_manage_trophies: 'Sidebar: Manage Trophies',
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
  link_about: 'Sidebar: About',
  link_help_guide: 'Sidebar: Help Guide',
  link_chat: 'Sidebar: Chat',
};

const SettingsPage: React.FC = () => {
    const { currentUser, users, settings } = useAppState();
    const { updateSettings, resetSettings } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [showSaved, setShowSaved] = useState<string | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    if (currentUser?.role !== Role.DonegeonMaster) {
        return <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))' }}><p>You do not have permission to view this page.</p></div>;
    }

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
            const finalValue = type === 'number' ? parseInt(value) || 0 : value;
            currentLevel[keys[keys.length - 1]] = finalValue;
            return newState;
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
        setFormState(newState);
        updateSettings(newState); // Auto-save
        triggerSavedAnimation(sectionTitle);
    };
    
    const handleDateChange = (name: string, dateStr: string) => {
        const keys = name.split('.');
         setFormState(prev => {
             let newState = JSON.parse(JSON.stringify(prev));
             let currentLevel: any = newState;
             for (let i = 0; i < keys.length - 1; i++) {
                 currentLevel = currentLevel[keys[i]];
             }
            currentLevel[keys[keys.length-1]] = dateStr ? new Date(dateStr).toISOString().split('T')[0] : undefined
            return newState;
        });
    }

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
    
    return (
        <div className="space-y-8 relative">
            <CollapsibleSection title="General Settings" defaultOpen showSavedIndicator={showSaved === 'General Settings'}>
                 <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val) => handleToggleChange('chat.enabled', val, 'General Settings')} label="Enable Sitewide Chat" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>Allow users to send direct messages and participate in guild chats.</p>
                    </div>

                    <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={(val) => handleToggleChange('forgivingSetbacks', val, 'General Settings')} label="Forgiving Setbacks" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, time-based setbacks are only applied if a quest remains uncompleted at the end of the day.</p>
                    </div>
                    
                    <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.vacationMode.enabled} setEnabled={(val) => handleToggleChange('vacationMode.enabled', val, 'General Settings')} label="Vacation Mode" />
                        <div className="ml-6 flex-grow">
                            <p className="text-sm" style={{ color: 'hsl(var(--color-text-secondary))' }}>Pause all quest deadlines and setbacks for a specified date range.</p>
                            {formState.vacationMode.enabled && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Input label="Start Date" type="date" name="vacationMode.startDate" value={formState.vacationMode.startDate || ''} onChange={(e) => handleDateChange('vacationMode.startDate', e.target.value)} />
                                    <Input label="End Date" type="date" name="vacationMode.endDate" value={formState.vacationMode.endDate || ''} onChange={(e) => handleDateChange('vacationMode.endDate', e.target.value)} />
                                </div>
                            )}
                        </div>
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
                            <p className="text-xs text-stone-400 mb-2">If no users are selected, Shared Mode will include all users by default.</p>
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

            <CollapsibleSection title="AI Features" showSavedIndicator={showSaved === 'AI Features'}>
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch
                            enabled={formState.enableAiFeatures}
                            setEnabled={(val) => handleToggleChange('enableAiFeatures', val, 'AI Features')}
                            label="Enable AI-Powered Features"
                        />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                            Allow the use of Gemini AI to power features like the Quest Idea Generator.
                            This requires a valid Gemini API key to be configured by the server administrator.
                        </p>
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
                <div className="p-4 bg-red-900/30 border border-red-700/60 rounded-lg">
                    <h4 className="font-bold text-red-300">Reset All Settings</h4>
                    <p className="text-sm text-red-200/80 mt-1 mb-4">
                        If you're experiencing issues with new features not appearing (especially after an update on a local Docker install), resetting settings can help. This will revert all options on this page to their default values.
                        <strong className="block mt-2">This will NOT delete users, quests, items, or any other created content.</strong>
                    </p>
                    <Button
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="!bg-red-600 hover:!bg-red-500"
                    >
                        Reset All Settings to Default
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
        </div>
    );
};

export default SettingsPage;