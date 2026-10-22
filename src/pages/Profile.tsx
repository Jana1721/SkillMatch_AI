import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SkillBadge } from '../components/common/SkillBadge';
import { ALL_SKILLS } from '../data/skills';
import { ProficiencyLevel, UserSkill } from '../types';
import {
  User,
  School,
  Target,
  Heart,
  Briefcase,
  Save,
  Plus,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, addSkill, removeSkill, updateSkillProficiency } = useAuth();
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    bio: user.bio || '',
    college: user.college,
    degree: user.degree,
    department: user.department,
    cgpa: user.cgpa,
    graduationYear: user.graduationYear,
    targetRole: user.targetRole,
    preferredLocation: user.preferredLocation,
    workMode: user.workMode,
    expectedSalary: user.expectedSalary
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const availableInterests = [
    'Data Analytics',
    'AI/ML',
    'Cloud',
    'Cybersecurity',
    'Web Development',
    'ServiceNow',
    'DevOps',
    'Business Analysis'
  ];

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const skillDef = ALL_SKILLS.find(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    addSkill({
      name: skillDef ? skillDef.name : newSkillName.trim(),
      proficiency: newSkillProficiency,
      category: skillDef ? (skillDef.category as any) : 'Tools'
    });

    showToast(`Added ${newSkillName.trim()} (${newSkillProficiency})`, 'success');
    setNewSkillName('');
    setIsAddingSkill(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      interests: selectedInterests
    });
    showToast('Profile updated successfully! AI matching scores refreshed.', 'success');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal details, academic standings, skills, and target career preferences.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSaveProfile}
        >
          Save Profile
        </Button>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: Personal Information */}
        <Card padding="lg">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Your core contact information shown on applications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio / Profile Summary</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none leading-relaxed"
                placeholder="Brief summary of your academic interests and career goals..."
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Academic Information */}
        <Card padding="lg">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic Information</h2>
              <p className="text-xs text-slate-500">Your university background, degree, and GPA benchmark</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University</label>
              <input
                type="text"
                required
                value={formData.college}
                onChange={e => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Degree</label>
              <input
                type="text"
                required
                value={formData.degree}
                onChange={e => setFormData({ ...formData, degree: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Branch</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CGPA (Out of 10.0)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={formData.cgpa}
                onChange={e => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="number"
                min="2024"
                max="2030"
                required
                value={formData.graduationYear}
                onChange={e => setFormData({ ...formData, graduationYear: parseInt(e.target.value, 10) || 2027 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Skills Management */}
        <Card padding="lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Skills Management</h2>
                <p className="text-xs text-slate-500">Add, remove, or modify your verified technical proficiency</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddingSkill(!isAddingSkill)}
            >
              {isAddingSkill ? 'Cancel' : 'Add Skill'}
            </Button>
          </div>

          {/* Add Skill Form Popover */}
          {isAddingSkill && (
            <div className="p-4 mb-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 animate-slide-up">
              <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                Add Technical Skill
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Name</label>
                  <input
                    type="text"
                    list="skills-datalist"
                    placeholder="e.g. AWS, Power BI, Python..."
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                  />
                  <datalist id="skills-datalist">
                    {ALL_SKILLS.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level</label>
                  <select
                    value={newSkillProficiency}
                    onChange={e => setNewSkillProficiency(e.target.value as ProficiencyLevel)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                  >
                    <option value="Beginner">Beginner (Foundational understanding)</option>
                    <option value="Intermediate">Intermediate (Project experience)</option>
                    <option value="Advanced">Advanced (Production & problem solving)</option>
                    <option value="Expert">Expert (Architecture & deep mastery)</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddSkillSubmit}
                  disabled={!newSkillName.trim()}
                >
                  Confirm Add
                </Button>
              </div>
            </div>
          )}

          {/* Existing Skills List */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.skills.map(skill => (
                <div
                  key={skill.name}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{skill.name}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{skill.category || 'Technical'}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={skill.proficiency}
                      onChange={e => updateSkillProficiency(skill.name, e.target.value as ProficiencyLevel)}
                      className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        removeSkill(skill.name);
                        showToast(`Removed ${skill.name}`, 'info');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label="Remove skill"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 4: Interests & Career Preferences */}
        <Card padding="lg">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Career Preferences & Interests</h2>
              <p className="text-xs text-slate-500">Calibrates role recommendations and expected salary benchmarking</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Interests Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Domains of Interest</label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1 text-indigo-600" />}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Career Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
                <select
                  value={formData.targetRole}
                  onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="ServiceNow Developer">ServiceNow Developer</option>
                  <option value="Business Analyst">Business Analyst</option>
                  <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="AI / ML Engineer">AI / ML Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Location</label>
                <select
                  value={formData.preferredLocation}
                  onChange={e => setFormData({ ...formData, preferredLocation: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Mode</label>
                <select
                  value={formData.workMode}
                  onChange={e => setFormData({ ...formData, workMode: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Any">Any / Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Salary</label>
                <input
                  type="text"
                  value={formData.expectedSalary}
                  onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })}
                  placeholder="e.g. ₹6–10 LPA"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<Save className="w-4 h-4" />}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
