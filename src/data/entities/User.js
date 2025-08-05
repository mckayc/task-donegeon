import { EntitySchema } from 'typeorm';
import { User as UserInterface } from '../../types.js';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  target: UserInterface,
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
      unique: true,
    },
    email: {
      type: 'varchar',
      unique: true,
    },
    gameName: {
      type: 'varchar',
    },
    birthday: {
      type: 'varchar', // Storing as string for simplicity with date inputs
    },
    role: {
      type: 'varchar',
    },
    avatar: {
      type: 'simple-json',
      default: '{}',
    },
    profilePictureUrl: {
      type: 'varchar',
      nullable: true,
    },
    ownedAssetIds: {
      type: 'simple-json',
      default: '[]',
    },
    pin: {
      type: 'varchar', // Hashed PIN
    },
    password: {
      type: 'varchar', // Hashed password
      nullable: true,
    },
    personalPurse: {
      type: 'simple-json',
      default: '{}',
    },
    personalExperience: {
      type: 'simple-json',
      default: '{}',
    },
    guildBalances: {
      type: 'simple-json',
      default: '{}',
    },
    theme: {
      type: 'varchar',
      nullable: true,
    },
    ownedThemes: {
      type: 'simple-json',
      default: '[]',
    },
    hasBeenOnboarded: {
      type: 'boolean',
      default: false,
    },
  },
});
