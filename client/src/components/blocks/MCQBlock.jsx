import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function MCQBlock({ question, options = [], answer = 0, explanation, questionNumber }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx) => {
    if (!submitted) {
      setSelectedOption(idx);
    }
  };

  const handleCheck = () => {
    if (selectedOption !== null) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedOption(null);
  };

  const isCorrect = submitted && selectedOption === answer;

  return (
    <div className="my-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-8 transition-colors">

      <div className="flex items-start gap-3.5 mb-6 pb-4 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
          {questionNumber ? `Q${questionNumber}` : 'Q'}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest">
              KNOWLEDGE CHECK
            </span>
          </div>
          <h4 className="font-display font-bold text-base md:text-lg text-[var(--ink)] tracking-tight">
            {question}
          </h4>
        </div>
      </div>

      <div className="space-y-2.5 my-6">
        {options.map((opt, idx) => {
          let btnClass =
            'w-full text-left p-3.5 md:p-4 rounded-xl border text-xs md:text-sm font-sans transition-all flex items-center justify-between cursor-pointer ';

          if (!submitted) {
            if (selectedOption === idx) {
              btnClass += 'bg-[var(--bg-canvas)] text-[var(--ink)] border-emerald-500 ring-1 ring-emerald-500/30 font-medium';
            } else {
              btnClass +=
                'bg-[var(--bg-card-hover)]/50 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-hover)] border-[var(--border)]';
            }
          } else {
            if (idx === answer) {
              btnClass += 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500 font-medium';
            } else if (selectedOption === idx && idx !== answer) {
              btnClass += 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500 font-medium';
            } else {
              btnClass += 'bg-[var(--bg-canvas)] text-[var(--ink-dim)] opacity-40 border-[var(--border)]';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={btnClass}
              disabled={submitted}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md font-mono text-xs border border-current/30 flex items-center justify-center flex-shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </span>
              {submitted && idx === answer && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
              )}
              {submitted && selectedOption === idx && idx !== answer && (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={handleCheck}
          disabled={selectedOption === null}
          className={`px-5 py-2.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            selectedOption === null
              ? 'bg-[var(--bg-card-hover)] text-[var(--ink-dim)] cursor-not-allowed opacity-50 border border-[var(--border)]'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm'
          }`}
        >
          Verify Answer
        </button>
      ) : (
        <div
          className={`mt-6 p-5 rounded-xl border flex items-start justify-between gap-4 ${
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200'
          }`}
        >
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider block">
              {isCorrect ? '✓ CORRECT — CONCEPT VERIFIED' : '✗ INCORRECT — REVIEW SUGGESTION'}
            </span>
            {explanation && (
              <p className="font-sans text-xs md:text-sm mt-2 leading-relaxed opacity-90">
                {explanation}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] border border-[var(--border)] font-mono text-xs font-semibold transition-all flex-shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
}

