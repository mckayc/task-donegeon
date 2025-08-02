
import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, AppSettings, Terminology, RewardCategory, RewardTypeDefinition, AutomatedBackupProfile } from '../../types';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ToggleSwitch from '../ui/toggle-switch';
import ConfirmDialog from '../ui/confirm-dialog';
import { INITIAL_SETTINGS } from '../../data/initialData';
import EmojiPicker from '../ui/emoji-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


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
        setFormState(JSON.parse(JSON.stringify(settings)));
    }, [settings]);


    useEffect(() => {
        if (formState.enableAiFeatures) {
            const verifyKeyOnLoad = async () => {
                try {
                    const response = await fetch('/api/ai/test', { method: 'POST' });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Test failed');
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        addNotification({ type: 'error', message: `AI key is invalid, disabling AI features: ${err.message}` });
                    }
                    setFormState(p => ({ ...p, enableAiFeatures: false }));
                    setApiKeyStatus('invalid');
                }
            };
            verifyKeyOnLoad();
        }
    }, [formState.enableAiFeatures, addNotification]);
    
    const handleTerminologyChange = (field: keyof Terminology, value: string) => {
        setFormState(prev => ({
            ...prev,
            terminology: {
                ...prev.terminology,
                [field]: value
            }
        }));
    };
    
    const handleSimpleChange = (field: keyof AppSettings, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };
    
    const handleNestedChange = <T extends keyof AppSettings>(section: T) => (field: keyof AppSettings[T], value: any) => {
        setFormState(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            }
        }));
    };

    const handleSave = (section: string) => {
        updateSettings(formState);
        setShowSaved(section);
        setTimeout(() => setShowSaved(null), 2000);
    };

    const handleReset = () => {
        updateSettings(INITIAL_SETTINGS);
        setFormState(INITIAL_SETTINGS);
        setIsResetConfirmOpen(false);
        addNotification({type: 'success', message: 'All settings have been reset to default.'})
    };
    
    if (!currentUser || currentUser.role !== Role.DonegeonMaster) {
        return (
            <Card>
                <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
                <CardContent>You do not have permission to view this page.</CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-display text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage the core settings of your application.</p>

            <CollapsibleSection title="Terminology" onSave={() => handleSave('terminology')} showSavedIndicator={showSaved === 'terminology'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(terminologyLabels).map(([key, label]) => (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={`term-${key}`}>{label}</Label>
                            <Input
                                id={`term-${key}`}
                                value={formState.terminology[key as keyof Terminology]}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleTerminologyChange(key as keyof Terminology, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection title="Security & Access" onSave={() => handleSave('security')} showSavedIndicator={showSaved === 'security'}>
                <div className="space-y-4">
                    <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val) => handleNestedChange('security')('requirePinForUsers', val)} label="Require PIN for user login" />
                    <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val) => handleNestedChange('security')('requirePasswordForAdmin', val)} label="Require Password for Admin/Moderator login" />
                    <ToggleSwitch enabled={formState.security.allowProfileEditing} setEnabled={(val) => handleNestedChange('security')('allowProfileEditing', val)} label="Allow users to edit their own profiles" />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="AI Features" onSave={() => handleSave('ai')} showSavedIndicator={showSaved === 'ai'}>
                <div className="space-y-4">
                    <ToggleSwitch enabled={formState.enableAiFeatures} setEnabled={(val) => handleSimpleChange('enableAiFeatures', val)} label="Enable AI-powered features" />
                    <p className="text-sm text-muted-foreground">When enabled, AI features like idea generators will appear. This requires a valid Google Gemini API key to be set on the server.</p>
                </div>
            </CollapsibleSection>

            <div className="flex justify-end gap-4 pt-4">
                <Button variant="destructive" onClick={() => setIsResetConfirmOpen(true)}>Reset All Settings</Button>
            </div>

            {isResetConfirmOpen && (
                <ConfirmDialog
                    isOpen={isResetConfirmOpen}
                    onClose={() => setIsResetConfirmOpen(false)}
                    onConfirm={handleReset}
                    title="Reset All Settings"
                    message="Are you sure you want to reset all settings to their default values? This action cannot be undone."
                />
            )}
        </div>
    );
};

export default SettingsPage;
