
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings, useSettingsDispatch } from '../../context/SettingsContext';
import { useAppDispatch } from '../../context/AppContext';
import { Role, AppSettings, Terminology, Theme } from '../../types';
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
    const { currentUser } = useAuth();
    const { settings } = useSettings();
    const { updateSettings, addNotification } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(settings);
    
    useEffect(() => {
        // Instant theme preview
        document.body.dataset.theme = formState.theme;
        // Cleanup function to revert theme if user navigates away without saving
        return () => {
            document.body.dataset.theme = settings.theme;
        };
    }, [formState.theme, settings.theme]);

    if (currentUser?.role !== Role.DonegeonMaster) {
        return <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))' }}><p>You do not have permission to view this page.</p></div>;
    }

    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        
        setFormState(prev => {
            if (keys.length === 2) {
                const [outerKey, innerKey] = keys as [keyof AppSettings, string];
                return {
                    ...prev,
                    [outerKey]: {
                        ...(prev[outerKey] as object),
                        [innerKey]: value,
                    },
                };
            }
            return { ...prev, [name]: value };
        });
    };
    
    const handleToggleChange = (name: string, enabled: boolean) => {
         const keys = name.split('.');
         setFormState(prev => {
            if (keys.length === 2) {
                const [outerKey, innerKey] = keys as [keyof AppSettings, string];
                return {
                    ...prev,
                    [outerKey]: {
                        ...(prev[outerKey] as object),
                        [innerKey]: enabled,
                    },
                };
            }
            return { ...prev, [name]: enabled };
        });
    };
    
    const handleDateChange = (name: string, dateStr: string) => {
        const keys = name.split('.');
         setFormState(prev => {
            if (keys.length === 2) {
                const [outerKey, innerKey] = keys as [keyof AppSettings, string];
                return {
                    ...prev,
                    [outerKey]: {
                        ...(prev[outerKey] as object),
                        [innerKey]: dateStr ? new Date(dateStr).toISOString().split('T')[0] : undefined
                    },
                };
            }
            return { ...prev, [name]: dateStr };
        });
    }

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Settings saved successfully!' });
    };
    
    const themes: Theme[] = ['emerald', 'rose', 'sky', 'arcane', 'cartoon', 'forest', 'ocean', 'vulcan', 'royal', 'winter', 'sunset', 'cyberpunk', 'steampunk', 'parchment', 'eerie'];

    return (
        <div className="space-y-8 relative">
            <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', borderBottom: '1px solid hsl(var(--color-border))' }}>
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-medieval text-stone-100" style={{ color: 'hsl(var(--color-text-primary))' }}>Game Settings</h1>
                    <Button onClick={handleSave}>Save All Settings</Button>
                </div>
            </div>


            <CollapsibleSection title="General" defaultOpen>
                <div className="space-y-4">
                    <Input label="App Name" name="terminology.appName" value={formState.terminology.appName} onChange={handleFormChange} />
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>Default Theme</label>
                        <div className="flex flex-wrap gap-4">
                            {themes.map(theme => (
                                <button
                                    key={theme}
                                    type="button"
                                    onClick={() => setFormState(p => ({...p, theme}))}
                                    className={`capitalize w-24 h-16 rounded-lg font-bold text-white flex items-center justify-center transition-all ${formState.theme === theme ? 'ring-2 ring-offset-2 ring-offset-stone-800 ring-white' : ''}`}
                                    style={{
                                        fontFamily: `var(--font-${theme}-display, var(--font-display))`, 
                                        backgroundColor: `hsl(var(--color-${theme}-hue, var(--color-primary-hue)) var(--color-${theme}-saturation, var(--color-primary-saturation)) var(--color-${theme}-lightness, var(--color-primary-lightness)))`
                                    }}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
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
