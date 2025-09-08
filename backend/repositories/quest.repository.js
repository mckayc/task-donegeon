const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity } = require('../entities');
const { In } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(QuestEntity);
const userRepo = dataSource.getRepository(UserEntity);

const findAllWithRelations = async () => {
    const quests = await repo.find({ relations: ['assignedUsers'] });
    return quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers.map(u => u.id) }));
};

const findById = (id) => repo.findOneBy({ id });
const findByIdWithRelations = (id) => repo.findOne({ where: { id }, relations: ['assignedUsers'] });
// FIX: Updated to use `groupIds` which is a simple-array. TypeORM doesn't have a direct `contains` for simple-array, so we have to filter in code. This is inefficient but works for now. A better solution is a many-to-many relation.
const findByGroupId = (groupId) => repo.find().then(quests => quests.filter(q => q.groupIds?.includes(groupId)));
const findByIds = (ids) => repo.findBy({ id: In(ids) });

const create = async (data) => {
    const { assignedUserIds, ...questData } = data;
    const newQuest = repo.create({
        ...questData,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    });
    if (assignedUserIds && assignedUserIds.length > 0) {
        newQuest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }
    return repo.save(updateTimestamps(newQuest, true));
};

const save = (quest) => {
    return repo.save(updateTimestamps(quest));
};

const update = async (id, data) => {
    const quest = await findByIdWithRelations(id);
    if (!quest) return null;
    const { assignedUserIds, ...questData } = data;
    repo.merge(quest, questData);
    if (assignedUserIds) {
        quest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }
    return save(quest);
};

const deleteMany = (ids) => repo.delete(ids);

const unassignGroup = (groupIds) => {
    // This is more complex with an array. We need to fetch, filter, and save.
    return dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const allQuests = await questRepo.find();
        const questsToUpdate = [];
        for (const quest of allQuests) {
            if (quest.groupIds && quest.groupIds.some(gId => groupIds.includes(gId))) {
                quest.groupIds = quest.groupIds.filter(gId => !groupIds.includes(gId));
                questsToUpdate.push(quest);
            }
        }
        if(questsToUpdate.length > 0) {
            await questRepo.save(questsToUpdate.map(q => updateTimestamps(q)));
        }
    });
};

const assignGroupToUsers = async (groupId, userIds) => {
    const questsInGroup = await findByGroupId(groupId);
    const usersToAssign = await userRepo.findBy({ id: In(userIds) });
    if (questsInGroup.length === 0 || usersToAssign.length === 0) return;
    
    for (const quest of questsInGroup) {
        quest.assignedUsers = usersToAssign;
    }
    await repo.save(questsInGroup.map(q => updateTimestamps(q)));
};


module.exports = {
    findAllWithRelations,
    findById,
    findByIdWithRelations,
    findByGroupId,
    findByIds,
    create,
    save,
    update,
    deleteMany,
    unassignGroup,
    assignGroupToUsers,
};