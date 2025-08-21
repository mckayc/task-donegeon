const trophyRepository = require('../repositories/trophy.repository');
const { updateEmitter } = require('../utils/updateEmitter');
// The checkAndAwardTrophies logic will be moved here from helpers
const userRepository = require('../repositories/user.repository');
const completionRepository = require('../repositories/completion.repository');
const rankRepository = require('../repositories/rank.repository');
const notificationRepository = require('../repositories/notification.repository');

const getAll = () => trophyRepository.findAll();

const create = async (data) => {
    const newTrophy = {
        ...data,
        id: `trophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await trophyRepository.create(newTrophy);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const saved = await trophyRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const clone = async (id) => {
    const trophyToClone = await trophyRepository.findById(id);
    if (!trophyToClone) return null;

    const newTrophyData = {
        ...trophyToClone,
        id: `trophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${trophyToClone.name} (Copy)`,
    };
    const saved = await trophyRepository.create(newTrophyData);
    updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await trophyRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const checkAndAward = async (userId, guildId) => {
    if (guildId) return { newUserTrophies: [], newNotifications: [] };

    const user = await userRepository.findById(userId);
    if (!user) return { newUserTrophies: [], newNotifications: [] };

    const newUserTrophies = [];
    const newNotifications = [];

    const userCompletedQuests = await completionRepository.findForUser(userId, null);
    const userTrophies = await trophyRepository.findUserTrophies(userId, null);
    const ranks = await rankRepository.findAll();
    const automaticTrophies = await trophyRepository.findAutomatic();

    const totalXp = Object.values(user.personalExperience || {}).reduce((sum, amount) => sum + amount, 0);
    const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

    for (const trophy of automaticTrophies) {
        if (userTrophies.some(ut => ut.trophyId === trophy.id)) continue;
        
        const requirements = Array.isArray(trophy.requirements) ? trophy.requirements : [];
        const meetsAllRequirements = requirements.every(req => {
            if (!req || typeof req.type === 'undefined') return false;
            switch (req.type) {
                case 'COMPLETE_QUEST_TYPE':
                    return userCompletedQuests.filter(c => c.quest?.type === req.value).length >= req.count;
                case 'COMPLETE_QUEST_TAG':
                    return userCompletedQuests.filter(c => c.quest?.tags?.includes(req.value)).length >= req.count;
                case 'ACHIEVE_RANK':
                    return userRank?.id === req.value;
                case 'QUEST_COMPLETED':
                    return userCompletedQuests.filter(c => c.quest?.id === req.value).length >= req.count;
                default:
                    return false;
            }
        });

        if (meetsAllRequirements) {
            const newTrophy = {
                userId,
                trophyId: trophy.id,
                awardedAt: new Date().toISOString(),
                guildId: null,
            };
            const savedTrophy = await trophyRepository.createUserTrophy(newTrophy);
            newUserTrophies.push(savedTrophy);

            const newNotification = {
                 type: 'TrophyAwarded',
                 message: `You unlocked a new trophy: "${trophy.name}"!`,
                 recipientUserIds: [userId],
                 link: 'Trophies',
                 guildId: null,
                 iconType: trophy.iconType,
                 icon: trophy.icon,
                 imageUrl: trophy.imageUrl,
            };
            const savedNotification = await notificationRepository.create(newNotification);
            newNotifications.push(savedNotification);
        }
    }
    return { newUserTrophies, newNotifications };
};


module.exports = {
    getAll,
    create,
    update,
    clone,
    deleteMany,
    checkAndAward,
};