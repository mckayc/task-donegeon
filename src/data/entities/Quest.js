
import { EntitySchema } from 'typeorm';

export const Quest = new EntitySchema({
  name: 'Quest',
  tableName: 'quests',
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
    description: {
      type: 'text',
      nullable: true,
    },
    emoji: {
      type: 'varchar',
      nullable: true,
    },
    backgroundColor: {
      type: 'varchar',
      nullable: true,
    },
    borderColor: {
      type: 'varchar',
      nullable: true,
    },
    type: {
      type: 'varchar', // 'Duty' or 'Venture'
    },
    optional: {
      type: 'boolean',
      default: false,
    },
    approvalRequired: {
      type: 'boolean',
      default: true,
    },
    tags: {
      type: 'simple-json',
      nullable: true,
    }, // array of strings
    availability: {
      type: 'simple-json',
      nullable: true,
    }, // { perPerson: boolean, frequency: number }
    deadlines: {
      type: 'simple-json',
      nullable: true,
    }, // { late?: string, incomplete?: string }
    rewards: {
      type: 'simple-json',
    }, // RewardItem[]
    setbacks: {
      type: 'simple-json',
      nullable: true,
    }, // { late?: SetbackItem[], incomplete?: SetbackItem[] }
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
    questGroup: {
      type: 'many-to-one',
      target: 'QuestGroup',
      joinColumn: true, // This will create questGroupId column
      onDelete: 'SET NULL', // If a group is deleted, don't delete the quests
    },
    assignedUsers: {
      type: 'many-to-many',
      target: 'User',
      joinTable: {
        name: 'quest_assignments',
        joinColumn: {
          name: 'questId',
          referencedColumnName: 'id'
        },
        inverseJoinColumn: {
          name: 'userId',
          referencedColumnName: 'id'
        },
      },
    },
  },
});
