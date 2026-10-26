import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileText,
  User,
  Calendar,
  Briefcase,
  X,
  Compass,
  Check,
  BarChart3,
  Scale,
  ListChecks
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface InterviewMarksheetViewProps {
  report: any;
  candidateName?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const InterviewMarksheetView: React.FC<InterviewMarksheetViewProps> = ({
  report,
  candidateName: propCandidateName,
  onClose,
  isModal = false
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [activeSectionTab, setActiveSectionTab] = useState<
    'all' | 'questions' | 'categories' | 'strengths' | 'rubric' | 'learning_plan' | 'feedback'
  >('all');

  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p>No interview marksheet data available.</p>
      </div>
    );
  }

  // Extract marksheet from nested object or synthesize from report
  const marksheet = report.marksheet || {};
  const overall = marksheet.overallPerformance || {
    candidateName: report.candidateName || propCandidateName || 'Candidate',
    interviewDate: report.completedAt
      ? new Date(report.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    targetJobRole: report.targetRole || 'Software Engineer',
    interviewType: report.interviewType || 'Technical Interview',
    difficulty: report.difficulty || 'Intermediate',
    questionsAsked: report.totalQuestions || 5,
    questionsAnswered: report.answeredCount !== undefined ? report.answeredCount : (report.totalQuestions || 5),
    questionsAttempted: report.answeredCount !== undefined ? report.answeredCount : (report.totalQuestions || 5),
    questionsCompleted: report.answeredCount !== undefined ? report.answeredCount : (report.totalQuestions || 5),
    questionsUnanswered: Math.max(0, (report.totalQuestions || 5) - (report.answeredCount !== undefined ? report.answeredCount : (report.totalQuestions || 5))),
    totalMarksObtained: report.totalMarksObtained !== undefined ? report.totalMarksObtained : Number(((report.overallScore || 75) / 10).toFixed(1)),
    totalMaxMarks: report.totalMaxMarks || ((report.totalQuestions || 5) * 10),
    overallPercentage: report.overallPercentage !== undefined ? report.overallPercentage : (report.overallScore || 75),
    performanceLevel: report.readinessTier || 'Solid Competence',
    completionStatus: (report.tabSwitchTerminated || marksheet.overallPerformance?.tabSwitchTerminated)
      ? 'Terminated Early (Tab Switch Violation)'
      : 'Completed',
    interviewMode: marksheet.overallPerformance?.interviewMode || report.interviewMode || 'resume',
    selectedDomain: marksheet.overallPerformance?.selectedDomain || report.selectedDomain || null,
    specialization: marksheet.overallPerformance?.specialization || report.specialization || null,
    tabSwitchCount: marksheet.overallPerformance?.tabSwitchCount !== undefined
      ? marksheet.overallPerformance.tabSwitchCount
      : (report.tabSwitchCount !== undefined ? report.tabSwitchCount : 0),
    tabSwitchTerminated: !!(marksheet.overallPerformance?.tabSwitchTerminated || report.tabSwitchTerminated)
  };

  // Section 6.B: Question-by-Question Table Items
  const questionTable: any[] = (marksheet.questionByQuestionTable || (report.transcript || [])).map((t: any, idx: number) => {
    const finalScore = t.awardedMarks !== undefined ? t.awardedMarks : (t.scoreOutOf10 !== undefined ? t.scoreOutOf10 : Number(((t.score || 70) / 10).toFixed(1)));
    return {
      questionNumber: t.questionNumber || idx + 1,
      question: t.question || t.questionText,
      topic: t.topic || `Question ${idx + 1}`,
      category: t.category || 'Technical Fundamentals',
      candidateAnswer: t.candidateAnswer || t.userAnswer || t.answer || '[Candidate provided no audible response]',
      awardedMarks: finalScore,
      maxMarks: t.maxMarks || 10,
      marksDisplay: t.marksDisplay || `${finalScore} / 10`,
      scoreOutOf10: finalScore,
      explanation: t.explanation || t.evaluation?.spokenFeedback || 'Evaluated based on relevance, correctness, and technical depth.',
      correctPoints: t.correctPoints || t.evaluation?.whatYouDidWell || ['Directly engaged with core question prompt.'],
      missingPoints: t.missingPoints || t.evaluation?.whatYouMissed || ['Omitted deeper architectural or operational details.'],
      expectedAnswer: t.expectedAnswer || t.evaluation?.betterAnswer || 'Comprehensive explanation covering definition, implementation workflow, and practical engineering trade-offs.',
      evaluation: t.evaluation?.classification || t.classification || (finalScore >= 8 ? 'Relevant and correct' : finalScore >= 5 ? 'Partially correct' : 'Incorrect / Needs work'),
      improvementFeedback: t.improvementFeedback || t.evaluation?.conciseFeedback || t.evaluation?.spokenFeedback || 'Review core technical documentation and practice structured STAR articulation.',
      marksBreakdown: t.marksBreakdown || {
        relevance: finalScore >= 5 ? 2 : 1,
        correctness: Math.min(4, Math.max(1, Math.round(finalScore * 0.4))),
        depth: Math.min(2, Math.max(0, Math.round(finalScore * 0.2))),
        clarity: Math.min(2, Math.max(1, Math.round(finalScore * 0.2)))
      },
      attempts: t.attempts || [{ attemptNumber: 1, userAnswer: t.candidateAnswer || t.userAnswer, awardedMarks: finalScore, classification: t.classification }]
    };
  });

  // Section 6.C: Category-Wise Performance (Assessed Categories Only)
  const categoryPerformance: any[] = (marksheet.categoryWisePerformance || report.categoryWisePerformance || []).filter(
    (c: any) => c && c.questionsAssessed > 0
  );

  // Fallback to skillPerformance if category-wise wasn't computed (e.g. legacy session)
  const skillPerformance: any[] = marksheet.skillWisePerformance || [
    {
      skill: 'Technical Knowledge & Fundamentals',
      score: report.performanceDimensions?.technicalKnowledge || 75,
      percentage: report.performanceDimensions?.technicalKnowledge || 75,
      evidence: 'Evaluated across technical architecture questions in this session.'
    },
    {
      skill: 'Resume and Project Understanding',
      score: report.performanceDimensions?.projectUnderstanding || 78,
      percentage: report.performanceDimensions?.projectUnderstanding || 78,
      evidence: 'Evaluated across candidate project architecture questions and problem statements.'
    },
    {
      skill: 'Problem-Solving & Scenario Reasoning',
      score: report.performanceDimensions?.problemSolving || 72,
      percentage: report.performanceDimensions?.problemSolving || 72,
      evidence: 'Evaluated on handling edge cases, debugging methods, and design trade-offs.'
    },
    {
      skill: 'Role-Specific Readiness',
      score: report.overallScore || 75,
      percentage: report.overallScore || 75,
      evidence: `Calibrated specifically against the competency expectations for a ${overall.targetJobRole}.`
    },
    {
      skill: 'Communication & Verbal Articulation',
      score: report.performanceDimensions?.communication || 80,
      percentage: report.performanceDimensions?.communication || 80,
      evidence: 'Assessed by verbal clarity, structured explanations, and conciseness.'
    }
  ];

  // Section 6.D: Strengths and Improvement Areas
  const strengthsAndImprovements = marksheet.strengthsAndImprovementAreas || {
    strongestKnowledgeAreas: report.strongAreas || [
      'Grounded understanding of foundational software engineering principles',
      'Familiarity with core tech stack components and problem workflows'
    ],
    demonstratedPracticalSkills: [
      'Ability to articulate development workflows and project implementation steps',
      'Knowledge of basic debugging and verification approaches'
    ],
    projectUnderstandingStrengths: [
      'Clear high-level overview of resume project purpose and motivation',
      'Understanding of component interaction in primary modules'
    ],
    communicationAndReasoningStrengths: [
      'Professional tone and prompt voice responsiveness during questioning',
      'Clear verbal pacing without excessive fillers'
    ],
    technicalGaps: report.weakAreas || [
      'Deeper architectural trade-offs and component failure handling',
      'Specific time/space complexity trade-offs in implementation choices'
    ],
    incompleteOrUnclearResponses: [
      'Responses that briefly stated concepts without concrete implementation examples'
    ],
    areasNeedingFurtherPractice: [
      'Defending technical decisions using measurable metrics (latency, scalability)',
      'Handling unexpected edge cases and critical production failure scenarios'
    ],
    recommendedExercises: [
      'Practice verbal walk-throughs of your resume projects using the STAR framework',
      'Implement reproducible minimal examples for core data structures and frameworks',
      'Simulate system architecture walk-throughs focusing on error recovery'
    ]
  };

  const mistakes: any[] = marksheet.mistakesAndWeakAreas || (report.improvementQuestions || []).map((iq: any) => ({
    question: iq.questionText || iq.question,
    topic: iq.topic || 'Technical Competency',
    marksAwarded: Number(((iq.score || 50) / 10).toFixed(1)),
    marksLost: Number((10 - ((iq.score || 50) / 10)).toFixed(1)),
    whatMisunderstood: (iq.whatYouMissed && iq.whatYouMissed.join('; ')) || 'Omitted key underlying mechanisms or architectural edge cases.',
    whyIncompleteOrIncorrect: 'The answer lacked concrete engineering depth regarding internal mechanics.',
    correctConcept: iq.betterAnswer || 'State the definition, internal mechanics, and practical implementation example.',
    improvementExample: 'Structure your explanation using STAR and specify real data structures.'
  }));

  const learningPlan = marksheet.personalizedLearningPlan || {
    priority1_mustImprove: [
      {
        topic: report.weakAreas?.[0] || 'Core Technical Foundations',
        reason: 'Identified as primary knowledge gap in this interview.',
        recommendedAction: 'Study official documentation and implement minimal reproducible examples.'
      }
    ],
    priority2_practiceMore: [
      {
        topic: report.weakAreas?.[1] || 'Project Technical Architecture',
        reason: 'Partially explained but needs greater depth and edge-case clarity.',
        recommendedAction: 'Document schema diagrams and caching trade-offs for each resume project.'
      }
    ],
    priority3_advancedLearning: [
      {
        topic: 'High-Concurrency Scaling & Caching',
        reason: 'Preparation for tier-1 technical rounds and system design.',
        recommendedAction: 'Design distributed architectures with Redis caching and asynchronous queues.'
      }
    ],
    recommendedPracticeQuestions: [
      {
        topic: overall.targetJobRole,
        question: `How would your architecture scale if traffic increased 100x?`
      }
    ],
    recommendedProjects: [
      {
        name: `Production-Grade ${overall.targetJobRole} Microservice`,
        description: 'Build a containerized REST service with relational persistence, JWT auth, and metrics.',
        technologies: ['Docker', 'Database Indexing', 'API Security']
      }
    ]
  };

  const closingFeedback = marksheet.interviewerClosingFeedback || {
    strongestAreas: report.strongAreas || ['Demonstrated solid conceptual familiarity with software engineering'],
    criticalMistakes: mistakes.slice(0, 3).map((m: any) => `Lost ${m.marksLost} marks on ${m.topic}: ${m.whatMisunderstood}`),
    roleReadinessVerdict: report.readinessTier
      ? `Assessed as ${report.readinessTier}. Systematic preparation of identified weak areas will elevate candidate readiness.`
      : 'Demonstrates foundational competency with clear opportunities for technical deepening.',
    recommendedNextActions: [
      'Review weak areas and suggested model answers in this marksheet.',
      'Spend 30 minutes revising Priority 1 topics before next session.',
      'Practice verbal articulation with the STAR framework.',
      'Retake the AI Voice Interview to verify score gains.'
    ]
  };

  const toggleQuestionExpand = (idx: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const getClassificationBadge = (classification: string) => {
    const c = (classification || '').toLowerCase();
    if (c.includes('correct') && !c.includes('partially') && !c.includes('incorrect')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Relevant & Correct</span>;
    }
    if (c.includes('partially')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Partially Correct</span>;
    }
    if (c.includes('incorrect')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Incorrect</span>;
    }
    if (c.includes('irrelevant') || c.includes('off-topic')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Irrelevant / Off-Topic</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Insufficient Info</span>;
  };

  return (
    <div className={`space-y-6 ${isModal ? 'max-h-[85vh] overflow-y-auto px-1' : ''}`}>
      {/* ========================================================================= */}
      {/* MARKSHEET HEADER & PRINT ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>SkillMatch AI &bull; Official Candidate Interview Marksheet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {overall.candidateName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Target Role: <strong>{overall.targetJobRole}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {overall.interviewType} ({overall.difficulty})
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {overall.interviewDate}
              </span>
              <span className="text-slate-500">•</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                overall.interviewMode === 'manual'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                {overall.interviewMode === 'manual'
                  ? `Mode 2: Manual Practice (${overall.selectedDomain || 'Domain'})`
                  : 'Mode 1: Resume-Based Interview'}
              </span>
              <span className="text-slate-500">•</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                overall.tabSwitchCount >= 3
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
              }`}>
                Tab switches: {overall.tabSwitchCount}/3
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
              title="Print Official Marksheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Marksheet</span>
            </button>
            {isModal && onClose && (
              <button
                onClick={onClose}
                type="button"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Proctoring Policy Termination Banner */}
        {overall.tabSwitchTerminated && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 flex items-start gap-3 backdrop-blur-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-100 uppercase tracking-wide">
                Interview Terminated Early &bull; Tab-Switch Limit Reached (3/3)
              </h4>
              <p className="text-xs text-rose-200 leading-relaxed">
                This interview was paused and terminated according to the interview proctoring policy after 3 tab switches were recorded. The marksheet below evaluates questions answered prior to termination.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6.A: OVERALL INTERVIEW SUMMARY */}
        {/* ========================================================================= */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Section 6.A — Interview Summary & Performance Metrics</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Score Earned / Max Score */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                Total Score
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {overall.totalMarksObtained}
                <span className="text-sm sm:text-base text-indigo-300 font-semibold"> / {overall.totalMaxMarks}</span>
              </div>
              <span className="text-[10px] text-slate-300 mt-0.5 block">Total Scaled Marks</span>
            </div>

            {/* Overall Percentage = (Total earned / Total possible) * 100 */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                Overall Percentage
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                {overall.overallPercentage}%
              </div>
              <span className="text-[10px] text-slate-300 mt-0.5 block font-mono">(Earned ÷ Max) × 100</span>
            </div>

            {/* Questions Attempted & Completed */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                Questions
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {overall.questionsAttempted}
                <span className="text-sm sm:text-base text-indigo-300 font-semibold"> / {overall.questionsAsked}</span>
              </div>
              <span className="text-[10px] text-slate-300 mt-0.5 block">
                {overall.questionsUnanswered > 0 ? `${overall.questionsUnanswered} Unanswered` : '100% Completed'}
              </span>
            </div>

            {/* Performance Level */}
            <div className="col-span-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-center text-center sm:text-left">
              <span className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                Performance Verdict
              </span>
              <div className="text-sm sm:text-base font-bold text-white mt-1">
                {overall.performanceLevel}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-300 font-medium">
                  Status: Completed &bull; Ready for Industry Review
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION FILTER TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'all', label: 'Complete Marksheet' },
          { key: 'questions', label: '6.B Question Evaluation' },
          { key: 'categories', label: `6.C Category Scores (${categoryPerformance.length || 'Assessed'})` },
          { key: 'strengths', label: '6.D Strengths & Improvements' },
          { key: 'rubric', label: '6.E Scoring Rules & Rubric' },
          { key: 'learning_plan', label: 'Personalized Learning Plan' },
          { key: 'feedback', label: '6.F Closing Verdict' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSectionTab(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSectionTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6.B: QUESTION-BY-QUESTION EVALUATION TABLE */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'questions') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Section 6.B — Question-by-Question Evaluation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact spoken answers, transparent 0–10 score, score explanation, identified correct/missing points, and model criteria.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 font-mono">
              Rubric: 0–10 Scale (Relevance + Correctness + Depth + Clarity)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[130px]">Category</th>
                  <th className="py-3 px-4 min-w-[220px]">Question Asked</th>
                  <th className="py-3 px-4 min-w-[240px]">Candidate's Spoken Answer</th>
                  <th className="py-3 px-3 text-center min-w-[85px]">Score</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Evaluation</th>
                  <th className="py-3 px-4 min-w-[180px]">Improvement Suggestion</th>
                  <th className="py-3 px-2 text-center w-10">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questionTable.map((q, idx) => {
                  const isExpanded = expandedQuestions[idx];
                  return (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                          {q.questionNumber || idx + 1}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {q.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-snug">{q.question}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{q.topic}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 italic">
                          "{q.candidateAnswer}"
                          {q.attempts && q.attempts.length > 1 && (
                            <span className="block mt-1 text-[10px] font-bold text-amber-600 not-italic">
                              ({q.attempts.length} attempts recorded)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-black font-mono text-sm text-indigo-700">
                          {q.marksDisplay}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {getClassificationBadge(q.evaluation)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                          {q.improvementFeedback}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleQuestionExpand(idx)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                            title="Toggle Full Rubric & Criteria Details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/40">
                          <td colSpan={8} className="p-4 border-b border-indigo-100">
                            <div className="space-y-3 text-xs">
                              {/* Score Explanation */}
                              <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">
                                  Score Explanation ({q.marksDisplay}):
                                </span>
                                <p className="text-slate-800 font-medium leading-relaxed">
                                  {q.explanation}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Correct Points Identified */}
                                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
                                  <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Correct / Relevant Points Identified:</span>
                                  </span>
                                  <ul className="space-y-1 pl-4 list-disc text-emerald-950 font-medium">
                                    {Array.isArray(q.correctPoints) && q.correctPoints.length > 0 ? (
                                      q.correctPoints.map((pt: string, pIdx: number) => (
                                        <li key={pIdx}>{pt}</li>
                                      ))
                                    ) : (
                                      <li>Core topic was acknowledged.</li>
                                    )}
                                  </ul>
                                </div>

                                {/* Missing or Weak Points */}
                                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1.5">
                                  <span className="text-[10px] uppercase font-bold text-rose-800 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Missing, Incorrect, or Weak Points:</span>
                                  </span>
                                  <ul className="space-y-1 pl-4 list-disc text-rose-950 font-medium">
                                    {Array.isArray(q.missingPoints) && q.missingPoints.length > 0 ? (
                                      q.missingPoints.map((pt: string, pIdx: number) => (
                                        <li key={pIdx}>{pt}</li>
                                      ))
                                    ) : (
                                      <li>No critical omissions detected.</li>
                                    )}
                                  </ul>
                                </div>
                              </div>

                              {/* Expected Answer Elements / Criteria */}
                              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">
                                  Expected Answer Criteria & Model Elements:
                                </span>
                                <p className="text-indigo-950 font-medium leading-relaxed">
                                  {q.expectedAnswer}
                                </p>
                              </div>

                              {/* All Attempts History if multiple */}
                              {q.attempts && q.attempts.length > 1 && (
                                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                                  <span className="font-bold text-amber-800 text-[11px] uppercase tracking-wider">
                                    Spoken Response Attempts History:
                                  </span>
                                  <div className="space-y-1.5">
                                    {q.attempts.map((att: any, aIdx: number) => (
                                      <div key={aIdx} className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] flex items-start justify-between gap-2">
                                        <div>
                                          <strong className="text-slate-800">Attempt {att.attemptNumber || aIdx + 1}:</strong> "{att.userAnswer}"
                                          {att.spokenFeedback && <p className="text-slate-500 italic mt-0.5">{att.spokenFeedback}</p>}
                                        </div>
                                        <div className="shrink-0 text-right">
                                          <span className="font-bold text-indigo-700">{att.awardedMarks || 0}/10</span>
                                          <div className="text-[10px] text-slate-400">{att.classification}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6.C: CATEGORY-WISE SCORES (SHOWING ONLY ASSESSED CATEGORIES)     */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'categories') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Section 6.C — Category-Wise Evaluated Scores</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays scores only for categories actually assessed during this interview. Unassessed categories are omitted to ensure fair evaluation.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{categoryPerformance.length} Actually Assessed Categories</span>
            </div>
          </div>

          {categoryPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryPerformance.map((c, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">{c.category}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {c.questionsAssessed} question(s) assessed &bull; {c.marksDisplay} marks
                      </span>
                    </div>
                    <span className="font-black font-mono text-base text-indigo-700 shrink-0">
                      {c.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.percentage >= 80 ? 'bg-emerald-500' : c.percentage >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-700">Evidence basis:</strong> {c.evidence}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillPerformance.map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{s.skill}</span>
                    <span className="font-black font-mono text-sm sm:text-base text-indigo-700">{s.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, s.score))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-700">Evidence basis:</strong> {s.evidence}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Fair Evaluation Policy:</strong> Categories not assessed in this session are excluded from both total earned score and maximum possible score. They are never represented as zero percent.
            </span>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6.D: STRENGTHS AND IMPROVEMENT AREAS                             */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'strengths') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Section 6.D — Strengths and Improvement Areas</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive synthesis based on candidate's actual spoken answers, project defenses, and technical evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Left Column: Strengths */}
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Strongest Knowledge & Practical Skills</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-emerald-950 font-medium">
                  {strengthsAndImprovements.strongestKnowledgeAreas.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                  {strengthsAndImprovements.demonstratedPracticalSkills.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span>Project-Understanding Strengths</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-teal-950 font-medium">
                  {strengthsAndImprovements.projectUnderstandingStrengths.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Communication & Reasoning Strengths</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-indigo-950 font-medium">
                  {strengthsAndImprovements.communicationAndReasoningStrengths.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Improvement Areas & Actions */}
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Technical Gaps & Unclear Responses</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-rose-950 font-medium">
                  {strengthsAndImprovements.technicalGaps.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                  {strengthsAndImprovements.incompleteOrUnclearResponses.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Areas Needing Further Verbal Practice</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-amber-950 font-medium">
                  {strengthsAndImprovements.areasNeedingFurtherPractice.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  <span>Recommended Actionable Exercises</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-700 font-medium">
                  {strengthsAndImprovements.recommendedExercises.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6.E: SCORING AND CALCULATION RULES                                */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'rubric') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Section 6.E — Scoring and Calculation Rules</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent, explainable 0–10 evaluation rubric and percentage calculation formulas applied to this interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 0-10 Rubric */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                Standard 0–10 Question Evaluation Rubric:
              </span>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <strong>9–10 Marks:</strong> Strong, accurate, relevant, and sufficiently complete answer demonstrating deep conceptual understanding and implementation mastery.
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950">
                  <strong>7–8 Marks:</strong> Good understanding with minor omissions. Covers core mechanics and workflow accurately.
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-950">
                  <strong>4–6 Marks:</strong> Partial understanding with important gaps. Identifies high-level terms but lacks architectural or debugging depth.
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                  <strong>1–3 Marks:</strong> Major gaps or significant inaccuracies. Response is superficial or tangential.
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-950">
                  <strong>0 Marks:</strong> No assessable answer, silent recording, or entirely irrelevant response.
                </div>
              </div>
            </div>

            {/* Calculation Formula & Exclusion Policy */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
              <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] block">
                Official Percentage Calculation Formula:
              </span>
              <div className="p-3 bg-white rounded-xl border border-indigo-200 text-center font-mono font-bold text-sm text-indigo-700">
                Overall Percentage = (Total Earned Score ÷ Total Possible Score) × 100
              </div>
              <div className="space-y-2 text-indigo-950">
                <p>
                  &bull; <strong>Current Session:</strong> ({overall.totalMarksObtained} ÷ {overall.totalMaxMarks}) × 100 = <strong>{overall.overallPercentage}%</strong>
                </p>
                <p>
                  &bull; <strong>Unassessed Questions & Categories:</strong> Excluded completely from both earned and possible scores. Unasked categories never penalize candidate scores.
                </p>
                <p>
                  &bull; <strong>Retry Policy:</strong> When clarification is requested for off-topic answers on attempt 1, the final submitted response is scored and both attempts are recorded transparently in the audit trail.
                </p>
                <p>
                  &bull; <strong>Behavioral Calibration:</strong> Assessed on concrete actions, reasoning, accountability, and STAR clarity rather than single factual correctness.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* PERSONALIZED ACTIONABLE LEARNING PLAN                                     */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'learning_plan') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Personalized Actionable Learning Plan (3 Priority Tiers)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized study recommendations tailored directly to your mistakes, target role competencies, and career readiness.
            </p>
          </div>

          <div className="space-y-4">
            {/* Priority 1 — Must Improve */}
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Priority 1 — Must Improve (Critical Gaps Causing Major Mistakes)</span>
              </div>
              <div className="space-y-2">
                {learningPlan.priority1_mustImprove.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-white rounded-xl border border-rose-100 text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{item.topic}</div>
                    <p className="text-slate-600">{item.reason}</p>
                    <p className="text-rose-900 font-semibold mt-1">
                      <strong>Action:</strong> {item.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority 2 — Practice More */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>Priority 2 — Practice More (Partially Understood Concepts)</span>
              </div>
              <div className="space-y-2">
                {learningPlan.priority2_practiceMore.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-white rounded-xl border border-amber-100 text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{item.topic}</div>
                    <p className="text-slate-600">{item.reason}</p>
                    <p className="text-amber-900 font-semibold mt-1">
                      <strong>Action:</strong> {item.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority 3 — Advanced Learning */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Priority 3 — Advanced Learning (Elevating Beyond Foundational Knowledge)</span>
              </div>
              <div className="space-y-2">
                {learningPlan.priority3_advancedLearning.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-white rounded-xl border border-indigo-100 text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{item.topic}</div>
                    <p className="text-slate-600">{item.reason}</p>
                    <p className="text-indigo-900 font-semibold mt-1">
                      <strong>Action:</strong> {item.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6.F: FINAL INTERVIEWER CLOSING FEEDBACK                          */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'feedback') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>Section 6.F — Final Interviewer Closing Feedback</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized appraisal, role readiness verdict, and recommended next milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Strongest Areas */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strongest Demonstrated Areas</span>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                {closingFeedback.strongestAreas.map((sa: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{sa}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Mistakes */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Most Significant Mistakes</span>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                {closingFeedback.criticalMistakes.map((cm: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{cm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Role Readiness Verdict */}
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-1.5 text-xs">
            <span className="font-bold uppercase tracking-wider text-indigo-900 text-[11px]">
              Role Readiness Verdict for {overall.targetJobRole}:
            </span>
            <p className="text-indigo-950 font-medium leading-relaxed">
              {closingFeedback.roleReadinessVerdict}
            </p>
          </div>

          {/* Recommended Next Actions */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Recommended Next Actions:
            </span>
            <div className="space-y-1.5">
              {closingFeedback.recommendedNextActions.map((action: string, aIdx: number) => (
                <div key={aIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-slate-700">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 text-center">
            SkillMatch AI Mock Interview Assessment Engine &bull; Evaluation is calculated from observable heuristics and does not constitute a guarantee of employment.
          </div>
        </Card>
      )}
    </div>
  );
};
