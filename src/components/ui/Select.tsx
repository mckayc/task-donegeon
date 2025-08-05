
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={`
            flex h-10 w-full items-center justify-between rounded-md border border-donegeon-gray bg-donegeon-gray-dark px-3 py-2 text-sm text-donegeon-parchment
            focus:outline-none focus:ring-2 focus:ring-donegeon-gold/50
            disabled:cursor-not-allowed disabled:opacity-50
            appearance-none
            ${className}
          `}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
