
import React from 'react';
import { Status } from '../types';
import { LoaderCircle } from 'lucide-react';

interface StatusIndicatorProps {
  icon: React.ReactNode;
  title: string;
  status: Status;
  successMessage: string;
  errorMessage: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ icon, title, status, successMessage, errorMessage }) => {
  const getStatusColor = () => {
    switch (status) {
      case Status.SUCCESS:
        return 'bg-donegeon-green';
      case Status.ERROR:
        return 'bg-donegeon-red';
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
      case Status.LOADING:
      default:
        return 'Checking status...';
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
        <span className={`text-sm ${status === Status.ERROR ? 'text-donegeon-red' : 'text-gray-400'}`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};
