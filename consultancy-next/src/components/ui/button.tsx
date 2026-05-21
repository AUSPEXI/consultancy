import React from 'react';

const variantClasses: Record<string, string> = {
  default: 'bg-zinc-900 text-white hover:bg-zinc-800',
  outline: 'border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<string, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-6',
  icon: 'h-9 w-9',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  asChild?: boolean;
}

export function Button({ children, className, variant = 'default', size = 'default', asChild, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant] ?? ''} ${sizeClasses[size] ?? ''} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
