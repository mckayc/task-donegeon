import { Role } from '../users/types';

export enum ConditionSetLogic {
    ALL = 'ALL', // All conditions must be met (AND)
    ANY = 'ANY', // Any one condition can be met (OR)
}

export enum ConditionType {
    MinRank = 'MIN_RANK',
    DayOfWeek = 'DAY_OF_WEEK',
    DateRange = 'DATE_RANGE',
    TimeOfDay = 'TIME_OF_DAY',
    QuestCompleted = 'QUEST_COMPLETED',
    TrophyAwarded = 'TROPHY_AWARDED',
    UserHasItem = 'USER_HAS_ITEM',
    UserDoesNotHaveItem = 'USER_DOES_NOT_HAVE_ITEM',
    UserIsMemberOfGuild = 'USER_IS_MEMBER_OF_GUILD',
    UserHasRole = 'USER_HAS_ROLE',
}

export interface BaseCondition {
    id: string;
    type: ConditionType;
}

export interface MinRankCondition extends BaseCondition {
    type: ConditionType.MinRank;
    rankId: string;
}

export interface DayOfWeekCondition extends BaseCondition {
    type: ConditionType.DayOfWeek;
    days: number[]; // 0 for Sunday
}

export interface DateRangeCondition extends BaseCondition {
    type: ConditionType.DateRange;
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
}

export interface TimeOfDayCondition extends BaseCondition {
    type: ConditionType.TimeOfDay;
    start: string; // HH:MM
    end: string; // HH:MM
}

export interface QuestCompletedCondition extends BaseCondition {
    type: ConditionType.QuestCompleted;
    questId: string;
}

export interface TrophyAwardedCondition extends BaseCondition {
    type: ConditionType.TrophyAwarded;
    trophyId: string;
}

export interface UserHasItemCondition extends BaseCondition {
    type: ConditionType.UserHasItem;
    assetId: string;
}

export interface UserDoesNotHaveItemCondition extends BaseCondition {
    type: ConditionType.UserDoesNotHaveItem;
    assetId: string;
}

export interface UserIsMemberOfGuildCondition extends BaseCondition {
    type: ConditionType.UserIsMemberOfGuild;
    guildId: string;
}

export interface UserHasRoleCondition extends BaseCondition {
    type: ConditionType.UserHasRole;
    role: Role;
}


export type Condition =
  | MinRankCondition
  | DayOfWeekCondition
  | DateRangeCondition
  | TimeOfDayCondition
  | QuestCompletedCondition
  | TrophyAwardedCondition
  | UserHasItemCondition
  | UserDoesNotHaveItemCondition
  | UserIsMemberOfGuildCondition
  | UserHasRoleCondition;


export interface ConditionSet {
    id: string;
    name: string;
    description: string;
    logic: ConditionSetLogic;
    conditions: Condition[];
}
