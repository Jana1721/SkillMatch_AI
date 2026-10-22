import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SALARY_BENCHMARKS } from '../../data/salary';

export const SalaryBarChart: React.FC = () => {
  const chartData = SALARY_BENCHMARKS.map(b => ({
    role: b.role.replace(' Developer', '').replace(' Engineer', ''),
    entry: b.entryLevelMax,
    mid: b.midLevelMax,
    senior: b.seniorMax
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="role"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(val) => `₹${val}L`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`₹${value} LPA`, '']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: 'none',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          <Bar dataKey="entry" name="Entry-Level" fill="#818cf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="mid" name="Mid-Level (2-4 Yrs)" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="senior" name="Senior (5+ Yrs)" fill="#4338ca" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
