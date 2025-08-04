import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-stone-800 border border-green-800/50 rounded-lg shadow-lg p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
};
