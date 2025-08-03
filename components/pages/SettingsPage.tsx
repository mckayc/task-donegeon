import React, { useState, ChangeEvent, ReactNode, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, AppSettings, Terminology, RewardCategory, RewardTypeDefinition, AutomatedBackupProfile } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ToggleSwitch from '../ui/toggle-switch';
import ConfirmDialog from '../ui/confirm-dialog';
import EmojiPicker from '../ui/emoji-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '../ui/separator';
import UserMultiSelect from '../ui/user-multi-select';

const SettingSection: React.FC<{ title: string, description?: string, children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="py-6">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>}
        <div className="mt-4 space-y-4">
            {children}
        </div>
    </div>
);

const SettingsPage: React.FC = () => {
    const { currentUser, users, settings, rewardTypes, isAiConfigured, themes } = useAppState();
    const { updateSettings, addNotification, reinitializeApp, clearAllHistory, resetAllPlayerData, deleteAllCustomContent } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [confirmation, setConfirmation] = useState<{ action: string, title: string, message: string } | null>(null);
    const [isFaviconPickerOpen, setIsFaviconPickerOpen] = useState(false);
    const [isChatEmojiPickerOpen, setIsChatEmojiPickerOpen] = useState(false);

    useEffect(() => {
        setFormState(JSON.parse(JSON.stringify(settings)));
    }, [settings]);
    
    const handleNestedChange = <T extends keyof AppSettings>(section: T) => (field: keyof AppSettings[T], value: any) => {
        setFormState(prev => ({
            ...prev,
            [section]: { ...(prev[section] as object), [field as string]: value },
        }));
    };
    
     const handleBackupProfileChange = (index: number, field: keyof AutomatedBackupProfile, value: string | boolean | number) => {
        setFormState(prev => {
            const newProfiles = [...prev.automatedBackups.profiles] as [AutomatedBackupProfile, AutomatedBackupProfile, AutomatedBackupProfile];
            (newProfiles[index] as any)[field] = value;
            return { ...prev, automatedBackups: { ...prev.automatedBackups, profiles: newProfiles } };
        });
    };

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Settings saved successfully!' });
    };
    
    const handleConfirm = async () => {
        if (!confirmation) return;
        try {
            switch (confirmation.action) {
                case 'reinitialize': await reinitializeApp(); break;
                case 'clear_history': await clearAllHistory(); addNotification({ type: 'success', message: 'All history has been cleared.' }); break;
                case 'reset_player_data': await resetAllPlayerData(); addNotification({ type: 'success', message: 'Player data has been reset.' }); break;
                case 'factory_reset': await deleteAllCustomContent(); addNotification({ type: 'success', message: 'All custom content deleted. App will reload.' }); setTimeout(() => window.location.reload(), 3000); break;
            }
        } finally {
            setConfirmation(null);
        }
    };
    
    if (!currentUser || currentUser.role !== Role.DonegeonMaster) {
        return (
            <Card>
                <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
                <CardContent>You do not have permission to view this page.</CardContent>
            </Card>
        );
    }
    
    const currencyRewards = rewardTypes.filter(rt => rt.category === RewardCategory.Currency);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-display text-foreground">Settings</h1>
                <Button onClick={handleSave}>Save All Settings</Button>
            </div>
            
            <Card>
                <CardContent className="divide-y divide-border">
                    <SettingSection title="General">
                         <div className="space-y-2 max-w-sm">
                            <Label htmlFor="app-name">App Name</Label>
                            <Input id="app-name" value={formState.terminology.appName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormState(p => ({...p, terminology: { ...p.terminology, appName: e.target.value}}))} />
                         </div>
                         <div className="flex items-end gap-4">
                             <div className="relative">
                                <Label>Favicon</Label>
                                <button type="button" onClick={() => setIsFaviconPickerOpen(p => !p)} className="w-16 h-10 mt-1.5 text-2xl p-1 rounded-md bg-background border border-input flex items-center justify-center">
                                    {formState.favicon}
                                </button>
                                {isFaviconPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormState(p => ({...p, favicon: emoji})); setIsFaviconPickerOpen(false); }} onClose={() => setIsFaviconPickerOpen(false)} />}
                            </div>
                            <div className="flex-grow space-y-2">
                                <Label htmlFor="default-theme">Default Theme</Label>
                                <Select value={formState.theme} onValueChange={(value: string) => setFormState(p => ({...p, theme: value}))}>
                                    <SelectTrigger id="default-theme"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {themes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <ToggleSwitch enabled={formState.forgivingSetbacks} setEnabled={(val) => setFormState(p => ({...p, forgivingSetbacks: val}))} label="Forgiving Setbacks (only apply penalties at the end of the day)" />
                    </SettingSection>

                    <SettingSection title="Quest Defaults">
                        <ToggleSwitch enabled={formState.questDefaults.isActive} setEnabled={(val) => handleNestedChange('questDefaults')('isActive' as any, val)} label="New Quests are Active by default" />
                        <ToggleSwitch enabled={formState.questDefaults.isOptional} setEnabled={(val) => handleNestedChange('questDefaults')('isOptional' as any, val)} label="New Quests are Optional by default" />
                        <ToggleSwitch enabled={formState.questDefaults.requiresApproval} setEnabled={(val) => handleNestedChange('questDefaults')('requiresApproval' as any, val)} label="New Quests Require Approval by default" />
                    </SettingSection>

                    <SettingSection title="Security & Access">
                        <ToggleSwitch enabled={formState.security.requirePinForUsers} setEnabled={(val) => handleNestedChange('security')('requirePinForUsers' as any, val)} label="Require PIN for user login" />
                        <ToggleSwitch enabled={formState.security.requirePasswordForAdmin} setEnabled={(val) => handleNestedChange('security')('requirePasswordForAdmin' as any, val)} label="Require Password for Admin/Moderator login" />
                        <ToggleSwitch enabled={formState.security.allowProfileEditing} setEnabled={(val) => handleNestedChange('security')('allowProfileEditing' as any, val)} label="Allow users to edit their own profiles" />
                    </SettingSection>

                     <SettingSection title="Shared / Kiosk Mode">
                        <ToggleSwitch enabled={formState.sharedMode.enabled} setEnabled={(val) => handleNestedChange('sharedMode')('enabled' as any, val)} label="Enable Shared Mode" />
                        <UserMultiSelect allUsers={users} selectedUserIds={formState.sharedMode.userIds} onSelectionChange={(ids) => handleNestedChange('sharedMode')('userIds' as any, ids)} label="Users in Shared Mode" />
                        <ToggleSwitch enabled={formState.sharedMode.allowCompletion} setEnabled={(val) => handleNestedChange('sharedMode')('allowCompletion' as any, val)} label="Allow quest completion from shared view" />
                        <ToggleSwitch enabled={formState.sharedMode.autoExit} setEnabled={(val) => handleNestedChange('sharedMode')('autoExit' as any, val)} label="Auto-exit user session after inactivity" />
                        {formState.sharedMode.autoExit && (
                             <div className="space-y-2 max-w-xs">
                                <Label htmlFor="auto-exit-minutes">Auto-exit after (minutes)</Label>
                                <Input id="auto-exit-minutes" type="number" value={formState.sharedMode.autoExitMinutes} onChange={(e) => handleNestedChange('sharedMode')('autoExitMinutes' as any, parseInt(e.target.value) || 2)} />
                             </div>
                        )}
                    </SettingSection>

                     <SettingSection title="Notifications & Chat">
                        <ToggleSwitch enabled={formState.loginNotifications.enabled} setEnabled={(val) => handleNestedChange('loginNotifications')('enabled' as any, val)} label="Enable login notifications popup" />
                        <ToggleSwitch enabled={formState.chat.enabled} setEnabled={(val) => handleNestedChange('chat')('enabled' as any, val)} label="Enable in-app chat" />
                         <div className="relative w-fit">
                            <Label>Chat Icon</Label>
                            <button type="button" onClick={() => setIsChatEmojiPickerOpen(p => !p)} className="w-16 h-10 mt-1.5 text-2xl p-1 rounded-md bg-background border border-input flex items-center justify-center">
                                {formState.chat.chatEmoji}
                            </button>
                            {isChatEmojiPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormState(p => ({...p, chat: {...p.chat, chatEmoji: emoji}})); setIsChatEmojiPickerOpen(false); }} onClose={() => setIsChatEmojiPickerOpen(false)} />}
                        </div>
                    </SettingSection>

                     <SettingSection title="Reward Valuation & Exchange">
                        <ToggleSwitch enabled={formState.rewardValuation.enabled} setEnabled={(val) => handleNestedChange('rewardValuation')('enabled' as any, val)} label="Enable reward valuation system" />
                        {formState.rewardValuation.enabled && (
                            <div className="p-4 bg-background/50 rounded-lg border space-y-4">
                                <div className="space-y-2 max-w-sm">
                                    <Label>Anchor Currency</Label>
                                    <Select value={formState.rewardValuation.anchorRewardId} onValueChange={(val) => handleNestedChange('rewardValuation')('anchorRewardId' as any, val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{currencyRewards.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 max-w-sm">
                                    <Label>Currency Exchange Fee (%)</Label>
                                    <Input type="number" value={formState.rewardValuation.currencyExchangeFeePercent} onChange={(e) => handleNestedChange('rewardValuation')('currencyExchangeFeePercent' as any, parseInt(e.target.value))} />
                                </div>
                                <div className="space-y-2 max-w-sm">
                                    <Label>XP Exchange Fee (%)</Label>
                                    <Input type="number" value={formState.rewardValuation.xpExchangeFeePercent} onChange={(e) => handleNestedChange('rewardValuation')('xpExchangeFeePercent' as any, parseInt(e.target.value))} />
                                </div>
                            </div>
                        )}
                    </SettingSection>

                    <SettingSection title="Automated Backups">
                        {formState.automatedBackups.profiles.map((profile, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-background/50 flex flex-wrap gap-4 items-center">
                                <ToggleSwitch enabled={profile.enabled} setEnabled={(val) => handleBackupProfileChange(index, 'enabled', val)} label={`Profile ${index+1}`} />
                                <div className="flex-grow grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Frequency</Label>
                                        <Select value={profile.frequency} onValueChange={(val) => handleBackupProfileChange(index, 'frequency', val)} disabled={!profile.enabled}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hourly">Hourly</SelectItem>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Keep how many?</Label>
                                        <Input type="number" value={profile.keep} onChange={(e) => handleBackupProfileChange(index, 'keep', parseInt(e.target.value))} disabled={!profile.enabled}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </SettingSection>

                    <SettingSection title="AI Features">
                        <ToggleSwitch enabled={formState.enableAiFeatures} setEnabled={(val) => setFormState(p => ({...p, enableAiFeatures: val}))} label="Enable AI-powered features" />
                        <p className="text-sm text-muted-foreground">When enabled, AI features like idea generators will appear. This requires a valid Google Gemini API key to be set on the server.</p>
                    </SettingSection>

                    <SettingSection title="Danger Zone" description="These are destructive actions that cannot be undone. Please be certain before proceeding.">
                        <div className="p-4 border border-destructive rounded-lg flex flex-wrap gap-4 items-center justify-center">
                            <Button variant="destructive" onClick={() => setConfirmation({ action: 'clear_history', title: 'Clear All History', message: 'This will delete all quest completions, purchases, adjustments, and logs. User and quest definitions will remain. Are you sure?' })}>Clear All History</Button>
                            <Button variant="destructive" onClick={() => setConfirmation({ action: 'reset_player_data', title: 'Reset All Player Data', message: 'This will reset all user balances, owned items, and trophies to zero, but will not delete history. Are you sure?' })}>Reset Player Data</Button>
                            <Button variant="destructive" onClick={() => setConfirmation({ action: 'factory_reset', title: 'Factory Reset', message: 'This will delete all custom content (quests, items, etc.), reset all players, and clear all history, keeping only user accounts. Are you sure?' })}>Factory Reset</Button>
                            <Button variant="destructive" onClick={() => setConfirmation({ action: 'reinitialize', title: 'Re-initialize Application', message: 'This will delete EVERYTHING, including all user accounts, and restart the first-run wizard. THIS IS A COMPLETE WIPE. Are you sure?' })}>Re-initialize App</Button>
                        </div>
                    </SettingSection>
                </CardContent>
            </Card>

            {confirmation && (
                <ConfirmDialog
                    isOpen={!!confirmation}
                    onClose={() => setConfirmation(null)}
                    onConfirm={handleConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                />
            )}
        </div>
    );
};

export default SettingsPage;