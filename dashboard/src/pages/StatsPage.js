import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DocumentDuplicateIcon, ArrowTrendingUpIcon, AcademicCapIcon, UserIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: IconComponent, color = 'blue', trend = null, subtitle = null }) => (
  <div className="surface-card p-6 text-center group hover:scale-105 transition-all duration-200" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex flex-col items-center space-y-3">
      <div className={`p-3 bg-gradient-to-br from-${color}-100 to-${color}-200 dark:from-${color}-900/30 dark:to-${color}-800/50 rounded-xl shadow-sm group-hover:shadow-md transition-all`}>
        <IconComponent className={`h-8 w-8 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <div className="flex items-center justify-center space-x-2">
          <p className="text-3xl font-bold text-gradient-primary mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              <ArrowTrendingUpIcon className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

const ProgressCard = ({ title, current, total, color = 'blue' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  // Define color mappings to ensure Tailwind classes are included
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  };
  
  return (
    <div className="surface-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{current}/{total}</span>
      </div>
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 mb-2">
        <div 
          className={`${colorClasses[color] || colorClasses.blue} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{percentage}% Complete</p>
    </div>
  );
};

const StatsPage = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [testSessions, setTestSessions] = useState([]);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSkillRecommendations, setAiSkillRecommendations] = useState([]);
  const [skillRecommendationsLoading, setSkillRecommendationsLoading] = useState(false);

  // Navigation handlers
  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToTests = () => {
    navigate('/test');
  };

  const handleContinueTest = (testName) => {
    // Navigate to tests page with a filter or specific test
    navigate('/test', { state: { searchTerm: testName } });
  };

  const handleRetakeTest = (testName) => {
    // Navigate to tests page to retake specific test
    navigate('/test', { state: { searchTerm: testName, action: 'retake' } });
  };

  const handleTakeNewTest = (skillName) => {
    // Navigate to tests page to take a new test for the skill
    navigate('/test', { state: { searchTerm: skillName, action: 'new' } });
  };

  const handleEditCV = () => {
    // Navigate to CV editor (assuming it's part of profile page)
    navigate('/profile', { state: { activeTab: 'cv' } });
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Fetch AI recommendations when profile data is available
  useEffect(() => {
    if (profileData && aiSkillRecommendations.length === 0) {
      fetchAiSkillRecommendations();
    }
  }, [profileData]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, testRes, progressRes, statusRes, latestRes] = await Promise.all([
        axios.get('/api/profile'),
        axios.get('/api/tests/history').catch(() => ({ data: [] })),
        axios.get('/api/cv/analyze/progress?days=30').catch(() => ({ data: null })),
        axios.get('/api/cv/analyze/status').catch(() => ({ data: null })),
        axios.get('/api/cv/analyze/latest').catch(() => ({ data: null }))
      ]);
      
      setProfileData(profileRes.data);
      setTestSessions(testRes.data || []);
      setAnalyticsData(progressRes.data);
      setAnalysisStatus(statusRes.data);
      setLatestAnalysis(latestRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="spinner-modern w-8 h-8"></div>
            <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading Analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    if (!profileData) return { current: 0, total: 7, missing: [] };
    
    const sections = [
      { key: 'full_name', name: 'Full Name', completed: !!profileData.profile?.full_name, link: '/profile' },
      { key: 'email', name: 'Email Address', completed: !!profileData.profile?.email, link: '/profile' },
      { key: 'summary', name: 'Professional Summary', completed: !!profileData.profile?.summary, link: '/profile' },
      { key: 'skills', name: 'Skills Portfolio', completed: profileData.skills?.length > 0, link: '/profile' },
      { key: 'work_experiences', name: 'Work Experience', completed: profileData.work_experiences?.length > 0, link: '/profile' },
      { key: 'education', name: 'Education History', completed: profileData.education?.length > 0, link: '/profile' },
      { key: 'projects', name: 'Projects Showcase', completed: profileData.projects?.length > 0, link: '/profile' }
    ];
    
    const missing = sections.filter(section => !section.completed);
    
    return {
      current: sections.filter(section => section.completed).length,
      total: sections.length,
      missing: missing,
      sections: sections
    };
  };

  // Fetch AI-powered skill recommendations
  const fetchAiSkillRecommendations = async () => {
    if (!profileData || skillRecommendationsLoading) return;
    
    try {
      setSkillRecommendationsLoading(true);
      const response = await axios.get('/api/profile/skill-recommendations');
      setAiSkillRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch AI skill recommendations:', error);
      // Fallback to general professional skills
      setAiSkillRecommendations(['Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Time Management']);
    } finally {
      setSkillRecommendationsLoading(false);
    }
  };

  // Get AI-powered skill recommendations
  const getIndustrySpecificSkills = () => {
    if (aiSkillRecommendations.length > 0) {
      return aiSkillRecommendations;
    }
    // Fallback while loading or if AI fails
    return ['Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Time Management'];
  };

  // Get specific skill improvement recommendations
  const getSkillRecommendations = () => {
    if (!testSessions || testSessions.length === 0) {
      return {
        needsImprovement: [],
        suggested: getIndustrySpecificSkills(),
        incomplete: []
      };
    }

    const allAttempts = testSessions.filter(t => t.score !== null && t.score !== undefined);
    const completedTests = allAttempts.filter(t => t.score > 0);
    const incompleteTests = allAttempts.filter(t => t.score === 0);
    
    const needsImprovement = completedTests
      .filter(t => t.score < 60)
      .map(t => ({
        name: t.skill || 'Unknown Skill',
        score: t.score,
        lastAttempt: t.completed_at
      }));

    const incomplete = incompleteTests
      .map(t => ({
        name: t.skill || 'Unknown Skill',
        startedAt: t.completed_at
      }));

    // Get all completed skill names for filtering - use the actual 'skill' field
    const completedSkillNames = completedTests.map(t => (t.skill || '').toLowerCase().trim());
    
    // Get industry-specific skills first, then add some universal skills
    const industrySpecificSkills = getIndustrySpecificSkills();
    const universalProfessionalSkills = ['Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Time Management'];
    
    // Combine industry-specific with some universal skills
    const allAvailableSkills = [...industrySpecificSkills, ...universalProfessionalSkills];
    
    const suggested = allAvailableSkills.filter(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check if this skill is already completed
      const isCompleted = completedSkillNames.some(completedName => {
        if (!completedName) return false;
        
        // Direct match
        if (completedName === skillLower) return true;
        
        // Check if completed test name contains the suggested skill
        if (completedName.includes(skillLower)) return true;
        
        // Special cases for common variations
        if (skillLower === 'javascript' && (
          completedName.includes('javascript') || 
          completedName.includes('js') ||
          completedName.includes('react') // React implies JavaScript knowledge
        )) return true;
        
        if (skillLower === 'sql' && completedName.includes('sql')) return true;
        
        if (skillLower === 'react' && completedName.includes('react')) return true;
        
        if (skillLower === 'python' && completedName.includes('python')) return true;
        
        return false;
      });
      
      return !isCompleted;
    }).slice(0, 5);

    return { needsImprovement, suggested, incomplete };
  };

  // Get specific CV improvement recommendations
  const getCvRecommendations = () => {
    if (!latestAnalysis?.analysis) {
      return {
        criticalIssues: ['Add professional summary', 'Include work experience', 'List relevant skills'],
        suggestions: ['Use action verbs', 'Quantify achievements', 'Customize for each job'],
        atsIssues: ['Add keywords', 'Use standard section headers', 'Choose ATS-friendly format']
      };
    }

    const analysis = latestAnalysis.analysis;
    return {
      criticalIssues: analysis.weaknesses?.slice(0, 3) || [],
      suggestions: analysis.suggestions?.slice(0, 3) || [],
      atsIssues: analysis.ats_feedback?.issues?.slice(0, 3) || []
    };
  };

  // Calculate test performance metrics
  const calculateTestMetrics = () => {
    if (!testSessions || testSessions.length === 0) {
      return { 
        totalTests: 0, 
        totalAttempts: 0,
        incompleteTests: 0,
        averageScore: 0, 
        passedTests: 0, 
        improvementTrend: 0,
        skillBreakdown: [],
        recentActivity: [],
        topSkills: [],
        needsImprovement: []
      };
    }

    // Separate completed tests (score > 0) from incomplete/failed attempts (score = 0)
    const allAttemptedTests = testSessions.filter(t => t.score !== null && t.score !== undefined);
    const completedTests = allAttemptedTests.filter(t => t.score > 0);
    const incompleteTests = allAttemptedTests.filter(t => t.score === 0);
    
    const totalTests = completedTests.length;
    const totalAttempts = allAttemptedTests.length;
    const averageScore = totalTests > 0 
      ? Math.round(completedTests.reduce((sum, t) => sum + t.score, 0) / totalTests)
      : 0;
    const passedTests = completedTests.filter(t => t.score >= 60).length;
    
    // Simple trend calculation - comparing recent vs older scores
    const recentTests = completedTests.slice(-5);
    const olderTests = completedTests.slice(0, -5);
    const recentAvg = recentTests.length > 0 
      ? recentTests.reduce((sum, t) => sum + t.score, 0) / recentTests.length
      : 0;
    const olderAvg = olderTests.length > 0 
      ? olderTests.reduce((sum, t) => sum + t.score, 0) / olderTests.length
      : 0;
    const improvementTrend = olderTests.length > 0 ? Math.round(recentAvg - olderAvg) : 0;

    return { 
      totalTests, 
      totalAttempts,
      incompleteTests: incompleteTests.length,
      averageScore, 
      passedTests, 
      improvementTrend,
      skillBreakdown: [],
      recentActivity: [],
      topSkills: [],
      needsImprovement: []
    };
  };

  const profileCompleteness = calculateProfileCompleteness();
  const testMetrics = calculateTestMetrics();
  const skillRecommendations = getSkillRecommendations();
  const cvRecommendations = getCvRecommendations();

  // Get CV score data from latest analysis
  const getCurrentCvScore = () => {
    if (latestAnalysis?.overall_score) {
      return latestAnalysis.overall_score;
    }
    return analyticsData?.newest_analysis?.overall_score || 0;
  };

  const getCvTrend = () => {
    return analyticsData?.improvements?.overall_score_change || 0;
  };

  const formatLastAnalyzed = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const getAnalysisStatusColor = () => {
    if (!analysisStatus) return 'gray';
    if (analysisStatus.needs_analysis) return 'yellow';
    return 'green';
  };

  const handleRunAnalysis = async (force = false) => {
    try {
      setIsAnalyzing(true);
      
      // Only force if there are actual changes or if explicitly requested
      let shouldForce = force;
      if (!force && analysisStatus && !analysisStatus.needs_analysis) {
        // Show confirmation dialog if user tries to re-analyze when no changes detected
        const userConfirmed = window.confirm(
          'No changes detected since last analysis. Re-analyzing the same content may produce slightly different scores due to AI variability.\n\nAre you sure you want to re-analyze?'
        );
        if (!userConfirmed) {
          setIsAnalyzing(false);
          return;
        }
        shouldForce = true; // User confirmed, so force the analysis
      }
      
      const response = await axios.post('/api/cv/analyze', { force: shouldForce });
      setLatestAnalysis(response.data);
      
      // Refresh status after analysis
      const statusRes = await axios.get('/api/cv/analyze/status');
      setAnalysisStatus(statusRes.data);
      
      // Also refresh progress data
      const progressRes = await axios.get('/api/cv/analyze/progress?days=30');
      setAnalyticsData(progressRes.data);
      
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentCvScore = getCurrentCvScore();
  const cvTrend = getCvTrend();

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        {/* Header */}
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-purple-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight" data-testid="stats-page-title">CV & Skills Analytics</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  getAnalysisStatusColor() === 'green' ? 'bg-green-400' :
                  getAnalysisStatusColor() === 'yellow' ? 'bg-yellow-400 animate-pulse' :
                  'bg-gray-400'
                }`}></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Track your professional development and CV optimization progress
                </p>
              </div>
              {analysisStatus && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 rounded-lg p-4 border border-neutral-200 dark:border-neutral-600">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        CV Analysis Status
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysisStatus.needs_analysis 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {analysisStatus.needs_analysis ? 'Needs Analysis' : 'Up to Date'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {analysisStatus.latest_analysis 
                        ? `Last analyzed: ${formatLastAnalyzed(analysisStatus.latest_analysis.analyzed_at)} (Version ${analysisStatus.latest_analysis.version})`
                        : 'No analysis performed yet'
                      }
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {analysisStatus.change_detection?.reason}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunAnalysis(false)}
                    disabled={isAnalyzing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      analysisStatus.needs_analysis
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2 inline-block"></div>
                        Analyzing...
                      </>
                    ) : analysisStatus.needs_analysis ? 'Analyze Now' : 'Re-analyze (No Changes)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="stats-cards-grid">
          <StatCard 
            title="CV Score" 
            value={`${currentCvScore}/100`}
            icon={DocumentDuplicateIcon}
            color="purple"
            trend={cvTrend}
            subtitle={latestAnalysis ? `Analyzed ${formatLastAnalyzed(latestAnalysis.analyzed_at)}` : "Overall CV Quality"}
          />
          <StatCard 
            title="Tests Completed" 
            value={testMetrics.totalTests}
            icon={AcademicCapIcon}
            color="blue"
            subtitle={testMetrics.incompleteTests > 0 ? `${testMetrics.incompleteTests} incomplete, ${testMetrics.passedTests} passed` : `${testMetrics.passedTests} passed`}
          />
          <StatCard 
            title="Test Average" 
            value={testMetrics.totalTests > 0 ? `${testMetrics.averageScore}%` : 'N/A'}
            icon={ArrowTrendingUpIcon}
            color={testMetrics.totalTests > 0 ? 'green' : 'gray'}
            trend={testMetrics.improvementTrend}
            subtitle={testMetrics.totalTests > 0 ? `Across ${testMetrics.totalTests} completed tests` : testMetrics.incompleteTests > 0 ? `${testMetrics.incompleteTests} tests need completion` : 'No tests completed'}
          />
          <StatCard 
            title="Profile Complete" 
            value={`${Math.round((profileCompleteness.current / profileCompleteness.total) * 100)}%`}
            icon={UserIcon}
            color="orange"
            subtitle={`${profileCompleteness.current}/${profileCompleteness.total} sections`}
          />
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProgressCard 
            title="Profile Completeness"
            current={profileCompleteness.current}
            total={profileCompleteness.total}
            color="orange"
          />
          <ProgressCard 
            title="Tests Completed"
            current={testMetrics.totalTests}
            total={Math.max(testMetrics.totalTests + testMetrics.incompleteTests, 5)}
            color="green"
          />
          <ProgressCard 
            title="Skills Developed"
            current={profileData?.skills?.length || 0}
            total={Math.max(profileData?.skills?.length || 0, 10)}
            color="blue"
          />
        </div>

        {/* Analysis Details */}
        {latestAnalysis && (
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Latest CV Analysis</h3>
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {latestAnalysis.is_cached ? 'Cached Result' : 'Fresh Analysis'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{latestAnalysis.overall_score}/100</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{latestAnalysis.ats_score}/100</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">ATS Score</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{latestAnalysis.strengths?.length || 0}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Strengths</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{latestAnalysis.weaknesses?.length || 0}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Areas to Improve</div>
              </div>
            </div>

            {/* Detailed Strengths and Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              {latestAnalysis.strengths && latestAnalysis.strengths.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">Key Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {latestAnalysis.strengths.slice(0, 5).map((strength, index) => (
                      <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                        <span className="text-green-500 mr-2 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                  {latestAnalysis.strengths.length > 5 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 italic">
                      +{latestAnalysis.strengths.length - 5} more strengths identified
                    </p>
                  )}
                </div>
              )}

              {/* Weaknesses/Areas to Improve */}
              {latestAnalysis.weaknesses && latestAnalysis.weaknesses.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">Areas to Improve</h4>
                  </div>
                  <ul className="space-y-2">
                    {latestAnalysis.weaknesses.slice(0, 5).map((weakness, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start">
                        <span className="text-red-500 mr-2 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                  {latestAnalysis.weaknesses.length > 5 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 italic">
                      +{latestAnalysis.weaknesses.length - 5} more areas for improvement
                    </p>
                  )}
                </div>
              )}
            </div>

            {latestAnalysis.action_items && latestAnalysis.action_items.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Priority Action Items</h4>
                <div className="space-y-2">
                  {latestAnalysis.action_items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        item.priority === 'high' ? 'bg-red-500' :
                        item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.task}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          Priority: {item.priority} • Est. time: {item.estimated_time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Feedback Sections */}
            {(latestAnalysis.structure_feedback?.suggestions?.length > 0 || latestAnalysis.content_feedback?.suggestions?.length > 0) && (
              <div className="mt-6">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-4">Detailed Feedback</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* Structure Feedback */}
                  {latestAnalysis.structure_feedback?.suggestions?.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <h5 className="font-medium text-blue-800 dark:text-blue-200">Structure & Format</h5>
                        </div>
                        {latestAnalysis.structure_feedback.score && (
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {latestAnalysis.structure_feedback.score}/100
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {latestAnalysis.structure_feedback.suggestions.slice(0, 3).map((suggestion, index) => (
                          <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Content Feedback */}
                  {latestAnalysis.content_feedback?.suggestions?.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          <h5 className="font-medium text-purple-800 dark:text-purple-200">Content Quality</h5>
                        </div>
                        {latestAnalysis.content_feedback.score && (
                          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            {latestAnalysis.content_feedback.score}/100
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {latestAnalysis.content_feedback.suggestions.slice(0, 3).map((suggestion, index) => (
                          <li key={index} className="text-sm text-purple-700 dark:text-purple-300 flex items-start">
                            <span className="text-purple-500 mr-2 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="analytics-charts-grid">
          {/* Enhanced Progress Tracking */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">CV Score Progress</h3>
            {analyticsData && analyticsData.analyses_found > 1 ? (
              <div className="space-y-6">
                {/* Progress Timeline Visualization */}
                <div className="relative">
                  <div className="flex items-end justify-between h-32 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative">
                        <div 
                          className="w-12 bg-gradient-to-t from-neutral-400 to-neutral-500 rounded-t"
                          style={{ height: `${(analyticsData.oldest_analysis.overall_score / 100) * 80 + 16}px` }}
                        ></div>
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                          {analyticsData.oldest_analysis.overall_score}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
                        First<br/>Analysis
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative">
                        <div 
                          className="w-12 bg-gradient-to-t from-purple-500 to-purple-600 rounded-t"
                          style={{ height: `${(analyticsData.newest_analysis.overall_score / 100) * 80 + 16}px` }}
                        ></div>
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-neutral-900 dark:text-white">
                          {analyticsData.newest_analysis.overall_score}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
                        Latest<br/>Analysis
                      </span>
                    </div>
                  </div>
                  
                  {/* Connection Line */}
                  <div className="absolute bottom-8 left-6 right-6 h-0.5 bg-gradient-to-r from-neutral-400 to-purple-500 opacity-30"></div>
                </div>

                {/* Progress Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {analyticsData.analyses_found}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Total Analyses</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      analyticsData.improvements.overall_score_change > 0 ? 'text-green-600 dark:text-green-400' :
                      analyticsData.improvements.overall_score_change < 0 ? 'text-red-600 dark:text-red-400' : 
                      'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {analyticsData.improvements.overall_score_change > 0 ? '+' : ''}{analyticsData.improvements.overall_score_change}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Points Change</div>
                  </div>
                </div>

                {/* Achievement Milestones */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-900 dark:text-white">Achievement Level:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      analyticsData.newest_analysis.overall_score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      analyticsData.newest_analysis.overall_score >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      analyticsData.newest_analysis.overall_score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
                    }`}>
                      {analyticsData.newest_analysis.overall_score >= 90 ? 'Excellent (90+)' :
                       analyticsData.newest_analysis.overall_score >= 80 ? 'Strong (80+)' :
                       analyticsData.newest_analysis.overall_score >= 70 ? 'Good (70+)' :
                       'Developing'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          analyticsData.newest_analysis.overall_score >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                          analyticsData.newest_analysis.overall_score >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                          analyticsData.newest_analysis.overall_score >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          'bg-gradient-to-r from-neutral-400 to-neutral-500'
                        }`}
                        style={{ width: `${analyticsData.newest_analysis.overall_score}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      <span>0</span>
                      <span>70</span>
                      <span>80</span>
                      <span>90</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Build Your Progress History</h4>
                <p className="text-xs mb-4">Run your first analysis to start tracking CV improvements over time</p>
                <button
                  onClick={() => handleRunAnalysis(false)}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Start Tracking Progress'}
                </button>
              </div>
            )}
          </div>

          {/* Test Performance */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Recent Test Performance</h3>
            
            {/* Incomplete Tests Alert */}
            {testMetrics.incompleteTests > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    {testMetrics.incompleteTests} test{testMetrics.incompleteTests > 1 ? 's' : ''} need{testMetrics.incompleteTests === 1 ? 's' : ''} completion
                  </p>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Tests with 0% scores are incomplete. Visit the Test Hub to retake them.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {testSessions.slice(-5).map((test, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{test.skill}</span>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {new Date(test.completed_at).toLocaleDateString()}
                      {test.score === 0 && <span className="ml-2 text-yellow-600 dark:text-yellow-400">(Incomplete)</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {test.score === 0 ? (
                      <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors">
                        Complete Test
                      </button>
                    ) : (
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        test.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        test.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {test.score}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {testSessions.length === 0 && (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                  <AcademicCapIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No test data available yet</p>
                  <p className="text-xs">Complete some tests in the Test Hub to see your progress here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Skills Analysis */}
        {testMetrics.skillBreakdown && testMetrics.skillBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Skills */}
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 text-green-600 mr-2" />
                Your Strongest Skills
              </h3>
              <div className="space-y-3">
                {testMetrics.topSkills && testMetrics.topSkills.length > 0 ? testMetrics.topSkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">{skill.skill}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{skill.testCount} test{skill.testCount > 1 ? 's' : ''} completed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{skill.averageScore}%</div>
                      <div className="text-xs text-green-600">Best: {skill.bestScore}%</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">Complete more tests with 70%+ scores to see your top skills</p>
                )}
              </div>
            </div>
            
            {/* Skills Needing Improvement */}
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-orange-600 mr-2" />
                Focus Areas for Growth
              </h3>
              <div className="space-y-3">
                {testMetrics.needsImprovement && testMetrics.needsImprovement.length > 0 ? testMetrics.needsImprovement.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">{skill.skill}</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Needs improvement</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{skill.averageScore}%</div>
                      <button className="text-xs bg-orange-600 text-white px-2 py-1 rounded mt-1 hover:bg-orange-700 transition-colors">
                        Retake Test
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">Great job! No skills currently below 60%</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Market Intelligence & Benchmarking */}
        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 text-blue-600 mr-2" />
            Market Intelligence & Benchmarking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentCvScore > 70 ? 'Above Average' : currentCvScore > 50 ? 'Average' : 'Below Average'}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">CV Quality Ranking</div>
              <div className="text-xs text-blue-600 mt-1">vs Industry Standard</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{testMetrics.averageScore > 70 ? 'Strong' : testMetrics.averageScore > 50 ? 'Developing' : 'Beginner'}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Skill Level</div>
              <div className="text-xs text-purple-600 mt-1">Based on Test Performance</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{profileCompleteness.current >= 6 ? 'Ready' : 'In Progress'}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Market Readiness</div>
              <div className="text-xs text-green-600 mt-1">Profile Completeness</div>
            </div>
          </div>
        </div>
        
        {/* Detailed Recommendations & Action Plan */}
        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
            Smart Recommendations & Next Steps
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Immediate Actions (This Week)</h4>
              <div className="space-y-3">
                
                {/* Missing Profile Sections */}
                {profileCompleteness.missing && profileCompleteness.missing.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Complete Missing Profile Sections
                        </p>
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          {profileCompleteness.missing.map((section, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>• {section.name}</span>
                              <button 
                                onClick={handleNavigateToProfile}
                                className="text-blue-600 hover:text-blue-800 underline text-xs transition-colors cursor-pointer"
                              >
                                Add Now →
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Incomplete Tests */}
                {skillRecommendations.incomplete && skillRecommendations.incomplete.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Complete Started Tests
                        </p>
                        <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          {skillRecommendations.incomplete.slice(0, 3).map((test, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>• {test.name}</span>
                              <button 
                                onClick={() => handleContinueTest(test.name)}
                                className="text-amber-600 hover:text-amber-800 underline text-xs transition-colors cursor-pointer"
                              >
                                Continue →
                              </button>
                            </div>
                          ))}
                          {skillRecommendations.incomplete.length > 3 && (
                            <p className="text-xs italic">+{skillRecommendations.incomplete.length - 3} more...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weak Skills */}
                {skillRecommendations.needsImprovement && skillRecommendations.needsImprovement.length > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                          Improve Weak Skills (Below 60%)
                        </p>
                        <div className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                          {skillRecommendations.needsImprovement.slice(0, 3).map((skill, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>• {skill.name} ({skill.score}%)</span>
                              <button 
                                onClick={() => handleRetakeTest(skill.name)}
                                className="text-orange-600 hover:text-orange-800 underline text-xs transition-colors cursor-pointer"
                              >
                                Retake →
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CV Issues */}
                {currentCvScore < 80 && cvRecommendations.criticalIssues.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                          Critical CV Issues ({currentCvScore}/100)
                        </p>
                        <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                          {cvRecommendations.criticalIssues.slice(0, 3).map((issue, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>• {issue}</span>
                              <button 
                                onClick={handleEditCV}
                                className="text-red-600 hover:text-red-800 underline text-xs transition-colors cursor-pointer"
                              >
                                Fix →
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Growth Goals */}
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Growth Goals (This Month)</h4>
              <div className="space-y-3">
                
                {/* Skills to Learn */}
                {skillRecommendations.suggested && skillRecommendations.suggested.length > 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                          High-Demand Skills to Test
                        </p>
                        <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                          {skillRecommendations.suggested.slice(0, 4).map((skill, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>• {skill}</span>
                              <button 
                                onClick={() => handleTakeNewTest(skill)}
                                className="text-purple-600 hover:text-purple-800 underline text-xs transition-colors cursor-pointer"
                              >
                                Test →
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CV Score Goal */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        Achieve 85+ CV Score
                      </p>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        <p>Current: {currentCvScore}/100 • Target: 85+</p>
                        <p className="mt-1">Focus: {cvRecommendations.suggestions[0] || 'Professional summary & achievements'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ATS Optimization */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                        ATS Optimization
                      </p>
                      <div className="text-xs text-indigo-700 dark:text-indigo-300">
                        <p>Current: {latestAnalysis?.ats_score || 0}/100 • Target: 90+</p>
                        {cvRecommendations.atsIssues.length > 0 && (
                          <p className="mt-1">Priority: {cvRecommendations.atsIssues[0]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skill Portfolio Goal */}
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-l-4 border-teal-500">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-teal-900 dark:text-teal-100 mb-1">
                        Build Strong Skill Portfolio
                      </p>
                      <div className="text-xs text-teal-700 dark:text-teal-300">
                        <p>Completed: {testMetrics.totalTests} • Goal: {testMetrics.totalTests + 5}+ tests</p>
                        <p className="mt-1">Target 70%+ average score</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

