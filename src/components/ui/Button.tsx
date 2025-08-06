import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variantClassesMap = {
      default: 'bg-donegeon-green text-white hover:bg-donegeon-green/90',
      outline: 'border border-donegeon-gray bg-transparent hover:bg-donegeon-gray/80 hover:text-donegeon-text',
      ghost: 'hover:bg-donegeon-gray/80 hover:text-donegeon-text'
    };

    const variantClasses = variantClassesMap[variant || 'default'];

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    }[size];

    return (
      <button
        className={[baseClasses, variantClasses, sizeClasses, className].filter(Boolean).join(' ')}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };