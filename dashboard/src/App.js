import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { safeJsonParse } from './utils/jsonUtils';
import Sidebar from './components/Sidebar';
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

function App() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ appliedToday: 0, appliedThisWeek: 0, applicationsByDay: [], sourcePerformance: [], statusBreakdown: [] });
  const [interviews, setInterviews] = useState([]);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchData = async () => {
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
      toast.error('Failed to fetch data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage applications={combinedApps} allJobs={jobs} fetchData={fetchData} onJobUpdate={handleJobUpdate} onMatchComplete={handleMatchResult} />} />
            <Route path="/opportunities" element={<OpportunitiesPage applications={combinedApps} fetchData={fetchData} onJobUpdate={handleJobUpdate} onMatchComplete={handleMatchResult} />} />
            <Route path="/profile" element={<MasterProfilePage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/test" element={<TestHubPage />} />
            <Route path="/stats" element={<StatsPage stats={stats} />} />
            <Route path="/cv-editor" element={<CVEditorPage />} />
            <Route path="/interviews" element={<InterviewsPage interviews={interviews} />} />
            <Route path="/market-fit" element={<MarketFitPage />} />
            <Route path="/bulk-add" element={<BulkAddPage fetchData={fetchData} />} />
            <Route path="/guidance" element={<GuidancePage />} />
            <Route path="/job/:id" element={<JobAnalysisPage onJobUpdate={handleJobUpdate} onApplicationUpdate={handleApplicationUpdate} onMatchComplete={handleMatchResult} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


