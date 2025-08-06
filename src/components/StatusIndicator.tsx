
import React from 'react';
import { Status } from '../types';
import { LoaderCircle } from 'lucide-react';

interface StatusIndicatorProps {
  icon: React.ReactNode;
  title: string;
  status: Status;
  successMessage: string;
  errorMessage: string;
  warningMessage?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ icon, title, status, successMessage, errorMessage, warningMessage }) => {
  const getStatusColor = () => {
    switch (status) {
      case Status.SUCCESS:
        return 'bg-donegeon-green';
      case Status.ERROR:
        return 'bg-donegeon-red';
      case Status.WARNING:
        return 'bg-donegeon-orange';
      case Status.LOADING:
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case Status.SUCCESS:
        return successMessage;
      case Status.ERROR:
        return errorMessage;
      case Status.WARNING:
        return warningMessage || 'Requires attention';
      case Status.LOADING:
      default:
        return 'Checking status...';
    }
  }

  const getTextColor = () => {
    switch (status) {
        case Status.ERROR:
            return 'text-donegeon-red';
        case Status.WARNING:
            return 'text-donegeon-orange';
        default:
            return 'text-gray-400';
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {icon}
        <span className="text-lg text-donegeon-text">{title}</span>
      </div>
      <div className="flex items-center space-x-2">
        {status === Status.LOADING ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-yellow-500" />
        ) : (
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`}></div>
        )}
        <span className={`text-sm ${getTextColor()}`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};
