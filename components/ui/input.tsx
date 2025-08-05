
import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-brand-brown-700 bg-brand-gray-900/50 px-3 py-2 text-sm text-brand-brown-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-brown-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-quattrocento',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export default Input;
