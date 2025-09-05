import React, { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, GrabHandleIcon } from './Icons';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleIcon?: ReactNode;
  headerAction?: ReactNode;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  dragHandleProps?: any; // For framer-motion drag controls
}

const Card: React.FC<CardProps> = ({ children, className, title, titleIcon, headerAction, isCollapsible, isCollapsed, onToggleCollapse, dragHandleProps }) => {
  const HeaderContent = (
    <div className="flex items-center justify-between flex-grow min-w-0">
        <div className="flex items-center space-x-3 truncate">
            {titleIcon}
            <h3 className="text-xl font-medieval text-emerald-400 truncate">{title}</h3>
        </div>
        {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
    </div>
  );

  return (
    <div className={`bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden ${className}`}>
      {title && (
        <div className={`bg-stone-800/70 px-4 py-3 border-b border-stone-700/60 flex items-center justify-between rounded-t-xl`}>
          {isCollapsible ? (
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-between w-full text-left gap-2"
              aria-expanded={!isCollapsed}
            >
              {HeaderContent}
              <div className="flex items-center ml-2 flex-shrink-0">
                {dragHandleProps && (
                  <div {...dragHandleProps} className="cursor-grab p-2 -my-2 -mr-2 text-stone-500 hover:text-white" onClick={e => e.stopPropagation()}>
                    <GrabHandleIcon className="w-5 h-5" />
                  </div>
                )}
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
              </div>
            </button>
          ) : (
            HeaderContent
          )}
        </div>
      )}

       <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.section
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-6">
              {children}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Card;