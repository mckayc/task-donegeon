import { EntitySchema } from 'typeorm';
import { User as UserInterface, Role } from '../../types';

export const User = new EntitySchema<UserInterface>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      generated: 'uuid',
    },
    firstName: {
      type: 'varchar',
    },
    lastName: {
      type: 'varchar',
    },
    username: {
        type: 'varchar',
        unique: true
    },
    email: {
        type: 'varchar',
        unique: true
    },
    gameName: {
      type: 'varchar',
    },
    birthday: {
      type: 'date',
    },
    pin: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
      nullable: true,
    },
    role: {
        type: 'varchar',
    },
    profilePictureUrl: {
        type: 'varchar',
        nullable: true
    },
    ownedAssetIds: {
        type: 'simple-json',
        default: '[]'
    },
    personalPurse: {
        type: 'simple-json',
        default: '{}'
    },
    personalExperience: {
        type: 'simple-json',
        default: '{}'
    },
    guildBalances: {
        type: 'simple-json',
        default: '{}'
    },
    theme: {
        type: 'varchar',
        nullable: true,
    },
    ownedThemes: {
        type: 'simple-json',
        default: '[]'
    },
    hasBeenOnboarded: {
        type: 'boolean',
        default: false,
    },
    avatar: {
        type: 'simple-json',
        default: '{}'
    }
  },
});
