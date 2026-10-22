import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'auto';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'indigo',
  height = 'md',
  showLabel = false,
  label,
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  // Determine color automatically if 'auto'
  let activeColor = color;
  if (color === 'auto') {
    if (clamped >= 75) activeColor = 'emerald';
    else if (clamped >= 40) activeColor = 'indigo';
    else activeColor = 'amber';
  }

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const fillColors = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-600',
    auto: 'bg-indigo-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
          <span>{label || 'Progress'}</span>
          <span className="tabular-nums font-bold text-slate-900">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightStyles[height]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillColors[activeColor]}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
