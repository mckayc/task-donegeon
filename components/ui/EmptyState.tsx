import React, { ReactNode } from 'react';

interface EmptyStateProps {
  Icon?: React.FC<{className?: string}>;
  title: string;
  message: string;
  actionButton?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, actionButton }) => {
  return (
    <div className="text-center py-12 px-6 bg-stone-800/40 rounded-lg">
      {Icon && <Icon className="mx-auto h-12 w-12 text-stone-500" />}
      <h3 className="mt-2 text-xl font-semibold text-stone-200">{title}</h3>
      <p className="mt-1 text-sm text-stone-400">{message}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
};

export default EmptyState;