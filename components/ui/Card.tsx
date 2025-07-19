
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleIcon?: ReactNode;
  headerAction?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, titleIcon, headerAction }) => {
  return (
    <div className={`bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg backdrop-blur-sm ${className}`}>
      {title && (
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-stone-700/60 flex items-center justify-between bg-stone-800/90 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center space-x-3">
            {titleIcon}
            <h3 className="text-xl font-medieval text-emerald-400">{title}</h3>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;