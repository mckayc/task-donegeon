
import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    firstName: {
      type: 'varchar',
    },
    lastName: {
      type: 'varchar',
    },
    gameName: {
      type: 'varchar',
      unique: true,
    },
    birthday: {
      type: 'date',
    },
    pin: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
    },
    role: {
        type: 'varchar', // e.g., 'admin', 'player'
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
