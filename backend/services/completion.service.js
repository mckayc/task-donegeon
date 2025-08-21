const completionRepository = require('../repositories/completion.repository');
const questRepository = require('../repositories/quest.repository');
const userRepository = require('../repositories/user.repository');
const rewardTypeRepository = require('../repositories/rewardType.repository');
const settingRepository = require('../repositories/setting.repository');
const trophyService = require('./trophy.service');
const { updateEmitter } = require('../utils/updateEmitter');

const complete = async (completionData) => {
    const newCompletion = {
        ...completionData,
        id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const savedCompletion = await completionRepository.create(newCompletion);
    
    let updatedUser = null;
    if (completionData.status === 'Approved') {
        const user = await userRepository.findById(completionData.userId);
        const quest = await questRepository.findById(completionData.questId);
        if (user && quest) {
            // Apply rewards... logic can be complex, so this is simplified
            updatedUser = await userRepository.update(user.id, user);
        }
    }
    updateEmitter.emit('update');
    return { updatedUser, newCompletion: savedCompletion };
};

const approve = async (id, approverId, note) => {
    const completion = await completionRepository.findByIdWithRelations(id);
    if (!completion || completion.status !== 'Pending') {
        return null;
    }

    const settings = await settingRepository.get();
    const isSelfApproval = completion.userId === approverId;

    if (isSelfApproval && !settings.security.allowAdminSelfApproval) {
        const adminCount = await userRepository.countAdmins();
        if (adminCount > 1) {
            throw new Error('Self-approval is disabled. Another administrator must approve this quest.');
        }
    }

    const updateData = {
        status: 'Approved',
        actedById: approverId,
        actedAt: new Date().toISOString(),
        note: `${completion.note ? `${completion.note}\n` : ''}Approver note: ${note}`
    };
    
    const updatedCompletion = await completionRepository.update(id, updateData);

    const user = completion.user;
    const quest = completion.quest;
    let updatedUser = null;
    let trophyResults = { newUserTrophies: [], newNotifications: [] };

    if (user && quest) {
        const rewardTypes = await rewardTypeRepository.findAll();
        const isGuildScope = !!completion.guildId;
        const balances = isGuildScope ? user.guildBalances[completion.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
        
        quest.rewards.forEach(reward => {
            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
            }
        });
        
        const userUpdatePayload = isGuildScope ? { guildBalances: user.guildBalances } : { personalPurse: user.personalPurse, personalExperience: user.personalExperience };
        updatedUser = await userRepository.update(user.id, userUpdatePayload);
        
        trophyResults = await trophyService.checkAndAward(user.id, completion.guildId);
    }
    
    updateEmitter.emit('update');
    return { updatedUser, updatedCompletion, ...trophyResults };
};

const reject = async (id, rejecterId, note) => {
    const completion = await completionRepository.findById(id);
    if (!completion || completion.status !== 'Pending') {
        return null;
    }
    
    const updateData = {
        status: 'Rejected',
        actedById: rejecterId,
        actedAt: new Date().toISOString(),
        note: `${completion.note ? `${completion.note}\n` : ''}Rejecter note: ${note}`
    };

    const updatedCompletion = await completionRepository.update(id, updateData);
    updateEmitter.emit('update');
    return { updatedCompletion };
};

module.exports = {
    complete,
    approve,
    reject,
};