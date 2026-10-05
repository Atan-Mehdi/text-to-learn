import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, User, LogOut, Sun, Moon, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCoursesClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById('course-catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#course-catalog');
    }
  };

  return (
    <header className="h-16 sm:h-20 border-b border-[var(--border)] bg-[var(--bg-page)]/85 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 md:px-16 lg:px-24 flex items-center justify-between transition-colors duration-200">

      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group cursor-pointer select-none">

          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-emerald-500/0 blur-md opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#0e0e14] dark:bg-[#09090e] border border-emerald-500/40 group-hover:border-emerald-400 flex items-center justify-center overflow-hidden shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-transparent to-transparent opacity-80" />

              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
              </svg>

              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-display font-extrabold text-[18px] sm:text-[21px] tracking-[-0.03em] text-[var(--text-primary)] leading-none">
                Text
              </span>
              <span className="px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 leading-none">
                to
              </span>
              <span className="font-display font-black text-[18px] sm:text-[21px] tracking-[-0.03em] bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-200 bg-clip-text text-transparent leading-none">
                Learn
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 mt-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] font-medium">
                Make Your Own Course
              </span>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-2.5 sm:gap-4 md:gap-6">
        <a
          href="#course-catalog"
          onClick={handleCoursesClick}
          className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-sans font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>Courses</span>
        </a>

        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-emerald-500/30 transition-all cursor-pointer shadow-xs"
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--text-primary)]" />
          )}
        </button>

        <div className="h-4 w-[1px] bg-[var(--border)] hidden sm:block"></div>

        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] hover:border-emerald-500/40 text-xs font-sans transition-all cursor-pointer shadow-xs"
            >
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                alt={user.name}
                className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30"
              />
              <span className="text-[var(--text-primary)] font-semibold truncate max-w-[110px]">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                  <p className="text-[11px] text-[var(--text-dim)] truncate">{user.email}</p>
                  {user.role && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      {user.role}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/#course-catalog');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer text-left"
                >
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Explore Courses</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left mt-1 border-t border-[var(--border)]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-page)] text-xs font-sans font-semibold tracking-wide transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <span>Sign in</span>
          </button>
        )}
      </nav>
    </header>
  );
}

