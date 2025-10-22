import React from 'react';

interface ToggleSwitchProps {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    label: string;
    'data-log-id'?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, setEnabled, label, 'data-log-id': dataLogId }) => {
  return (
    <div className="flex items-center">
      {/* FIX: Conditionally render the label to allow the switch to be used without text. */}
      {label && (
        <label htmlFor={label} className="text-sm font-medium text-stone-300 mr-3">
          {label}
        </label>
      )}
      <button
        type="button"
        id={label}
        data-log-id={dataLogId}
        className={`${
          enabled ? 'bg-emerald-600' : 'bg-stone-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-stone-900`}
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;