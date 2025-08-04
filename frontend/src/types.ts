export interface NewAdminData {
  firstName: string;
  lastName: string;
  gameName: string;
  birthDate: string;
  pin: string;
  password?: string; // Password is sent separately to the API
}

export interface User {
  id: string;
  gameName: string;
  firstName: string;
  isAdmin: boolean;
}

// Base interface for all quest types
interface BaseQuest {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  currency_reward: number;
}

export interface Duty extends BaseQuest {
  repeatable: "daily" | "weekly" | "monthly";
}

export interface Venture extends BaseQuest {
  // Ventures may have unique properties later
}
