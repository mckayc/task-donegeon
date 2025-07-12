import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, id, className, ...props }, ref) => {
  const inputElement = (
      <input
        id={id}
        ref={ref}
        {...props}
        className={`w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition ${className || ''}`}
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
