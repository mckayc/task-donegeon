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
const findByGroupId = (groupId) => repo.findBy({ groupId });
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

const unassignGroup = (groupIds) => repo.update({ groupId: In(groupIds) }, { groupId: null });

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