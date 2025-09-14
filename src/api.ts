
import {
    AppSettings, ThemeDefinition, SystemNotification, ScheduledEvent, BugReport, ModifierDefinition, AdminAdjustment, User, ChatMessage, AssetPack, ImportResolution, ShareableAssetType, Quest, QuestGroup, Rotation, QuestCompletion, Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, Rank, Trophy, UserTrophy, Guild, BulkQuestUpdates, RewardItem, Minigame, GameScore, Bookmark
} from './types';

// Generic API Request Function
const apiRequest = async (method: string, path: string, body?: any) => {
    const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await window.fetch(path, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response.status === 204 ? null : await response.json();
};

const apiUpload = async (path: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
        formData.append('category', category);
    }
    