
import { EntitySchema } from 'typeorm';

export const QuestGroup = new EntitySchema({
  name: 'QuestGroup',
  tableName: 'quest_groups',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    title: {
      type: 'varchar',
      unique: true,
    },
    emoji: {
      type: 'varchar',
      nullable: true,
    },
    backgroundColor: {
      type: 'varchar',
      nullable: true,
    },
    createdAt: {
      type: 'datetime',
      createDate: true,
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true,
    },
  },
  relations: {
    quests: {
      type: 'one-to-many',
      target: 'Quest',
      inverseSide: 'questGroup',
    },
  },
});
