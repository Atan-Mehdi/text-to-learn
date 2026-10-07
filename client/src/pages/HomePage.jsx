import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, Search, Sparkles, Terminal, Shield, Cpu, Activity, Zap, Trash2 } from 'lucide-react';
import { generateCourse, getAllCourses, deleteCourseApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SAMPLE_PROMPTS = [
  { text: 'React 19 & Next.js Architecture', tag: 'DEV' },
  { text: 'Transformers & Large Language Models', tag: 'AI' },
  { text: 'Distributed Systems & Microservices', tag: 'ARCH' },
  { text: 'Cloud Security & Threat Modeling', tag: 'SEC' },
  { text: 'Applied Cryptography & Zero-Knowledge', tag: 'CRYPTO' },
];

const INITIAL_COURSE_IDS = [
  'b5487d1b-886b-403d-9b80-ef58495f0b82',
  'b968ee0d-86eb-4c19-b64c-6a10239690da',
];

export default function HomePage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  const isCourseDeletable = (course) => {
    if (INITIAL_COURSE_IDS.includes(course.id)) return false;
    if (user?.role === 'ADMIN') return true;
    if (!user) return false;
    const userIdent = (user.email || user.name || '').toLowerCase().trim();
    const creator = (course.creator || '').toLowerCase().trim();
    return (
      creator &&
      userIdent &&
      (creator === userIdent || userIdent.includes(creator) || creator.includes(userIdent))
    );
  };

  const handleDeleteCourse = async (e, course) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${course.title}"?`);
    if (!confirmed) return;

    setDeletingId(course.id);
    try {
      await deleteCourseApi(course.id, user?.email || user?.name || null);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (err) {
      console.error('Failed to delete course', err);
      alert(err.response?.data?.error || 'Failed to delete course. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const userIdentifier = user?.email || user?.name || null;
    getAllCourses(userIdentifier)
      .then((data) => setCourses(data || []))
      .catch((err) => console.log('Could not fetch existing courses', err));
  }, [user]);

  useEffect(() => {
    if (location.hash === '#course-catalog') {
      const timer = setTimeout(() => {
        const el = document.getElementById('course-catalog');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const mouse = { x: -1000, y: -1000, radius: 180 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const particleCount = Math.min(Math.floor((width * height) / 18000), 65);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2 + 1.8,
        glow: Math.random() > 0.4,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains('dark');
      const particleBaseColor = isDark ? 'rgba(16, 185, 129, 0.9)' : 'rgba(5, 150, 105, 0.95)';
      const lineBaseColor = isDark ? 'rgba(16, 185, 129, ' : 'rgba(5, 150, 105, ';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distToMouse = Math.hypot(dx, dy);
        if (distToMouse < mouse.radius) {
          const force = (mouse.radius - distToMouse) / mouse.radius;
          p.x -= (dx / distToMouse) * force * 3;
          p.y -= (dy / distToMouse) * force * 3;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleBaseColor;
        if (p.glow) {
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 155) {
            const alpha = (1 - dist / 155) * (isDark ? 0.35 : 0.28);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${lineBaseColor}${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return;

    if (!isAuthenticated || !user) {
      setError('Please sign in first to generate and save your custom course.');
      openAuthModal();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const creator = user.email || user.name;
      const course = await generateCourse(topic, creator);
      if (course && course.id) {
        navigate(`/courses/${course.id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-32 bg-tech-grid relative overflow-hidden">

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-90"
      />

      <div className="absolute top-6 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/20 dark:bg-emerald-500/25 blur-[100px] pointer-events-none animate-float-slow -z-0" />
      <div className="absolute top-36 right-1/4 w-[420px] h-[420px] rounded-full bg-teal-400/20 dark:bg-emerald-400/20 blur-[90px] pointer-events-none animate-float-reverse -z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] ambient-glow pointer-events-none -z-0" />

      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/90 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.9)] pointer-events-none animate-scanline -z-0" />

      <section className="relative px-4 sm:px-6 md:px-12 pt-6 md:pt-10 pb-12 sm:pb-16 z-10">
        <div className="max-w-7xl mx-auto">

          <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md text-[11px] sm:text-xs md:text-sm font-mono text-[var(--text-muted)] mb-5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[var(--text-primary)] font-semibold uppercase tracking-wider">
              AI-POWERED COURSE GENERATOR
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-start">

            <div className="lg:col-span-7 pt-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[62px] xl:text-[68px] font-extrabold tracking-[-0.035em] text-[var(--text-primary)] leading-[1.15] sm:leading-[1.12]">
                Synthesize any curriculum with{' '}
                <span className="text-emerald-500 dark:text-emerald-400">precision intelligence.</span>
              </h1>

              <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-xl text-[var(--text-muted)] max-w-2xl leading-[1.65] font-normal">
                Autonomous course structuring with modular syllabi, interactive code environments, natural bilingual speech synthesis, and vector export.
              </p>

              <div className="mt-6 sm:mt-8 pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-dim)] font-semibold">
                    QUICK DISPATCH PROMPTS:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {SAMPLE_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(item.text)}
                      className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-sm hover:border-emerald-500/50 hover:bg-[var(--bg-card-hover)] text-xs md:text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                    >
                      <span className="text-emerald-500 mr-1.5 font-bold">[{item.tag}]</span>
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)]/90 p-5 sm:p-7 md:p-8 shadow-2xl relative backdrop-blur-xl hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border)] font-mono text-xs md:text-sm">
                  <span className="text-[var(--text-muted)] flex items-center gap-2 font-medium">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>PROMPT INGESTION</span>
                  </span>
                  <span className="text-xs text-emerald-500 font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    READY
                  </span>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="text-xs md:text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-2.5 font-semibold">
                      Topic or Skill Definition:
                    </label>
                    <textarea
                      rows={4}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., C++ Memory Allocation, Distributed Cache Systems, Zero-Knowledge Proofs..."
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 text-sm md:text-base font-sans text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none leading-relaxed"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    className="w-full flex items-center justify-center gap-2.5 py-3 sm:py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs md:text-sm font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Synthesizing Syllabus...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Course</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs md:text-sm font-mono">
                    {error}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] sm:text-[11px] md:text-xs font-mono text-[var(--text-dim)]">
                  <span>MODULAR ENGINE</span>
                  <span>•</span>
                  <span>BILINGUAL AUDIO</span>
                  <span>•</span>
                  <span>VECTOR PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-12 py-8 sm:py-10 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7">
          <div className="p-5 sm:p-7 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all shadow-xs hover:-translate-y-1 duration-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-mono text-sm font-bold mb-4 sm:mb-5">
              01
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2 sm:mb-2.5 leading-snug">
              Modular Curriculum Matrix
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed font-normal">
              Structured progressive modules with targeted learning objectives, executable code, companion tutorials, and interactive validation.
            </p>
          </div>

          <div className="p-5 sm:p-7 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all shadow-xs hover:-translate-y-1 duration-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-mono text-sm font-bold mb-4 sm:mb-5">
              02
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2 sm:mb-2.5 leading-snug">
              Bilingual Speech Engine
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed font-normal">
              Instant voice playback in English or natural conversational Hinglish with bookmark position tracking and continuous playback chaining.
            </p>
          </div>

          <div className="p-5 sm:p-7 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md hover:border-emerald-500/40 transition-all shadow-xs hover:-translate-y-1 duration-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-mono text-sm font-bold mb-4 sm:mb-5">
              03
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2 sm:mb-2.5 leading-snug">
              Vector PDF Exporter
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed font-normal">
              Clean vector document compilation with structured code formatting, objectives, and quiz answer keys for offline reference.
            </p>
          </div>
        </div>
      </section>

      <section id="course-catalog" className="px-4 sm:px-6 md:px-12 pt-6 sm:pt-8 max-w-7xl mx-auto relative z-10 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 mb-8">
          <div>
            <div className="text-xs md:text-sm font-mono text-emerald-500 uppercase tracking-widest mb-1.5 font-semibold">

            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Generated Course Catalog
            </h2>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, description, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm font-sans text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="group cursor-pointer rounded-3xl border border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-sm hover:border-emerald-500/50 p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 shadow-xs hover:shadow-xl hover:shadow-black/15"
              >
                <div>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {course.tags?.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {isCourseDeletable(course) && (
                      <button
                        type="button"
                        title="Delete Course"
                        onClick={(e) => handleDeleteCourse(e, course)}
                        disabled={deletingId === course.id}
                        className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer opacity-80 hover:opacity-100 flex-shrink-0"
                      >
                        {deletingId === course.id ? (
                          <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="mt-3 text-xs md:text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed font-normal">
                    {course.description}
                  </p>
                </div>

                <div className="mt-7 pt-5 border-t border-[var(--border)] flex items-center justify-between text-xs md:text-sm font-mono text-[var(--text-dim)]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>{course.modules?.length || 0} Modules</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all font-semibold">
                    <span>Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)]/80 p-8">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {searchQuery ? 'No matching courses found' : 'No courses generated yet'}
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto font-normal">
              {searchQuery
                ? 'Try searching with a broader keyword or create a new syllabus above.'
                : 'Enter a topic in the prompt box above to generate your custom curriculum.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

