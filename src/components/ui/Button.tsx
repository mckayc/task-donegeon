import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = 'md', variant = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-9 px-3 rounded-md',
      md: 'h-10 py-2 px-4',
      lg: 'h-12 px-8 rounded-lg text-lg',
    };

    const variantClasses = {
      default: 'bg-donegeon-gold text-donegeon-brown-dark hover:bg-donegeon-gold/90',
      outline: 'border border-donegeon-gray bg-transparent hover:bg-donegeon-gray-dark text-donegeon-text hover:text-donegeon-gold'
    };

    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-donegeon-gold/50 disabled:pointer-events-none disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };