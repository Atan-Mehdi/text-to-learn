import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Auth0ProviderWrapper } from './context/Auth0ProviderWrapper';
import { AuthProvider } from './context/AuthContext';
import Topbar from './components/Topbar';
import AuthModal from './components/AuthModal';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import LessonViewerPage from './pages/LessonViewerPage';

export default function App() {
  return (
    <ThemeProvider>
      <Auth0ProviderWrapper>
        <AuthProvider>
          <ScrollToTop />
          <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
            <Topbar />
            <div className="flex-1 flex flex-col">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses/:id" element={<CoursePage />} />
                <Route
                  path="/courses/:courseId/module/:moduleId/lesson/:lessonId"
                  element={<LessonViewerPage />}
                />
              </Routes>
            </div>
            <AuthModal />
          </div>
        </AuthProvider>
      </Auth0ProviderWrapper>
    </ThemeProvider>
  );
}

