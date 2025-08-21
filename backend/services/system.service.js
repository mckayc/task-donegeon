const { dataSource } = require('../data-source');
const { 
    QuestCompletionEntity, PurchaseRequestEntity, UserTrophyEntity, AdminAdjustmentEntity, 
    GiftEntity, TradeOfferEntity, AppliedModifierEntity 
} = require('../entities');
const { getFullAppData } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');
const { In } = require('typeorm');


const getChronicles = async (req, res) => {
    const { startDate, endDate, userId, guildId, viewMode, page = 1, limit = 50 } = req.query;
    const manager = dataSource.manager;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let allEvents = [];
    const baseWhere = { timestamp: { $gte: startDate, $lte: endDate } }; // Simplified, TypeORM uses different syntax

    const userFilter = viewMode === 'personal' ? { userId: userId } : {};

    // Quest Completions
    const completions = await manager.find(QuestCompletionEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user', 'quest'],
        order: { completedAt: 'DESC' }
    });
    allEvents.push(...completions.map(c => ({
        id: `c-${c.id}`, originalId: c.id, date: c.completedAt, type: 'Quest',
        title: c.quest?.title || 'Unknown Quest', note: c.note, status: c.status,
        icon: c.quest?.icon, color: '#10b981', userId: c.user.id
    })));

    // Purchase Requests
    const purchases = await manager.find(PurchaseRequestEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user'],
        order: { requestedAt: 'DESC' }
    });
    allEvents.push(...purchases.map(p => ({
        id: `p-${p.id}`, originalId: p.id, date: p.requestedAt, type: 'Purchase',
        title: `Purchase: ${p.assetDetails.name}`, note: p.assetDetails.description, status: p.status,
        icon: '💰', color: '#f59e0b', userId: p.user.id
    })));

    // User Trophies
    const trophies = await manager.find(UserTrophyEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user', 'trophy'],
        order: { awardedAt: 'DESC' }
    });
    allEvents.push(...trophies.map(t => ({
        id: `t-${t.id}`, originalId: t.id, date: t.awardedAt, type: 'Trophy',
        title: `Trophy Earned: ${t.trophy.name}`, note: t.trophy.description, status: 'Awarded',
        icon: t.trophy.icon, color: '#ca8a04', userId: t.user.id
    })));

    // Admin Adjustments
    const adjustments = await manager.find(AdminAdjustmentEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user'],
        order: { adjustedAt: 'DESC' }
    });
    allEvents.push(...adjustments.map(a => ({
        id: `a-${a.id}`, originalId: a.id, date: a.adjustedAt, type: 'Adjustment',
        title: `Admin Adjustment: ${a.type}`, note: a.reason, status: a.type,
        icon: '⚖️', color: '#a855f7', userId: a.user.id
    })));
    
    // Sort all collected events by date
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const paginatedEvents = allEvents.slice(skip, skip + parseInt(limit));

    res.json({ events: paginatedEvents, total: allEvents.length });
};


module.exports = {
    getChronicles
};
