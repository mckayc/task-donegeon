
const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, QuestCompletionEntity, SystemLogEntity, ScheduledEventEntity, SystemNotificationEntity } = require('../entities');
const { In, Between } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');
const userService = require('./user.service');

const toYMD = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isVacationActiveOnDate = (date, scheduledEvents, guildId) => {
    const dateKey = toYMD(date);
    return scheduledEvents.some(event => {
        if (event.eventType !== 'Vacation' && event.eventType !== 'Grace Period') return false;
        const scopeMatch = !event.guildId || event.guildId === guildId;
        if (!scopeMatch) return false;
        return dateKey >= event.startDate && dateKey <= event.endDate;
    });
};

const checkIncompleteQuests = async (manager) => {
    const now = new Date();
    const todayYMD = toYMD(now);
    
    const quests = await manager.find(QuestEntity, { 
        where: { type: 'Duty', isActive: true }, 
        relations: ['assignedUsers'] 
    });

    const scheduledEvents = await manager.find(ScheduledEventEntity);

    for (const quest of quests) {
        if (!quest.endTime || !quest.incompleteSetbacks || quest.incompleteSetbacks.length === 0) continue;

        const [hours, minutes] = quest.endTime.split(':').map(Number);
        const deadlineToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        if (now < deadlineToday) continue;

        const onVacation = isVacationActiveOnDate(now, scheduledEvents, quest.guildId);
        if (onVacation) continue;

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59).toISOString();

        for (const user of quest.assignedUsers) {
            const logCheck = await manager.query(
              `SELECT COUNT(*) as count FROM system_log WHERE type = 'QUEST_INCOMPLETE' AND questId = ? AND timestamp BETWEEN ? AND ? AND userIds LIKE ?`,
              [quest.id, startOfDay, endOfDay, `%${user.id}%`]
            );
            if (logCheck[0].count > 0) continue;

            const completionCount = await manager.count(QuestCompletionEntity, {
                where: {
                    quest: { id: quest.id },
                    user: { id: user.id },
                    status: In(['Approved', 'Pending']),
                    completedAt: Between(startOfDay, endOfDay)
                }
            });
            
            if (completionCount > 0) continue;

            console.log(`[Automation] Applying setback for incomplete quest "${quest.title}" for user ${user.gameName}`);
            
            const grantDetails = {
                userId: user.id,
                setbacks: quest.incompleteSetbacks,
                actorId: 'system',
                chronicleTitle: `Incomplete: "${quest.title}"`,
                chronicleNote: 'Quest was not completed by the deadline.',
                chronicleType: 'QuestIncomplete',
                chronicleIcon: '❌',
                chronicleColor: '#ef4444',
                originalId: `incomplete-${quest.id}-${todayYMD}-${user.id}`,
                guildId: quest.guildId,
                allowSetbackSubstitution: quest.allowSetbackSubstitution,
            };
            await userService.grantRewards(manager, grantDetails);
            
            const newLog = manager.create(SystemLogEntity, {
                id: `log-${Date.now()}-${user.id.slice(0,4)}`,
                timestamp: now.toISOString(),
                type: 'QUEST_INCOMPLETE',
                questId: quest.id,
                userIds: [user.id],
                setbacksApplied: quest.incompleteSetbacks
            });
            await manager.save(updateTimestamps(newLog, true));

            // Create a notification for the user
            const notificationRepo = manager.getRepository(SystemNotificationEntity);
            const newNotification = notificationRepo.create({
                id: `sysnotif-incomplete-${quest.id}-${user.id}-${Date.now()}`,
                type: 'TrialApplied',
                message: `Setback applied for not completing: "${quest.title}"`,
                recipientUserIds: [user.id],
                readByUserIds: [],
                senderId: 'system',
                timestamp: now.toISOString(),
                link: 'Chronicles',
                icon: '⚖️',
                guildId: quest.guildId || undefined,
            });
            await manager.save(updateTimestamps(newNotification, true));
        }
    }
};

module.exports = { checkIncompleteQuests };
