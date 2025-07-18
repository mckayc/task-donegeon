import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-6 py-3 font-bold rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'bg-stone-600 text-stone-100 hover:bg-stone-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;