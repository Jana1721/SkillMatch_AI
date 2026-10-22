import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  ExternalLink,
  GraduationCap,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { StorageService } from '../utils/storage';
import { useToast } from '../context/ToastContext';
import { LearningPhase } from '../types';
import { MOCK_COURSES } from '../data/courses';

export const LearningPath: React.FC = () => {
  const { showToast } = useToast();
  const [phases, setPhases] = useState<LearningPhase[]>(() => StorageService.getLearningRoadmap());

  useEffect(() => {
    const handleStorageChange = () => {
      setPhases(StorageService.getLearningRoadmap());
    };
    window.addEventListener('skillmatch-storage-change', handleStorageChange);
    return () => window.removeEventListener('skillmatch-storage-change', handleStorageChange);
  }, []);

  // Calculate overall progress across all phases
  const totalProgress = phases.length > 0
    ? Math.round(phases.reduce((acc, curr) => acc + curr.progress, 0) / phases.length)
    : 0;

  const handleStartPhase = (phaseId: string) => {
    StorageService.updatePhaseProgress(phaseId, 25, 'in_progress');
    showToast('Phase started! Happy learning.', 'info');
  };

  const handleMarkCompletePhase = (phaseId: string) => {
    StorageService.updatePhaseProgress(phaseId, 100, 'completed');
    showToast('Congratulations! Phase marked as 100% completed.', 'success');
  };

  const handleResetPhase = (phaseId: string) => {
    StorageService.updatePhaseProgress(phaseId, 0, 'not_started');
    showToast('Phase reset to not started.', 'info');
  };

  const handleToggleTask = (phaseId: string, taskId: string) => {
    StorageService.toggleTaskCompleted(phaseId, taskId);
    showToast('Milestone task updated!', 'info');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your Personalized Career Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dynamic milestone phases constructed from your verified profile and top skill gap deficiencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs">
            {phases.filter(p => p.status === 'completed').length} of {phases.length} Phases Done
          </span>
        </div>
      </div>

      {/* Overall Roadmap Progress Hero Card */}
      <Card padding="lg" className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Placement Preparedness Tracker</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Overall Roadmap: {totalProgress}% Complete
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl leading-relaxed">
              Completing all 5 milestone phases equips you with production-grade portfolio projects, deep query mastery, and ATS-optimized interview positioning.
            </p>
          </div>

          <div className="w-full md:w-72 space-y-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="flex justify-between text-xs font-bold text-indigo-200">
              <span>Career Preparedness</span>
              <span>{totalProgress}%</span>
            </div>
            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-300 text-center pt-1">
              {100 - totalProgress}% remaining to target role certification
            </p>
          </div>
        </div>
      </Card>

      {/* 5-Phase Interactive Roadmap */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Curriculum Phases</span>
          </h2>
          <span className="text-xs text-slate-500">Live persistence enabled</span>
        </div>

        <div className="space-y-4">
          {phases.map((phase, idx) => {
            const isDone = phase.status === 'completed' || phase.progress === 100;
            const inProgress = phase.status === 'in_progress' && phase.progress > 0;

            return (
              <Card
                key={phase.id}
                padding="md"
                className={`transition-all ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : inProgress
                    ? 'border-indigo-300 bg-white shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-4">
                  {/* Phase Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : inProgress
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isDone ? <Check className="w-5 h-5" /> : `0${phase.phaseNumber || idx + 1}`}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">{phase.title}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : inProgress
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isDone ? 'Completed' : inProgress ? 'In Progress' : 'Not Started'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3 h-3 text-slate-400" /> {phase.duration}
                          </span>
                          <span>•</span>
                          <span>Focus: {phase.skills.join(', ')}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:self-center">
                      {!isDone && (
                        <>
                          {phase.progress === 0 ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Play className="w-3.5 h-3.5" />}
                              onClick={() => handleStartPhase(phase.id)}
                            >
                              Start Phase
                            </Button>
                          ) : null}
                          <Button
                            variant="success"
                            size="sm"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleMarkCompletePhase(phase.id)}
                          >
                            Mark Complete
                          </Button>
                        </>
                      )}

                      {isDone && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                          onClick={() => handleResetPhase(phase.id)}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {phase.description}
                  </p>

                  {/* Phase Progress Bar */}
                  <div className="space-y-1">
                    <ProgressBar
                      progress={phase.progress}
                      color={isDone ? 'emerald' : 'indigo'}
                      height="sm"
                      showLabel
                      label="Milestone Completion"
                    />
                  </div>

                  {/* Tasks Checklist */}
                  {phase.tasks && phase.tasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Action Tasks
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {phase.tasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleTask(phase.id, task.id)}
                            className={`p-2 rounded-xl border flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                              task.completed
                                ? 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/60'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                task.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {task.completed && <Check className="w-3 h-3" />}
                            </div>
                            <span className={task.completed ? 'line-through text-slate-400' : 'font-medium'}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recommended Courses & Resources */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Recommended Online Courses</span>
            </h2>
            <p className="text-xs text-slate-500">Curated materials matching your active learning gaps</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_COURSES.slice(0, 8).map(course => (
            <Card key={course.id} hoverable padding="sm" className="flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                    {course.platform}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-600">★ {course.rating}</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                  {course.title}
                </h4>

                <p className="text-[11px] text-slate-500">
                  Duration: {course.duration} • {course.difficulty}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {course.skillsGained.slice(0, 3).map(skill => (
                    <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
