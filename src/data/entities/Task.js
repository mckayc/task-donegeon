import { EntitySchema } from 'typeorm';

// Using EntitySchema allows defining entities in plain JavaScript without TypeScript decorators.
export const Task = new EntitySchema({
  name: 'Task',
  tableName: 'tasks',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    title: {
      type: 'varchar',
    },
    description: {
      type: 'text',
      nullable: true,
    },
    isCompleted: {
      type: 'boolean',
      default: false,
    },
    experiencePoints: {
      type: 'int',
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
});