

const { dataSource } = require('../data-source');
const { In, MoreThan, IsNull } = require("typeorm");
const { 
    UserEntity, QuestEntity, QuestCompletionEntity, GuildEntity, PurchaseRequestEntity, UserTrophyEntity, AdminAdjustmentEntity, SystemNotificationEntity, RewardTypeDefinitionEntity
} = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { getFullAppData, updateTimestamps } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');
const systemService = require('../services/system.service');


// === Server-Sent Events Logic ===
let clients = [];

const handleSse = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log(`[SSE] Client connected: ${clientId}`);

    res.write('data: connected\n\n');

    const heartbeatInterval = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing heartbeat to client ${clientId}, closing connection.`);
            clearInterval(heartbeatInterval);
            req.socket.end();
        }
    }, 20000);

    req.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log(`[SSE] Client disconnected: ${clientId}`);
        clients = clients.filter(client => client.id !== clientId);
    });
};

const sendUpdateToClients = () => {
    console.log(`[SSE] Broadcasting sync event to ${clients.length} client(s).`);
    clients.forEach(client => {
        try {
            client.res.write('data: sync\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing to client ${client.id}:`, error.message);
            // The 'close' event on req will handle cleanup.
        }
    });
};

updateEmitter.on('update', sendUpdateToClients);

// === Data Syncing & First Run ===

const getDeltaAppData = async (manager, lastSync) => {
    const updates = {};
    const entityMap = {
        Market: 'markets', GameAsset: 'gameAssets', PurchaseRequest: 'purchaseRequests', RewardTypeDefinition: 'rewardTypes', TradeOffer: 'tradeOffers', Gift: 'gifts',
        Rank: 'ranks', Trophy: 'trophies', UserTrophy: 'userTrophies',
        SystemLog: 'systemLogs', AdminAdjustment: 'adminAdjustments', SystemNotification: 'systemNotifications', ScheduledEvent: 'scheduledEvents', ChatMessage: 'chatMessages',
        BugReport: 'bugReports', ModifierDefinition: 'modifierDefinitions', AppliedModifier: 'appliedModifiers', ThemeDefinition: 'themes', QuestGroup: 'questGroups', Rotation: 'rotations'
    };

    // User sync is special because of relations
    const updatedUsers = await manager.find('User', { where: { updatedAt: MoreThan(lastSync) }, relations: ['guilds'] });
    if (updatedUsers.length > 0) {
        updates.users = updatedUsers.map(u => {
            const { guilds, ...userData } = u;
            return { ...userData, guildIds: guilds.map(g => g.id) };
        });
    }

    // Quest sync
    const questRepo = manager.getRepository('Quest');
    const updatedQuests = await questRepo.find({ where: { updatedAt: MoreThan(lastSync) }, relations: ['assignedUsers'] });
    if (updatedQuests.length > 0) {
        updates.quests = updatedQuests.map(q => {
            const { assignedUsers, ...questData } = q;
            return { ...questData, assignedUserIds: assignedUsers?.map(u => u.id) || [] };
        });
    }

    // QuestCompletion sync
    const qcRepo = manager.getRepository(QuestCompletionEntity);
    const updatedQCs = await qcRepo.find({ 
        where: { updatedAt: MoreThan(lastSync) }, 
        relations: ['user', 'quest'] 
    });
    if (updatedQCs.length > 0) {
        updates.questCompletions = updatedQCs
            .filter(qc => qc.user && qc.quest)
            .map(qc => {
                // Explicitly create a new object to avoid TypeORM proxy issues
                return {
                    id: qc.id,
                    completedAt: qc.completedAt,
                    status: qc.status,
                    note: qc.note,
                    adminNote: qc.adminNote,
                    guildId: qc.guildId,
                    actedById: qc.actedById,
                    actedAt: qc.actedAt,
                    createdAt: qc.createdAt,
                    updatedAt: qc.updatedAt,
                    userId: qc.user.id,
                    questId: qc.quest.id,
                };
            });
    }

    // Guild sync
    const guildRepo = manager.getRepository('Guild');
    const updatedGuilds = await guildRepo.find({ where: { updatedAt: MoreThan(lastSync) }, relations: ['members'] });
    if (updatedGuilds.length > 0) {
        updates.guilds = updatedGuilds.map(g => {
            const { members, ...guildData } = g;
            return { ...guildData, memberIds: members?.map(m => m.id) || [] };
        });
    }
    
    for (const entityName in entityMap) {
        const repo = manager.getRepository(entityName);
        const keyName = entityMap[entityName];
        
        if (repo.metadata.hasColumnWithPropertyPath('updatedAt')) {
            const changedItems = await repo.find({ where: { updatedAt: MoreThan(lastSync) } });
            if (changedItems.length > 0) {
                updates[keyName] = changedItems;
            }
        }
    }

    const settingRow = await manager.findOne('Setting', { where: { id: 1, updatedAt: MoreThan(lastSync) } });
    if (settingRow) updates.settings = settingRow.settings;

    const historyRow = await manager.findOne('LoginHistory', { where: { id: 1, updatedAt: MoreThan(lastSync) } });
    if (historyRow) updates.loginHistory = historyRow.history;

    return updates;
};

