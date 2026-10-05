import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Layers, ArrowLeft, Play, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import { getCourse, deleteCourseApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const INITIAL_COURSE_IDS = [
  '8a96fddb-0ad0-4c96-abaa-ef93d2daa8c7',
  'b968ee0d-86eb-4c19-b64c-6a10239690da',
  '3775f8b3-cc8c-4597-a189-4a63842f2387',
];

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCourse(id)
      .then((data) => setCourse(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const isDeletable = course && !INITIAL_COURSE_IDS.includes(course.id) && (
    user?.role === 'ADMIN' ||
    (user && course.creator && (
      course.creator.toLowerCase() === (user.email || user.name || '').toLowerCase() ||
      (user.email && (course.creator.toLowerCase().includes(user.email.toLowerCase()) || user.email.toLowerCase().includes(course.creator.toLowerCase()))) ||
      (user.name && (course.creator.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(course.creator.toLowerCase())))
    ))
  );

  const handleDeleteCourse = async () => {
    if (!course) return;
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${course.title}"?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteCourseApi(course.id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete course', err);
      alert(err.response?.data?.error || 'Failed to delete course. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-3 text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider">LOADING SYLLABUS...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24 px-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Course Not Found</h2>
        <p className="text-xs text-[var(--text-muted)] mt-2">The requested curriculum does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-mono uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const firstModule = course.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0];
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-32">

      <section className="relative px-4 sm:px-8 md:px-12 py-8 sm:py-12 border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-5xl mx-auto">

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text-primary)] mb-4 sm:mb-5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Courses</span>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
            {course.tags?.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight max-w-3xl">
            {course.title}
          </h1>

          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-[var(--text-muted)] max-w-2xl leading-relaxed font-normal">
            {course.description}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            {firstLesson && (
              <button
                onClick={() =>
                  navigate(
                    `/courses/${course.id}/module/${firstModule.id}/lesson/${firstLesson.id}`
                  )
                }
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-page)] text-xs font-mono uppercase tracking-wider font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Learning</span>
              </button>
            )}

            {isDeletable && (
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-rose-500/30 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-xs hover:scale-[1.02] disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Course</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono text-[var(--text-dim)]">
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)]">
                {course.modules?.length || 0} Modules
              </span>
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)]">
                {totalLessons} Lessons
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 mt-8 sm:mt-12">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6 sm:mb-8">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
              // SYLLABUS HIERARCHY
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              Curriculum Modules & Lessons
            </h2>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {course.modules?.map((module, mIdx) => (
            <div
              key={module.id || mIdx}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6 md:p-7 shadow-sm"
            >

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                    {String(mIdx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {module.title}
                    </h3>
                  </div>
                </div>

                <span className="text-xs font-mono text-[var(--text-dim)]">
                  {module.lessons?.length || 0} Lessons
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {module.lessons?.map((lesson, lIdx) => (
                  <button
                    key={lesson.id || lIdx}
                    onClick={() =>
                      navigate(
                        `/courses/${course.id}/module/${module.id}/lesson/${lesson.id}`
                      )
                    }
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] text-left group cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform flex-shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] truncate">
                        {lesson.title}
                      </span>
                    </div>
                    <Play className="w-3 h-3 text-[var(--text-dim)] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
