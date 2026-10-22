import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface ReadinessDonutProps {
  score: number; // 0 to 100
  breakdown: {
    technicalSkills: number;
    softSkills: number;
    experience: number;
    certifications: number;
    resumeQuality: number;
  };
}

export const ReadinessDonut: React.FC<ReadinessDonutProps> = ({ score, breakdown }) => {
  const data = [
    { name: 'Readiness', value: score },
    { name: 'Remaining', value: 100 - score }
  ];

  const COLORS = ['#6366f1', '#e2e8f0'];

  const metrics = [
    { label: 'Technical Skills', value: breakdown.technicalSkills, color: 'bg-indigo-600' },
    { label: 'Soft Skills', value: breakdown.softSkills, color: 'bg-purple-600' },
    { label: 'Experience', value: breakdown.experience, color: 'bg-blue-500' },
    { label: 'Certifications', value: breakdown.certifications, color: 'bg-amber-500' },
    { label: 'Resume Quality', value: breakdown.resumeQuality, color: 'bg-emerald-500' }
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Circular Donut Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{score}</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">/ 100</span>
          <span className="text-[10px] font-bold text-indigo-600 mt-0.5">Job-Ready</span>
        </div>
      </div>

      {/* Breakdown Progress Bars */}
      <div className="w-full space-y-2.5">
        {metrics.map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>{m.label}</span>
              <span className="font-bold text-slate-900">{m.value}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
