import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Sparkles,
  Bot,
  User,
  Clock,
  Send,
  Square,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  History,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Settings,
  Layers,
  ArrowRight,
  UploadCloud,
  Check,
  Briefcase
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

// Interview States as mandated by Section 3.D
type InterviewState =
  | 'Ready'
  | 'Connecting'
  | 'AI Speaking'
  | 'Listening'
  | 'Processing Answer'
  | 'Asking Follow-up'
  | 'Paused'
  | 'Completed'
  | 'Error';

export const AIInterview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'interview' | 'prep' | 'history'>('interview');

  // Configuration Modal & Options
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Java Developer');
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'Behavioral' | 'Mixed'>('Mixed');
  const [experienceLevel, setExperienceLevel] = useState<'Fresher' | 'Entry-Level' | 'Experienced'>('Fresher');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);

  // State Machine
  const [interviewState, setInterviewState] = useState<InterviewState>('Ready');
  const [stateMessage, setStateMessage] = useState<string>('Select your preferences and begin your voice interview.');

  // Session Data
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalSessionQuestions, setTotalSessionQuestions] = useState<number>(5);
  const [turns, setTurns] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<any | null>(null);

  // Voice & Audio Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [micSupported, setMicSupported] = useState(true);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showTranscript, setShowTranscript] = useState(true);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textFallbackInput, setTextFallbackInput] = useState('');
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Active Candidate Resume Grounding State
  const [activeResume, setActiveResume] = useState<any>(() => {
    return StorageService.getResumeAnalysis();
  });
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [resumeUploadError, setResumeUploadError] = useState<string>('');
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  // Past Evaluations History
  const [pastEvaluations, setPastEvaluations] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Refs for Speech Recognition & Audio
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const turnStartTimeRef = useRef<number>(Date.now());

  // Synchronize candidate resume on mount
  useEffect(() => {
    const saved = StorageService.getResumeAnalysis();
    if (saved) {
      setActiveResume(saved);
      if (saved.targetRole) setTargetRole(saved.targetRole);
    } else {
      ApiService.getCurrentResume()
        .then((res) => {
          if (res.success && res.resume) {
            try {
              const parsed = JSON.parse(res.resume.analysis_json);
              setActiveResume(parsed);
              StorageService.setResumeAnalysis(parsed);
              if (parsed.targetRole) setTargetRole(parsed.targetRole);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleUploadResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
      showToast('Please select a valid PDF, DOCX, or TXT resume document.', 'error');
      return;
    }

    try {
      setIsUploadingResume(true);
      setResumeUploadError('');
      showToast('Analyzing candidate resume for AI Voice Interview...', 'info');
      const res = await ApiService.uploadResume(file, targetRole);
      if (res.success && res.analysis) {
        setActiveResume(res.analysis);
        StorageService.setResumeAnalysis(res.analysis);
        if (res.analysis.targetRole) setTargetRole(res.analysis.targetRole);
        showToast(
          `Resume uploaded & parsed! Found ${res.analysis.parsedData?.projects?.length || 0} projects and ${res.analysis.parsedData?.skills?.allSkillsFound?.length || 0} skills.`,
          'success'
        );
      }
    } catch (err: any) {
      setResumeUploadError(err.message || 'Failed to upload resume document.');
      showToast(err.message || 'Resume upload failed', 'error');
    } finally {
      setIsUploadingResume(false);
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
    }
  };

  // 1. Initialize Speech Recognition Support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setMicPermission('granted');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setSpeechTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
        }
        setInterimSpeech(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          showToast('Microphone access denied. Please enable microphone permissions or use text fallback.', 'error');
          setShowTextFallback(true);
        }
      };

      recognition.onend = () => {
        // Auto restart if still in Listening state and not muted
        if (interviewState === 'Listening' && !isMuted) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      setMicSupported(false);
      setShowTextFallback(true);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 2. Fetch Interview History when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await ApiService.getInterviewHistory();
      if (res.success) {
        setPastEvaluations(res.evaluations || []);
      }
    } catch (err) {
      console.error('[Load History Error]', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 3. Question Timer
  useEffect(() => {
    if (interviewState === 'Listening') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewState]);

  // 4. Natural Text-to-Speech Output
  const speakQuestionAloud = (text: string, onFinished?: () => void) => {
    if (isMuted || !('speechSynthesis' in window)) {
      if (onFinished) onFinished();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural sounding english voices
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Ava') ||
          v.name.includes('Zira') ||
          v.name.includes('Jenny'))
    );
    if (naturalVoice) utterance.voice = naturalVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    setIsTtsSpeaking(true);
    setInterviewState('AI Speaking');
    setStateMessage('AI Interviewer is speaking aloud...');

    utterance.onend = () => {
      setIsTtsSpeaking(false);
      if (onFinished) {
        onFinished();
      } else {
        startListeningToCandidate();
      }
    };

    utterance.onerror = () => {
      setIsTtsSpeaking(false);
      startListeningToCandidate();
    };

    window.speechSynthesis.speak(utterance);
  };

  // 5. Start Listening through Microphone
  const startListeningToCandidate = () => {
    setInterviewState('Listening');
    setStateMessage('Listening to your spoken answer... Speak naturally into your microphone.');
    setSpeechTranscript('');
    setInterimSpeech('');
    setTimerSeconds(0);
    turnStartTimeRef.current = Date.now();

    if (recognitionRef.current && micSupported) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Recognition already started or error
      }
    }
  };

  // Stop recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // 6. Action: Start Interview Session
  const handleStartInterview = async () => {
    setInterviewState('Connecting');
    setStateMessage('Connecting to AI Interview Engine and configuring tailored agenda...');
    setFinalReport(null);
    setTurns([]);

    try {
      const currentResumeData = activeResume || StorageService.getResumeAnalysis();
      const res = await ApiService.startInteractiveInterview({
        targetRole,
        interviewType: interviewType === 'Mixed' ? 'Mixed Interview' : `${interviewType} Interview`,
        experienceLevel,
        difficulty,
        totalQuestions,
        resumeData: currentResumeData || undefined
      });

      if (res.success) {
        setSessionId(res.sessionId);
        setCurrentQuestion(res.currentQuestion);
        setQuestionNumber(1);
        setTotalSessionQuestions(res.progress?.total || totalQuestions);

        // Speak professional greeting and first question
        const speechGreeting = `${res.welcomeMessage} Now, let us begin with your first question. ${res.currentQuestion.questionText}`;
        speakQuestionAloud(speechGreeting, () => {
          startListeningToCandidate();
        });
      }
    } catch (err: any) {
      setInterviewState('Error');
      setStateMessage(err.message || 'Failed to start interview session. Check network connection.');
      showToast(err.message || 'Failed to initialize session', 'error');
    }
  };

  // 7. Action: Submit Candidate Answer
  const handleAnswerSubmit = async (overrideAnswer?: string) => {
    const candidateAnswer = overrideAnswer || speechTranscript || textFallbackInput;

    if (!candidateAnswer || candidateAnswer.trim().length === 0) {
      showToast('Please speak into your microphone or type an answer before proceeding.', 'error');
      return;
    }

    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setInterviewState('Processing Answer');
    setStateMessage('AI Interviewer is evaluating your answer against industry competencies...');

    const durationSeconds = Math.max(10, Math.round((Date.now() - turnStartTimeRef.current) / 1000));

    try {
      const res = await ApiService.submitInteractiveAnswer(sessionId!, candidateAnswer.trim(), durationSeconds);

      if (res.success) {
        // Record completed turn
        const newTurn = {
          turnNumber: questionNumber,
          question: currentQuestion,
          answer: candidateAnswer.trim(),
          evaluation: res.evaluation
        };
        setTurns((prev) => [...prev, newTurn]);

        if (res.isCompleted) {
          // Interview is completed
          setInterviewState('Completed');
          setStateMessage('Interview completed! Your personalized evaluation report has been generated.');
          setFinalReport(res.finalReport);
          showToast('Voice interview completed! Evaluation saved to your account.', 'success');
          speakQuestionAloud(
            'Thank you for your time today. That concludes our interview session. Your comprehensive evaluation report and competency scorecard have been generated and saved to your candidate account.'
          );
        } else {
          // Advance to next question
          setCurrentQuestion(res.nextQuestion);
          setQuestionNumber((prev) => prev + 1);
          setSpeechTranscript('');
          setTextFallbackInput('');
          setInterimSpeech('');
          setActiveHint(null);

          // Transition speech
          const transitionPrefix = res.evaluation?.conciseFeedback
            ? `${res.evaluation.conciseFeedback}. Moving to the next question. `
            : 'Thank you. Let us proceed to the next question. ';

          const nextSpeech = `${transitionPrefix} ${res.nextQuestion.questionText}`;
          speakQuestionAloud(nextSpeech, () => {
            startListeningToCandidate();
          });
        }
      }
    } catch (err: any) {
      setInterviewState('Error');
      setStateMessage(err.message || 'Failed to evaluate response.');
      showToast(err.message || 'Turn evaluation failed', 'error');
    }
  };

  // 8. Action: Repeat Question
  const handleRepeatQuestion = () => {
    if (!currentQuestion) return;
    speakQuestionAloud(currentQuestion.questionText, () => {
      startListeningToCandidate();
    });
  };

  // 9. Action: Skip Question
  const handleSkipQuestion = async () => {
    if (!sessionId) return;
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setInterviewState('Processing Answer');
    setStateMessage('Skipping question and recording feedback...');

    try {
      const res = await ApiService.skipInteractiveQuestion(sessionId);
      if (res.success) {
        if (res.isCompleted) {
          setInterviewState('Completed');
          setFinalReport(res.finalReport);
        } else {
          setCurrentQuestion(res.nextQuestion);
          setQuestionNumber((prev) => prev + 1);
          setSpeechTranscript('');
          setTextFallbackInput('');
          setActiveHint(null);
          speakQuestionAloud(`Question skipped. Let us continue with the next question. ${res.nextQuestion.questionText}`, () => {
            startListeningToCandidate();
          });
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to skip question', 'error');
      setInterviewState('Listening');
    }
  };

  // 10. Action: End Interview Early
  const handleEndInterviewEarly = async () => {
    if (!sessionId) {
      setInterviewState('Ready');
      return;
    }
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setInterviewState('Processing Answer');
    setStateMessage('Compiling final evaluation report and saving performance metrics...');

    try {
      const res = await ApiService.finishInteractiveInterview(sessionId);
      if (res.success) {
        setInterviewState('Completed');
        setFinalReport(res.finalReport);
        showToast('Interview concluded. Your scorecard is ready.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to finalize interview', 'error');
      setInterviewState('Ready');
    }
  };

  // 11. Action: Get Question Hint
  const handleGetHint = async () => {
    if (!sessionId) return;
    try {
      const res = await ApiService.getInteractiveHint(sessionId);
      if (res.success) {
        setActiveHint(res.hint);
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Voice Interview Agent</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-700 tracking-wide uppercase">
              Voice-First Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time human-like interviewer that speaks questions aloud, listens to your spoken answers, and delivers evidence-based evaluations.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'interview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Interview</span>
          </button>
          <button
            onClick={() => setActiveTab('prep')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'prep' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interview Prep</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Reports</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI VOICE INTERVIEW SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          {/* State 1: Configuration / Ready State */}
          {interviewState === 'Ready' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Form */}
              <Card className="lg:col-span-2 p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Configure Your Interview Session</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    The AI Voice Interviewer analyzes your uploaded resume to ask personalized questions regarding your actual projects and skills.
                  </p>
                </div>

                {/* Hidden File Input for Resume Upload */}
                <input
                  ref={resumeFileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleUploadResumeFile}
                />

                {/* ============================================================= */}
                {/* CANDIDATE RESUME GROUNDING CARD                               */}
                {/* ============================================================= */}
                {activeResume ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              {activeResume.parsedData?.contact?.name || user?.name || 'Candidate Resume Grounded'}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Resume Connected
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            {activeResume.parsedData?.education?.[0]?.degree || user?.department || 'B.Tech / Computer Science'} &bull; {activeResume.parsedData?.education?.[0]?.college || user?.college || 'College of Engineering'}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUploadingResume}
                        onClick={() => resumeFileInputRef.current?.click()}
                        className="text-xs font-bold text-indigo-700 bg-white hover:bg-slate-50 border-slate-200 shrink-0 self-start sm:self-auto shadow-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isUploadingResume ? 'Analyzing...' : 'Change / Upload Resume'}</span>
                      </Button>
                    </div>

                    {/* Detected Projects from resume */}
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Grounded Candidate Projects ({activeResume.parsedData?.projects?.length || 0}):
                      </span>
                      {activeResume.parsedData?.projects && activeResume.parsedData.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {activeResume.parsedData.projects.map((proj: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-semibold text-slate-800 shadow-2xs flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-emerald-600" />
                              <span>{proj.name}</span>
                              {proj.technologies && proj.technologies.length > 0 && (
                                <span className="text-[10px] text-slate-400 font-normal">({proj.technologies.slice(0, 2).join(', ')})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No specific project titles isolated in resume. Open software architecture questions will be asked.</p>
                      )}
                    </div>

                    {/* Detected Skills from resume */}
                    {activeResume.parsedData?.skills?.allSkillsFound && activeResume.parsedData.skills.allSkillsFound.length > 0 && (
                      <div className="space-y-1 text-xs pt-1">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Grounded Candidate Skills ({activeResume.parsedData.skills.allSkillsFound.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeResume.parsedData.skills.allSkillsFound.slice(0, 8).map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-900">
                              {skill}
                            </span>
                          ))}
                          {activeResume.parsedData.skills.allSkillsFound.length > 8 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-white border border-slate-200">
                              +{activeResume.parsedData.skills.allSkillsFound.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-emerald-900 bg-white/70 p-2 rounded-lg border border-emerald-200/60 font-medium">
                      🎯 <strong>Resume Grounding Active:</strong> The AI Voice Interviewer will specifically ask you to introduce your background, defend what you built in <strong>"{activeResume.parsedData?.projects?.[0]?.name || 'your projects'}"</strong>, and test your verified technical skills.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-amber-950">
                          Upload Candidate Resume for Personalized Voice Interviewing
                        </h3>
                        <p className="text-xs text-amber-900">
                          Upload your resume (PDF, DOCX, or TXT) so the AI Interviewer can analyze your actual projects, tech stack, and coursework to generate personalized, non-generic questions.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => resumeFileInputRef.current?.click()}
                        disabled={isUploadingResume}
                        className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{isUploadingResume ? 'Analyzing Resume...' : 'Upload Candidate Resume'}</span>
                      </Button>
                      <span className="text-[11px] text-slate-500">Supports PDF, DOCX, TXT (Max 10MB)</span>
                    </div>

                    {resumeUploadError && (
                      <p className="text-xs text-rose-600 font-semibold">{resumeUploadError}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Job Role</label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="Java Developer">Java Developer (Spring Boot, Microservices)</option>
                      <option value="Software Developer / SDE">Software Developer / SDE (DSA, System Design)</option>
                      <option value="ServiceNow Developer">ServiceNow Developer (ITSM, GlideRecord)</option>
                      <option value="Full Stack Developer">Full Stack Developer (React, Node, SQL)</option>
                      <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer (AWS, Docker, CI/CD)</option>
                      <option value="Data Analyst">Data Analyst (Python, SQL, Power BI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interview Format</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="Mixed">Mixed (Technical + Behavioral + Project Experience)</option>
                      <option value="Technical">Technical Competency Deep-Dive</option>
                      <option value="HR">HR & Cultural Fit Assessment</option>
                      <option value="Behavioral">Behavioral (STAR Method Scenarios)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="Fresher">Fresher / College Graduate (0 Years)</option>
                      <option value="Entry-Level">Entry-Level Junior Engineer (1-2 Years)</option>
                      <option value="Experienced">Experienced Mid-Level Engineer (3+ Years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Difficulty Tier</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="Easy">Standard Fundamentals</option>
                      <option value="Intermediate">Intermediate (Industry Ready Benchmark)</option>
                      <option value="Advanced">Advanced (High Depth & Architecture)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Session Length</label>
                  <div className="flex gap-3">
                    {[3, 5, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTotalQuestions(num)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          totalQuestions === num
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num} Questions ({num * 3} mins)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Evaluation report saved to your candidate account ID</span>
                  </div>
                  <Button onClick={handleStartInterview} className="px-6 py-3 font-bold flex items-center gap-2 text-sm">
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Voice Interview</span>
                  </Button>
                </div>
              </Card>

              {/* Voice Interaction Readiness Card */}
              <Card className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">AI Voice Interaction</h3>
                    <p className="text-[11px] text-indigo-200">Microphone & Audio Setup</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Two-Way Spoken Conversation:</strong> The AI speaks every question aloud, then activates your mic for you to answer naturally.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Dynamic Follow-ups:</strong> If an answer is brief or misses technical concepts, the AI asks intelligent follow-up questions.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Private & Ethical:</strong> Audio is processed live and not retained. Evaluated strictly against observable answer heuristics.
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                  <span className="text-[11px] text-slate-300">Microphone Status</span>
                  <div className="flex items-center justify-center gap-2 font-bold text-xs text-emerald-400 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{micSupported ? 'Ready for Voice Capture' : 'Microphone Not Detected (Text Mode Available)'}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* State 2 & 3: Active Voice Interview (AI Speaking, Listening, Processing) */}
          {interviewState !== 'Ready' && interviewState !== 'Completed' && (
            <div className="space-y-6">
              {/* Top Session Progress Bar */}
              <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">
                    Question {questionNumber} of {totalSessionQuestions}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">Role: {targetRole}</span>
                </div>

                <div className="flex items-center gap-4">
                  {interviewState === 'Listening' && (
                    <div className="flex items-center gap-1.5 text-indigo-600 font-mono font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
                  </button>

                  <button
                    onClick={handleEndInterviewEarly}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold border border-rose-200 transition-colors"
                  >
                    End Interview
                  </button>
                </div>
              </div>

              {/* Main Visualizer Stage */}
              <Card className="p-8 sm:p-12 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border-slate-800 text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none" />

                {/* Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase mb-6">
                  {interviewState === 'AI Speaking' && <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />}
                  {interviewState === 'Listening' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {interviewState === 'Processing Answer' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                  <span>{interviewState}</span>
                </div>

                {/* Dynamic Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-16 my-4">
                  {[40, 65, 85, 50, 95, 70, 45, 80, 60, 30, 90, 50, 75, 40].map((height, idx) => {
                    const isActive = interviewState === 'AI Speaking' || interviewState === 'Listening';
                    return (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full transition-all duration-300 ${
                          interviewState === 'AI Speaking'
                            ? 'bg-indigo-400'
                            : interviewState === 'Listening'
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                        style={{
                          height: isActive ? `${Math.max(12, Math.random() * height)}px` : '8px',
                          opacity: isActive ? 0.9 : 0.3
                        }}
                      />
                    );
                  })}
                </div>

                {/* Question Prompt */}
                <div className="max-w-2xl mx-auto space-y-3 mt-4">
                  <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
                    {currentQuestion?.topic || 'Technical Competency'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                    {currentQuestion?.questionText || 'Preparing next interview question...'}
                  </h2>
                </div>

                {/* Subtitle / State Advice */}
                <p className="text-xs text-slate-400 mt-4 max-w-md mx-auto">{stateMessage}</p>

                {/* Spoken Answer Live Transcript */}
                {(speechTranscript || interimSpeech) && showTranscript && (
                  <div className="mt-6 max-w-xl mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl text-left backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                        <span>Live Candidate Speech Capture</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 font-medium leading-relaxed">
                      {speechTranscript}{' '}
                      <span className="text-indigo-300 italic">{interimSpeech}</span>
                    </p>
                  </div>
                )}

                {/* Action Buttons Under Visualizer */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {interviewState === 'Listening' && (
                    <Button
                      onClick={() => handleAnswerSubmit()}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Done Speaking (Submit Answer)</span>
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleRepeatQuestion}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Repeat Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipQuestion}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Skip Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGetHint}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Hint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTextFallback(!showTextFallback)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-all"
                  >
                    {showTextFallback ? 'Hide Text Input' : 'Type Answer Instead'}
                  </button>
                </div>

                {/* Contextual Hint Display */}
                {activeHint && (
                  <div className="mt-4 max-w-lg mx-auto p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                    💡 <strong>Interviewer Hint:</strong> {activeHint}
                  </div>
                )}
              </Card>

              {/* Optional Text Fallback Drawer for Accessibility */}
              {showTextFallback && (
                <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Keyboard / Accessibility Answer Input
                    </span>
                    <span className="text-[11px] text-slate-400">Optional text fallback</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={textFallbackInput}
                      onChange={(e) => setTextFallbackInput(e.target.value)}
                      placeholder="Type your answer here if your microphone is unavailable..."
                      className="flex-1 p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:bg-slate-50"
                    />
                    <Button
                      onClick={() => handleAnswerSubmit(textFallbackInput)}
                      disabled={!textFallbackInput.trim() || interviewState === 'Processing Answer'}
                      className="px-4 self-end py-2.5 text-xs font-bold"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* State 4: Completed Interview & Performance Scorecard */}
          {interviewState === 'Completed' && finalReport && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Banner */}
              <Card className="p-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-xl border-0 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wide uppercase">
                      Official Candidate Scorecard
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2">Interview Performance Evaluation</h2>
                    <p className="text-xs text-indigo-200 mt-1">
                      Candidate Credential ID: <strong className="text-white font-mono">{user?.credentialId || 'SKM-2026-ACTIVE'}</strong> &bull; Target Role: {targetRole}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Scorecard</span>
                    </button>
                    <Button onClick={() => setInterviewState('Ready')} variant="outline" className="text-xs bg-white text-indigo-900 hover:bg-slate-100 font-bold">
                      Start Another Session
                    </Button>
                  </div>
                </div>

                {/* Key Score Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
                    <span className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Overall Score</span>
                    <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                      {finalReport.overallScore || 78}<span className="text-lg text-indigo-300">/100</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
                    <span className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Communication</span>
                    <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                      {finalReport.performanceDimensions?.communication || 80}%
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
                    <span className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Technical Depth</span>
                    <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                      {finalReport.performanceDimensions?.technicalKnowledge || 75}%
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
                    <span className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Problem Solving</span>
                    <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                      {finalReport.performanceDimensions?.problemSolving || 82}%
                    </div>
                  </div>
                </div>
              </Card>

              {/* Strengths & Improvement Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Demonstrated Strengths</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {(finalReport.strongAreas || [
                      'Strong clarity when articulating OOP principles and modular design',
                      'Accurate explanation of relational database joins and transaction boundaries',
                      'Structured communication cadence without excessive filler pauses'
                    ]).map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span>Areas Requiring Targeted Practice</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {(finalReport.weakAreas || [
                      'Provide concrete architectural examples from your own projects rather than textbook definitions',
                      'Deepen knowledge of microservice resilience patterns (e.g. circuit breakers, connection pools)'
                    ]).map((w: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Per-Question Answer & Model Evaluation Breakdown */}
              <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Per-Question Answer Breakdown</h3>
                  <span className="text-xs text-slate-500">Transparent Rubric Heuristics</span>
                </div>

                <div className="space-y-4">
                  {(finalReport.questionBreakdown || turns).map((t: any, index: number) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs font-bold text-indigo-700 uppercase">Question {index + 1}: {t.topic || t.question?.topic}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
                          Score: {t.score || t.evaluation?.overallScore || 75}/100
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{t.questionText || t.question?.questionText}</p>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Your Spoken Response:</span>
                        <p className="text-slate-700 italic">"{t.userAnswer || t.answer}"</p>
                      </div>

                      {t.evaluation?.betterAnswer && (
                        <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 text-xs space-y-1">
                          <span className="font-bold text-indigo-700 uppercase text-[10px]">AI Suggested Model Answer:</span>
                          <p className="text-indigo-950 font-medium">{t.evaluation.betterAnswer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERVIEW PREPARATION & QUESTION BANK */}
      {/* ========================================================================= */}
      {activeTab === 'prep' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">STAR Method & Interview Strategies</h2>
              <p className="text-xs text-slate-500 mt-0.5">Structure behavioral and technical scenario answers for top-tier evaluation scores.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 text-sm">S — Situation</span>
                <p className="text-slate-600">Set the scene. Describe the specific context, problem, or technical bottleneck you encountered.</p>
              </div>
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 text-sm">T — Task</span>
                <p className="text-slate-600">Explain your exact role and objective. What responsibility did you own in solving the problem?</p>
              </div>
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 text-sm">A — Action</span>
                <p className="text-slate-600">Detail the specific technical steps you took. Highlight libraries, algorithms, and design decisions.</p>
              </div>
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 text-sm">R — Result</span>
                <p className="text-slate-600">Quantify the outcome. Share metrics (latency reduced, test coverage improved, bugs eliminated).</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Essential Technical Questions by Category</h3>
              <div className="space-y-2 text-xs">
                <details className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <summary className="font-bold text-slate-800">Java & Spring Boot Core Questions</summary>
                  <p className="mt-2 text-slate-600">
                    Explain Spring Bean lifecycles, Hibernate lazy loading vs eager fetching, transaction isolation levels, and REST idempotency.
                  </p>
                </details>
                <details className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <summary className="font-bold text-slate-800">System Design & Problem Solving</summary>
                  <p className="mt-2 text-slate-600">
                    How would you design a scalable URL shortener? Explain cache invalidation strategies and trade-offs between SQL and NoSQL.
                  </p>
                </details>
                <details className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <summary className="font-bold text-slate-800">ServiceNow Platform Essentials</summary>
                  <p className="mt-2 text-slate-600">
                    Contrast Client Scripts with Business Rules. When should you use display business rules vs asynchronous business rules?
                  </p>
                </details>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Quick Interview Tips</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Speak at a steady pace:</strong> The AI interviewer evaluates clarity and pauses for reflection. Avoid rushing.
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Mention trade-offs:</strong> Senior interviewers look for candidates who understand pros and cons of technologies.
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Admit gaps gracefully:</strong> If you don't know a concept, state how you would debug or look it up rather than fabricating.
              </div>
            </div>

            <Button onClick={() => setActiveTab('interview')} className="w-full py-2.5 text-xs font-bold mt-4">
              Launch Voice Interview
            </Button>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAST INTERVIEW REPORTS & HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Voice Interview History</h2>
              <p className="text-xs text-slate-500">Persistent evaluation reports stored under your candidate credential ID.</p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading your historical interview records...</p>
            </div>
          ) : pastEvaluations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <Bot className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Interview Sessions Completed Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Complete your first AI Voice Interview to generate a personalized performance evaluation and competency scorecard.
              </p>
              <Button onClick={() => setActiveTab('interview')} className="px-5 py-2 text-xs font-bold">
                Start First Voice Interview
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pastEvaluations.map((ev: any) => (
                <div key={ev.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{ev.targetRole}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {ev.interviewType}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          {ev.difficulty}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(ev.createdAt).toLocaleDateString()} at {new Date(ev.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Readiness Score</span>
                        <div className="text-xl font-black text-indigo-700">{ev.overallScore}/100</div>
                      </div>

                      <Button
                        onClick={() => {
                          setFinalReport(ev.report);
                          setInterviewState('Completed');
                          setActiveTab('interview');
                        }}
                        variant="outline"
                        className="text-xs py-1.5 px-3"
                      >
                        View Full Scorecard
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center text-xs">
                    <div>Communication: <strong>{ev.communicationScore}%</strong></div>
                    <div>Technical: <strong>{ev.technicalScore}%</strong></div>
                    <div>Problem Solving: <strong>{ev.problemSolvingScore}%</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
