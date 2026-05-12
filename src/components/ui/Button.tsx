import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'gold-ghost' | 'danger' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    'gold-ghost': 'btn-gold-ghost',
    danger: 'btn-danger',
    icon: 'btn-icon'
  };

  return (
    <button className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
