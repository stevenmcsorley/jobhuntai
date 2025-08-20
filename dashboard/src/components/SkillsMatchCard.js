import React, { useState } from 'react';
import RadarChart from './RadarChart';
import { ChartBarIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const SkillsMatchCard = ({ job, skillsAnalysis }) => {
  const [showChart, setShowChart] = useState(false);

  // Extract skills data from job analysis
  const extractSkillsData = () => {
    if (!skillsAnalysis || !skillsAnalysis.skills_breakdown) {
      return [];
    }

    return skillsAnalysis.skills_breakdown.map(skill => ({
      name: skill.skill,
      userLevel: skill.user_proficiency || 0,
      jobRequirement: skill.job_requirement || 0,
      match: skill.match_score || 0
    }));
  };

  const skillsData = extractSkillsData();
  const overallMatch = job?.score ? Math.round(job.score * 100) : 0;

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 70) return 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const getMatchLabel = (score) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    if (score >= 50) return 'Weak Match';
    return 'Poor Match';
  };

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Skills Match Analysis</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {job?.title} at {job?.company}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-2 rounded-full text-sm font-medium ${getMatchColor(overallMatch)}`}>
            {overallMatch}% • {getMatchLabel(overallMatch)}
          </div>
          
          <button
            onClick={() => setShowChart(!showChart)}
            className="btn-icon text-neutral-600 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400"
            title={showChart ? "Hide Chart" : "Show Chart"}
          >
            {showChart ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {showChart && (
        <div className="animate-fade-in">
          <div className="h-80 mb-4">
            <RadarChart skillsData={skillsData} />
          </div>
          
          {skillsData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {skillsData.slice(0, 6).map((skill, index) => {
                const gap = Math.abs(skill.jobRequirement - skill.userLevel);
                const gapColor = gap <= 1 ? 'text-emerald-600' : gap <= 2 ? 'text-amber-600' : 'text-red-600';
                
                return (
                  <div key={index} className="surface-card-soft p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {skill.name}
                      </span>
                      <span className={`text-xs font-medium ${gapColor}`}>
                        {gap <= 1 ? '✓' : `Gap: ${gap}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">Your Level</span>
                          <span className="font-medium">{skill.userLevel}/10</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(skill.userLevel / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs mt-2">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">Required</span>
                          <span className="font-medium">{skill.jobRequirement}/10</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(skill.jobRequirement / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!showChart && skillsData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {skillsData.slice(0, 4).map((skill, index) => {
            const matchPercentage = Math.min(100, (skill.userLevel / Math.max(skill.jobRequirement, 1)) * 100);
            return (
              <div key={index} className="text-center surface-card-soft p-3">
                <div className="text-sm font-medium text-neutral-900 dark:text-white mb-2 truncate">
                  {skill.name}
                </div>
                <div className={`text-lg font-bold ${getMatchColor(matchPercentage).split(' ')[0]}`}>
                  {Math.round(matchPercentage)}%
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  {skill.userLevel}/{skill.jobRequirement}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SkillsMatchCard;