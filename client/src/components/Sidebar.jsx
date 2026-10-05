import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Layers, CheckCircle2, X } from 'lucide-react';

export default function Sidebar({ course, activeModuleId, activeLessonId, isOpen, onClose }) {
  if (!course) return null;

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--bg-card)]">
      <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest font-semibold">
              COURSE SYLLABUS
            </span>
          </div>
          <h2 className="font-display font-bold text-sm text-[var(--ink)] leading-snug line-clamp-2">
            {course.title}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Close syllabus drawer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-5 flex-1">
        {course.modules?.map((module, mIdx) => (
          <div key={module.id || mIdx} className="space-y-1.5">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider truncate">
                MOD {String(mIdx + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] text-[var(--ink-dim)] px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)]">
                {module.lessons?.length || 0}
              </span>
            </div>

            <div className="space-y-1">
              {module.lessons?.map((lesson, lIdx) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <NavLink
                    key={lesson.id || lIdx}
                    to={`/courses/${course.id}/module/${module.id}/lesson/${lesson.id}`}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-all ${
                      isActive
                        ? 'bg-[var(--bg-canvas)] text-[var(--ink)] font-semibold border border-emerald-500/40 shadow-sm'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                        isActive
                          ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-[var(--border)] group-hover:bg-[var(--ink-muted)]'
                      }`}
                    />
                    <span className="truncate flex-1">{lesson.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex-col h-[calc(100vh-5rem)] sticky top-20 overflow-hidden transition-colors duration-200">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--bg-card)] shadow-2xl border-r border-[var(--border)] flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
