import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2';
    
    const variantClasses = variant === 'outline'
      ? 'border border-donegeon-gray bg-transparent hover:bg-donegeon-gray'
      : 'bg-donegeon-gold text-donegeon-brown-dark hover:bg-donegeon-gold/90';

    return (
      <button
        className={[baseClasses, variantClasses, className].filter(Boolean).join(' ')}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };