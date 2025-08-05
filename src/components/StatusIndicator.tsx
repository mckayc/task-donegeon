
import React from 'react';
import { Status } from '../types';
import { LoaderCircle } from 'lucide-react';
import { Switch } from './ui/Switch';

interface StatusIndicatorProps {
  icon: React.ReactNode;
  title: string;
  status: Status;
  successMessage: string;
  errorMessage: string;
  instructions: React.ReactNode;
  isSkipped: boolean;
  onSkipToggle: (checked: boolean) => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ icon, title, status, successMessage, errorMessage, instructions, isSkipped, onSkipToggle }) => {
  const getStatusColor = () => {
    if (isSkipped) return 'bg-gray-500';
    switch (status) {
      case Status.SUCCESS: return 'bg-donegeon-green';
      case Status.ERROR: return 'bg-donegeon-red';
      case Status.LOADING:
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    if (isSkipped) return 'Skipped';
    switch (status) {
      case Status.SUCCESS: return successMessage;
      case Status.ERROR: return errorMessage;
      case Status.LOADING:
      default: return 'Checking...';
    }
  }

  const showInstructions = status === Status.ERROR && !isSkipped;

  return (
    <div className="p-4 border border-donegeon-gray/50 rounded-lg bg-donegeon-brown/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {icon}
          <span className="text-lg text-donegeon-text">{title}</span>
        </div>
        <div className="flex items-center space-x-3">
          {status === Status.LOADING ? (
            <LoaderCircle className="h-5 w-5 animate-spin text-yellow-500" />
          ) : (
             <>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${getStatusColor()}`}></div>
                <span className={`text-sm ${status === Status.ERROR && !isSkipped ? 'text-donegeon-red' : 'text-gray-400'}`}>
                  {getStatusText()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id={`skip-${title}`} checked={isSkipped} onCheckedChange={onSkipToggle} />
                <label htmlFor={`skip-${title}`} className="text-sm text-gray-400">Do it later</label>
              </div>
            </>
          )}
        </div>
      </div>
      {showInstructions && instructions}
    </div>
  );
};
