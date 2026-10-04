import React, { useState, useMemo } from 'react';
import { Copy, Check, FileCode2, Code2 } from 'lucide-react';
import Prism from 'prismjs';

if (typeof window !== 'undefined') {
  window.Prism = Prism;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Prism = Prism;
}

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-go';

const LANGUAGE_CONFIG = {
  cpp: { name: 'C++', ext: 'main.cpp', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  'c++': { name: 'C++', ext: 'main.cpp', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  c: { name: 'C', ext: 'main.c', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  javascript: { name: 'JavaScript', ext: 'index.js', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  js: { name: 'JavaScript', ext: 'index.js', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  jsx: { name: 'React JSX', ext: 'App.jsx', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  typescript: { name: 'TypeScript', ext: 'index.ts', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  ts: { name: 'TypeScript', ext: 'index.ts', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  tsx: { name: 'React TSX', ext: 'App.tsx', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  python: { name: 'Python', ext: 'solution.py', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  py: { name: 'Python', ext: 'solution.py', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  java: { name: 'Java', ext: 'Main.java', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  sql: { name: 'SQL', ext: 'query.sql', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  rust: { name: 'Rust', ext: 'main.rs', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  rs: { name: 'Rust', ext: 'main.rs', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  go: { name: 'Go', ext: 'main.go', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  golang: { name: 'Go', ext: 'main.go', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  bash: { name: 'Bash', ext: 'script.sh', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' },
  sh: { name: 'Shell', ext: 'script.sh', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' },
  json: { name: 'JSON', ext: 'data.json', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' }
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Splits highlighted HTML into individual lines while maintaining
 * open/close tags across newlines so every line is valid HTML.
 */
function splitHtmlIntoLines(html) {
  const rawLines = html.split('\n');
  const result = [];
  const openTags = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Prefix with currently open tags
    const prefix = openTags.map(tag => tag.fullTag).join('');

    // Find all tags in this line to update openTags stack
    const tagRegex = /<\/?([a-zA-Z0-9_-]+)(?:\s+[^>]*)?>/g;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];
      const isClosing = fullTag.startsWith('</');

      if (isClosing) {
        for (let j = openTags.length - 1; j >= 0; j--) {
          if (openTags[j].name === tagName) {
            openTags.splice(j, 1);
            break;
          }
        }
      } else if (!fullTag.endsWith('/>')) {
        openTags.push({ name: tagName, fullTag });
      }
    }

    // Suffix with closing tags for any still-open tags
    const suffix = openTags.slice().reverse().map(tag => '</' + tag.name + '>').join('');

    let fullLine = prefix + line + suffix;
    if (!fullLine.trim()) {
      fullLine = '&nbsp;';
    }
    result.push(fullLine);
  }

  return result;
}

export default function CodeBlock({ language = 'javascript', text = '' }) {
  const [copied, setCopied] = useState(false);

  const normalizedLang = (language || 'javascript').toLowerCase().trim();
  const config = LANGUAGE_CONFIG[normalizedLang] || {
    name: language ? language.toUpperCase() : 'CODE',
    ext: `snippet.${normalizedLang || 'txt'}`,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedLines = useMemo(() => {
    if (!text) return [];

    // Determine Prism grammar with fallback mappings
    let grammar = Prism.languages[normalizedLang];
    if (!grammar) {
      if (normalizedLang === 'c++' || normalizedLang === 'cpp') grammar = Prism.languages.cpp;
      else if (normalizedLang === 'c') grammar = Prism.languages.c;
      else if (normalizedLang === 'js' || normalizedLang === 'jsx') grammar = Prism.languages.javascript;
      else if (normalizedLang === 'ts' || normalizedLang === 'tsx') grammar = Prism.languages.typescript;
      else if (normalizedLang === 'py') grammar = Prism.languages.python;
      else if (normalizedLang === 'sh' || normalizedLang === 'shell' || normalizedLang === 'zsh') grammar = Prism.languages.bash;
      else if (normalizedLang === 'rs') grammar = Prism.languages.rust;
      else if (normalizedLang === 'golang') grammar = Prism.languages.go;
      else grammar = Prism.languages.clike || Prism.languages.javascript;
    }

    try {
      const highlighted = Prism.highlight(text, grammar || Prism.languages.clike, normalizedLang);
      return splitHtmlIntoLines(highlighted);
    } catch {
      return text.split('\n').map(line => escapeHtml(line) || '&nbsp;');
    }
  }, [text, normalizedLang]);

  const lineCount = highlightedLines.length;

  return (
    <div className="my-8 rounded-2xl border border-[var(--border)] bg-[#0a0a0f] overflow-hidden shadow-xl shadow-black/20 transition-all hover:border-[var(--border-hover)]">
      {/* VS Code / macOS Style Window Titlebar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111118] border-b border-[var(--border)] select-none">
        {/* Left: macOS Window Dots & Active Tab Filename */}
        <div className="flex items-center gap-3.5">
          {/* Window Controls */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 shadow-xs" />
          </div>

          {/* Active File Tab */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#181822] border border-[var(--border)] text-xs font-mono text-zinc-300">
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-zinc-200">{config.ext}</span>
          </div>
        </div>

        {/* Right: Language Badge, Lines Count & Copy Button */}
        <div className="flex items-center gap-3">
          {/* Language Pill */}
          <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider border ${config.color}`}>
            <Code2 className="w-3 h-3" />
            {config.name}
          </span>

          <span className="hidden md:inline text-[11px] font-mono text-zinc-500">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>

          {/* Copy Button with Feedback */}
          <button
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer border ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[#1a1a24] hover:bg-[#242432] text-zinc-300 hover:text-white border-[var(--border)]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Code Body with Gutter & Syntax Highlighted Lines */}
      <div className="relative py-4 overflow-x-auto text-xs md:text-[13.5px] font-mono bg-[#0a0a0f] flex">
        {/* Line Numbers Gutter */}
        <div className="select-none text-zinc-600 px-4 text-right border-r border-zinc-800/80 font-mono text-xs md:text-[13.5px] leading-6 flex-shrink-0">
          {highlightedLines.map((_, i) => (
            <div key={i} className="h-6 leading-6 flex items-center justify-end">
              {String(i + 1).padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Code Content with Syntax Tokens & Preserved Whitespace */}
        <div className="pl-5 pr-6 flex-1 min-w-0">
          <pre className="font-mono text-zinc-200 whitespace-pre overflow-x-visible m-0 p-0 bg-transparent border-0 leading-6">
            <code>
              {highlightedLines.map((htmlLine, i) => (
                <div
                  key={i}
                  className="h-6 leading-6 block hover:bg-white/[0.03] -mx-5 px-5 transition-colors whitespace-pre"
                  dangerouslySetInnerHTML={{ __html: htmlLine }}
                />
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
