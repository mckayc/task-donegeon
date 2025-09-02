
const questGroupRepository = require('../repositories/questGroup.repository');
const questRepository = require('../repositories/quest.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction } = require('../utils/helpers');
const { QuestEntity } = require('../entities');
const { In } = require("typeorm");


const getAll = () => questGroupRepository.findAll();

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const questGroupRepo = manager.getRepository('QuestGroup');
        const questRepo = manager.getRepository('Quest');

        const { questIds, ...groupData } = data;

        const newGroup = {
            ...groupData,
            id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const saved = await questGroupRepo.save(newGroup);

        if (questIds && questIds.length > 0) {
            await questRepo.update({ id: In(questIds) }, { groupId: saved.id });
        }

        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Quest Group', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    return await dataSource.transaction(async manager => {
        const questGroupRepo = manager.getRepository('QuestGroup');
        const questRepo = manager.getRepository('Quest');
        
        const group = await questGroupRepo.findOneBy({ id });
        if (!group) return null;

        const { questIds, ...groupData } = data;
        questGroupRepo.merge(group, groupData);
        const savedGroup = await questGroupRepo.save(group);
        
        const previouslyAssignedQuests = await questRepo.findBy({ groupId: id });
        const previouslyAssignedIds = new Set(previouslyAssignedQuests.map(q => q.id));
        const newAssignedIds = new Set(questIds || []);

        const questsToUnassign = previouslyAssignedQuests
            .filter(q => !newAssignedIds.has(q.id))
            .map(q => q.id);
        
        const questsToAssign = (questIds || [])
            .filter(qId => !previouslyAssignedIds.has(qId));

        if (questsToUnassign.length > 0) {
            await questRepo.update({ id: In(questsToUnassign) }, { groupId: null });
        }

        if (questsToAssign.length > 0) {
            await questRepo.update({ id: In(questsToAssign) }, { groupId: id });
        }

        updateEmitter.emit('update');
        return savedGroup;
    });
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        await manager.getRepository('Quest').update({ groupId: In(ids) }, { groupId: null });
        await manager.getRepository('QuestGroup').delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Quest Group', assetCount: ids.length });
        updateEmitter.emit('update');
    });
};

const assignToUsers = async (groupId, userIds) => {
    await questRepository.assignGroupToUsers(groupId, userIds);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    assignToUsers,
};