import React, { ReactNode } from 'react';
import { Card } from '../common/Card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'indigo' | 'emerald' | 'purple' | 'amber' | 'blue';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  accentColor = 'indigo',
  onClick
}) => {
  const iconBgStyles = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600'
  };

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      padding="md"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</span>
            {trend && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium pt-0.5">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-2xl shrink-0 ${iconBgStyles[accentColor]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
