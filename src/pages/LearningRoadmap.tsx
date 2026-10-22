import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';

export const LearningRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);

  useEffect(() => {
    async function loadRoadmap() {
      try {
        setLoading(true);
        const res = await ApiService.getRoadmap();
        if (res.success && res.roadmap) {
          setRoadmap(res.roadmap);
        }
      } catch (err: any) {
        showToast('Unable to load personalized roadmap', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, []);

  const toggleWeekDone = (weekNum: number) => {
    if (completedWeeks.includes(weekNum)) {
      setCompletedWeeks(completedWeeks.filter(w => w !== weekNum));
      showToast(`Marked Week ${weekNum} as in progress`, 'info');
    } else {
      setCompletedWeeks([...completedWeeks, weekNum]);
      showToast(`Congratulations on completing Week ${weekNum}!`, 'success');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Personalized 6-Week Learning Roadmap
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Gap-Calibrated
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dynamic weekly milestones engineered specifically to bridge the technical deficiencies identified in your resume.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/interview')}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Interview Preparation
        </Button>
      </div>

      {/* Roadmap Feed */}
      <div className="space-y-5">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Constructing gap-driven syllabus...</p>
          </div>
        ) : (
          roadmap.map((week: any) => {
            const isCompleted = completedWeeks.includes(week.weekNumber);

            return (
              <Card
                key={week.weekNumber}
                padding="lg"
                className={`transition-all border-l-4 ${
                  isCompleted
                    ? 'border-l-emerald-500 bg-emerald-50/20'
                    : 'border-l-indigo-600 bg-white'
                }`}
              >
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        W{week.weekNumber}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{week.title}</h3>
                        <p className="text-xs text-indigo-700 font-semibold">{week.focus}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleWeekDone(week.weekNumber)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isCompleted ? 'Completed' : 'Mark as Done'}
                    </button>
                  </div>

                  {/* Core Topics Grid */}
                  <div className="space-y-1.5 text-xs">
                    <strong className="text-slate-400 uppercase text-[10px] tracking-wider block">
                      Target Technical Concepts:
                    </strong>
                    <div className="flex flex-wrap gap-1.5">
                      {week.keyTopics.map((topic: string, tIdx: number) => (
                        <span key={tIdx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg">
                          • {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Practical Tasks */}
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-700">
                    <strong className="text-slate-500 uppercase text-[10px] tracking-wider block">
                      Concrete Practice Deliverables:
                    </strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-900 font-medium">
                      {week.practiceTasks.map((task: string, taskIdx: number) => (
                        <li key={taskIdx}>{task}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
