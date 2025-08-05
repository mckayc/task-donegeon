
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 font-cinzel tracking-wider';

    const variantClasses = {
      primary: 'bg-brand-green-700 text-brand-green-100 hover:bg-brand-green-600 shadow-lg transform hover:-translate-y-0.5 transition-transform',
      secondary: 'bg-brand-brown-500 text-brand-brown-100 hover:bg-brand-brown-700',
      ghost: 'hover:bg-brand-gray-700 hover:text-brand-gray-100',
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
