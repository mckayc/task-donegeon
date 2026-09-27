export interface PrivilegeItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    assignedUserIds: string[]; // empty array = all explorers
    requiresAllDailyDuties: boolean; // default true
    minDutyPercentage?: number; // default 100
    conditionSetIds?: string[];
    type: 'timer' | 'unlock_only';
    timerDurationMinutes?: number; // e.g. 45
    isActive: boolean;
}

export interface UserAllowanceConfig {
    userId: string;
    enabled: boolean;
    weeklyAmount: number; // e.g. 10.00
    minThresholdPercent: number; // e.g. 70
    calculationType: 'pro_rated' | 'threshold_all_or_nothing';
    payoutDestination: 'purse' | 'vault';
    currencyRewardTypeId: string;
}

export interface AllowancePayoutRecord {
    id: string;
    userId: string;
    weekStart: string; // YYYY-MM-DD
    weekEnd: string; // YYYY-MM-DD
    scheduledDutiesCount: number;
    completedDutiesCount: number;
    completionPercentage: number;
    amountPaid: number;
    currencyRewardTypeId: string;
    payoutDestination: 'purse' | 'vault';
    paidAt: string; // ISO string
    note?: string;
}

export interface AllowanceSettings {
    enabled: boolean;
    userConfigs: UserAllowanceConfig[];
    payoutHistory: AllowancePayoutRecord[];
}
