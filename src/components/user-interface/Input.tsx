import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// Extends base props to allow for a 'select' or 'textarea' type input
// Also allows any data-* attributes to be passed through.
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, 'type'> {
  label?: string;
  as?: 'input' | 'select' | 'textarea';
  type?: string;
  children?: React.ReactNode;
  'data-log-id'?: string;
  rows?: number;
}

const Input = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, InputProps>(({ label, id, className, as = 'input', children, rows, ...props }, ref) => {
  
  const shadCnInputClasses = "flex h-10 w-full rounded-md border border-input bg-stone-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const inputElement = (() => {
    switch(as) {
      case 'select':
        return (
          <select
            id={id}
            ref={ref as React.ForwardedRef<HTMLSelectElement>}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
            className={cn(shadCnInputClasses, 'h-auto', className)}
          >
            {children}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            id={id}
            ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
            rows={rows}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            className={cn(shadCnInputClasses, 'h-auto', className)}
          />
        );
      case 'input':
      default:
        return (
          <input
            id={id}
            type={props.type || 'text'}
            ref={ref as React.ForwardedRef<HTMLInputElement>}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            className={cn(shadCnInputClasses, className)}
          />
        );
    }
  })();
  
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
