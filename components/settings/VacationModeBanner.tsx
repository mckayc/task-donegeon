
import React from 'react';
import { useSettingsState } from '../../context/AppContext';

const VacationModeBanner: React.FC = () => {
  const { settings } = useSettingsState();
  const { vacationMode } = settings;

  if (!vacationMode.enabled) {
    return null;
  }

  const now = new Date();
  const start = vacationMode.startDate ? new Date(vacationMode.startDate) : null;
  const end = vacationMode.endDate ? new Date(vacationMode.endDate) : null;

  if (start && end) {
    end.setHours(23, 59, 59, 999); // Ensure end date is inclusive
    if (now >= start && now <= end) {
      return (
        <div className="bg-blue-800 text-blue-100 text-center p-2 rounded-lg mb-6 shadow-lg">
          <p className="font-semibold">
            Vacation Mode is active from {start.toLocaleDateString()} to {end.toLocaleDateString()}. All quest deadlines are paused.
          </p>
        </div>
      );
    }
  }

  return null;
};

export default VacationModeBanner;