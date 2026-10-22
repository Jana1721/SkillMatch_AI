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
import { COLLEGE_INDUSTRY_DATA } from '../../data/collegeIndustry';

export const CollegeIndustryChart: React.FC = () => {
  const data = COLLEGE_INDUSTRY_DATA.map(item => ({
    skill: item.skill,
    college: item.collegeAvg,
    industry: item.industryDemand,
    gap: item.gap
  }));

  return (
    <div className="w-full h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="skill"
            angle={-25}
            textAnchor="end"
            interval={0}
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(val, name) => [`${val}%`, name === 'college' ? 'College Syllabus Coverage' : 'Industry Hiring Demand']}
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
          <Bar dataKey="college" name="College Average" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="industry" name="Industry Demand" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