const syncData = async (req, res) => {
    const { lastSync } = req.query;
    const newSyncTimestamp = new Date().toISOString();
    const manager = dataSource.manager;

    if (!lastSync) {
        // Full initial load
        const userCount = await manager.count(UserEntity);
        if (userCount === 0) {
            console.log("No users found, triggering first run.");
            return res.status(200).json({
                updates: { settings: INITIAL_SETTINGS, users: [], loginHistory: [] },
                newSyncTimestamp
            });
        }
        console.log("[Sync] Performing full initial data load for client.");
        const appData = await getFullAppData(manager);
        res.status(200).json({ updates: appData, newSyncTimestamp });
    } else {
        // Delta sync
        console.log(`[Sync] Performing delta sync for client since ${lastSync}`);
        const updates = await getDeltaAppData(manager, lastSync);
        res.status(200).json({ updates, newSyncTimestamp });
    }
};

const getChronicles = async (req, res) => {
    const { userId, guildId, viewMode, page = 1, limit = 50, startDate, endDate, filterTypes } = req.query;
    const manager = dataSource.manager;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let allEvents = [];
    const activeFilters = filterTypes ? filterTypes.split(',') : [];

    const allUsers = await manager.find(UserEntity);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    
    const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
    const rewardTypeMap = new Map(rewardTypes.map(rt => [rt.id, rt]));

    // --- Quest Completions ---
    if (activeFilters.includes('QuestCompletion')) {
        const qcQb = manager.createQueryBuilder(QuestCompletionEntity, "qc")
            .leftJoinAndSelect("qc.user", "user")
            .leftJoinAndSelect("qc.quest", "quest");
        
        if (viewMode === 'personal' && userId) qcQb.where("user.id = :userId", { userId });
        
        if (guildId === 'null') qcQb.andWhere("qc.guildId IS NULL");
        else if (guildId) qcQb.andWhere("qc.guildId = :guildId", { guildId });
        
        if (startDate && endDate) {
            qcQb.andWhere("qc.completedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
            qcQb.andWhere("qc.completedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
        }

        const completions = await qcQb.orderBy("qc.completedAt", "DESC").getMany();
        
        completions.forEach(c => {
            const questRequiresApproval = c.quest?.requiresApproval;
            const hasBeenActedOn = c.actedAt && c.actedById;

            // If it doesn't require approval, it's a single "Approved" event.
            if (!questRequiresApproval) {
                let rewardsText = '';
                if (c.quest?.rewards?.length > 0) {
                     rewardsText = c.quest.rewards.map(r => {
                        const rewardDef = rewardTypeMap.get(r.rewardTypeId);
                        return `+${r.amount} ${rewardDef ? rewardDef.icon : '?'}`;
                    }).join(' ');
                }
                allEvents.push({
                    id: `c-${c.id}`,
                    originalId: c.id,
                    date: c.completedAt,
                    type: 'QuestCompletion',
                    title: `${c.user?.gameName || 'Unknown User'} completed: ${c.quest?.title || 'Unknown Quest'}`,
                    note: c.note,
                    status: 'Approved',
                    icon: c.quest?.icon || '📜',
                    color: '#22c55e', // Green for Approved
                    userId: c.user?.id,
                    rewardsText: rewardsText || undefined,
                });
                return; // Done with this completion record
            }

            // If it requires approval, handle potentially multiple events.
            // Event 1: The initial submission (always shown)
            allEvents.push({
                id: `c-submit-${c.id}`,
                originalId: c.id,
                date: c.completedAt,
                type: 'QuestCompletion',
                title: `${c.user?.gameName || 'Unknown User'} submitted for approval: ${c.quest?.title || 'Unknown Quest'}`,
                note: c.note,
                status: 'Pending',
                icon: c.quest?.icon || '📜',
                color: '#ca8a04', // Yellow for Pending
                userId: c.user?.id,
            });

            // Event 2: The admin action (if it exists)
            if (hasBeenActedOn) {
                const actorName = userMap.get(c.actedById)?.gameName || 'An Admin';
                let actionTitle = '';
                let actionColor = '';
                let rewardsText = '';

                if (c.status === 'Approved') {
                    actionTitle = `${actorName} approved: ${c.quest?.title || 'Unknown Quest'}`;
                    actionColor = '#22c55e'; // Green for Approved
                    if (c.quest?.rewards?.length > 0) {
                        rewardsText = c.quest.rewards.map(r => {
                            const rewardDef = rewardTypeMap.get(r.rewardTypeId);
                            return `+${r.amount} ${rewardDef ? rewardDef.icon : '?'}`;
                        }).join(' ');
                    }
                } else if (c.status === 'Rejected') {
                    actionTitle = `${actorName} rejected: ${c.quest?.title || 'Unknown Quest'}`;
                    actionColor = '#ef4444'; // Red for Rejected
                }

                if(actionTitle) {
                    allEvents.push({
                        id: `c-action-${c.id}`,
                        originalId: c.id,
                        date: c.actedAt,
                        type: 'QuestCompletion',
                        title: actionTitle,
                        note: c.adminNote,
                        status: c.status,
                        icon: c.quest?.icon || '📜',
                        color: actionColor,
                        userId: c.user?.id,
                        actorName: actorName,
                        rewardsText: rewardsText || undefined,
                    });
                }
            }
        });
    }
    
    // --- Quest Assignments ---
    if (activeFilters.includes('QuestAssigned')) {
        const snQb = manager.createQueryBuilder(SystemNotificationEntity, "sn")
            .where("sn.type = :type", { type: 'QuestAssigned' });

        if (viewMode === 'personal' && userId) {
            snQb.andWhere("sn.recipientUserIds LIKE :userId", { userId: `%${userId}%` });
        }

        if (guildId === 'null') {
            snQb.andWhere("sn.guildId IS NULL");
        } else if (guildId) {
            snQb.andWhere("sn.guildId = :guildId", { guildId });
        }

        if (startDate && endDate) {
            snQb.andWhere("sn.timestamp >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
            snQb.andWhere("sn.timestamp <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
        }
        
        const assignments = await snQb.orderBy("sn.timestamp", "DESC").getMany();
        const senderMap = new Map(allUsers.map(s => [s.id, s.gameName]));

        allEvents.push(...assignments.map(a => ({
            id: `assign-${a.id}`, originalId: a.id, date: a.timestamp, type: 'QuestAssigned',
            title: a.message,
            status: 'Assigned', icon: a.icon || '🗺️', color: '#8b5cf6',
            userId: a.senderId,
            actorName: a.senderId ? senderMap.get(a.senderId) || 'An Admin' : 'System',
            recipientUserIds: a.recipientUserIds,
        })));
    }


    // --- Purchase Requests ---
     if (activeFilters.includes('Purchase')) {
        const prQb = manager.createQueryBuilder(PurchaseRequestEntity, "pr")
            .leftJoinAndSelect("pr.user", "user");
        
        if (viewMode === 'personal' && userId) prQb.where("user.id = :userId", { userId });

        if (guildId === 'null') prQb.andWhere("pr.guildId IS NULL");
        else if (guildId) prQb.andWhere("pr.guildId = :guildId", { guildId });

        if (startDate && endDate) {
            prQb.andWhere("pr.requestedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
            prQb.andWhere("pr.requestedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
        }
        
        const purchases = await prQb.orderBy("pr.requestedAt", "DESC").getMany();
        allEvents.push(...purchases.map(p => ({
            id: `p-${p.id}`, originalId: p.id, date: p.requestedAt, type: 'Purchase',
            title: `${p.user?.gameName || 'Unknown User'} requested: ${p.assetDetails.name}`,
            note: p.assetDetails.description, status: p.status, icon: '💰', color: '#f59e0b',
            userId: p.user?.id
        })));
    }

    // --- User Trophies ---
     if (activeFilters.includes('TrophyAwarded')) {
        const utQb = manager.createQueryBuilder(UserTrophyEntity, "ut")
            .leftJoinAndSelect("ut.user", "user")
            .leftJoinAndSelect("ut.trophy", "trophy");
        
        if (viewMode === 'personal' && userId) utQb.where("user.id = :userId", { userId });

        if (guildId === 'null') utQb.andWhere("ut.guildId IS NULL");
        else if (guildId) utQb.andWhere("ut.guildId = :guildId", { guildId });

        if (startDate && endDate) {
            utQb.andWhere("ut.awardedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
            utQb.andWhere("ut.awardedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
        }

        const trophies = await utQb.orderBy("ut.awardedAt", "DESC").getMany();
        allEvents.push(...trophies.map(t => ({
            id: `t-${t.id}`, originalId: t.id, date: t.awardedAt, type: 'TrophyAwarded',
            title: `${t.user?.gameName || 'Unknown User'} earned: ${t.trophy?.name || 'Unknown Trophy'}`,
            note: t.trophy?.description, status: 'Awarded', icon: t.trophy?.icon || '🏆', color: '#ca8a04',
            userId: t.user?.id
        })));
    }

    // --- Admin Adjustments ---
     if (activeFilters.includes('AdminAdjustment')) {
        const aaQb = manager.createQueryBuilder(AdminAdjustmentEntity, "aa")
            .leftJoinAndSelect("aa.user", "user");
        
        if (viewMode === 'personal' && userId) aaQb.where("user.id = :userId", { userId });

        if (guildId === 'null') aaQb.andWhere("aa.guildId IS NULL");
        else if (guildId) aaQb.andWhere("aa.guildId = :guildId", { guildId });

        if (startDate && endDate) {
            aaQb.andWhere("aa.adjustedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
            aaQb.andWhere("aa.adjustedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
        }
        
        const adjustments = await aaQb.orderBy("aa.adjustedAt", "DESC").getMany();
        allEvents.push(...adjustments.map(a => ({
            id: `a-${a.id}`, originalId: a.id, date: a.adjustedAt, type: 'AdminAdjustment',
            title: `Admin Adjustment for ${a.user?.gameName || 'Unknown User'}: ${a.type}`,
            note: a.reason, status: a.type, icon: '⚖️', color: '#a855f7',
            userId: a.user?.id
        })));
    }
    
    // Sort all collected events by date
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const total = allEvents.length;
    const paginatedEvents = (startDate || endDate) ? allEvents : allEvents.slice(skip, skip + parseInt(limit));

    res.json({ events: paginatedEvents, total });
};

const resetSettings = async (req, res) => {
    await systemService.resetSettings(req, res);
};

// Remove duplicated function declarations
module.exports = {
    handleSse,
    syncData,
    getChronicles,
};