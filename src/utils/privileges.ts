import { PrivilegeItem } from '../types';

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Checks if a privilege is scheduled for a specific date (day of week)
 */
export function isPrivilegeScheduledForDay(privilege: PrivilegeItem, date: Date = new Date()): boolean {
    if (!privilege.daysOfWeek || privilege.daysOfWeek.length === 0) {
        return true; // All days
    }
    const dayOfWeek = date.getDay(); // 0-6
    return privilege.daysOfWeek.includes(dayOfWeek);
}

/**
 * Checks if current time is within privilege time window
 */
export function isPrivilegeInTimeWindow(privilege: PrivilegeItem, date: Date = new Date()): { inWindow: boolean; label?: string } {
    const timeOfDay = privilege.timeOfDay || 'any';
    if (timeOfDay === 'any') {
        return { inWindow: true, label: 'Any Time' };
    }

    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    if (timeOfDay === 'morning') {
        // Morning: 5:00 AM (300m) to 12:00 PM (720m)
        const inWindow = currentMinutes >= 300 && currentMinutes < 720;
        return { inWindow, label: 'Morning (Before 12:00 PM)' };
    }

    if (timeOfDay === 'afternoon') {
        // Afternoon: 12:00 PM (720m) to 5:00 PM (1020m)
        const inWindow = currentMinutes >= 720 && currentMinutes < 1020;
        return { inWindow, label: 'Afternoon (12:00 PM – 5:00 PM)' };
    }

    if (timeOfDay === 'evening') {
        // Evening: 5:00 PM (1020m) to 10:30 PM (1350m)
        const inWindow = currentMinutes >= 1020 && currentMinutes < 1350;
        return { inWindow, label: 'Evening (After 5:00 PM)' };
    }

    if (timeOfDay === 'custom' && privilege.startTime && privilege.endTime) {
        const [startH, startM] = privilege.startTime.split(':').map(Number);
        const [endH, endM] = privilege.endTime.split(':').map(Number);
        const startTotal = (startH || 0) * 60 + (startM || 0);
        const endTotal = (endH || 0) * 60 + (endM || 0);

        if (startTotal <= endTotal) {
            const inWindow = currentMinutes >= startTotal && currentMinutes <= endTotal;
            return { inWindow, label: `${formatTimeStr(privilege.startTime)} – ${formatTimeStr(privilege.endTime)}` };
        } else {
            // Over midnight window
            const inWindow = currentMinutes >= startTotal || currentMinutes <= endTotal;
            return { inWindow, label: `${formatTimeStr(privilege.startTime)} – ${formatTimeStr(privilege.endTime)}` };
        }
    }

    return { inWindow: true, label: 'Any Time' };
}

export function formatTimeStr(time24: string): string {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const minStr = String(m).padStart(2, '0');
    return `${hour}:${minStr} ${ampm}`;
}

export function formatPrivilegeSchedule(privilege: PrivilegeItem): string {
    const days = privilege.daysOfWeek;
    if (!days || days.length === 0 || days.length === 7) {
        return 'Every Day';
    }
    const isWeekdays = days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d));
    if (isWeekdays) return 'Weekdays Only';

    const isWeekends = days.length === 2 && [0, 6].every(d => days.includes(d));
    if (isWeekends) return 'Weekends Only';

    const sortedDays = [...days].sort((a, b) => a - b);
    return sortedDays.map(d => DAY_NAMES_SHORT[d]).join(', ');
}

export function formatPrivilegeTimeWindow(privilege: PrivilegeItem): string {
    const timeOfDay = privilege.timeOfDay || 'any';
    switch (timeOfDay) {
        case 'morning':
            return '🌅 Morning (5am–12pm)';
        case 'afternoon':
            return '☀️ Afternoon (12pm–5pm)';
        case 'evening':
            return '🌙 Evening (5pm–10pm)';
        case 'custom':
            if (privilege.startTime && privilege.endTime) {
                return `⏰ ${formatTimeStr(privilege.startTime)} – ${formatTimeStr(privilege.endTime)}`;
            }
            return '⏰ Custom Window';
        case 'any':
        default:
            return '⚡ Any Time Today';
    }
}
