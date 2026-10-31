import React from 'react';

export type BadgeVariant =
  | 'ocean'
  | 'sand'
  | 'success'
  | 'warning'
  | 'purple'
  | 'slate'
  | 'rose'
  | 'sky'
  | 'emerald'
  | 'amber';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'ocean',
  size = 'md',
  icon,
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    ocean: { container: 'bg-ocean-50/80 text-ocean-700 border-ocean-200/80 shadow-2xs', dot: 'bg-ocean-500' },
    sand: { container: 'bg-sand-100 text-slate-600 border-sand-300 shadow-2xs', dot: 'bg-sand-400' },
    success: { container: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs', dot: 'bg-emerald-500' },
    emerald: { container: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs', dot: 'bg-emerald-500' },
    warning: { container: 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs', dot: 'bg-amber-500' },
    amber: { container: 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs', dot: 'bg-amber-500' },
    purple: { container: 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs', dot: 'bg-purple-500' },
    slate: { container: 'bg-slate-100 text-slate-700 border-slate-200 shadow-2xs', dot: 'bg-slate-500' },
    rose: { container: 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs', dot: 'bg-rose-500' },
    sky: { container: 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs', dot: 'bg-sky-500' },
  };

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5 font-medium rounded',
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-lg',
    lg: 'text-sm px-3 py-1.5 font-semibold rounded-xl',
  };

  const currentVariant = variantStyles[variant] || variantStyles.ocean;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-sans select-none tracking-tight transition-colors ${currentVariant.container} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentVariant.dot} animate-pulse`} />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
