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
  Briefcase,
  AlertTriangle,
  Radio,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';
import { InterviewMarksheetView } from '../components/interview/InterviewMarksheetView';

// Interview States as mandated by Sections 1, 2, 4, and 7
type InterviewState =
  | 'Ready'
  | 'Connecting'
  | 'Introduction'
  | 'AI Speaking'
  | 'Listening'
  | 'Processing Answer'
  | 'Clarification / Retry'
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

  // Welcome Introduction & Retry Clarification State
  const [welcomeIntroMessage, setWelcomeIntroMessage] = useState<string>('');
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const [isRetryTurn, setIsRetryTurn] = useState<boolean>(false);
  const [activeAttemptNumber, setActiveAttemptNumber] = useState<number>(1);

  // Voice & Audio Controls (Voice-Only Answer Pipeline)
  const [isMuted, setIsMuted] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAnswer, setHasRecordedAnswer] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [micSupported, setMicSupported] = useState(true);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
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

  // Preparation Questions Bank
  const [prepQuestions, setPrepQuestions] = useState<any[]>([]);
  const [loadingPrep, setLoadingPrep] = useState(false);

  // Refs for Speech Recognition, MediaRecorder & Audio Chunks
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const turnStartTimeRef = useRef<number>(Date.now());

  // Synchronize candidate resume on mount and listen to updates
  useEffect(() => {
    const fetchCurrentCandidateResume = () => {
      ApiService.getCurrentResume()
        .then((res: any) => {
          const analysisData = res.analysis || (res.resume && JSON.parse(res.resume.analysis_json));
          if (res.success && analysisData) {
            const enrichedResume = {
              ...analysisData,
              id: res.resume?.id || analysisData.id,
              parsedData: analysisData.parsedData || (res.resume?.parsed_json ? JSON.parse(res.resume.parsed_json) : null)
            };
            setActiveResume(enrichedResume);
            StorageService.setResumeAnalysis(enrichedResume);
            if (analysisData.targetRole) setTargetRole(analysisData.targetRole);
          } else {
            setActiveResume(null);
          }
        })
        .catch(() => {
          const saved = StorageService.getResumeAnalysis();
          if (saved && saved.parsedData) {
            setActiveResume(saved);
            if (saved.targetRole) setTargetRole(saved.targetRole);
          } else {
            setActiveResume(null);
          }
        });
    };

    fetchCurrentCandidateResume();

    const handleStorageChange = () => {
      fetchCurrentCandidateResume();
    };

    window.addEventListener('skillmatch-storage-change', handleStorageChange);
    return () => {
      window.removeEventListener('skillmatch-storage-change', handleStorageChange);
    };
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

  // 1. Initialize Speech Recognition Support for Voice-Only Answers
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setMicPermission('granted');
        setMicErrorMessage(null);
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
          setMicErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser URL bar.');
        } else if (event.error === 'no-speech') {
          // Normal silence, keep waiting
        } else if (event.error === 'network') {
          setMicErrorMessage('Voice transcription network warning. Please check your connection.');
        }
      };

      recognition.onend = () => {
        // Auto restart only if still actively recording and not muted
        if (isRecording && !isMuted) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      setMicSupported(false);
      setMicErrorMessage('Your browser does not support the Web Speech API. Please use Google Chrome, Microsoft Edge, or a modern Chromium browser.');
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
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, isMuted]);

  // 2. Fetch Interview History & Prep Questions when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    } else if (activeTab === 'prep') {
      loadPrepQuestions();
    }
  }, [activeTab, targetRole]);

  const loadPrepQuestions = async () => {
    setLoadingPrep(true);
    try {
      const res = await ApiService.getInterviewQuestions(targetRole);
      if (res.success && res.questions) {
        const list = res.questions.allQuestions || [
          ...(res.questions.introQuestions || []),
          ...(res.questions.projectQuestions || []),
          ...(res.questions.javaQuestions || []),
          ...(res.questions.dsaQuestions || []),
          ...(res.questions.sqlQuestions || []),
          ...(res.questions.serviceNowQuestions || []),
          ...(res.questions.behavioralQuestions || []),
          ...(res.questions.personalHrQuestions || []),
          ...(res.questions.companyHrQuestions || []),
          ...(res.questions.situationalQuestions || []),
          ...(res.questions.fresherQuestions || []),
          ...(res.questions.criticalThinkingQuestions || []),
          ...(res.questions.teamworkQuestions || []),
          ...(res.questions.scenarioQuestions || []),
          ...(res.questions.certificationQuestions || [])
        ];
        setPrepQuestions(list);
      }
    } catch (e) {
      console.warn('Failed to load prep questions:', e);
    } finally {
      setLoadingPrep(false);
    }
  };

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

  // 3. Question Timer while recording spoken answer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // 4. Natural Text-to-Speech Output
  const speakQuestionAloud = (text: string, onFinished?: () => void) => {
    if (isMuted || !('speechSynthesis' in window)) {
      if (onFinished) onFinished();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
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
        startRecordingAudio();
      }
    };

    utterance.onerror = () => {
      setIsTtsSpeaking(false);
      startRecordingAudio();
    };

    window.speechSynthesis.speak(utterance);
  };

  // 5. Audio Capture Pipeline: Start Voice Recording
  const startRecordingAudio = async () => {
    setMicErrorMessage(null);
    setSpeechTranscript('');
    setInterimSpeech('');
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    audioChunksRef.current = [];
    setHasRecordedAnswer(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setMicSupported(true);

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          setHasRecordedAnswer(true);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setInterviewState('Listening');
      setStateMessage('Listening to your spoken answer... Speak naturally into your microphone.');
      setTimerSeconds(0);
      turnStartTimeRef.current = Date.now();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('[Microphone Access Error]', err);
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setMicErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser URL bar, then click "Request Microphone Access".');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicSupported(false);
        setMicErrorMessage('No microphone device was detected on your computer. Please connect a working microphone or headset.');
      } else {
        setMicErrorMessage(err.message || 'Failed to access microphone. Please check your system audio settings.');
      }
      showToast('Microphone access failed. Spoken voice answers are mandatory.', 'error');
    }
  };

  // Stop Voice Recording
  const stopRecordingAudio = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setStateMessage('Recording captured! Review your spoken answer below, re-record if needed, or submit for evaluation.');
  };

  // Re-record Spoken Answer
  const handleReRecordAudio = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setSpeechTranscript('');
    setInterimSpeech('');
    setHasRecordedAnswer(false);
    setMicErrorMessage(null);
    startRecordingAudio();
  };

  // Request Microphone Permission
  const handleRequestMicPermission = async () => {
    setMicErrorMessage(null);
    await startRecordingAudio();
  };

  // 6. Action: Start Interview Session Grounded in Candidate's Own Resume
  const handleStartInterview = async () => {
    if (!activeResume || !activeResume.parsedData) {
      showToast('Please upload your resume first before starting the AI Voice Interview.', 'error');
      resumeFileInputRef.current?.click();
      return;
    }

    setInterviewState('Connecting');
    setStateMessage('Connecting to AI Interview Engine and configuring personalized questions from your resume...');
    setFinalReport(null);
    setTurns([]);
    setIsRetryTurn(false);
    setActiveAttemptNumber(1);
    setRetryNotice(null);
    setMicErrorMessage(null);

    try {
      const res = await ApiService.startInteractiveInterview({
        targetRole,
        interviewType: interviewType === 'Mixed' ? 'Mixed Interview' : `${interviewType} Interview`,
        experienceLevel,
        difficulty,
        totalQuestions,
        resumeId: activeResume.id || undefined
      });

      if (res.success && res.currentQuestion) {
        setSessionId(res.sessionId);
        setCurrentQuestion(res.currentQuestion);
        setQuestionNumber(1);
        setTotalSessionQuestions(res.progress?.total || totalQuestions);
        const candidateName = user?.name || activeResume?.parsedData?.contact?.name;
        const welcomeText = res.welcomeMessage || (candidateName ? `Hi, ${candidateName}! Welcome to the AI Interview.` : 'Hi! Welcome to the AI Interview.');
        setWelcomeIntroMessage(welcomeText);

        // Sequence: Display welcome message before Question 1, present Question 1, start voice answering
        setInterviewState('AI Speaking');
        setStateMessage('AI Interviewer is speaking Question 1 aloud...');

        speakQuestionAloud(res.currentQuestion.questionText, () => {
          startRecordingAudio();
        });
      } else {
        throw new Error(res.error || 'Failed to initialize personalized question.');
      }
    } catch (err: any) {
      setInterviewState('Error');
      setStateMessage(err.message || 'Failed to start interview session. Check network connection.');
      showToast(err.message || 'Failed to initialize session', 'error');
    }
  };

  // 6b. Proceed to Question 1 after Professional Introduction Briefing
  const handleBeginFirstQuestion = () => {
    if (!currentQuestion) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setInterviewState('AI Speaking');
    setStateMessage('AI Interviewer is asking Question 1 aloud...');

    const speechQ1 = currentQuestion.questionText;
    speakQuestionAloud(speechQ1, () => {
      startRecordingAudio();
    });
  };

  // 7. Action: Submit Candidate Spoken Answer (Voice-Only)
  const handleAnswerSubmit = async () => {
    if (isRecording) {
      stopRecordingAudio();
    }

    const candidateAnswer = speechTranscript.trim();

    // Validation: Prevent empty or silent submissions
    if (!candidateAnswer || candidateAnswer.length === 0) {
      setMicErrorMessage('Empty or silent recording detected. No spoken words were transcribed. Please ensure your microphone is unmuted, speak clearly, and record your answer again.');
      showToast('Empty or silent recording. Spoken answer is required.', 'error');
      return;
    }

    // Guard: Prevent duplicate submission attempts
    if (isSubmittingAnswer) return;
    setIsSubmittingAnswer(true);

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setInterviewState('Processing Answer');
    setStateMessage('AI Interviewer is transcribing your spoken answer and evaluating for relevance, correctness, depth, and clarity...');

    const durationSeconds = Math.max(5, Math.round((Date.now() - turnStartTimeRef.current) / 1000));

    try {
      const res = await ApiService.submitInteractiveAnswer(sessionId!, candidateAnswer, durationSeconds);

      if (res.success) {
        // Clean up audio blob URL to prevent unnecessary memory/audio retention
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
          setRecordedAudioUrl(null);
        }
        setHasRecordedAnswer(false);

        // Section 4 / 5: Handle Irrelevant Answer with Polite Redirection & Single Retry
        if (res.retryOpportunity) {
          setIsRetryTurn(true);
          setActiveAttemptNumber(2);
          const redirectFeedback = res.spokenFeedback || 'Your answer does not fit this question. Please try answering the question asked.';
          setRetryNotice(redirectFeedback);
          setInterviewState('Clarification / Retry');
          setStateMessage('Clarification Opportunity: ' + redirectFeedback + ' (Attempt 2 of 2).');
          setSpeechTranscript('');
          setInterimSpeech('');

          // Speak polite redirection feedback aloud
          speakQuestionAloud(redirectFeedback, () => {
            startRecordingAudio();
          });
          return;
        }

        // Finalize turn
        setIsRetryTurn(false);
        setActiveAttemptNumber(1);
        setRetryNotice(null);

        const newTurn = {
          turnNumber: questionNumber,
          question: currentQuestion,
          answer: candidateAnswer,
          evaluation: res.evaluation
        };
        setTurns((prev) => [...prev, newTurn]);

        if (res.isCompleted) {
          // Interview completed -> Section 6 Marksheet
          setInterviewState('Completed');
          setStateMessage('Interview completed! Your official marksheet, mistake analysis, and personalized learning plan have been generated.');
          setFinalReport(res.finalReport);
          showToast('Voice interview completed! Marksheet saved to your account.', 'success');
          speakQuestionAloud(
            'Thank you for your time today. That concludes our interview session. Your official marksheet, category performance, and personalized learning plan have been generated and saved to your account.'
          );
        } else {
          // Advance to next question
          setCurrentQuestion(res.nextQuestion);
          setQuestionNumber((prev) => prev + 1);
          setSpeechTranscript('');
          setInterimSpeech('');
          setActiveHint(null);

          const transitionPrefix = res.spokenFeedback || res.evaluation?.conciseFeedback
            ? `${res.spokenFeedback || res.evaluation.conciseFeedback} Moving to your next question.`
            : 'Thank you. Let us proceed to the next question.';

          const nextSpeech = `${transitionPrefix} ${res.nextQuestion.questionText}`;
          speakQuestionAloud(nextSpeech, () => {
            startRecordingAudio();
          });
        }
      }
    } catch (err: any) {
      setInterviewState('Error');
      setStateMessage(err.message || 'Failed to evaluate response.');
      showToast(err.message || 'Turn evaluation failed', 'error');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // 8. Action: Repeat Question
  const handleRepeatQuestion = () => {
    if (!currentQuestion) return;
    if (isRecording) stopRecordingAudio();
    speakQuestionAloud(currentQuestion.questionText, () => {
      startRecordingAudio();
    });
  };

  // 9. Action: Skip Question
  const handleSkipQuestion = async () => {
    if (!sessionId) return;
    if (isRecording) stopRecordingAudio();
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
          setInterimSpeech('');
          setActiveHint(null);
          speakQuestionAloud(`Question skipped. Let us continue with the next question. ${res.nextQuestion.questionText}`, () => {
            startRecordingAudio();
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
    if (isRecording) stopRecordingAudio();
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
              Voice-Only Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Voice-first interviewer that speaks questions aloud, records your spoken answers through the microphone, and provides transparent marksheet evaluations.
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
                    The AI Voice Interviewer personalizes questions from your uploaded resume, covering your actual projects, tech stack, and coursework.
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
                              {activeResume.parsedData?.contact?.name || user?.name || 'Candidate Resume Connected'}
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
                        <p className="text-xs text-slate-500 italic">No specific project titles isolated in resume. Open software engineering questions will be tailored to your stated coursework.</p>
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
                      🎯 <strong>Resume-Aware Interview:</strong> The AI will ask personalized questions based on your background, defending what you built in <strong>"{activeResume.parsedData?.projects?.[0]?.name || 'your projects'}"</strong> and verifying your technical skills. Spoken voice answers are mandatory.
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
                          Upload your resume (PDF, DOCX, or TXT) so the AI Interviewer can extract your actual projects, tech stack, and coursework to generate personalized questions.
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
                    <span>Voice-only answers &bull; Transparent marksheet evaluation</span>
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
                    <p className="text-[11px] text-indigo-200">Mandatory Microphone Setup</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Voice-Only Answering:</strong> You answer every question directly using your microphone. Typed answers are disabled.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Audio Review & Playback:</strong> Listen back to your recorded spoken answer before submitting, or re-record if needed.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Intelligent Clarifications:</strong> If an answer is off-topic, the AI offers one focused retry opportunity.
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                  <span className="text-[11px] text-slate-300">Microphone Status</span>
                  <div className="flex items-center justify-center gap-2 font-bold text-xs mt-1">
                    <span className={`w-2 h-2 rounded-full ${micSupported && micPermission !== 'denied' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span className={micSupported && micPermission !== 'denied' ? 'text-emerald-400' : 'text-rose-300'}>
                      {micPermission === 'denied'
                        ? 'Microphone Blocked (Permission Needed)'
                        : micSupported
                        ? 'Microphone Ready for Voice Answers'
                        : 'No Microphone Detected'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* State: Error State with Diagnostic Message and Retry Option */}
          {interviewState === 'Error' && (
            <Card className="p-8 bg-white border border-rose-200 rounded-3xl shadow-sm text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Interview Session Issue</h3>
                <p className="text-xs text-rose-600 font-medium mt-1 max-w-md mx-auto">{stateMessage}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={handleStartInterview}
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Interview Generation</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setInterviewState('Ready')}
                  className="px-4 py-2.5 text-xs font-bold border-slate-200"
                >
                  <span>Return to Setup</span>
                </Button>
                <Button
                  onClick={() => resumeFileInputRef.current?.click()}
                  className="px-4 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload / Change Resume</span>
                </Button>
              </div>
            </Card>
          )}

          {/* State 2 & 3: Active Voice Interview (Introduction, AI Speaking, Listening, Clarification / Retry, Processing) */}
          {interviewState !== 'Ready' && interviewState !== 'Completed' && interviewState !== 'Error' && (
            <div className="space-y-6">
              {/* Top Session Progress Bar */}
              <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">
                    Question {questionNumber} of {totalSessionQuestions}
                    {isRetryTurn && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Attempt 2 of 2 (Clarification)
                      </span>
                    )}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">Role: {targetRole}</span>
                </div>

                <div className="flex items-center gap-4">
                  {isRecording && (
                    <div className="flex items-center gap-1.5 text-rose-600 font-mono font-bold animate-pulse">
                      <Radio className="w-3.5 h-3.5 text-rose-500" />
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
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold border border-rose-200 transition-colors cursor-pointer"
                  >
                    End Interview
                  </button>
                </div>
              </div>

              {/* Main Visualizer Stage */}
              <Card className="p-5 sm:p-6 lg:p-7 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border-slate-800 text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none" />

                {/* Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase mb-3">
                  {interviewState === 'Introduction' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                      <span>Introduction & Briefing</span>
                    </>
                  )}
                  {interviewState === 'AI Speaking' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                      <span>AI Speaking Question</span>
                    </>
                  )}
                  {interviewState === 'Listening' && isRecording && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-rose-300">Recording Spoken Answer (Mic Active)</span>
                    </>
                  )}
                  {interviewState === 'Listening' && !isRecording && hasRecordedAnswer && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-300">Audio Recorded &bull; Ready to Review or Submit</span>
                    </>
                  )}
                  {interviewState === 'Listening' && !isRecording && !hasRecordedAnswer && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span>Ready for Your Spoken Answer</span>
                    </>
                  )}
                  {interviewState === 'Clarification / Retry' && (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300">Clarification Needed (Attempt 2 of 2)</span>
                    </>
                  )}
                  {interviewState === 'Processing Answer' && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Evaluating Spoken Response</span>
                    </>
                  )}
                </div>

                {/* Dynamic Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-8 my-2">
                  {[40, 65, 85, 50, 95, 70, 45, 80, 60, 30, 90, 50, 75, 40].map((height, idx) => {
                    const isActive = interviewState === 'Introduction' || interviewState === 'AI Speaking' || isRecording;
                    return (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full transition-all duration-300 ${
                          isRecording
                            ? 'bg-rose-500'
                            : interviewState === 'Introduction' || interviewState === 'AI Speaking'
                            ? 'bg-indigo-400'
                            : interviewState === 'Clarification / Retry'
                            ? 'bg-amber-400'
                            : hasRecordedAnswer
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                        style={{
                          height: isActive ? `${Math.max(6, Math.random() * (height * 0.35))}px` : '4px',
                          opacity: isActive ? 0.9 : 0.3
                        }}
                      />
                    );
                  })}
                </div>

                {/* Interview Stage: Welcome Message & Question Display */}
                <div className="w-full max-w-5xl lg:max-w-6xl mx-auto space-y-2.5 mt-2">
                  {/* Requirement 3: Personalized Welcome Message displayed before Question 1 only */}
                  {questionNumber === 1 && (
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-xs sm:text-sm font-medium text-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{welcomeIntroMessage || (user?.name ? `Hi, ${user.name}! Welcome to the AI Interview.` : 'Hi! Welcome to the AI Interview.')}</span>
                      </div>
                    </div>
                  )}

                  {/* Clarification & Retry Notice Banner (if answer was off-topic) */}
                  {isRetryTurn && retryNotice && (
                    <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-left backdrop-blur-sm space-y-1 max-w-2xl mx-auto">
                      <span className="text-[11px] font-bold uppercase text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Interviewer Redirection & Clarification Opportunity:</span>
                      </span>
                      <p className="text-xs text-amber-100 font-medium leading-relaxed">
                        {retryNotice}
                      </p>
                    </div>
                  )}

                  {/* Category & Step Info */}
                  <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-indigo-300 font-bold">
                    <span>Question {questionNumber} of {totalSessionQuestions}</span>
                    <span>&bull;</span>
                    <span>{currentQuestion?.category || currentQuestion?.topic || 'Technical Competency'}</span>
                  </div>

                  {/* Requirement 4: Display Each Interview Question on a Single Line */}
                  <div className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                    <p
                      className="text-sm sm:text-base font-semibold text-white tracking-normal text-center whitespace-normal lg:whitespace-nowrap lg:overflow-x-auto lg:scrollbar-none"
                      title={currentQuestion?.questionText}
                    >
                      {currentQuestion?.questionText || 'Preparing next interview question...'}
                    </p>
                  </div>
                </div>

                {/* Subtitle / State Advice */}
                <p className="text-xs text-slate-400 mt-4 max-w-md mx-auto">{stateMessage}</p>

                {/* Microphone Error Alert Card */}
                {micErrorMessage && (
                  <div className="mt-4 max-w-xl mx-auto p-3.5 bg-rose-500/20 border border-rose-400/50 rounded-2xl text-left backdrop-blur-sm space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Microphone Warning</span>
                    </div>
                    <p className="text-xs text-rose-100 font-medium leading-relaxed">
                      {micErrorMessage}
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleRequestMicPermission}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Request Microphone Access</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Recorded Audio Review Player */}
                {recordedAudioUrl && !isRecording && interviewState !== 'Introduction' && (
                  <div className="mt-6 max-w-lg mx-auto p-4 bg-white/10 border border-white/20 rounded-2xl text-left backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Recorded Spoken Answer (Review before submitting)</span>
                      </span>
                    </div>
                    <audio
                      src={recordedAudioUrl}
                      controls
                      className="w-full mt-1 rounded-xl"
                    />
                  </div>
                )}

                {/* Read-Only Spoken Answer Live Transcript Preview */}
                {(speechTranscript || interimSpeech) && showTranscript && interviewState !== 'Introduction' && (
                  <div className="mt-4 max-w-xl mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl text-left backdrop-blur-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                        <span>Spoken Transcript Preview (Read-Only)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Transcribed from your microphone</span>
                    </div>
                    <p className="text-sm text-slate-200 font-medium leading-relaxed select-text">
                      {speechTranscript}{' '}
                      <span className="text-indigo-300 italic">{interimSpeech}</span>
                    </p>
                  </div>
                )}

                {/* Mandatory Voice-Only Action Controls */}
                {interviewState !== 'Introduction' && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {/* Primary Voice Controls */}
                    {isRecording ? (
                      <Button
                        onClick={stopRecordingAudio}
                        className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-900/40 text-sm animate-pulse cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>Stop Recording ({timerSeconds}s)</span>
                      </Button>
                    ) : hasRecordedAnswer ? (
                      <>
                        <Button
                          onClick={handleAnswerSubmit}
                          disabled={isSubmittingAnswer}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 text-sm cursor-pointer disabled:opacity-60"
                        >
                          {isSubmittingAnswer ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>{isSubmittingAnswer ? 'Evaluating Answer...' : 'Submit Spoken Answer'}</span>
                        </Button>

                        <button
                          type="button"
                          onClick={handleReRecordAudio}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-record Answer</span>
                        </button>
                      </>
                    ) : (
                      <Button
                        onClick={startRecordingAudio}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-900/30 text-sm cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Voice Recording</span>
                      </Button>
                    )}

                    {/* Auxiliary Controls */}
                    <button
                      type="button"
                      onClick={handleRepeatQuestion}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repeat Question</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipQuestion}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Skip Question</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGetHint}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Hint</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Toggle Read-Only Transcript Preview"
                    >
                      {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showTranscript ? 'Hide Transcript' : 'Show Transcript'}</span>
                    </button>
                  </div>
                )}

                {/* Contextual Hint Display */}
                {activeHint && interviewState !== 'Introduction' && (
                  <div className="mt-4 max-w-lg mx-auto p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                    💡 <strong>Interviewer Hint:</strong> {activeHint}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* State 4: Completed Interview & Official Section 6 Marksheet */}
          {interviewState === 'Completed' && finalReport && (
            <div className="space-y-6 animate-in fade-in">
              <InterviewMarksheetView
                report={finalReport}
                candidateName={user?.name}
              />
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setInterviewState('Ready')}
                  variant="outline"
                  className="text-xs bg-white text-indigo-900 hover:bg-slate-100 font-bold px-6 py-2.5 cursor-pointer"
                >
                  Start Another Session
                </Button>
              </div>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Personalized Question Bank by Category ({prepQuestions.length || 15}+ Questions)</h3>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">12 Master Categories</span>
              </div>
              <div className="space-y-2 text-xs max-h-96 overflow-y-auto pr-1">
                {loadingPrep ? (
                  <div className="text-center py-6 text-slate-400">Loading personalized question bank...</div>
                ) : prepQuestions.length > 0 ? (
                  prepQuestions.map((q: any, idx: number) => (
                    <details key={q.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <summary className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{q.category}: {q.question || q.questionText}</span>
                        <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-2">{q.difficulty || 'Medium'}</span>
                      </summary>
                      {q.expectedConcepts && (
                        <div className="mt-2 text-slate-600 text-[11px] space-y-1">
                          <strong className="text-slate-700">Key Concepts:</strong>
                          <ul className="list-disc list-inside space-y-0.5">
                            {q.expectedConcepts.map((c: string, ci: number) => (
                              <li key={ci}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {q.sampleAnswerStructure && (
                        <p className="mt-1 text-slate-500 text-[11px]">
                          <strong>Structure:</strong> {q.sampleAnswerStructure}
                        </p>
                      )}
                    </details>
                  ))
                ) : (
                  <>
                    <details className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <summary className="font-bold text-slate-800">Resume & Introduction Questions</summary>
                      <p className="mt-2 text-slate-600">Walk through your education, technical stack, and career motivation with structured verbal clarity.</p>
                    </details>
                    <details className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <summary className="font-bold text-slate-800">Dynamic Project Architecture & Bottlenecks</summary>
                      <p className="mt-2 text-slate-600">Explain end-to-end component data flow, your personal technical contributions, and debugging methods.</p>
                    </details>
                    <details className="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <summary className="font-bold text-slate-800">Java & Technical Fundamentals</summary>
                      <p className="mt-2 text-slate-600">Explain OOP principles, Collections hashing and red-black treeification, and Spring Bean lifecycles.</p>
                    </details>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Voice Interview Guidelines</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Voice-only answers:</strong> Typed answer input is removed. You must speak your answers into the microphone.
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Speak at a steady pace:</strong> The AI interviewer evaluates clarity and pauses for reflection. Avoid rushing.
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Review your recording:</strong> You can play back your audio before submitting, or re-record if needed.
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong>Admit gaps gracefully:</strong> If you don't know a concept, state how you would investigate rather than fabricating.
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
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="text-xs py-1.5 px-3 cursor-pointer"
                      >
                        View Full Marksheet
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
