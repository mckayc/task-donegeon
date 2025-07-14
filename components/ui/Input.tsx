
import React, { forwardRef } from 'react';

// Extends base props to allow for a 'select' type input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement | HTMLSelectElement, InputProps>(({ label, id, className, as = 'input', children, ...props }, ref) => {
  
  const baseClasses = `w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition ${className || ''}`;

  const inputElement = as === 'select' ? (
    <select
      id={id}
      ref={ref as React.ForwardedRef<HTMLSelectElement>}
      {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      className={baseClasses}
    >
      {children}
    </select>
  ) : (
    <input
      id={id}
      ref={ref as React.ForwardedRef<HTMLInputElement>}
      {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      className={baseClasses}
    />
  );
  
  if (!label) {
    return inputElement;
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-300 mb-1">
        {label}
      </label>
      {inputElement}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
