import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LandingButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'hero';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const LandingButton: React.FC<LandingButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  icon
}) => {
  const baseClasses = "group relative inline-flex items-center justify-center rounded-full transition-all duration-200 font-primary font-extrabold tracking-[1.2px] uppercase overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variants = {
    primary: "bg-primary text-white border border-primary/30 shadow-sm hover:-translate-y-px hover:shadow-md focus:ring-primary",
    secondary: "bg-white text-primary border border-white/30 shadow-sm hover:-translate-y-px hover:shadow-md focus:ring-white",
    outline: "border border-white/20 bg-white/5 text-white/90 backdrop-blur hover:bg-white/10 hover:border-white/30 hover:text-white focus:ring-white",
    hero: "w-[210px] h-[54px] py-[5px] pl-2.5 pr-[5px] flex items-center justify-between min-w-[200px] group bg-accent text-primary focus:ring-accent"
  }
  
  const sizes = {
    sm: "h-[40px] px-6 text-[12px] min-w-[120px]",
    md: "h-[46px] px-8 text-[13px] min-w-[150px]",
    lg: "h-[52px] px-10 text-[14px] min-w-[180px]",
    hero: "h-[54px] px-2.5 text-[13px] min-w-[200px]"
  }

  const focusRings = {
    primary: "focus:ring-primary",
    secondary: "focus:ring-white", 
    outline: "focus:ring-white",
    hero: "focus:ring-accent"
  }

  if (variant === 'hero') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          focusRings[variant],
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <span className="flex-1 text-center tracking-[1.2px] font-primary font-bold text-primary text-sm uppercase">
          {children}
        </span>
        <span className="w-11 h-11 bg-primary flex items-center justify-center">
          {icon || (
            <svg className="text-white text-xl group-hover:rotate-45 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          )}
        </span>
      </button>
    )
  }

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        focusRings[variant],
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
      <span className="relative flex items-center gap-3">
        {children}
        {icon && <span className="transition-transform duration-200 group-hover:translate-x-1">{icon}</span>}
      </span>
    </Button>
  )
}

export default LandingButton