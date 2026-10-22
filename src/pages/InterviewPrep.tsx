import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Code2,
  Database,
  Layers,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';

export const InterviewPrep: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);
        const res = await ApiService.getInterviewQuestions();
        if (res.success && res.questions) {
          setQuestionsData(res.questions);
        }
      } catch (err: any) {
        showToast('Unable to load interview questions', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  // Consolidate into array
  const allQuestions = questionsData
    ? [
        ...(questionsData.projectQuestions || []),
        ...(questionsData.javaQuestions || []),
        ...(questionsData.dsaQuestions || []),
        ...(questionsData.sqlQuestions || []),
        ...(questionsData.serviceNowQuestions || []),
        ...(questionsData.behavioralQuestions || [])
      ]
    : [];

  const categories = [
    'All',
    'Project Architecture & Decisions',
    'Java Core & Concurrency',
    'Java Enterprise / Spring Boot',
    'Data Structures & Algorithms',
    'Databases & SQL',
    'ServiceNow Architecture',
    'Behavioral & Teamwork',
    'HR & Career Alignment'
  ];

  const filteredQuestions = allQuestions.filter(q => {
    if (activeCategory === 'All') return true;
    return q.category === activeCategory;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Resume-Grounded Interview Preparation
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {allQuestions.length} Questions Prepared
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Questions generated specifically from your extracted projects, technical skills, and target engineering domain.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/roadmap')}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          View Learning Roadmap
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Questions Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Curating interview questions from resume evidence...</p>
          </div>
        ) : (
          filteredQuestions.map((q: any) => {
            const isExpanded = expandedId === q.id;

            return (
              <Card key={q.id} padding="lg" className="space-y-3 transition-all hover:border-slate-300">
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {q.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        {q.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  <button className="text-slate-400 hover:text-slate-600 mt-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Collapsible Answer Guide */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 text-xs text-slate-700 animate-fade-in">
                    {/* Why interviewer asks */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <strong className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                        Why the interviewer may ask this:
                      </strong>
                      <p className="leading-relaxed">{q.whyInterviewerMayAsk}</p>
                    </div>

                    {/* Expected Concepts */}
                    {q.expectedConcepts && (
                      <div className="space-y-1">
                        <strong className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                          Key technical concepts to mention:
                        </strong>
                        <ul className="space-y-1 list-disc list-inside text-indigo-950 font-medium">
                          {q.expectedConcepts.map((c: string, idx: number) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sample Answer Structure */}
                    {q.sampleAnswerStructure && (
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-950 space-y-1">
                        <strong className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block">
                          Suggested Answer Structure:
                        </strong>
                        <p className="leading-relaxed">{q.sampleAnswerStructure}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
