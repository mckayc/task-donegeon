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
    const { updateSettings, addNotification } = useAppDispatch();
    
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    const [isFaviconPickerOpen, setIsFaviconPickerOpen] = useState(false);
    const [isChatEmojiPickerOpen, setIsChatEmojiPickerOpen] = useState(false);
    
    const handleNestedChange = <T extends keyof AppSettings>(section: T) => (field: keyof AppSettings[T], value: any) => {
        setFormState(prev => ({
            ...prev,
            [section]: { ...(prev[section] as object), [field as string]: value },
        }));
    };

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Settings saved successfully!' });
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
                    
                    <SettingSection title="AI Features">
                        <ToggleSwitch enabled={formState.enableAiFeatures} setEnabled={(val) => setFormState(p => ({...p, enableAiFeatures: val}))} label="Enable AI-powered features" />
                        <p className="text-sm text-muted-foreground">When enabled, AI features like idea generators will appear. This requires a valid Google Gemini API key to be set on the server.</p>
                    </SettingSection>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;