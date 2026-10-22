import React, { useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Sparkles,
  MapPin,
  Briefcase,
  AlertCircle,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SalaryBarChart } from '../components/charts/SalaryBarChart';
import { calculateSalaryProjection } from '../utils/salaryCalculator';
import { useAuth } from '../context/AuthContext';
import { SALARY_BENCHMARKS } from '../data/salary';

export const SalaryInsights: React.FC = () => {
  const { user } = useAuth();

  const [selectedRole, setSelectedRole] = useState(user.targetRole || 'Data Analyst');
  const [selectedLocation, setSelectedLocation] = useState(user.preferredLocation || 'Bengaluru');
  const [hasCert, setHasCert] = useState(false);

  // Dynamic calculation
  const customProfile = {
    ...user,
    targetRole: selectedRole,
    preferredLocation: selectedLocation,
    cgpa: hasCert ? 9.0 : user.cgpa
  };

  const projection = calculateSalaryProjection(customProfile, selectedRole);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            What Could You Earn?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dynamic compensation projections calibrated to your verified technical skills, university standing, and desired location.
          </p>
        </div>

        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs self-start sm:self-auto">
          Tier-1 City Indexed
        </span>
      </div>

      {/* Illustrative Disclaimer Alert */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p>
          <strong>Illustrative Disclaimer:</strong> Salary estimates are illustrative and can vary based on company, location, experience and market conditions.
        </p>
      </div>

      {/* Interactive Controls Bar */}
      <Card padding="md" className="space-y-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Customize Your Salary Projection
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Engineering Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            >
              {SALARY_BENCHMARKS.map(b => (
                <option key={b.role} value={b.role}>{b.role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Work Location</label>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            >
              <option value="Bengaluru">Bengaluru (+12% Premium)</option>
              <option value="Hyderabad">Hyderabad (+8% Premium)</option>
              <option value="Mumbai">Mumbai (+8% Premium)</option>
              <option value="Pune">Pune (+5% Premium)</option>
              <option value="Remote">Remote / Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Industry Certifications Held</label>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="cert-toggle"
                checked={hasCert}
                onChange={e => setHasCert(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="cert-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                Include Validated Certification (+₹0.8–1.5L)
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Salary Projection Range Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Estimated Salary */}
        <Card padding="lg" className="bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
              Your Estimated Potential
            </span>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-3xl sm:text-4xl font-black text-indigo-600">
                ₹{projection.estimatedMin}–{projection.estimatedMax}
              </span>
              <span className="text-sm font-bold text-indigo-900">LPA</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Based on your current skills ({user.skills.length}) in {selectedLocation}
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-indigo-100/60 text-[11px] font-bold text-indigo-700">
            ★ Calibrated to your verified profile
          </div>
        </Card>

        {/* Expected Entry-Level Baseline */}
        <Card padding="lg" className="flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Expected Entry-Level
            </span>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-800">
                ₹{projection.entryLevelMin}–{projection.entryLevelMax}
              </span>
              <span className="text-sm font-bold text-slate-500">LPA</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Market baseline for fresh graduates in {selectedRole}
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
            Standard campus placement range
          </div>
        </Card>

        {/* With Additional Skills */}
        <Card padding="lg" className="bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
              With Additional Skills
            </span>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600">
                ₹{projection.upgradedMin}–{projection.upgradedMax}
              </span>
              <span className="text-sm font-bold text-emerald-900">LPA</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Unlocked by leveling up {projection.recommendedBoostSkills.slice(0, 2).join(' & ')}
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-emerald-100 text-[11px] font-bold text-emerald-700">
            ▲ Potential +₹1.5–2.5 LPA boost
          </div>
        </Card>
      </div>

      {/* Salary Comparison Bar Chart */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Cross-Role Compensation Benchmarks</h2>
            <p className="text-xs text-slate-500 mt-0.5">Compare entry-level, mid-level, and senior compensation across tech tracks</p>
          </div>
          <span className="text-xs font-bold text-slate-500">Annual CTC (LPA)</span>
        </div>

        <SalaryBarChart />
      </Card>

      {/* High-Impact Salary Levers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Top Value-Drivers in Your Profile
          </h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <span>Advanced Python proficiency</span>
              <span className="font-bold text-emerald-600">+₹0.6 LPA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <span>8.4 CGPA Academic Standing</span>
              <span className="font-bold text-emerald-600">+₹0.3 LPA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <span>Bengaluru Tech Corridor Premium</span>
              <span className="font-bold text-emerald-600">+12%</span>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Highest Return-on-Investment Upgrades
          </h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <span>Learn Power BI / Tableau to Intermediate</span>
              <span className="font-bold text-indigo-700">+₹0.8 LPA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <span>Earn AWS Cloud Practitioner Voucher</span>
              <span className="font-bold text-indigo-700">+₹1.0 LPA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <span>ServiceNow Admin (CSA) Credential</span>
              <span className="font-bold text-indigo-700">+₹1.5 LPA</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
