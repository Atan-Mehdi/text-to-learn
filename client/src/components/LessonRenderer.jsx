import React from 'react';
import HeadingBlock from './blocks/HeadingBlock';
 import ParagraphBlock from './blocks/ParagraphBlock';
 import CodeBlock from './blocks/CodeBlock';
 import VideoBlock from './blocks/VideoBlock';
 import MCQBlock from './blocks/MCQBlock';
 import { Target, BookOpen } from 'lucide-react';

export default function LessonRenderer({ lesson }) {
  if (!lesson) {
    return (
      <div className="text-[var(--ink-muted)] text-sm italic py-10 font-sans">
        No lesson data available.
      </div>
    );
  }

  const { title, objectives = [], content = [] } = lesson;

  return (
    <div className="space-y-10">

      <div className="border-b border-[var(--border)] pb-8 mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-500 uppercase tracking-widest mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Interactive Lesson</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-5xl text-[var(--ink)] tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      {objectives && objectives.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[var(--border)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-semibold">
              Learning Objectives
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {objectives.map((obj, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)]"
              >
                <span className="font-mono font-bold text-xs text-emerald-500 flex-shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-sans text-xs md:text-sm text-[var(--ink)] leading-relaxed">
                  {obj}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {content && content.length > 0 ? (
          (() => {
            let mcqCounter = 0;
            return content.map((block, idx) => {
              switch (block.type) {
                case 'heading':
                  return <HeadingBlock key={idx} text={block.text} />;
                case 'paragraph':
                  return <ParagraphBlock key={idx} text={block.text} />;
                case 'code':
                  return (
                    <CodeBlock
                      key={idx}
                      language={block.language}
                      text={block.text}
                    />
                  );
                case 'video':
                  return (
                    <VideoBlock key={idx} query={block.query} url={block.url} />
                  );
                case 'mcq':
                case 'question':
                case 'quiz': {
                  mcqCounter++;
                  return (
                    <MCQBlock
                      key={idx}
                      questionNumber={mcqCounter}
                      question={block.question}
                      options={block.options}
                      answer={block.answer}
                      explanation={block.explanation}
                    />
                  );
                }
                default:
                  return <ParagraphBlock key={idx} text={block.text || ''} />;
              }
            });
          })()
        ) : (
          <p className="font-sans text-[var(--ink-muted)] italic text-sm">
            No structured content generated yet for this lesson.
          </p>
        )}
      </div>
    </div>
  );
}

