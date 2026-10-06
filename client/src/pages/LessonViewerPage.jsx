import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourse, getLesson, getHinglishTranslation } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import LessonRenderer from '../components/LessonRenderer';
import LessonPDFExporter from '../components/LessonPDFExporter';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  Volume2,
  Square,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Layers,
  Menu,
  Lock,
  LogIn,
} from 'lucide-react';

function useAudioController() {
  const [state, setState] = useState({
    status: 'idle',
    lang: 'en',
    chunkIdx: 0,
    totalChunks: 0,
  });

  const genRef = useRef(0);
  const chunksRef = useRef([]);
  const langRef = useRef('en');
  const idxRef = useRef(0);
  const statusRef = useRef('idle');
  const activeUttRef = useRef(null);
  const voicesRef = useRef([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length) {
          voicesRef.current = v;
        }
      } catch (e) {
        // ignore
      }
    };
    updateVoices();
    try {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      }
    } catch (e) {
      // ignore
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.removeEventListener) {
          window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        }
      }
    };
  }, []);

  // Periodic unfreeze check for mobile browsers and Chromium-based background stalls
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        'speechSynthesis' in window &&
        statusRef.current === 'playing'
      ) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const setStatus = useCallback((s) => {
    statusRef.current = s;
    setState((prev) => ({ ...prev, status: s }));
  }, []);

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        window.speechSynthesis.resume();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const speakChunk = useCallback(
    (gen) => {
      if (gen !== genRef.current) return;
      if (statusRef.current !== 'playing') return;

      const chunks = chunksRef.current;
      const idx = idxRef.current;

      if (!chunks || idx >= chunks.length) {
        idxRef.current = 0;
        setStatus('idle');
        setState((prev) => ({ ...prev, chunkIdx: 0, totalChunks: 0 }));
        return;
      }

      const text = chunks[idx];
      if (!text || !text.trim()) {
        idxRef.current += 1;
        speakChunk(gen);
        return;
      }

      setState((prev) => ({ ...prev, chunkIdx: idx }));

      const synth = window.speechSynthesis;
      const lang = langRef.current;

      const utt = new SpeechSynthesisUtterance(text);
      const isHindi = lang === 'hi';
      utt.rate = isHindi ? 0.9 : 0.95;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      try {
        const availableVoices = voicesRef.current.length
          ? voicesRef.current
          : (synth.getVoices ? synth.getVoices() : []);

        let selectedVoice = null;
        if (availableVoices && availableVoices.length > 0) {
          if (isHindi) {
            selectedVoice =
              availableVoices.find((v) => (v.name?.includes('Lekha') || v.name?.includes('Sangeeta') || v.name?.includes('Google हिन्दी') || v.name?.includes('Hindi')) && !v.name?.toLowerCase().includes('siri')) ||
              availableVoices.find((v) => v.lang?.toLowerCase().startsWith('hi') && !v.name?.toLowerCase().includes('siri')) ||
              availableVoices.find((v) => v.lang?.toLowerCase().startsWith('hi')) ||
              availableVoices.find((v) => v.lang?.toLowerCase().includes('in') && !v.name?.toLowerCase().includes('siri') && !v.name?.toLowerCase().includes('rishi'));
          } else {
            // Filter out macOS Siri voices that silently fail in third-party browsers
            const reliableVoices = availableVoices.filter(
              (v) =>
                v.lang?.toLowerCase().startsWith('en') &&
                !v.name?.toLowerCase().includes('siri') &&
                !v.name?.toLowerCase().includes('rishi')
            );

            const voicePool = reliableVoices.length > 0 ? reliableVoices : availableVoices;

            selectedVoice =
              voicePool.find((v) => v.name?.includes('Samantha')) ||
              voicePool.find((v) => v.name?.includes('Alex')) ||
              voicePool.find((v) => v.name?.includes('Daniel')) ||
              voicePool.find((v) => v.name?.includes('Victoria')) ||
              voicePool.find((v) => v.name?.includes('Karen')) ||
              voicePool.find((v) => v.name?.includes('Fred')) ||
              voicePool.find((v) => v.name?.includes('Google')) ||
              voicePool.find((v) => v.localService && v.lang?.toLowerCase().startsWith('en')) ||
              voicePool.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
              voicePool[0];
          }
        }

        if (selectedVoice) {
          utt.voice = selectedVoice;
          utt.lang = selectedVoice.lang || (isHindi ? 'hi-IN' : 'en-US');
        } else {
          utt.lang = isHindi ? 'hi-IN' : 'en-US';
        }
      } catch (err) {
        utt.lang = isHindi ? 'hi-IN' : 'en-US';
      }

      // Chromium Retain global reference to avoid GC drop
      if (!window.__activeTTSSet) window.__activeTTSSet = new Set();
      window.__activeTTSSet.add(utt);

      utt.onstart = () => {
        if (gen !== genRef.current) return;
      };

      utt.onend = () => {
        window.__activeTTSSet?.delete(utt);
        if (gen !== genRef.current) return;
        idxRef.current += 1;
        speakChunk(gen);
      };

      utt.onerror = (e) => {
        window.__activeTTSSet?.delete(utt);
        if (gen !== genRef.current) return;
        if (e?.error === 'canceled' || e?.error === 'interrupted') return;
        idxRef.current += 1;
        speakChunk(gen);
      };

      try {
        window.speechSynthesis.resume();
        synth.speak(utt);

        setTimeout(() => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 100);
      } catch (err) {
        // ignore
      }
    },
    [setStatus]
  );

  const startPlaying = useCallback(
    (chunks, lang, fromIdx = 0) => {
      genRef.current += 1;
      const gen = genRef.current;

      chunksRef.current = chunks;
      langRef.current = lang;
      idxRef.current = fromIdx;

      setStatus('playing');
      setState((prev) => ({
        ...prev,
        lang,
        chunkIdx: fromIdx,
        totalChunks: chunks.length,
      }));

      // Cancel only if currently speaking
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }

      speakChunk(gen);
    },
    [speakChunk, setStatus]
  );

  const stop = useCallback(() => {
    genRef.current += 1;
    cancelSpeech();
    chunksRef.current = [];
    idxRef.current = 0;
    setStatus('idle');
    setState((prev) => ({ ...prev, chunkIdx: 0, totalChunks: 0 }));
  }, [cancelSpeech, setStatus]);

  const pause = useCallback(() => {
    genRef.current += 1;
    cancelSpeech();
    setStatus('paused');
    setState((prev) => ({ ...prev, chunkIdx: idxRef.current }));
  }, [cancelSpeech, setStatus]);

  const getPausedIdx = useCallback(() => idxRef.current, []);

  return { state, stop, pause, startPlaying, getPausedIdx };
}

function splitIntoSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.?!।\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getEnglishText(lesson) {
  if (!lesson) return '';
  const parts = [lesson.title];
  if (lesson.objectives?.length) {
    parts.push('Learning Objectives: ' + lesson.objectives.join('. '));
  }
  lesson.content?.forEach((b) => {
    if ((b.type === 'heading' || b.type === 'paragraph') && b.text) parts.push(b.text);
    if (b.type === 'code' && b.text) parts.push('Code snippet: ' + b.text);
    if (b.type === 'mcq' && b.question) parts.push('Quiz: ' + b.question);
  });
  return parts.join('. ');
}

export default function LessonViewerPage() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const lessonRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [hinglishText, setHinglishText] = useState('');
  const [loadingHinglish, setLoadingHinglish] = useState(false);
  const [showHinglish, setShowHinglish] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [selectedLang, setSelectedLang] = useState('en');
  const cachedChunks = useRef({ en: null, hi: null });

  const {
    state: audioState,
    stop: audioStop,
    pause: audioPause,
    startPlaying,
    getPausedIdx,
  } = useAudioController();

  useEffect(() => {
    setSelectedLang(audioState.lang);
  }, [audioState.lang]);

  const fetchHinglish = useCallback(async () => {
    if (hinglishText) return hinglishText;
    if (lesson?.hinglishExplanation) {
      setHinglishText(lesson.hinglishExplanation);
      return lesson.hinglishExplanation;
    }
    setLoadingHinglish(true);
    try {
      const res = await getHinglishTranslation(lessonId);
      const t = res.explanation || 'Hinglish explanation generated!';
      setHinglishText(t);
      return t;
    } catch {
      return 'Could not generate Hinglish translation.';
    } finally {
      setLoadingHinglish(false);
    }
  }, [hinglishText, lesson, lessonId]);

  const getChunksForLang = useCallback(
    async (lang) => {
      if (lang === 'hi') {
        if (cachedChunks.current.hi) return cachedChunks.current.hi;
        const text = await fetchHinglish();
        const chunks = splitIntoSentences(text);
        cachedChunks.current.hi = chunks;
        return chunks;
      }
      if (cachedChunks.current.en) return cachedChunks.current.en;
      const chunks = splitIntoSentences(getEnglishText(lesson));
      cachedChunks.current.en = chunks;
      return chunks;
    },
    [lesson, fetchHinglish]
  );

  const handlePlay = useCallback(
    async (lang, resumeFromCurrent = false) => {
      if (!('speechSynthesis' in window)) {
        alert('Speech synthesis is not supported in this browser.');
        return;
      }

      // Synchronously unlock and unpause speechSynthesis within user touch/click gesture
      try {
        window.speechSynthesis.resume();
      } catch (e) {
        // ignore
      }

      const fromIdx = resumeFromCurrent ? getPausedIdx() : 0;

      if (lang === 'en') {
        if (!cachedChunks.current.en) {
          cachedChunks.current.en = splitIntoSentences(getEnglishText(lesson));
        }
        const chunks = cachedChunks.current.en;
        if (chunks && chunks.length) {
          startPlaying(chunks, 'en', fromIdx);
        }
        return;
      }

      if (cachedChunks.current.hi && cachedChunks.current.hi.length) {
        startPlaying(cachedChunks.current.hi, 'hi', fromIdx);
        return;
      }

      if (lesson?.hinglishExplanation) {
        const chunks = splitIntoSentences(lesson.hinglishExplanation);
        cachedChunks.current.hi = chunks;
        setHinglishText(lesson.hinglishExplanation);
        startPlaying(chunks, 'hi', fromIdx);
        return;
      }

      const fetchedChunks = await getChunksForLang('hi');
      if (fetchedChunks && fetchedChunks.length) {
        startPlaying(fetchedChunks, 'hi', fromIdx);
      }
    },
    [lesson, getPausedIdx, startPlaying, getChunksForLang]
  );

  const onLangSwitch = useCallback(
    (newLang) => {
      setSelectedLang(newLang);
      const wasActive =
        audioState.status === 'playing' || audioState.status === 'paused';
      if (wasActive) {
        handlePlay(newLang, false);
      }
    },
    [audioState.status, handlePlay]
  );

  const handleToggleHinglish = async () => {
    if (!showHinglish && !hinglishText) {
      await fetchHinglish();
    }
    setShowHinglish((v) => !v);
  };

  useEffect(() => {
    audioStop();
    setLoading(true);
    setIsForbidden(false);
    setShowHinglish(false);
    setHinglishText('');
    cachedChunks.current = { en: null, hi: null };
    setSelectedLang('en');

    const userIdentifier = user?.email || user?.name || null;

    Promise.all([
      getCourse(courseId, userIdentifier),
      getLesson(courseId, moduleId, lessonId, userIdentifier),
    ])
      .then(([c, l]) => {
        setCourse(c);
        setLesson(l);
        setIsForbidden(false);
        if (l) {
          cachedChunks.current.en = splitIntoSentences(getEnglishText(l));
          if (l.hinglishExplanation) {
            setHinglishText(l.hinglishExplanation);
            cachedChunks.current.hi = splitIntoSentences(l.hinglishExplanation);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 403 || err.response?.data?.isPrivate) {
          setIsForbidden(true);
        }
      })
      .finally(() => setLoading(false));

    return () => audioStop();
  }, [courseId, moduleId, lessonId, user, audioStop]);

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 shadow-sm">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-widest mb-3">
          // Private Lesson Material
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] max-w-md tracking-tight">
          Restricted Access
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2.5 max-w-md leading-relaxed">
          This lesson belongs to a privately generated course and is only accessible to its creator. Please log in with the creator account to access this lesson.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Access</span>
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono uppercase tracking-wider font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const allLessons = [];
  course?.modules?.forEach((m) => {
    m.lessons?.forEach((l) => allLessons.push({ ...l, moduleId: m.id }));
  });
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const effectiveLang = selectedLang;
  const { status, chunkIdx, totalChunks } = audioState;

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <Sidebar
        course={course}
        activeModuleId={moduleId}
        activeLessonId={lessonId}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 px-4 py-6 sm:px-8 md:p-12 max-w-5xl mx-auto overflow-y-auto pb-32 w-full min-w-0">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--ink-muted)] min-w-0">
              <Link
                to={`/courses/${courseId}`}
                className="hover:text-emerald-500 transition-colors truncate max-w-[120px] sm:max-w-[180px]"
              >
                {course?.title || 'Course'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-dim)] flex-shrink-0" />
              <span className="text-[var(--ink)] font-semibold truncate max-w-[140px] sm:max-w-[220px]">
                {lesson?.title || 'Lesson'}
              </span>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs font-mono text-[var(--ink)] hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs flex-shrink-0"
              title="View Modules & Lessons"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Syllabus</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">

            <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">

              <div className="flex items-center bg-[var(--bg-panel)] p-0.5 rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => onLangSwitch('en')}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-all cursor-pointer ${
                    effectiveLang === 'en'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                  title="English Audio"
                >
                  EN
                </button>
                <button
                  onClick={() => onLangSwitch('hi')}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-all cursor-pointer ${
                    effectiveLang === 'hi'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                  title="Hindi Audio"
                >
                  हिन्दी
                </button>
              </div>

              {status === 'playing' ? (
                <button
                  onClick={audioPause}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Pause className="w-3 h-3 fill-black" />
                  <span>Pause</span>
                </button>
              ) : status === 'paused' ? (
                <button
                  onClick={() => handlePlay(effectiveLang, true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={() => handlePlay(effectiveLang, false)}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              )}

              {(status === 'playing' || status === 'paused') && (
                <button
                  onClick={audioStop}
                  title="Stop audio"
                  className="p-1.5 rounded-lg bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] border border-[var(--border)] transition-all cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              )}

              {status === 'playing' && (
                <div className="hidden xs:flex items-center gap-0.5 px-1.5">
                  <span className="w-0.5 h-3 bg-emerald-500 animate-soundwave-1" />
                  <span className="w-0.5 h-4 bg-emerald-400 animate-soundwave-2" />
                  <span className="w-0.5 h-2 bg-emerald-500 animate-soundwave-3" />
                  <span className="w-0.5 h-3.5 bg-emerald-400 animate-soundwave-4" />
                </div>
              )}

              {totalChunks > 0 && status !== 'idle' && (
                <span className="text-[10px] font-mono text-emerald-500 px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)]">
                  {Math.min(chunkIdx + 1, totalChunks)}/{totalChunks}
                </span>
              )}
            </div>

            <button
              onClick={handleToggleHinglish}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border font-mono text-xs font-semibold transition-all cursor-pointer ${
                showHinglish
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] border-[var(--border)] hover:border-emerald-500/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>{showHinglish ? 'Hide Hinglish' : 'Hinglish'}</span>
            </button>

            <LessonPDFExporter targetRef={lessonRef} lessonTitle={lesson?.title} lesson={lesson} />
          </div>
        </div>

        {showHinglish && (
          <div className="mb-8 sm:mb-10 p-5 sm:p-8 rounded-2xl border border-emerald-500/30 bg-[#0c1511] text-emerald-50 shadow-sm transition-all">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-500/20 gap-4 flex-wrap">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hinglish Audio & Overview</span>
              </div>
              {status === 'idle' && (
                <button
                  onClick={() => {
                    setSelectedLang('hi');
                    handlePlay('hi', false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>Play Audio</span>
                </button>
              )}
            </div>

            {loadingHinglish ? (
              <div className="flex items-center gap-2 text-emerald-300/80 font-mono text-xs py-3">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Generating natural Hinglish explanation...</span>
              </div>
            ) : (
              <p className="font-sans text-sm md:text-base text-zinc-200 leading-[1.8] whitespace-pre-line">
                {hinglishText}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-[var(--ink-muted)] gap-4">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Loading lesson material...
            </span>
          </div>
        ) : (
          <div
            ref={lessonRef}
            className="p-5 sm:p-8 md:p-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-colors"
          >
            <LessonRenderer lesson={lesson} />
          </div>
        )}

        <div className="mt-10 sm:mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {prevLesson ? (
            <button
              onClick={() =>
                navigate(
                  `/courses/${courseId}/module/${prevLesson.moduleId}/lesson/${prevLesson.id}`
                )
              }
              className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] border border-[var(--border)] font-mono text-xs font-semibold transition-all cursor-pointer hover:border-emerald-500/40"
            >
              <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[220px]">
                {prevLesson.title}
              </span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextLesson ? (
            <button
              onClick={() =>
                navigate(
                  `/courses/${courseId}/module/${nextLesson.moduleId}/lesson/${nextLesson.id}`
                )
              }
              className="flex items-center justify-center sm:justify-end gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              <span className="truncate max-w-[200px] sm:max-w-[220px]">
                {nextLesson.title}
              </span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          ) : (
            <Link
              to={`/courses/${courseId}`}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Complete Course</span>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

