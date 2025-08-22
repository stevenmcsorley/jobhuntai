import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { safeJsonParse } from './utils/jsonUtils';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import FloatingActionButton from './components/FloatingActionButton';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TestHubPage from './pages/TestHubPage';
import StatsPage from './pages/StatsPage';
import CVEditorPage from './pages/CVEditorPage';
import InterviewsPage from './pages/InterviewsPage';
import PreferencesPage from './pages/PreferencesPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import MarketFitPage from './pages/MarketFitPage';
import BulkAddPage from './pages/BulkAddPage';
import GuidancePage from './pages/GuidancePage';
import MasterProfilePage from './pages/MasterProfilePage';
import JobAnalysisPage from './pages/JobAnalysisPage';
import { ThemeContext } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ appliedToday: 0, appliedThisWeek: 0, applicationsByDay: [], sourcePerformance: [], statusBreakdown: [] });
  const [interviews, setInterviews] = useState([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const [jobsRes, appsRes, matchesRes, statsRes, interviewsRes] = await Promise.all([
        axios.get('/api/jobs'),
        axios.get('/api/applications'),
        axios.get('/api/matches'),
        axios.get('/api/stats'),
        axios.get('/api/interviews')
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setMatches(matchesRes.data);
      setStats(statsRes.data);
      setInterviews(interviewsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        logout();
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to fetch data.');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleApplicationUpdate = (updatedApp) => {
    setApplications(prevApps =>
      prevApps.map(app =>
        app.id === updatedApp.id ? { ...app, ...updatedApp } : app
      )
    );
  };

  const handleJobUpdate = (updatedJob) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === updatedJob.id ? updatedJob : job
      )
    );
  };

  const handleMatchResult = (newMatch) => {
    setMatches(prevMatches => {
      const existingIndex = prevMatches.findIndex(m => m.job_id === newMatch.job_id);
      if (existingIndex > -1) {
        const updatedMatches = [...prevMatches];
        updatedMatches[existingIndex] = { ...prevMatches[existingIndex], ...newMatch };
        return updatedMatches;
      } else {
        return [...prevMatches, newMatch];
      }
    });
  };



  const jobsById = jobs.reduce((acc, job) => ({ ...acc, [job.id]: job }), {});
  const matchesByJobId = matches.reduce((acc, match) => ({ ...acc, [match.job_id]: match }), {});

  const combinedApps = applications.map(app => {
    const job = jobsById[app.job_id] || {};
    const match = matchesByJobId[app.job_id] || {};

    // Start with job and match data, then spread application data.
    // This ensures app.id and app.status overwrite any conflicting keys.
    const combined = {
      ...job,
      ...match,
      ...app,
      job_id: job.id, // Explicitly set job_id from the job object
      id: app.id,     // Explicitly set id from the application object
      reasons: safeJsonParse(match.reasons, [], 'match.reasons')
    };
    return combined;
  });

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Calculate opportunities count for sidebar badge
  const opportunitiesCount = applications.filter(app => app.status === 'opportunity').length;

  return (
    <Router>
      <div className="flex min-h-screen bg-neutral-50 dark:bg-slate-900 scrollbar-modern">
        <Sidebar opportunitiesCount={opportunitiesCount} onLogout={logout} />
        <main className="flex-1 overflow-hidden bg-dot-pattern">
          <Routes>
            <Route path="/" element={<DashboardPage applications={combinedApps} allJobs={jobs} fetchData={fetchData} onJobUpdate={handleJobUpdate} onMatchComplete={handleMatchResult} />} />
            <Route path="/opportunities" element={<OpportunitiesPage applications={combinedApps} fetchData={fetchData} onJobUpdate={handleJobUpdate} onMatchComplete={handleMatchResult} />} />
            <Route path="/profile" element={<MasterProfilePage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/test" element={<TestHubPage />} />
            <Route path="/stats" element={<StatsPage stats={stats} />} />
            <Route path="/cv-editor" element={<CVEditorPage />} />
            <Route path="/interviews" element={<InterviewsPage interviews={interviews} onRefresh={fetchData} />} />
            <Route path="/market-fit" element={<MarketFitPage />} />
            <Route path="/bulk-add" element={<BulkAddPage fetchData={fetchData} />} />
            <Route path="/guidance" element={<GuidancePage />} />
            <Route path="/job/:id" element={<JobAnalysisPage onJobUpdate={handleJobUpdate} onApplicationUpdate={handleApplicationUpdate} onMatchComplete={handleMatchResult} />} />
          </Routes>
        </main>
        <CommandPalette 
          isOpen={commandPaletteOpen} 
          onClose={() => setCommandPaletteOpen(false)} 
        />
        <FloatingActionButton 
          onCommandPalette={() => setCommandPaletteOpen(true)}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


