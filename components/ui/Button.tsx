import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'base' | 'sm';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'base', ...props }) => {
  const baseClasses = 'font-bold rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'bg-stone-600 text-stone-100 hover:bg-stone-500',
  };

  const sizeClasses = {
    base: 'px-6 py-3',
    sm: 'px-3 py-1.5 text-sm',
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;