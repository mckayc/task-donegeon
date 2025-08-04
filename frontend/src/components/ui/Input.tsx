import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`w-full bg-stone-900/70 border border-stone-600 rounded-md px-3 py-2 text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition duration-200 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
