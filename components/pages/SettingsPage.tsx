import React, { useState, ChangeEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings, useSettingsDispatch } from '../../context/SettingsContext';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { Role, AppSettings, Terminology } from '../../types';
import Button from '../ui/Button';
import { ChevronDownIcon } from '../ui/Icons';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
         <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg backdrop-blur-sm" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', borderColor: 'hsl(var(--color-border))' }}>
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-stone-700/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-2xl font-medieval text-accent">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
};

const SettingsPage: React.FC = () => {
    const { currentUser, users } = useAppState();
    const { settings } = useSettings();
    const { updateSettings, addNotification } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(settings);
    
    if (currentUser?.role !== Role.DonegeonMaster) {
        return <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))' }}><p>You do not have permission to view this page.</p></div>;
    }

    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const keys = name.split('.');
        
        setFormState(prev => {
            let newState = {...prev};
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            const finalValue = type === 'number' ? parseInt(value) || 0 : value;
            currentLevel[keys[keys.length - 1]] = finalValue;
            return newState;
        });
    };
    
    const handleToggleChange = (name: string, enabled: boolean) => {
         const keys = name.split('.');
         setFormState(prev => {
            let newState = {...prev};
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = enabled;
            return newState;
        });
    };
    
    const handleDateChange = (name: string, dateStr: string) => {
        const keys = name.split('.');
         setFormState(prev => {
             let newState = {...prev};
             let currentLevel: any = newState;
             for (let i = 0; i < keys.length - 1; i++) {
                 currentLevel = currentLevel[keys[i]];
             }
            currentLevel[keys[keys.length-1]] = dateStr ? new Date(dateStr).toISOString().split('T')[0] : undefined
            return newState;
        });
    }

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Settings saved successfully!' });
    };

    const handleSharedUserToggle = (userId: string) => {
        setFormState(prev => {
            const currentIds = prev.sharedMode.userIds;
            const newIds = currentIds.includes(userId)
                ? currentIds.filter(id => id !== userId)
                : [...currentIds, userId];
            return {
                ...prev,
                sharedMode: { ...prev.sharedMode, userIds: newIds }
            };
        });
    };
    
    return (
        <div className="space-y-8 relative">
            <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', borderBottom: '1px solid hsl(var(--color-border))' }}>
                <div className="flex justify-end items-center">
                    <Button onClick={handleSave}>Save All Settings</Button>
                </div>
            </div>

            <CollapsibleSection title="Shared Mode" defaultOpen>
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val) => handleToggleChange('sharedMode.enabled', val)} label="Enable Shared Mode" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>This mode is for a device in a shared location (like a family tablet) where multiple people can view and use the app like a kiosk.</p>
                    </div>

                    <div className={`space-y-6 pl-8 mt-4 border-l-2 border-stone-700 ${!formState.sharedMode.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="flex items-start">
                            <ToggleSwitch enabled={formState.sharedMode.quickUserSwitchingEnabled} setEnabled={(val) => handleToggleChange('sharedMode.quickUserSwitchingEnabled', val)} label="Quick User Switching Bar" />
                            <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, a bar with user avatars will appear at the top for one-click switching.</p>
                        </div>
                         <div className="flex items-start">
                            <ToggleSwitch enabled={formState.sharedMode.allowCompletion} setEnabled={(val) => handleToggleChange('sharedMode.allowCompletion', val)} label="Allow Completion in Shared View" />
                            <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, a "Complete" button will appear next to tasks in the shared calendar view. Recommended to keep off for security.</p>
                        </div>
                        <div className="flex items-start">
                             <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val) => handleToggleChange('sharedMode.autoExit', val)} label="Auto Exit to Shared View" />
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

            <CollapsibleSection title="Security">
                 <div className="space-y-6">
                     <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val) => handleToggleChange('security.requirePinForUsers', val)} label="Require PIN for Users" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If disabled, users will not be prompted for a PIN when switching profiles. This is less secure but faster for trusted environments.</p>
                    </div>
                     <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val) => handleToggleChange('security.requirePasswordForAdmin', val)} label={`Require Password for ${formState.terminology.admin} & ${formState.terminology.moderator}`} />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, these roles must use their password to log in. If disabled, they can use their PIN like regular users.</p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Game Rules">
                 <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={(val) => handleToggleChange('forgivingSetbacks', val)} label="Forgiving Setbacks" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, time-based setbacks are only applied if a quest remains uncompleted at the end of the day.</p>
                    </div>
                    
                    <div className="pt-4 border-t flex items-start" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <ToggleSwitch enabled={formState.vacationMode.enabled} setEnabled={(val) => handleToggleChange('vacationMode.enabled', val)} label="Vacation Mode" />
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

            <CollapsibleSection title="AI Features">
                <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch
                            enabled={formState.enableAiFeatures}
                            setEnabled={(val) => handleToggleChange('enableAiFeatures', val)}
                            label="Enable AI-Powered Features"
                        />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                            Allow the use of Gemini AI to power features like the Quest Idea Generator.
                            This requires a valid Gemini API key to be configured by the server administrator.
                        </p>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title={`Default ${formState.terminology.task} Values`}>
                 <div className="space-y-6">
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.questDefaults.requiresApproval} setEnabled={(val) => handleToggleChange('questDefaults.requiresApproval', val)} label="Requires Approval" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, new {formState.terminology.tasks.toLowerCase()} will default to requiring approval from a {formState.terminology.moderator} or {formState.terminology.admin}.</p>
                    </div>
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.questDefaults.isOptional} setEnabled={(val) => handleToggleChange('questDefaults.isOptional', val)} label="Is Optional" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, new {formState.terminology.tasks.toLowerCase()} will default to being optional, meaning they don't count against a user if not completed.</p>
                    </div>
                    <div className="flex items-start">
                        <ToggleSwitch enabled={formState.questDefaults.isActive} setEnabled={(val) => handleToggleChange('questDefaults.isActive', val)} label="Is Active" />
                        <p className="text-sm ml-6" style={{ color: 'hsl(var(--color-text-secondary))' }}>If enabled, new {formState.terminology.tasks.toLowerCase()} will be active and visible on the board immediately upon creation.</p>
                    </div>
                </div>
            </CollapsibleSection>

             <CollapsibleSection title="Terminology">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {Object.keys(formState.terminology).filter(k => k !== 'appName').map(key => (
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

        </div>
    );
};

export default SettingsPage;