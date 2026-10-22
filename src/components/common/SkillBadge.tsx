import React from 'react';
import { ProficiencyLevel } from '../../types';

export interface SkillBadgeProps {
  name: string;
  proficiency?: ProficiencyLevel;
  variant?: 'neutral' | 'matched' | 'missing' | 'custom';
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  proficiency,
  variant = 'neutral',
  onRemove,
  size = 'md'
}) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'matched') {
    styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
  } else if (variant === 'missing') {
    styleClasses = 'bg-rose-50 text-rose-800 border-rose-200/80';
  } else if (proficiency) {
    switch (proficiency) {
      case 'Beginner':
        styleClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'Intermediate':
        styleClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'Advanced':
        styleClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'Expert':
        styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        break;
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-colors ${sizeClasses} ${styleClasses}`}
    >
      <span>{name}</span>
      {proficiency && (
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75 px-1 py-0.2 bg-black/5 rounded">
          {proficiency}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 hover:bg-black/10 rounded-full cursor-pointer text-current transition-colors"
          aria-label={`Remove skill ${name}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};
