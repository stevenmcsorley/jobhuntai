import React from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  BriefcaseIcon,
  ClockIcon,
  FireIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const WidgetCard = ({ children, className = "" }) => (
  <div className={`surface-card p-6 hover:shadow-lg transition-all duration-200 ${className}`}>
    {children}
  </div>
);

const MetricItem = ({ label, value, trend, color = 'blue', icon: Icon }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
    <div className="flex items-center space-x-3">
      {Icon && <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />}
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-lg font-bold text-neutral-900 dark:text-white">{value}</span>
      {trend && (
        <span className={`text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  </div>
);

const CVMatchPerformanceWidget = ({ matchData = {} }) => {
  const {
    successRate = null,
    avgScore = null,
    trending = null,
    topSkillGaps = [],
    dataStatus = 'insufficient'
  } = matchData;

  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-violet-600" />
          <span>CV Match Performance</span>
        </h3>
        {trending !== null ? (
          <div className={`flex items-center space-x-1 text-sm ${trending >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <ArrowTrendingUpIcon className={`w-4 h-4 ${trending < 0 ? 'rotate-180' : ''}`} />
            <span>{trending >= 0 ? '+' : ''}{trending}%</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Building insights...</span>
        )}
      </div>
      
      {dataStatus === 'insufficient' ? (
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">No CV match data yet</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">Apply to jobs to start building insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          <MetricItem 
            label="Match Success Rate" 
            value={successRate !== null ? `${successRate}%` : '—'} 
            color="violet"
            icon={CheckCircleIcon}
          />
          <MetricItem 
            label="Avg Match Score" 
            value={avgScore !== null ? `${avgScore}%` : '—'} 
            color="blue"
            icon={ChartBarIcon}
          />
        </div>
      )}
        
      {topSkillGaps.length > 0 && dataStatus !== 'insufficient' && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Top Skills Gaps</span>
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300">
            {topSkillGaps.slice(0, 3).join(', ')}
          </div>
        </div>
      )}
    </WidgetCard>
  );
};

const JobHuntIntelligenceWidget = ({ intelligenceData = {} }) => {
  const {
    activeCompanies = 0,
    avgSalary = null,
    demandScore = null,
    trendingSkills = [],
    dataStatus = 'insufficient'
  } = intelligenceData;

  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center space-x-2">
          <BriefcaseIcon className="w-5 h-5 text-blue-600" />
          <span>Job Hunt Intelligence</span>
        </h3>
        {demandScore !== null ? (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            demandScore >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            demandScore >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {demandScore}% Market Demand
          </div>
        ) : (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Analyzing market...</span>
        )}
      </div>
      
      {dataStatus === 'insufficient' ? (
        <div className="text-center py-8">
          <BriefcaseIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">Building market intelligence</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">Scrape more jobs to unlock insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          <MetricItem 
            label="Active Companies" 
            value={activeCompanies} 
            color="blue"
            icon={UserGroupIcon}
          />
          <MetricItem 
            label="Avg Salary Range" 
            value={avgSalary !== null ? `£${avgSalary}K` : '—'} 
            color="green"
            icon={CurrencyDollarIcon}
          />
        </div>
      )}
        
      {trendingSkills.length > 0 && dataStatus !== 'insufficient' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <FireIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Trending Skills</span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            {trendingSkills.slice(0, 3).join(', ')}
          </div>
        </div>
      )}
    </WidgetCard>
  );
};

const InterviewSuccessWidget = ({ interviewData = {} }) => {
  const {
    conversionRate = 0,
    nextInterview = null,
    successByStage = {},
    upcomingCount = 0
  } = interviewData;

  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-emerald-600" />
          <span>Interview Pipeline</span>
        </h3>
        {upcomingCount > 0 && (
          <div className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full text-xs font-medium">
            {upcomingCount} upcoming
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <MetricItem 
          label="Conversion Rate" 
          value={`${conversionRate}%`} 
          color="emerald"
          icon={ArrowTrendingUpIcon}
        />
        
        {nextInterview && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">Next Interview</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              {nextInterview.company} - {nextInterview.date}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {nextInterview.type} interview
            </div>
          </div>
        )}
        
        {!nextInterview && upcomingCount === 0 && (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-center">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">No upcoming interviews</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              Keep applying to secure more opportunities!
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

const CareerProgressionWidget = ({ progressData = {} }) => {
  const {
    skillsImprovement = null,
    marketFitTrend = null,
    testScoreAvg = null,
    recommendedActions = [],
    dataStatus = 'insufficient'
  } = progressData;

  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center space-x-2">
          <AcademicCapIcon className="w-5 h-5 text-purple-600" />
          <span>Career Progression</span>
        </h3>
        {marketFitTrend !== null ? (
          <div className={`flex items-center space-x-1 text-sm ${marketFitTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <ArrowTrendingUpIcon className={`w-4 h-4 ${marketFitTrend < 0 ? 'rotate-180' : ''}`} />
            <span>{marketFitTrend >= 0 ? '+' : ''}{marketFitTrend}%</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Tracking progress...</span>
        )}
      </div>
      
      {dataStatus === 'insufficient' ? (
        <div className="text-center py-8">
          <AcademicCapIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">No progress data yet</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">Take tests and apply to jobs to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          <MetricItem 
            label="Skills Improvement" 
            value={skillsImprovement !== null ? `${skillsImprovement >= 0 ? '+' : ''}${skillsImprovement}%` : '—'} 
            color="purple"
            icon={ArrowTrendingUpIcon}
          />
          <MetricItem 
            label="Test Score Average" 
            value={testScoreAvg !== null ? `${testScoreAvg}%` : '—'} 
            color="blue"
            icon={CheckCircleIcon}
          />
        </div>
      )}
        
      {recommendedActions.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">Recommended Actions</div>
          <ul className="space-y-1">
            {recommendedActions.slice(0, 2).map((action, index) => (
              <li key={index} className="text-xs text-purple-700 dark:text-purple-300 flex items-start space-x-2">
                <span className="text-purple-500">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetCard>
  );
};

const OpportunityPipelineWidget = ({ pipelineData = {} }) => {
  const {
    responseRate = 0,
    staleOpportunities = 0,
    hotLeads = 0,
    sourcePerformance = {}
  } = pipelineData;

  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center space-x-2">
          <FireIcon className="w-5 h-5 text-orange-600" />
          <span>Opportunity Pipeline</span>
        </h3>
        {hotLeads > 0 && (
          <div className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
            {hotLeads} hot leads
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <MetricItem 
          label="Response Rate" 
          value={`${responseRate}%`} 
          color="orange"
          icon={ArrowTrendingUpIcon}
        />
        
        {staleOpportunities > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Stale Opportunities</span>
              <span className="text-lg font-bold text-amber-900 dark:text-amber-100">{staleOpportunities}</span>
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300">
              Need follow-up action
            </div>
          </div>
        )}
        
        {Object.keys(sourcePerformance).length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Source Performance</div>
            {Object.entries(sourcePerformance).map(([source, rate]) => (
              <div key={source} className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">{source}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export {
  CVMatchPerformanceWidget,
  JobHuntIntelligenceWidget,
  InterviewSuccessWidget,
  CareerProgressionWidget,
  OpportunityPipelineWidget
};