import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function Sidebar({ course, activeModuleId, activeLessonId }) {
  if (!course) return null;

  return (
    <aside className="w-80 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col h-[calc(100vh-4.5rem)] sticky top-18 overflow-y-auto transition-colors duration-200">

      <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest">

          </span>
        </div>
        <h2 className="font-display font-bold text-sm text-[var(--ink)] leading-snug line-clamp-2">
          {course.title}
        </h2>
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
    </aside>
  );
}

