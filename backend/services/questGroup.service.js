

const questGroupRepository = require('../repositories/questGroup.repository');
const questRepository = require('../repositories/quest.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction, updateTimestamps } = require('../utils/helpers');
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
            const questsToUpdate = await questRepo.findBy({ id: In(questIds) });
            for (const quest of questsToUpdate) {
                if (!quest.groupIds) quest.groupIds = [];
                if (!quest.groupIds.includes(saved.id)) {
                    quest.groupIds.push(saved.id);
                }
            }
            await questRepo.save(questsToUpdate.map(q => updateTimestamps(q)));
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
        
        const allQuests = await questRepo.find();
        const newAssignedIds = new Set(questIds || []);
        const questsToSave = [];

        for (const quest of allQuests) {
            const wasInGroup = quest.groupIds?.includes(id);
            const shouldBeInGroup = newAssignedIds.has(quest.id);

            if (wasInGroup && !shouldBeInGroup) {
                quest.groupIds = quest.groupIds.filter(gid => gid !== id);
                questsToSave.push(quest);
            } else if (!wasInGroup && shouldBeInGroup) {
                if (!quest.groupIds) quest.groupIds = [];
                quest.groupIds.push(id);
                questsToSave.push(quest);
            }
        }
        
        if (questsToSave.length > 0) {
            await questRepo.save(questsToSave.map(q => updateTimestamps(q)));
        }

        updateEmitter.emit('update');
        return savedGroup;
    });
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        const allQuests = await manager.getRepository('Quest').find();
        const questsToUpdate = [];
        const idsToDelete = new Set(ids);
        
        for (const quest of allQuests) {
            const originalLength = quest.groupIds?.length || 0;
            if (quest.groupIds) {
                quest.groupIds = quest.groupIds.filter(gid => !idsToDelete.has(gid));
                if (quest.groupIds.length < originalLength) {
                    questsToUpdate.push(quest);
                }
            }
        }
        
        if (questsToUpdate.length > 0) {
            await manager.getRepository('Quest').save(questsToUpdate.map(q => updateTimestamps(q)));
        }

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