const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const http = require('http');
const WebSocket = require('ws');

// === START INLINED DATA from data.js ===
const Role = {
  DonegeonMaster: 'Donegeon Master',
  Gatekeeper: 'Gatekeeper',
  Explorer: 'Explorer',
};
const QuestType = {
  Duty: 'Duty',
  Venture: 'Venture',
};
const RewardCategory = {
  Currency: 'Currency',
  XP: 'XP',
};
const QuestAvailability = {
    Daily: 'Daily',
    Weekly: 'Weekly',
    Monthly: 'Monthly',
    Frequency: 'Frequency',
    Unlimited: 'Unlimited',
};
const TrophyRequirementType = {
    CompleteQuestType: 'COMPLETE_QUEST_TYPE',
    EarnTotalReward: 'EARN_TOTAL_REWARD',
    AchieveRank: 'ACHIEVE_RANK',
    CompleteQuestTag: 'COMPLETE_QUEST_TAG',
};
const INITIAL_QUEST_GROUPS = [
    { id: 'qg-household', name: 'Household Chores', description: 'General tasks related to keeping the house clean and tidy.', icon: '🏡' },
    { id: 'qg-school', name: 'School & Learning', description: 'Quests related to homework, studying, and educational activities.', icon: '📚' },
    { id: 'qg-personal', name: 'Personal Goals', description: 'Quests for self-improvement, habits, and personal projects.', icon: '🎯' },
    { id: 'qg-health', name: 'Health & Wellness', description: 'Tasks for physical and mental well-being, like exercise and hygiene.', icon: '❤️‍🩹' },
    { id: 'qg-family', name: 'Family & Social', description: 'Quests that involve spending time with or helping family and friends.', icon: '👨‍👩‍👧‍👦' },
    { id: 'qg-creative', name: 'Creative & Hobbies', description: 'Quests for art, music, building, and other creative pursuits.', icon: '🎨' },
    { id: 'qg-outdoor', name: 'Outdoor & Adventure', description: 'Tasks related to yard work, playing outside, and exploring nature.', icon: '🌳' },
    { id: 'qg-kindness', name: 'Kindness & Service', description: 'Quests focused on helping others, showing appreciation, and community service.', icon: '💖' },
];
const createMockUsers = () => {
    const usersData = [
        { firstName: 'The', lastName: 'Admin', username: 'admin', email: 'admin@donegeon.com', gameName: 'admin', birthday: '2000-01-01', role: Role.DonegeonMaster, password: '123456', pin: '1234' },
        { firstName: 'Gate', lastName: 'Keeper', username: 'gatekeeper', email: 'gatekeeper@donegeon.com', gameName: 'Gatekeeper', birthday: '1995-08-20', role: Role.Gatekeeper, password: '123456', pin: '1234' },
        { firstName: 'New', lastName: 'Explorer', username: 'explorer', email: 'explorer@donegeon.com', gameName: 'Explorer', birthday: '2010-04-15', role: Role.Explorer, pin: '1234' },
    ];
    const initialUsers = usersData.map((u, i) => ({
        ...u,
        id: `user-${i + 1}`,
        avatar: {},
        ownedAssetIds: [],
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    }));
    const explorer = initialUsers.find(u => u.username === 'explorer');
    if (explorer) {
        explorer.personalPurse = { 'core-gold': 100 };
    }
    return initialUsers;
};
const INITIAL_REWARD_TYPES = [
    { id: 'core-gold', name: 'Gold Coins', category: RewardCategory.Currency, description: 'Can be exchanged for real money or items.', isCore: true, iconType: 'emoji', icon: '💰' },
    { id: 'core-gems', name: 'Gems', category: RewardCategory.Currency, description: 'Earned from service or helping. Used for experiences.', isCore: true, iconType: 'emoji', icon: '💎' },
    { id: 'core-crystal', name: 'Crystals', category: RewardCategory.Currency, description: 'Earned from small tasks. Used for screen time.', isCore: true, iconType: 'emoji', icon: '🔮' },
    { id: 'core-strength', name: 'Strength', category: RewardCategory.XP, description: 'Earned from physical tasks.', isCore: true, iconType: 'emoji', icon: '💪' },
    { id: 'core-diligence', name: 'Diligence', category: RewardCategory.XP, description: 'Earned from careful, persistent work like cleaning and organizing.', isCore: true, iconType: 'emoji', icon: '🧹' },
    { id: 'core-wisdom', name: 'Wisdom', category: RewardCategory.XP, description: 'Earned from learning activities.', isCore: true, iconType: 'emoji', icon: '🧠' },
    { id: 'core-skill', name: 'Skill', category: RewardCategory.XP, description: 'Earned from practice and sports.', isCore: true, iconType: 'emoji', icon: '🎯' },
    { id: 'core-creative', name: 'Creativity', category: RewardCategory.XP, description: 'Earned from artistic and creative endeavors.', isCore: true, iconType: 'emoji', icon: '🎨' },
];
const rankNames = ["Novice", "Initiate", "Apprentice", "Journeyman", "Adept", "Squire", "Knight", "Guardian", "Sentinel", "Champion", "Vanguard", "Paladin", "Myrmidon", "Justicar", "Marshal", "Baron", "Viscount", "Earl", "Marquess", "Duke", "Warlord", "Conqueror", "Highlord", "Overlord", "Master", "Grandmaster", "Elder", "Mystic", "Sage", "Archsage", "Shadow", "Phantom", "Spectre", "Wraith", "Lich", "Paragon", "Exemplar", "Titan", "Colossus", "Behemoth", "Celestial", "Empyrean", "Astral", "Ethereal", "Cosmic", "Demigod", "Ascendant", "Immortal", "Transcendent", "The Absolute"];
const rankIcons = ['🔰', '🌱', '🛠️', '🧭', '🔥', '🛡️', '⚔️', '🏰', '🔭', '🏆', '🎖️', '⚜️', '💠', '⚖️', '👑', '🌍', '🚀', '🌌', '🌟', '✨', '🔥', '💥', '💫', '☄️', '🪐', '⭐', '🥇', '🏅', '🎖️', '🏆', '👻', '💀', '☠️', '🎃', '👽', '💎', '💍', '👑', '🔱', '⚡', '🌈', '🌊', '🌋', '🏔️', '🌪️', '☀️', '🌕', '🌠', '🎇', '💥'];
const INITIAL_RANKS = Array.from({ length: 50 }, (_, i) => ({
    id: `rank-${i + 1}`, name: rankNames[i] || `Level ${i + 1}`, xpThreshold: Math.floor(i * (50 + i * 5)), iconType: 'emoji', icon: rankIcons[i] || '❓',
}));
const INITIAL_MAIN_SIDEBAR_CONFIG = [
  { type: 'link', id: 'Dashboard', emoji: '🏠', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_dashboard' }, { type: 'link', id: 'Quests', emoji: '🗺️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_quests' }, { type: 'link', id: 'Calendar', emoji: '🗓️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_calendar' }, { type: 'link', id: 'Marketplace', emoji: '💰', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_marketplace' }, { type: 'header', id: 'header-character', title: 'Explorer', emoji: '🧑‍🚀', level: 0, role: Role.Explorer, isVisible: true }, { type: 'link', id: 'Chronicles', emoji: '📜', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_chronicles' }, { type: 'link', id: 'Guild', emoji: '🏰', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_guild' }, { type: 'link', id: 'Progress', emoji: '📊', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_progress' }, { type: 'link', id: 'Avatar', emoji: '🧑‍🎤', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_avatar' }, { type: 'link', id: 'Ranks', emoji: '🎖️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_ranks' }, { type: 'link', id: 'Collection', emoji: '🎒', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_collection' }, { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_trophies' }, { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_themes' }, { type: 'header', id: 'header-admin-community', title: 'User Management', emoji: '🛡️', level: 0, role: Role.Gatekeeper, isVisible: true }, { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: Role.Gatekeeper, termKey: 'link_approvals' }, { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_users' }, { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_guilds' }, { type: 'header', id: 'header-admin-content', title: 'Content Management', emoji: '📚', level: 0, role: Role.DonegeonMaster, isVisible: true }, { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quests' }, { type: 'link', id: 'Manage Quest Groups', emoji: '📂', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quest_groups' }, { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_markets' }, { type: 'link', id: 'Manage Goods', emoji: '⚔️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_items' }, { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_trophies' }, { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_ranks' }, { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_rewards' }, { type: 'link', id: 'Manage Events', emoji: '🎉', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_events' }, { type: 'link', id: 'Theme Editor', emoji: '🎭', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_theme_editor' }, { type: 'header', id: 'header-admin-system', title: 'System Tools', emoji: '🛠️', level: 0, role: Role.DonegeonMaster, isVisible: true }, { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_asset_manager' }, { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_backup_import' }, { type: 'link', id: 'Object Exporter', emoji: '🗂️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_object_exporter' }, { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_appearance' }, { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_asset_library' }, { type: 'link', id: 'AI Studio', emoji: '✨', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_ai_studio' }, { type: 'separator', id: 'sep-system-settings', level: 0, role: Role.DonegeonMaster, isVisible: true }, { type: 'link', id: 'Settings', emoji: '⚙️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_settings' }, { type: 'separator', id: 'sep-settings-chat', level: 0, role: Role.Explorer, isVisible: true }, { type: 'link', id: 'Chat', emoji: '💬', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_chat' }, { type: 'header', id: 'header-help', title: 'Help', emoji: '❓', level: 0, role: Role.Explorer, isVisible: true }, { type: 'link', id: 'Help Guide', emoji: '❓', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_help_guide' }, { type: 'link', id: 'About', emoji: 'ℹ️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_about' },
];
const rawThemes = { emerald: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "224 71% 4%", '--color-bg-secondary': "224 39% 10%", '--color-bg-tertiary': "240 10% 19%", '--color-text-primary': "240 8% 90%", '--color-text-secondary': "240 6% 65%", '--color-border': "240 6% 30%", '--color-primary-hue': "158", '--color-primary-saturation': "84%", '--color-primary-lightness': "39%", '--color-accent-hue': "158", '--color-accent-saturation': "75%", '--color-accent-lightness': "58%", '--color-accent-light-hue': "158", '--color-accent-light-saturation': "70%", '--color-accent-light-lightness': "45%" }, rose: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "334 27% 10%", '--color-bg-secondary': "334 20% 15%", '--color-bg-tertiary': "334 15% 22%", '--color-text-primary': "346 33% 94%", '--color-text-secondary': "346 20% 70%", '--color-border': "346 15% 40%", '--color-primary-hue': "346", '--color-primary-saturation': "84%", '--color-primary-lightness': "59%", '--color-accent-hue': "346", '--color-accent-saturation': "91%", '--color-accent-lightness': "71%", '--color-accent-light-hue': "346", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" }, sky: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "217 33% 12%", '--color-bg-secondary': "217 28% 17%", '--color-bg-tertiary': "217 25% 25%", '--color-text-primary': "210 40% 98%", '--color-text-secondary': "215 25% 75%", '--color-border': "215 20% 40%", '--color-primary-hue': "204", '--color-primary-saturation': "85%", '--color-primary-lightness': "54%", '--color-accent-hue': "202", '--color-accent-saturation': "90%", '--color-accent-lightness': "70%", '--color-accent-light-hue': "202", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" } };
const INITIAL_THEMES = Object.entries(rawThemes).map(([id, styles]) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1), isCustom: false, styles }));
const INITIAL_SETTINGS = { contentVersion: 0, favicon: '🏰', forgivingSetbacks: true, questDefaults: { requiresApproval: false, isOptional: false, isActive: true, }, security: { requirePinForUsers: true, requirePasswordForAdmin: true, allowProfileEditing: true, }, sharedMode: { enabled: false, quickUserSwitchingEnabled: true, allowCompletion: false, autoExit: false, autoExitMinutes: 2, userIds: [], }, automatedBackups: { enabled: false, frequencyHours: 24, maxBackups: 7, }, loginNotifications: { enabled: true, }, theme: 'emerald', terminology: { appName: 'Task Donegeon', task: 'Quest', tasks: 'Quests', recurringTask: 'Duty', recurringTasks: 'Duties', singleTask: 'Venture', singleTasks: 'Ventures', shoppingCenter: 'Marketplace', store: 'Market', stores: 'Markets', history: 'Chronicles', group: 'Guild', groups: 'Guilds', level: 'Rank', levels: 'Ranks', award: 'Trophy', awards: 'Trophies', point: 'Reward', points: 'Rewards', xp: 'XP', currency: 'Currency', negativePoint: 'Setback', negativePoints: 'Setbacks', admin: 'Donegeon Master', moderator: 'Gatekeeper', user: 'Explorer', link_dashboard: 'Dashboard', link_quests: 'Quests', link_marketplace: 'Marketplace', link_calendar: 'Calendar', link_avatar: 'Avatar', link_collection: 'Collection', link_themes: 'Themes', link_guild: 'Guild', link_progress: 'Progress', link_trophies: 'Trophies', link_ranks: 'Ranks', link_chronicles: 'Chronicles', link_manage_quests: 'Manage Quests', link_manage_quest_groups: 'Manage Quest Groups', link_manage_items: 'Manage Goods', link_manage_markets: 'Manage Markets', link_manage_rewards: 'Manage Rewards', link_manage_ranks: 'Manage Ranks', link_manage_trophies: 'Manage Trophies', link_manage_events: 'Manage Events', link_theme_editor: 'Theme Editor', link_approvals: 'Approvals', link_manage_users: 'Manage Users', link_manage_guilds: 'Manage Guilds', link_ai_studio: 'AI Studio', link_appearance: 'Appearance', link_object_exporter: 'Object Exporter', link_asset_manager: 'Asset Manager', link_backup_import: 'Backup & Import', link_asset_library: 'Asset Library', link_settings: 'Settings', link_about: 'About', link_help_guide: 'Help Guide', link_chat: 'Chat', }, enableAiFeatures: false, rewardValuation: { enabled: true, anchorRewardId: 'core-gold', exchangeRates: { 'core-gems': 0.1, 'core-crystal': 20, 'core-strength': 10, 'core-diligence': 10, 'core-wisdom': 5, 'core-skill': 5, 'core-creative': 5, }, currencyExchangeFeePercent: 5, xpExchangeFeePercent: 10, }, chat: { enabled: true, chatEmoji: '💬', }, sidebars: { main: INITIAL_MAIN_SIDEBAR_CONFIG, dataManagement: [ { type: 'link', id: 'Object Exporter', emoji: '🗂️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_object_exporter' }, { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_asset_manager' }, { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_asset_library' }, { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_backup_import' }, ] } };
const INITIAL_TROPHIES = [ { id: 'trophy-1', name: 'First Quest', description: 'Complete your first quest.', iconType: 'emoji', icon: '🎉', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1}] }, { id: 'trophy-2', name: 'First Customization', description: 'Change your theme for the first time.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] }, { id: 'trophy-3', name: 'The Adjudicator', description: 'Approve or reject a pending quest.', iconType: 'emoji', icon: '⚖️', isManual: true, requirements: [] }, { id: 'trophy-4', name: 'World Builder', description: 'Create a new quest.', iconType: 'emoji', icon: '🛠️', isManual: true, requirements: [] }, { id: 'trophy-5', name: 'The Name Changer', description: 'Rename a user in the Manage Users panel.', iconType: 'emoji', icon: '✍️', isManual: true, requirements: [] }, { id: 'trophy-6', name: 'Initiate Rank', description: 'Achieve the rank of Initiate', iconType: 'emoji', icon: '🌱', isManual: false, requirements: [{type: TrophyRequirementType.AchieveRank, value: 'rank-2', count: 1}]}, { id: 'trophy-7', name: 'The Philanthropist', description: 'Donate an item to a guildmate.', iconType: 'emoji', icon: '🎁', isManual: true, requirements: [] }, { id: 'trophy-8', name: 'Master of Coin', description: 'Amass 1,000 gold.', iconType: 'emoji', icon: '💰', isManual: true, requirements: [] }, { id: 'trophy-9', name: 'Dungeon Crawler', description: 'Complete 10 Ventures.', iconType: 'emoji', icon: '🗺️', isManual: true, requirements: [] }, { id: 'trophy-10', name: 'Daily Grind', description: 'Complete 25 Duties.', iconType: 'emoji', icon: '⚙️', isManual: true, requirements: [] }, { id: 'trophy-11', name: 'The Collector', description: 'Own 10 unique items.', iconType: 'emoji', icon: '📦', isManual: true, requirements: [] }, { id: 'trophy-12', name: 'Fashionista', description: 'Own 5 pieces of avatar equipment.', iconType: 'emoji', icon: '🧑‍🎤', isManual: true, requirements: [] }, { id: 'trophy-13', name: 'The Completionist', description: 'Complete all available quests for a day.', iconType: 'emoji', icon: '💯', isManual: true, requirements: [] }, { id: 'trophy-14', name: 'The Achiever', description: 'Earn 5 other trophies.', iconType: 'emoji', icon: '🏆', isManual: true, requirements: [] }, { id: 'trophy-15', name: 'The Socialite', description: 'Join a guild.', iconType: 'emoji', icon: '🤝', isManual: true, requirements: [] }, { id: 'trophy-16', name: 'The Founder', description: 'Create a guild.', iconType: 'emoji', icon: '🏰', isManual: true, requirements: [] }, { id: 'trophy-17', name: 'The Merchant', description: 'Sell an item in the marketplace.', iconType: 'emoji', icon: '📈', isManual: true, requirements: [] }, { id: 'trophy-18', name: 'The Artisan', description: 'Craft an item.', iconType: 'emoji', icon: '🔨', isManual: true, requirements: [] }, { id: 'trophy-19', name: 'The Explorer', description: 'Discover a hidden area or secret.', iconType: 'emoji', icon: '🧭', isManual: true, requirements: [] }, { id: 'trophy-20', name: 'The Loremaster', description: 'Read 10 in-game books or lore entries.', iconType: 'emoji', icon: '📚', isManual: true, requirements: [] }, { id: 'trophy-21', name: 'The Beastmaster', description: 'Tame a pet.', iconType: 'emoji', icon: '🐾', isManual: true, requirements: [] }, { id: 'trophy-22', name: 'The Angler', description: 'Catch 50 fish.', iconType: 'emoji', icon: '🎣', isManual: true, requirements: [] }, { id: 'trophy-23', name: 'The Gardener', description: 'Harvest 100 plants.', iconType: 'emoji', icon: '🌱', isManual: true, requirements: [] }, { id: 'trophy-24', name: 'The Chef', description: 'Cook 20 different recipes.', iconType: 'emoji', icon: '🍳', isManual: true, requirements: [] }, { id: 'trophy-25', name: 'The Alchemist', description: 'Brew 15 different potions.', iconType: 'emoji', icon: '⚗️', isManual: true, requirements: [] }, { id: 'trophy-26', name: 'The Enchanter', description: 'Enchant an item.', iconType: 'emoji', icon: '✨', isManual: true, requirements: [] }, { id: 'trophy-27', name: 'The Blacksmith', description: 'Forge an item.', iconType: 'emoji', icon: '🔥', isManual: true, requirements: [] }, { id: 'trophy-28', name: 'The Jeweler', description: 'Cut a gemstone.', iconType: 'emoji', icon: '💎', isManual: true, requirements: [] }, { id: 'trophy-29', name: 'The Scribe', description: 'Write a scroll.', iconType: 'emoji', icon: '📜', isManual: true, requirements: [] }, { id: 'trophy-30', name: 'The Cartographer', description: 'Map out a new zone.', iconType: 'emoji', icon: '🗺️', isManual: true, requirements: [] }, { id: 'trophy-31', name: 'The Archaeologist', description: 'Uncover a lost artifact.', iconType: 'emoji', icon: '🏺', isManual: true, requirements: [] }, { id: 'trophy-32', name: 'The Linguist', description: 'Learn a new language.', iconType: 'emoji', icon: '🗣️', isManual: true, requirements: [] }, { id: 'trophy-33', name: 'The Musician', description: 'Master a musical instrument.', iconType: 'emoji', icon: '🎶', isManual: true, requirements: [] }, { id: 'trophy-34', name: 'The Dancer', description: 'Learn a new dance.', iconType: 'emoji', icon: '💃', isManual: true, requirements: [] }, { id: 'trophy-35', name: 'The Painter', description: 'Paint a masterpiece.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] }, { id: 'trophy-36', name: 'The Sculptor', description: 'Carve a statue.', iconType: 'emoji', icon: '🗿', isManual: true, requirements: [] }, { id: 'trophy-37', name: 'The Artist', description: 'For creating a masterpiece of art.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] }, { id: 'trophy-38', name: 'The Bard', description: 'For a wonderful musical performance.', iconType: 'emoji', icon: '🎵', isManual: true, requirements: [] }, { id: 'trophy-39', name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', iconType: 'emoji', icon: '🏰', isManual: true, requirements: [] }, { id: 'trophy-40', name: 'The Director', description: 'For creating and editing a video.', iconType: 'emoji', icon: '🎬', isManual: true, requirements: [] }, { id: 'trophy-41', name: 'The Photographer', description: 'For taking a beautiful photograph.', iconType: 'emoji', icon: '📷', isManual: true, requirements: [] }, { id: 'trophy-42', name: 'Team Player', description: 'For excellent teamwork in a game.', iconType: 'emoji', icon: '🏅', isManual: true, requirements: [] }, { id: 'trophy-43', name: 'Personal Best', description: 'For beating your own record.', iconType: 'emoji', icon: '📈', isManual: true, requirements: [] }, { id: 'trophy-44', name: 'Tournament Victor', description: 'For winning a tournament.', iconType: 'emoji', icon: '🥇', isManual: true, requirements: [] }, { id: 'trophy-45', name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', iconType: 'emoji', icon: '🤝', isManual: true, requirements: [] }, { id: 'trophy-46', name: 'Practice Pays Off', description: 'For mastering a new skill through practice.', iconType: 'emoji', icon: '🎯', isManual: true, requirements: [] }, { id: 'trophy-47', name: 'Master of the Mop', description: 'For mopping the floors to a sparkling shine.', iconType: 'emoji', icon: '✨', isManual: true, requirements: [] }, { id: 'trophy-48', name: 'Laundry Lord', description: 'For washing, drying, and folding 5 loads of laundry.', iconType: 'emoji', icon: '🧺', isManual: true, requirements: [] }, { id: 'trophy-49', name: 'The Green Thumb', description: 'For keeping a plant alive for a month.', iconType: 'emoji', icon: '🪴', isManual: true, requirements: [] }, { id: 'trophy-50', name: 'The Organizer', description: 'For decluttering a messy drawer or closet.', iconType: 'emoji', icon: '🗂️', isManual: true, requirements: [] }, { id: 'trophy-51', name: 'The Recycler', description: 'For consistently sorting the recycling correctly.', iconType: 'emoji', icon: '♻️', isManual: true, requirements: [] }, { id: 'trophy-52', name: 'The Repairman', description: 'For fixing something that was broken.', iconType: 'emoji', icon: '🛠️', isManual: true, requirements: [] }, { id: 'trophy-53', name: 'The Pet Pal', description: 'For taking excellent care of a pet.', iconType: 'emoji', icon: '🐾', isManual: true, requirements: [] }, { id: 'trophy-54', name: 'The Dust Slayer', description: 'For dusting the entire house.', iconType: 'emoji', icon: '🌬️', isManual: true, requirements: [] }, { id: 'trophy-55', name: 'Honor Roll', description: 'For getting straight A\'s on a report card.', iconType: 'emoji', icon: '🅰️', isManual: true, requirements: [] }, { id: 'trophy-56', name: 'Perfect Attendance', description: 'For not missing a single day of school.', iconType: 'emoji', icon: '🗓️', isManual: true, requirements: [] }, { id: 'trophy-57', name: 'Science Fair Winner', description: 'For winning a prize at the science fair.', iconType: 'emoji', icon: '🥇', isManual: true, requirements: [] }, { id: 'trophy-58', name: 'Spelling Bee Champ', description: 'For winning the spelling bee.', iconType: 'emoji', icon: '🐝', isManual: true, requirements: [] }, { id: 'trophy-59', name: 'Book Worm', description: 'For reading 25 books in a school year.', iconType: 'emoji', icon: '🐛', isManual: true, requirements: [] }, { id: 'trophy-60', name: 'The Punisher', description: 'For telling an exceptionally great (or terrible) pun.', iconType: 'emoji', icon: '😂', isManual: true, requirements: [] }, { id: 'trophy-61', name: 'Klutz of the Week', description: 'For a spectacular, harmless trip or fall.', iconType: 'emoji', icon: '🤕', isManual: true, requirements: [] }, { id: 'trophy-62', name: 'Bed Head', description: 'For having the most epic bed head one morning.', iconType: 'emoji', icon: '🛌', isManual: true, requirements: [] }, { id: 'trophy-63', name: 'The Snorter', description: 'For laughing so hard you snorted.', iconType: 'emoji', icon: '🐽', isManual: true, requirements: [] }, { id: 'trophy-64', name: 'Brain Fart', description: 'For a truly memorable moment of forgetfulness.', iconType: 'emoji', icon: '💨', isManual: true, requirements: [] }, { id: 'trophy-65', name: 'The Snackinator', description: 'For impressively finishing a bag of snacks.', iconType: 'emoji', icon: '🍿', isManual: true, requirements: [] }, { id: 'trophy-66', name: 'The Drama Llama', description: 'For an award-worthy dramatic performance over something small.', iconType: 'emoji', icon: '🎭', isManual: true, requirements: [] }, { id: 'trophy-67', name: 'Early Bird', description: 'For waking up on time without being told for a whole week.', iconType: 'emoji', icon: '🌅', isManual: true, requirements: [] }, { id: 'trophy-68', name: 'Night Owl', description: 'For staying up late to finish a project.', iconType: 'emoji', icon: '🦉', isManual: true, requirements: [] }, { id: 'trophy-69', name: 'Hydration Hero', description: 'For drinking 8 glasses of water in a day.', iconType: 'emoji', icon: '💧', isManual: true, requirements: [] }, { id: 'trophy-70', name: 'The Diplomat', description: 'For resolving an argument peacefully.', iconType: 'emoji', icon: '🕊️', isManual: true, requirements: [] }, { id: 'trophy-71', name: 'The Comedian', description: 'For making the entire family laugh out loud.', iconType: 'emoji', icon: '🤣', isManual: true, requirements: [] }, { id: 'trophy-72', name: 'The Encourager', description: 'For cheering up a family member who was feeling down.', iconType: 'emoji', icon: '🤗', isManual: true, requirements: [] }, { id: 'trophy-73', name: 'The Listener', description: 'For being a great listener when someone needed to talk.', iconType: 'emoji', icon: '👂', isManual: true, requirements: [] }, { id: 'trophy-74', name: 'The Giver', description: 'For giving a thoughtful, handmade gift.', iconType: 'emoji', icon: '🎁', isManual: true, requirements: [] }, { id: 'trophy-75', name: 'The Helper', description: 'For helping a sibling with their homework.', iconType: 'emoji', icon: '🧑‍🏫', isManual: true, requirements: [] }, { id: 'trophy-76', name: 'The Collaborator', description: 'For working well on a family project.', iconType: 'emoji', icon: '🧑‍🤝‍🧑', isManual: true, requirements: [] }, { id: 'trophy-77', name: 'The Welcomer', description: 'For making a guest feel welcome and included.', iconType: 'emoji', icon: '👋', isManual: true, requirements: [] }, { id: 'trophy-78', name: 'Speed Runner', description: 'For getting ready for school in record time.', iconType: 'emoji', icon: '⏱️', isManual: true, requirements: [] }, { id: 'trophy-79', name: 'Completionist', description: 'For finishing all your homework before dinner.', iconType: 'emoji', icon: '💯', isManual: true, requirements: [] }, { id: 'trophy-80', name: 'The Strategist', description: 'For winning a board game with a clever strategy.', iconType: 'emoji', icon: '♟️', isManual: true, requirements: [] }, { id: 'trophy-81', 'name': 'The Farmer', 'description': 'For helping with gardening or yard work.', iconType: 'emoji', 'icon': '🧑‍🌾', 'isManual': true, 'requirements': [] }, { id: 'trophy-82', name: 'The Co-op King', description: 'For successfully completing a two-person chore with a sibling.', iconType: 'emoji', icon: '🤝', isManual: true, requirements: [] }, { id: 'trophy-83', name: 'The Patient One', description: 'For waiting patiently without complaining.', iconType: 'emoji', icon: '⏳', isManual: true, requirements: [] }, { id: 'trophy-84', name: 'The Brave', description: 'For going to the doctor or dentist without any fuss.', iconType: 'emoji', icon: '씩', isManual: true, requirements: [] }, { id: 'trophy-85', name: 'The Problem Solver', description: 'For figuring out a tricky problem on your own.', iconType: 'emoji', icon: '💡', isManual: true, requirements: [] }, { id: 'trophy-86', name: 'The Tidy Titan', description: 'For keeping your room clean for a whole week.', iconType: 'emoji', icon: '✨', isManual: true, requirements: [] }, { id: 'trophy-87', name: 'The Gracious', description: 'For remembering to say "please" and "thank you" all day.', iconType: 'emoji', icon: '🙏', isManual: true, requirements: [] }, { id: 'trophy-88', name: 'The Independent', description: 'For completing your morning routine all by yourself.', iconType: 'emoji', icon: '🧍', isManual: true, requirements: [] }, { id: 'trophy-89', name: 'The Tech Support', description: 'For helping a family member with a tech problem.', iconType: 'emoji', icon: '💻', isManual: true, requirements: [] }, { id: 'trophy-90', name: 'The Foodie', description: 'For trying a new food without complaining.', iconType: 'emoji', icon: '😋', isManual: true, requirements: [] }, { id: 'trophy-91', name: 'The On-Time Arrival', description: 'For being ready to leave on time.', iconType: 'emoji', icon: '⏰', isManual: true, requirements: [] }, { id: 'trophy-92', name: 'The Car Cleaner', description: 'For helping to clean out the inside of the car.', iconType: 'emoji', icon: '🚗', isManual: true, requirements: [] }, { id: 'trophy-93', name: 'The Toy Tamer', description: 'For putting away all the toys after playing.', iconType: 'emoji', icon: '🧸', isManual: true, requirements: [] }, { id: 'trophy-94', name: 'The Leftover Legend', description: 'For eating leftovers without a fuss.', iconType: 'emoji', icon: '🍲', isManual: true, requirements: [] }, { id: 'trophy-95', name: 'The Chore Champion', description: 'For doing an extra chore without being asked.', iconType: 'emoji', icon: '🌟', isManual: true, requirements: [] }, { id: 'trophy-96', name: 'The Lost and Found', description: 'For finding something important that was lost.', iconType: 'emoji', icon: '🔍', isManual: true, requirements: [] }, { id: 'trophy-97', name: 'The Penny Pincher', description: 'For saving up your allowance for a goal.', iconType: 'emoji', icon: '🐷', isManual: true, requirements: [] },
];
const createSampleMarkets = () => ([ { id: 'market-tutorial', title: 'Tutorial Market', description: 'A place to complete your first quests.', iconType: 'emoji', icon: '🎓', status: { type: 'open' } }, { id: 'market-bank', title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', iconType: 'emoji', icon: '⚖️', status: { type: 'open' } }, { id: 'market-experiences', title: 'The Guild of Adventurers', description: 'Spend your hard-earned gems on real-world experiences and privileges.', iconType: 'emoji', icon: '🎟️', status: { type: 'open' } }, { id: 'market-candy', title: 'The Sugar Cube', description: 'A delightful shop for purchasing sweet treats with your crystals.', iconType: 'emoji', icon: '🍬', status: { type: 'open' } }, ]);
const createSampleGameAssets = () => ([ { id: 'ga-theme-sapphire', name: 'Sapphire Theme Unlock', description: 'Unlocks the cool blue Sapphire theme for your account.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Sapphire', icon: '🎨', category: 'Theme', avatarSlot: undefined, isForSale: true, costGroups: [[{rewardTypeId: 'core-gold', amount: 50}]], marketIds: ['market-tutorial'], creatorId: 'user-1', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'sapphire', }, ]);
const createInitialGuilds = (users) => ([ { id: 'guild-1', name: 'The First Guild', purpose: 'The default guild for all new adventurers.', memberIds: users.map(u => u.id), isDefault: true }, ]);
const createSampleQuests = (users) => { const explorer = users.find(u => u.role === Role.Explorer); const gatekeeper = users.find(u => u.role === Role.Gatekeeper); const donegeonMaster = users.find(u => u.role === Role.DonegeonMaster); return [ { id: 'quest-explorer-1', title: 'Change Your Theme', description: "First, visit the Marketplace and buy the 'Sapphire Theme Unlock' from the Tutorial Market. Then, go to the 'Themes' page from the sidebar to activate it!", type: QuestType.Venture, iconType: 'emoji', icon: '🎨', tags: ['tutorial', 'tutorial-explorer'], rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal' }, { id: 'quest-gatekeeper-approval-setup', title: 'Submit A Note', description: "Complete this quest to test the approval system.", type: QuestType.Venture, iconType: 'emoji', icon: '📝', tags: ['tutorial', 'tutorial-explorer'], rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: true, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal' }, { id: 'quest-gatekeeper-1', title: 'The First Approval', description: "An Explorer has submitted a quest for approval. Go to the 'Approvals' page and either approve or reject it.", type: QuestType.Venture, iconType: 'emoji', icon: '✅', tags: ['tutorial', 'tutorial-gatekeeper'], rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: gatekeeper ? [gatekeeper.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal' }, { id: 'quest-dm-1', title: 'Create a Quest', description: "Go to 'Manage Quests' and create a new quest of any type. Assign it to the Explorer.", type: QuestType.Venture, iconType: 'emoji', icon: '🛠️', tags: ['tutorial', 'tutorial-donegeon-master'], rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal' }, ]; };
const createInitialQuestCompletions = (users, quests) => { return []; };
// === END INLINED DATA ===

// --- Environment Variable Checks ---
const requiredEnv = ['DATABASE_URL', 'STORAGE_PROVIDER'];
if (process.env.STORAGE_PROVIDER === 'supabase') {
    requiredEnv.push('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
}
for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: ${envVar} environment variable is not set.`);
        process.exit(1);
    }
}

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === WebSocket Logic ===
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  console.log('Client connected to WebSocket');
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});


const broadcast = (data) => {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonData);
    }
  });
};

// === Middleware ===
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['https://taskdonegeon.mckayc.com', 'http://localhost:3000', 'http://localhost:3002'];
    if (process.env.VERCEL_URL) {
        allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Allow Vercel preview URLs
    if (origin && origin.endsWith('.vercel.app')) {
        allowedOrigins.push(origin);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// === Supabase Client (if applicable) ===
let supabase;
if (process.env.STORAGE_PROVIDER === 'supabase') {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// === Gemini AI Client ===
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set. AI features will be disabled.");
}

// === Multer Configuration for File Uploads ===
const UPLOADS_DIR = path.resolve('/app', 'uploads');
const storage = process.env.STORAGE_PROVIDER === 'supabase'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        const finalDir = path.join(UPLOADS_DIR, sanitizedCategory);
        try {
            await fs.mkdir(finalDir, { recursive: true });
            cb(null, finalDir);
        } catch (err) {
            cb(err);
        }
      },
      filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
      }
    });

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

let dbReady = false;

const initializeDatabase = async () => {
    let retries = 5;
    while (retries > 0) {
        try {
            const client = await pool.connect();
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS app_data (
                        key TEXT PRIMARY KEY,
                        value JSONB NOT NULL
                    );
                `);
                console.log("Table 'app_data' is ready.");
                await fs.mkdir(BACKUP_DIR, { recursive: true });
                console.log(`Backup directory is ready at: ${BACKUP_DIR}`);
                dbReady = true;
                return; // Success
            } finally {
                client.release();
            }
        } catch (err) {
            console.error(`Database initialization failed, ${retries - 1} retries left...`, err.message);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    console.error('Could not connect to database after several retries. The server will run in a degraded state.');
    dbReady = false;
};

initializeDatabase();

const checkDbConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query('SELECT NOW()');
        dbReady = true;
        return true;
    } catch (err) {
        console.error("Database connection check failed:", err.message);
        dbReady = false;
        return false;
    } finally {
        if (client) client.release();
    }
}

const dbHealthCheckMiddleware = async (req, res, next) => {
    if (dbReady) return next();
    
    const isConnected = await checkDbConnection();
    if (isConnected) {
        return next();
    }
    
    res.status(503).json({ error: 'Database is currently unavailable. Please try again later.' });
};

const ALL_DATA_KEYS = [
    'users', 'quests', 'questGroups', 'markets', 'rewardTypes', 'questCompletions',
    'purchaseRequests', 'guilds', 'ranks', 'trophies', 'userTrophies', 'adminAdjustments',
    'gameAssets', 'systemLogs', 'settings', 'themes', 'loginHistory', 'chatMessages',
    'systemNotifications', 'scheduledEvents'
];

const loadData = async () => {
    const result = await pool.query('SELECT key, value FROM app_data');
    const data = {};
    ALL_DATA_KEYS.forEach(key => { data[key] = []; }); // Initialize all keys
    data.settings = {}; // Settings is an object

    result.rows.forEach(row => {
        data[row.key] = row.value;
    });
    return data;
};

const saveDataSlice = async (key, sliceData) => {
    const dataString = JSON.stringify(sliceData);
    await pool.query(
        `INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2;`,
        [key, dataString]
    );
};

// === API Action Handler ===
const handleMultiSliceApiAction = async (res, sliceKeys, action) => {
    try {
        const data = await loadData();
        const result = await action(data); // action can be async now
        
        const uniqueSliceKeys = [...new Set(sliceKeys)];
        const savePromises = uniqueSliceKeys.map(key => saveDataSlice(key, data[key]));
        await Promise.all(savePromises);

        uniqueSliceKeys.forEach(key => {
            broadcast({ type: `${key.toUpperCase()}_UPDATED`, payload: data[key] });
        });
        
        res.status(200).json(result || { success: true });
    } catch (err) {
        console.error("API Action Error:", err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const applyRewards = (user, rewardsToApply, rewardTypes, guildId) => {
    rewardsToApply.forEach(reward => {
        const rewardDef = rewardTypes.find(rd => rd.id === reward.rewardTypeId);
        if (!rewardDef) return;
        
        if (guildId) {
            const guildBalance = user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} };
            if (rewardDef.category === 'Currency') {
                guildBalance.purse[reward.rewardTypeId] = (guildBalance.purse[reward.rewardTypeId] || 0) + reward.amount;
            } else { // XP
                guildBalance.experience[reward.rewardTypeId] = (guildBalance.experience[reward.rewardTypeId] || 0) + reward.amount;
            }
        } else { // Personal
            if (rewardDef.category === 'Currency') {
                user.personalPurse[reward.rewardTypeId] = (user.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
            } else { // XP
                user.personalExperience[reward.rewardTypeId] = (user.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
            }
        }
    });
};

const applySetbacks = (user, setbacksToApply, rewardTypes, guildId) => {
    setbacksToApply.forEach(setback => {
        const rewardDef = rewardTypes.find(rd => rd.id === setback.rewardTypeId);
        if (!rewardDef) return;

        if (guildId) {
            const guildBalance = user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} };
            if (rewardDef.category === 'Currency') {
                guildBalance.purse[setback.rewardTypeId] = Math.max(0, (guildBalance.purse[setback.rewardTypeId] || 0) - setback.amount);
            } else {
                guildBalance.experience[setback.rewardTypeId] = Math.max(0, (guildBalance.experience[setback.rewardTypeId] || 0) - setback.amount);
            }
        } else {
            if (rewardDef.category === 'Currency') {
                user.personalPurse[setback.rewardTypeId] = Math.max(0, (user.personalPurse[setback.rewardTypeId] || 0) - setback.amount);
            } else {
                user.personalExperience[setback.rewardTypeId] = Math.max(0, (user.personalExperience[setback.rewardTypeId] || 0) - setback.amount);
            }
        }
    });
};

const checkAndAwardTrophies = (user, data) => {
    data.trophies.forEach(trophy => {
        if (trophy.isManual || !trophy.requirements || trophy.requirements.length === 0) return;

        const hasTrophy = data.userTrophies.some(ut => ut.userId === user.id && ut.trophyId === trophy.id && ut.guildId === undefined);
        if (hasTrophy) return;

        const allRequirementsMet = trophy.requirements.every(req => {
            const userCompletions = data.questCompletions.filter(c => c.userId === user.id && !c.guildId && c.status === 'Approved');
            switch (req.type) {
                case TrophyRequirementType.CompleteQuestType:
                    return userCompletions.filter(c => {
                        const completedQuest = data.quests.find(q => q.id === c.questId);
                        return completedQuest?.type === req.value;
                    }).length >= req.count;
                case TrophyRequirementType.CompleteQuestTag:
                     return userCompletions.filter(c => {
                        const completedQuest = data.quests.find(q => q.id === c.questId);
                        return completedQuest?.tags?.includes(req.value);
                    }).length >= req.count;
                case TrophyRequirementType.AchieveRank:
                     const totalXp = Object.values(user.personalExperience).reduce((sum, amount) => sum + amount, 0);
                     const requiredRank = data.ranks.find(r => r.id === req.value);
                     return requiredRank ? totalXp >= requiredRank.xpThreshold : false;
                default:
                    return false;
            }
        });

        if (allRequirementsMet) {
            data.userTrophies.push({ id: `ut-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId: user.id, trophyId: trophy.id, awardedAt: new Date().toISOString(), guildId: undefined });
        }
    });
};


app.get('/api/health', async (req, res) => {
    const isConnected = await checkDbConnection();
    if (isConnected) {
        res.status(200).json({ status: 'ok' });
    } else {
        res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
});

app.get('/api/metadata', async (req, res, next) => {
    try {
        const metadataPath = path.join(__dirname, '..', 'metadata.json');
        res.sendFile(metadataPath);
    } catch (err) {
        next(err);
    }
});

// === Apply DB Health Check Middleware to all subsequent API routes ===
// Routes that don't need the DB (like AI status) can be placed before this line.
app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!ai }));

app.get('/api/pre-run-check', async (req, res, next) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT value FROM app_data WHERE key = 'settings'");
            if (result.rows.length > 0) {
                const settings = result.rows[0].value;
                res.json({
                    dataExists: true,
                    version: settings.contentVersion || 0,
                    appName: settings.terminology?.appName || 'Task Donegeon'
                });
            } else {
                res.json({ dataExists: false });
            }
        } finally {
            client.release();
        }
    } catch (err) {
        // If table doesn't exist, etc., assume no data
        if (err.code === '42P01') { // undefined_table
             res.json({ dataExists: false });
        } else {
            next(err);
        }
    }
});

app.use('/api', dbHealthCheckMiddleware);

app.post('/api/first-run', async (req, res) => {
    try {
        const { adminUserData, setupChoice, blueprint } = req.body;
        
        await pool.query('TRUNCATE TABLE app_data;');

        const newAdminUser = {
            ...adminUserData,
            id: `user-${Date.now()}`,
            avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
            guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false
        };

        let newAppData;
        if (setupChoice === 'guided') {
            const allUsers = [newAdminUser]; const sampleQuests = createSampleQuests(allUsers); const sampleGuilds = createInitialGuilds(allUsers);
            newAppData = {
                users: allUsers, quests: sampleQuests, questGroups: INITIAL_QUEST_GROUPS, markets: createSampleMarkets(), rewardTypes: INITIAL_REWARD_TYPES,
                questCompletions: createInitialQuestCompletions(allUsers, sampleQuests), purchaseRequests: [], guilds: sampleGuilds, ranks: INITIAL_RANKS,
                trophies: INITIAL_TROPHIES, userTrophies: [], adminAdjustments: [], gameAssets: createSampleGameAssets(), systemLogs: [],
                settings: { ...INITIAL_SETTINGS, contentVersion: 1 }, themes: INITIAL_THEMES, loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: []
            };
        } else if (setupChoice === 'scratch') {
             const allUsers = [newAdminUser]; const sampleGuilds = createInitialGuilds(allUsers);
             newAppData = {
                users: allUsers, quests: [], questGroups: [], markets: [], rewardTypes: INITIAL_REWARD_TYPES, questCompletions: [], purchaseRequests: [],
                guilds: sampleGuilds, ranks: INITIAL_RANKS, trophies: [], userTrophies: [], adminAdjustments: [], gameAssets: [], systemLogs: [],
                settings: { ...INITIAL_SETTINGS, contentVersion: 1 }, themes: INITIAL_THEMES, loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: []
             };
        } else if (setupChoice === 'import' && blueprint) {
            const allUsers = [newAdminUser];
            const sampleGuilds = createInitialGuilds(allUsers);
            newAppData = {
                users: allUsers,
                quests: blueprint.assets.quests || [],
                questGroups: blueprint.assets.questGroups || [],
                markets: blueprint.assets.markets || [],
                rewardTypes: [...INITIAL_REWARD_TYPES, ...(blueprint.assets.rewardTypes || [])],
                questCompletions: [], purchaseRequests: [],
                guilds: sampleGuilds,
                ranks: blueprint.assets.ranks || INITIAL_RANKS,
                trophies: blueprint.assets.trophies || [],
                userTrophies: [], adminAdjustments: [],
                gameAssets: blueprint.assets.gameAssets || [],
                systemLogs: [],
                settings: { ...INITIAL_SETTINGS, contentVersion: 1 },
                themes: INITIAL_THEMES,
                loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: []
            };
        }
        else {
            throw new Error('Invalid setup choice provided.');
        }
        
        const savePromises = Object.entries(newAppData).map(([key, value]) => saveDataSlice(key, value));
        await Promise.all(savePromises);

        res.status(201).json({ user: newAdminUser });
    } catch (err) {
        console.error("First Run Error:", err);
        res.status(500).json({ error: 'Failed to complete first run setup.' });
    }
});


app.get('/api/data', async (req, res, next) => {
    try {
        const data = await loadData();
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
});
app.post('/api/data', async (req, res) => {
    try {
        const dataToRestore = req.body;
        await pool.query('TRUNCATE TABLE app_data;');
        const savePromises = Object.entries(dataToRestore).map(([key, value]) => saveDataSlice(key, value));
        await Promise.all(savePromises);
        broadcast({ type: 'FULL_REFRESH_REQUESTED' });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Restore Error:", err);
        res.status(500).json({ error: 'Failed to restore data.' });
    }
});


// === GRANULAR API ENDPOINTS ===

// --- Users ---
app.post('/api/users', async (req, res) => handleMultiSliceApiAction(res, ['users', 'guilds', 'quests'], data => {
    const newUser = {
        ...req.body, id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
        guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false
    };
    data.users.push(newUser);
    const defaultGuild = data.guilds.find(g => g.isDefault);
    if (defaultGuild) defaultGuild.memberIds.push(newUser.id);
    return { user: newUser };
}));
app.put('/api/users/:id', async (req, res) => handleMultiSliceApiAction(res, ['users'], data => {
    const userIndex = data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) throw { statusCode: 404, message: 'User not found' };
    data.users[userIndex] = { ...data.users[userIndex], ...req.body };
}));
app.delete('/api/users/:id', async (req, res) => handleMultiSliceApiAction(res, ['users', 'guilds', 'quests'], data => {
    const userId = req.params.id;
    data.users = data.users.filter(u => u.id !== userId);
    data.guilds.forEach(g => { g.memberIds = g.memberIds.filter(id => id !== userId); });
    data.quests.forEach(q => { q.assignedUserIds = q.assignedUserIds.filter(id => id !== userId); });
}));

// --- Adjustments ---
app.post('/api/adjustments', async (req, res) => handleMultiSliceApiAction(res, ['adminAdjustments', 'users', 'userTrophies'], data => {
    const { userId, type, rewards, setbacks, trophyId, reason, adjusterId, guildId } = req.body;
    const user = data.users.find(u => u.id === userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const newAdjustment = {
        id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString(),
        userId, adjusterId, type, reason, guildId: guildId || undefined,
        rewards: [], setbacks: [], trophyId,
    };

    if (type === 'Reward' && rewards) { applyRewards(user, rewards, data.rewardTypes, guildId); newAdjustment.rewards = rewards; }
    else if (type === 'Setback' && setbacks) { applySetbacks(user, setbacks, data.rewardTypes, guildId); newAdjustment.setbacks = setbacks; }
    else if (type === 'Trophy' && trophyId) {
        const alreadyHasTrophy = data.userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophyId && ut.guildId === (guildId || undefined));
        if (!alreadyHasTrophy) { data.userTrophies.push({ id: `ut-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId: guildId || undefined }); }
    }
    data.adminAdjustments.push(newAdjustment);
}));

// --- Quests ---
const questHandler = (sliceKeys) => (req, res) => handleMultiSliceApiAction(res, sliceKeys, (data) => {
    const { action, userId } = req.body; const questId = req.params.id;
    const questIndex = data.quests.findIndex(q => q.id === questId);
    if (questIndex === -1 && questId) throw { statusCode: 404, message: 'Quest not found' };

    switch (req.path) {
        case '/api/quests': data.quests.push({ ...req.body, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [], todoUserIds: [] }); break;
        case `/api/quests/${questId}`: data.quests[questIndex] = req.body; break;
        case `/api/quests/${questId}/clone`: const qtc = data.quests[questIndex]; data.quests.push({ ...JSON.parse(JSON.stringify(qtc)), id: `quest-${Date.now()}`, title: `${qtc.title} (Copy)`}); break;
        case `/api/quests/${questId}/actions`:
            const quest = data.quests[questIndex];
            switch(action) {
                case 'dismiss': quest.dismissals = [...quest.dismissals.filter(d => d.userId !== userId), { userId, dismissedAt: new Date().toISOString() }]; break;
                case 'claim': quest.claimedByUserIds.push(userId); break;
                case 'release': quest.claimedByUserIds = quest.claimedByUserIds.filter(id => id !== userId); break;
                case 'mark_todo': quest.todoUserIds = [...(quest.todoUserIds || []), userId]; break;
                case 'unmark_todo': quest.todoUserIds = (quest.todoUserIds || []).filter(id => id !== userId); break;
            }
            break;
        case '/api/quests/bulk-update':
            const { questIds, updates } = req.body;
            data.quests.forEach(q => {
                if (questIds.includes(q.id)) {
                    if (updates.isActive !== undefined) q.isActive = updates.isActive;
                    if (updates.isOptional !== undefined) q.isOptional = updates.isOptional;
                    if (updates.requiresApproval !== undefined) q.requiresApproval = updates.requiresApproval;
                    if (updates.groupId !== undefined) q.groupId = updates.groupId === null ? undefined : updates.groupId;
                    if (updates.addTags) q.tags = [...new Set([...q.tags, ...updates.addTags])];
                    if (updates.removeTags) q.tags = q.tags.filter(tag => !updates.removeTags.includes(tag));
                    if (updates.assignUsers) q.assignedUserIds = [...new Set([...q.assignedUserIds, ...updates.assignUsers])];
                    if (updates.unassignUsers) q.assignedUserIds = q.assignedUserIds.filter(id => !updates.unassignUsers.includes(id));
                }
            });
            break;
        case '/api/quests/delete-many': data.quests = data.quests.filter(q => !req.body.questIds.includes(q.id)); break;
    }
});
app.post('/api/quests', questHandler(['quests']));
app.put('/api/quests/:id', questHandler(['quests']));
app.post('/api/quests/:id/clone', questHandler(['quests']));
app.post('/api/quests/:id/actions', questHandler(['quests']));
app.post('/api/quests/bulk-update', questHandler(['quests']));
app.post('/api/quests/delete-many', questHandler(['quests']));

// Quest Completion
app.post('/api/quests/:id/complete', async (req, res) => handleMultiSliceApiAction(res, ['questCompletions', 'users', 'userTrophies'], data => {
    const { userId, note, completionDate } = req.body;
    const questId = req.params.id;

    const quest = data.quests.find(q => q.id === questId);
    const user = data.users.find(u => u.id === userId);

    if (!quest || !user) {
        throw { statusCode: 404, message: 'Quest or User not found' };
    }

    const newCompletion = {
        id: `qc-${Date.now()}`,
        questId,
        userId,
        completedAt: completionDate ? new Date(completionDate).toISOString() : new Date().toISOString(),
        status: quest.requiresApproval ? 'Pending' : 'Approved',
        note: note || undefined,
        guildId: quest.guildId || undefined
    };

    data.questCompletions.push(newCompletion);

    if (newCompletion.status === 'Approved') {
        applyRewards(user, quest.rewards, data.rewardTypes, quest.guildId);
        checkAndAwardTrophies(user, data);
    }
}));

app.put('/api/quest-completions/:id', async (req, res) => handleMultiSliceApiAction(res, ['questCompletions', 'users', 'userTrophies'], data => {
    const { status, note } = req.body;
    const completionId = req.params.id;

    const completionIndex = data.questCompletions.findIndex(c => c.id === completionId);
    if (completionIndex === -1) {
        throw { statusCode: 404, message: 'Quest completion not found.' };
    }
    
    const completion = data.questCompletions[completionIndex];
    if (completion.status !== 'Pending') {
        throw { statusCode: 400, message: 'This quest completion has already been processed.' };
    }

    completion.status = status;
    if (note) completion.note = note;

    if (status === 'Approved') {
        const user = data.users.find(u => u.id === completion.userId);
        const quest = data.quests.find(q => q.id === completion.questId);

        if (!user || !quest) {
            throw { statusCode: 404, message: 'Associated user or quest not found.' };
        }
        
        applyRewards(user, quest.rewards, data.rewardTypes, quest.guildId);
        checkAndAwardTrophies(user, data);
    }
}));


// --- Generic CRUD for Simple Assets ---
['rewardTypes', 'markets', 'guilds', 'trophies', 'gameAssets', 'scheduledEvents', 'questGroups', 'themes'].forEach(assetKey => {
    const plural = assetKey;
    const singular = plural.endsWith('s') ? plural.slice(0, -1) : plural;
    
    app.post(`/api/${plural}`, (req, res) => handleMultiSliceApiAction(res, [plural], async data => {
        const newItem = {...req.body, id: `${singular}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`};
        if(plural === 'gameAssets' && !newItem.creatorId) newItem.creatorId = 'user-1'; // placeholder
        if(plural === 'gameAssets' && !newItem.createdAt) newItem.createdAt = new Date().toISOString();
        data[plural].push(newItem);
        if (plural === 'questGroups') return { newGroup: newItem };
    }));
    app.put(`/api/${plural}/:id`, (req, res) => handleMultiSliceApiAction(res, [plural], data => {
        const itemIndex = data[plural].findIndex(i => i.id === req.params.id);
        if (itemIndex === -1) throw { statusCode: 404, message: `${singular} not found` };
        data[plural][itemIndex] = {...data[plural][itemIndex], ...req.body, id: req.params.id};
    }));
    app.delete(`/api/${plural}/:id`, (req, res) => handleMultiSliceApiAction(res, [plural, 'quests'], data => {
        data[plural] = data[plural].filter(i => i.id !== req.params.id);
        if(plural === 'questGroups') {
            data.quests.forEach(q => { if(q.groupId === req.params.id) q.groupId = undefined; });
        }
    }));
    app.post(`/api/${plural}/:id/clone`, (req, res) => handleMultiSliceApiAction(res, [plural], data => {
        const itemIndex = data[plural].findIndex(i => i.id === req.params.id);
        if (itemIndex === -1) throw { statusCode: 404, message: `${singular} not found` };
        const original = data[plural][itemIndex];
        const newItem = {...JSON.parse(JSON.stringify(original)), id: `${singular}-${Date.now()}`};
        newItem.name = `${original.name || original.title} (Copy)`;
        if(newItem.title) newItem.title = `${original.title} (Copy)`;
        data[plural].push(newItem);
    }));
});


// --- Settings ---
app.put('/api/settings', async (req, res) => handleMultiSliceApiAction(res, ['settings'], data => {
    data.settings = { ...data.settings, ...req.body };
}));
app.post('/api/settings/reset', async (req, res) => handleMultiSliceApiAction(res, ['settings'], data => {
    data.settings = { ...INITIAL_SETTINGS, contentVersion: data.settings.contentVersion };
}));


// --- Chat ---
app.post('/api/chat/messages', async (req, res) => {
    try {
        const { senderId, recipientId, guildId, message, isAnnouncement } = req.body;
        const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            senderId, recipientId, guildId, message,
            timestamp: new Date().toISOString(),
            readBy: [senderId],
            isAnnouncement: isAnnouncement || undefined,
        };

        const query = `
            INSERT INTO app_data (key, value)
            VALUES ('chatMessages', jsonb_build_array($1::jsonb))
            ON CONFLICT (key) DO UPDATE
            SET value = app_data.value || $1::jsonb;
        `;
        
        await pool.query(query, [JSON.stringify(newMessage)]);

        broadcast({ type: 'NEW_CHAT_MESSAGE', payload: newMessage });
        res.status(201).json(newMessage);
    } catch (err) {
        console.error("Chat message error:", err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});
app.post('/api/chat/read', async (req, res) => handleMultiSliceApiAction(res, ['chatMessages'], data => {
    const { userId, partnerId, guildId } = req.body;
    if (!userId) throw { statusCode: 400, message: 'User ID is required' };

    data.chatMessages.forEach(msg => {
        const isUnread = !msg.readBy.includes(userId);
        if (isUnread) {
            if (partnerId && ((msg.senderId === partnerId && msg.recipientId === userId))) {
                msg.readBy.push(userId);
            }
            if (guildId && msg.guildId === guildId && msg.senderId !== userId) {
                msg.readBy.push(userId);
            }
        }
    });
}));

// --- Bulk/Complex Actions ---
app.post('/api/markets/delete-many', (req, res) => handleMultiSliceApiAction(res, ['markets'], data => { data.markets = data.markets.filter(m => !req.body.marketIds.includes(m.id)); }));
app.post('/api/markets/bulk-status', (req, res) => handleMultiSliceApiAction(res, ['markets'], data => { const { marketIds, status } = req.body; data.markets.forEach(m => { if(marketIds.includes(m.id)) m.status = { type: status }; }); }));
app.put('/api/ranks', (req, res) => handleMultiSliceApiAction(res, ['ranks'], data => { data.ranks = req.body.ranks; }));
app.post('/api/trophies/award', (req, res) => handleMultiSliceApiAction(res, ['userTrophies'], data => { const { userId, trophyId, guildId } = req.body; data.userTrophies.push({ id: `ut-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId: guildId || undefined }); }));
app.post('/api/trophies/delete-many', (req, res) => handleMultiSliceApiAction(res, ['trophies'], data => { data.trophies = data.trophies.filter(t => !req.body.trophyIds.includes(t.id)); }));
app.post('/api/gameAssets/delete-many', (req, res) => handleMultiSliceApiAction(res, ['gameAssets'], data => { data.gameAssets = data.gameAssets.filter(a => !req.body.assetIds.includes(a.id)); }));

app.put('/api/purchase-requests/:id', async (req, res) => handleMultiSliceApiAction(res, ['purchaseRequests', 'users', 'gameAssets', 'themes'], data => {
    const { status } = req.body;
    const requestIndex = data.purchaseRequests.findIndex(p => p.id === req.params.id);
    if (requestIndex === -1) throw { statusCode: 404, message: 'Purchase request not found' };
    const request = data.purchaseRequests[requestIndex];
    if (request.status !== 'Pending') throw { statusCode: 400, message: 'Request is not pending' };
    
    if (status === 'Completed') {
        const user = data.users.find(u => u.id === request.userId);
        const asset = data.gameAssets.find(a => a.id === request.assetId);
        if (!user || !asset) throw { statusCode: 404, message: 'User or Asset not found' };

        // No need to deduct funds, they are already in escrow (implicitly). Just award the item.
        user.ownedAssetIds.push(asset.id);
        if (asset.linkedThemeId && !user.ownedThemes.includes(asset.linkedThemeId)) {
            user.ownedThemes.push(asset.linkedThemeId);
        }
        asset.purchaseCount = (asset.purchaseCount || 0) + 1;
    }
    
    request.status = status;
    request.actedAt = new Date().toISOString();
}));


app.post('/api/assets/:id/purchase', async (req, res) => handleMultiSliceApiAction(res, ['purchaseRequests', 'users', 'gameAssets', 'themes', 'userTrophies'], data => {
    const { userId, marketId, costGroupIndex, guildId } = req.body;
    const asset = data.gameAssets.find(a => a.id === req.params.id);
    const user = data.users.find(u => u.id === userId);
    if (!asset || !user) throw { statusCode: 404, message: 'Asset or User not found' };
    
    const cost = asset.costGroups[costGroupIndex];
    if (!cost) throw { statusCode: 400, message: 'Invalid cost option' };

    if (asset.requiresApproval) {
        data.purchaseRequests.push({
            id: `pr-${Date.now()}`, userId, assetId: asset.id, requestedAt: new Date().toISOString(), status: 'Pending',
            assetDetails: { name: asset.name, description: asset.description, cost }, guildId: guildId || undefined
        });
    } else {
        applySetbacks(user, cost, data.rewardTypes, guildId);
        user.ownedAssetIds.push(asset.id);
        if (asset.linkedThemeId && !user.ownedThemes.includes(asset.linkedThemeId)) {
            user.ownedThemes.push(asset.linkedThemeId);
        }
        asset.purchaseCount = (asset.purchaseCount || 0) + 1;
    }
}));


app.get('/api/backups', async (req, res, next) => { try { const files = await fs.readdir(BACKUP_DIR); const backupDetails = await Promise.all( files .filter(file => file.endsWith('.json')) .map(async file => { const stats = await fs.stat(path.join(BACKUP_DIR, file)); return { filename: file, createdAt: stats.birthtime, size: stats.size, isAuto: file.startsWith('auto_backup_'), }; }) ); res.json(backupDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); } catch (err) { if (err.code === 'ENOENT') { return res.json([]); } next(err); } });
app.post('/api/backups', async (req, res, next) => { try { const dataToBackup = JSON.stringify(req.body, null, 2); const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19); const filename = `manual_backup_${timestamp}.json`; await fs.writeFile(path.join(BACKUP_DIR, filename), dataToBackup); res.status(201).json({ message: 'Manual backup created successfully.' }); } catch (err) { next(err); } });
app.get('/api/backups/:filename', (req, res, next) => { const filename = path.basename(req.params.filename); const filePath = path.join(BACKUP_DIR, filename); res.download(filePath, (err) => { if (err) { if (err.code === "ENOENT") { return res.status(404).json({ error: "File not found." }); } return next(err); } }); });
app.delete('/api/backups/:filename', async (req, res, next) => { try { const filename = path.basename(req.params.filename); await fs.unlink(path.join(BACKUP_DIR, filename)); res.status(200).json({ message: 'Backup deleted successfully.' }); } catch (err) { if (err.code === "ENOENT") { return res.status(404).json({ error: "File not found." }); } next(err); } });
app.post('/api/media/upload', upload.single('file'), async (req, res, next) => { if (!req.file) return res.status(400).json({ error: 'No file uploaded.' }); try { let fileUrl; if (process.env.STORAGE_PROVIDER === 'supabase') { const category = req.body.category || 'Miscellaneous'; const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim(); const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_'); const filePath = sanitizedCategory ? `${sanitizedCategory}/${Date.now()}-${sanitizedFilename}` : `${Date.now()}-${sanitizedFilename}`; const { data, error } = await supabase.storage .from('media-assets') .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false, }); if (error) throw error; const { data: { publicUrl } } = supabase.storage.from('media-assets').getPublicUrl(data.path); fileUrl = publicUrl; } else { const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/'); fileUrl = `/uploads/${relativePath}`; } res.status(201).json({ url: fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size }); } catch (err) { next(err); } });
app.get('/api/media/local-gallery', async (req, res, next) => { if (process.env.STORAGE_PROVIDER !== 'local') { return res.status(200).json([]); } const walk = async (dir, parentCategory = null) => { let dirents; try { dirents = await fs.readdir(dir, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') { await fs.mkdir(dir, { recursive: true }); return []; } throw e; } let imageFiles = []; for (const dirent of dirents) { const fullPath = path.join(dir, dirent.name); if (dirent.isDirectory()) { const nestedFiles = await walk(fullPath, dirent.name); imageFiles = imageFiles.concat(nestedFiles); } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(dirent.name)) { const relativePath = path.relative(UPLOADS_DIR, fullPath).replace(/\\/g, '/'); imageFiles.push({ url: `/uploads/${relativePath}`, category: parentCategory ? (parentCategory.charAt(0).toUpperCase() + parentCategory.slice(1)) : 'Miscellaneous', name: dirent.name.replace(/\.[^/.]+$/, ""), }); } } return imageFiles; }; try { const allImageFiles = await walk(UPLOADS_DIR); res.status(200).json(allImageFiles); } catch (err) { next(err); } });
app.post('/api/ai/test', async (req, res, next) => { if (!ai) { return res.status(400).json({ success: false, error: "AI features are not configured on the server. The API_KEY environment variable is not set." }); } try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' }); if (response && response.text) { res.json({ success: true }); } else { throw new Error("Received an empty or invalid response from the API."); } } catch (error) { console.error("AI API Key Test Failed:", error.message); res.status(400).json({ success: false, error: 'API key is invalid or permissions are insufficient.' }); } });
app.post('/api/ai/generate', async (req, res, next) => { if (!ai) return res.status(503).json({ error: "AI features are not configured on the server." }); const { model, prompt, generationConfig } = req.body; try { const response = await ai.models.generateContent({ model, contents: prompt, config: generationConfig, }); res.json({ text: response.text }); } catch (err) { next(err); } });

app.use(express.static(path.join(__dirname, '../dist')));
if (process.env.STORAGE_PROVIDER === 'local') { app.use('/uploads', express.static(UPLOADS_DIR)); }
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));
app.use((err, req, res, next) => { console.error('An error occurred:', err.stack); res.status(500).json({ error: 'Internal Server Error', message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, }); });

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    server.listen(port, () => {
        console.log(`Task Donegeon backend listening at http://localhost:${port}`);
    });
}

module.exports = app;