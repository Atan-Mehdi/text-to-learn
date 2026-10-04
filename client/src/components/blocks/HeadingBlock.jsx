import React from 'react';

export default function HeadingBlock({ text }) {
  return (
    <div className="mt-12 mb-6 pt-6 border-t border-[var(--border)]">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>SECTION</span>
      </div>
      <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--ink)] tracking-tight leading-snug">
        {text}
      </h2>
    </div>
  );
}

