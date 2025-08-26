// This file is now a pointer to the correct, centralized hook.
// This prevents any accidental usage of the old, buggy client-side logic.
export { useDashboardData } from '../../../hooks/useDashboardData';
