import React from 'react';

export default function ParagraphBlock({ text }) {
  return (
    <p className="font-sans text-base md:text-lg text-[var(--ink-muted)] leading-[1.8] mb-6">
      {text}
    </p>
  );
}

