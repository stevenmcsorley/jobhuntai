const express = require('express');
const router = express.Router();
const knex = require('knex')(require('../../../knexfile').development);
const { authenticateToken } = require('../../middleware/auth');

/**
 * Get enhanced dashboard analytics with actionable insights
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get CV match performance data
    const matchData = await getCVMatchPerformance(userId);
    
    // Get job hunt intelligence
    const intelligenceData = await getJobHuntIntelligence(userId);
    
    // Get interview success data
    const interviewData = await getInterviewSuccessData(userId);
    
    // Get career progression data
    const progressData = await getCareerProgressionData(userId);
    
    // Get opportunity pipeline data
    const pipelineData = await getOpportunityPipelineData(userId);
    
    res.json({
      matchData,
      intelligenceData,
      interviewData,
      progressData,
      pipelineData
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

async function getCVMatchPerformance(userId) {
  try {
    // Get match statistics
    const matches = await knex('matches')
      .where('user_id', userId)
      .select('match', 'score', 'missing_skills', 'checked_at')
      .orderBy('checked_at', 'desc')
      .limit(30);
    
    if (matches.length === 0) {
      return {
        successRate: null,
        avgScore: null,
        trending: null,
        topSkillGaps: [],
        dataStatus: 'insufficient'
      };
    }
    
    // Calculate success rate (matches with score >= 70%)
    const successfulMatches = matches.filter(m => m.match || m.score >= 0.7);
    const successRate = Math.round((successfulMatches.length / matches.length) * 100);
    
    // Calculate average score
    const avgScore = Math.round(matches.reduce((sum, m) => sum + (m.score * 100), 0) / matches.length);
    
    // Calculate trending (requires minimum 10 matches, split evenly)
    let trending = null;
    if (matches.length >= 10) {
      const splitPoint = Math.floor(matches.length / 2);
      const recent = matches.slice(0, splitPoint);
      const previous = matches.slice(splitPoint);
      
      const recentAvg = recent.length > 0 ? recent.reduce((sum, m) => sum + (m.score * 100), 0) / recent.length : 0;
      const previousAvg = previous.length > 0 ? previous.reduce((sum, m) => sum + (m.score * 100), 0) / previous.length : 0;
      
      if (previousAvg > 0) {
        trending = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
        // Cap extreme values for realistic display
        trending = Math.max(-50, Math.min(50, trending));
      }
    }
    
    // Get top skill gaps
    const skillGaps = {};
    matches.forEach(match => {
      if (match.missing_skills) {
        try {
          const skills = JSON.parse(match.missing_skills);
          skills.forEach(skill => {
            skillGaps[skill] = (skillGaps[skill] || 0) + 1;
          });
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    });
    
    const topSkillGaps = Object.entries(skillGaps)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);
    
    return {
      successRate,
      avgScore,
      trending,
      topSkillGaps,
      dataStatus: matches.length >= 10 ? 'sufficient' : 'building'
    };
  } catch (error) {
    console.error('Error getting CV match performance:', error);
    return { successRate: null, avgScore: null, trending: null, topSkillGaps: [], dataStatus: 'error' };
  }
}

async function getJobHuntIntelligence(userId) {
  try {
    // Get active companies from recent jobs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const companies = await knex('jobs')
      .where('user_id', userId)
      .where('scraped_at', '>', thirtyDaysAgoStr) // Compare as ISO string
      .countDistinct('company as count')
      .first();
    
    // Get salary data from job descriptions
    const salaryData = await knex('jobs')
      .where('user_id', userId)
      .whereNotNull('salary')
      .select('salary')
      .limit(50);
    
    // Extract salary numbers (simplified - would need better parsing in production)
    let salarySum = 0;
    let salaryCount = 0;
    salaryData.forEach(job => {
      const match = job.salary.match(/£(\d+,?\d*)/);
      if (match) {
        const salary = parseInt(match[1].replace(',', ''));
        if (salary > 20 && salary < 200) { // Reasonable range for K values
          salarySum += salary;
          salaryCount++;
        }
      }
    });
    
    const avgSalary = salaryCount > 0 ? Math.round(salarySum / salaryCount) : null;
    
    // Get user's skills for demand calculation from the skills table that actually exists
    const userSkills = await knex('skills')
      .where('user_id', userId)
      .select('name');
    
    const skillNames = userSkills.map(s => s.name);
    
    // Calculate demand score with adaptive scaling
    let demandScore = null;
    const totalJobsQuery = await knex('jobs')
      .where('user_id', userId)
      .where('scraped_at', '>', thirtyDaysAgoStr)
      .count('id as total')
      .first();
    const totalJobs = parseInt(totalJobsQuery.total);
    
    if (skillNames.length > 0 && totalJobs >= 10) { // Minimum 10 jobs for reliable demand calculation
      let mentionCount = 0;
      for (const skill of skillNames.slice(0, 5)) { // Check top 5 skills
        const mentions = await knex('jobs')
          .where('user_id', userId)
          .where('scraped_at', '>', thirtyDaysAgoStr)
          .whereRaw('LOWER(description) LIKE ?', [`%${skill.toLowerCase()}%`])
          .count('id as count')
          .first();
        
        mentionCount += parseInt(mentions.count);
      }
      
      if (totalJobs > 0) {
        // Calculate raw demand score
        const rawDemand = Math.round((mentionCount / totalJobs) * 100);
        // Apply adaptive scaling based on dataset size
        const scalingFactor = Math.min(totalJobs / 50, 1); // More conservative for smaller datasets
        demandScore = Math.round(rawDemand * scalingFactor);
        // Cap at realistic maximum (85% for established users, lower for new users)
        const maxDemand = totalJobs >= 30 ? 85 : 70;
        demandScore = Math.min(demandScore, maxDemand);
      }
    }
    
    // Get trending skills from recent job descriptions
    const trendingSkillsQuery = await knex('jobs')
      .where('user_id', userId)
      .where('scraped_at', '>', thirtyDaysAgoStr)
      .select('skills')
      .whereNotNull('skills');
    
    const skillCounts = {};
    trendingSkillsQuery.forEach(job => {
      if (job.skills) {
        try {
          const skills = JSON.parse(job.skills);
          skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    });
    
    const trendingSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);
    
    console.log('🔍 Debug - Final return values:', {
      activeCompanies: parseInt(companies.count),
      rawCount: companies.count,
      avgSalary,
      demandScore,
      trendingSkills
    });
    
    return {
      activeCompanies: parseInt(companies.count) || 0,
      avgSalary,
      demandScore,
      trendingSkills,
      dataStatus: totalJobs >= 10 ? 'sufficient' : (totalJobs > 0 ? 'building' : 'insufficient')
    };
  } catch (error) {
    console.error('🚨 Error getting job hunt intelligence:', error.message);
    console.error('🚨 Full error:', error);
    return { activeCompanies: 0, avgSalary: null, demandScore: null, trendingSkills: [], dataStatus: 'error' };
  }
}

async function getInterviewSuccessData(userId) {
  try {
    const interviews = await knex('interviews')
      .where('user_id', userId)
      .select('*')
      .orderBy('interview_date', 'desc');
    
    if (interviews.length === 0) {
      return {
        conversionRate: 0,
        nextInterview: null,
        successByStage: {},
        upcomingCount: 0
      };
    }
    
    // Calculate conversion rate (interviews that led to job offers or next rounds)
    const successful = interviews.filter(i => 
      i.status === 'completed' && 
      (i.notes?.toLowerCase().includes('offer') || i.notes?.toLowerCase().includes('next round'))
    );
    const conversionRate = Math.round((successful.length / interviews.length) * 100);
    
    // Get next upcoming interview
    const upcomingInterviews = interviews.filter(i => 
      new Date(i.interview_date) > new Date() && i.status === 'scheduled'
    );
    
    const nextInterview = upcomingInterviews.length > 0 ? {
      company: upcomingInterviews[0].company,
      date: upcomingInterviews[0].interview_date.toISOString().slice(0, 10),
      type: upcomingInterviews[0].type || 'Phone'
    } : null;
    
    return {
      conversionRate,
      nextInterview,
      successByStage: {}, // Could be expanded
      upcomingCount: upcomingInterviews.length
    };
  } catch (error) {
    console.error('Error getting interview success data:', error);
    return { conversionRate: 0, nextInterview: null, successByStage: {}, upcomingCount: 0 };
  }
}

async function getCareerProgressionData(userId) {
  try {
    // Get test performance trends
    const testSessions = await knex('test_sessions')
      .where('user_id', userId)
      .whereNotNull('score')
      .select('skill', 'score', 'completed_at')
      .orderBy('completed_at', 'desc')
      .limit(50);
    
    if (testSessions.length === 0) {
      return {
        skillsImprovement: null,
        marketFitTrend: null,
        testScoreAvg: null,
        recommendedActions: ['Take some tests to start tracking your progress!'],
        dataStatus: 'insufficient'
      };
    }
    
    // Calculate average test score
    const testScoreAvg = Math.round(
      testSessions.reduce((sum, session) => sum + session.score, 0) / testSessions.length
    );
    
    // Calculate skills improvement (requires minimum 4 tests for meaningful comparison)
    let skillsImprovement = null;
    if (testSessions.length >= 4) {
      const splitPoint = Math.floor(testSessions.length / 2);
      const recentTests = testSessions.slice(0, splitPoint);
      const olderTests = testSessions.slice(splitPoint);
      
      const recentAvg = recentTests.length > 0 ? 
        recentTests.reduce((sum, t) => sum + t.score, 0) / recentTests.length : 0;
      const olderAvg = olderTests.length > 0 ? 
        olderTests.reduce((sum, t) => sum + t.score, 0) / olderTests.length : 0;
      
      if (olderAvg > 0) {
        skillsImprovement = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        // Cap extreme values
        skillsImprovement = Math.max(-75, Math.min(100, skillsImprovement));
      }
    }
    
    // Get market fit trend from recent matches
    const recentMatches = await knex('matches')
      .where('user_id', userId)
      .select('score', 'checked_at')
      .orderBy('checked_at', 'desc')
      .limit(20);
    
    // Calculate market fit trend (requires minimum 10 matches)
    let marketFitTrend = null;
    if (recentMatches.length >= 10) {
      const splitPoint = Math.floor(recentMatches.length / 2);
      const recent = recentMatches.slice(0, splitPoint);
      const previous = recentMatches.slice(splitPoint);
      const recentFit = recent.reduce((sum, m) => sum + (m.score * 100), 0) / recent.length;
      const previousFit = previous.reduce((sum, m) => sum + (m.score * 100), 0) / previous.length;
      if (previousFit > 0) {
        marketFitTrend = Math.round(((recentFit - previousFit) / previousFit) * 100);
        // Cap extreme values
        marketFitTrend = Math.max(-50, Math.min(50, marketFitTrend));
      }
    }
    
    // Generate adaptive recommended actions based on data availability and performance
    const recommendedActions = [];
    const dataStatus = testSessions.length >= 4 ? 'sufficient' : 'building';
    
    if (testScoreAvg !== null && testScoreAvg < 70) {
      recommendedActions.push('Focus on improving test scores through practice');
    }
    if (skillsImprovement !== null && skillsImprovement < 0) {
      recommendedActions.push('Review and strengthen core technical skills');
    }
    if (marketFitTrend !== null && marketFitTrend < 0) {
      recommendedActions.push('Update CV to better match job requirements');
    }
    
    // Add context-aware recommendations based on data availability
    if (testSessions.length < 4) {
      recommendedActions.push('Take more skills tests to build performance insights');
    }
    if (recentMatches.length < 10) {
      recommendedActions.push('Apply to more jobs to improve market fit analysis');
    }
    
    if (recommendedActions.length === 0) {
      recommendedActions.push('Keep up the great work!');
      recommendedActions.push('Consider exploring new skill areas for growth');
    }
    
    return {
      skillsImprovement,
      marketFitTrend,
      testScoreAvg,
      recommendedActions,
      dataStatus
    };
  } catch (error) {
    console.error('Error getting career progression data:', error);
    return { skillsImprovement: null, marketFitTrend: null, testScoreAvg: null, recommendedActions: ['Unable to load progress data'], dataStatus: 'error' };
  }
}

async function getOpportunityPipelineData(userId) {
  try {
    // Get application response rates
    const applications = await knex('applications')
      .where('user_id', userId)
      .select('status', 'source', 'applied_at', 'updated_at');
    
    if (applications.length === 0) {
      return {
        responseRate: 0,
        staleOpportunities: 0,
        hotLeads: 0,
        sourcePerformance: {}
      };
    }
    
    // Calculate response rate
    const responses = applications.filter(app => 
      app.status !== 'applied' && app.status !== 'opportunity'
    );
    const responseRate = Math.round((responses.length / applications.length) * 100);
    
    // Find stale opportunities (no update in 14+ days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const staleOpportunities = applications.filter(app => 
      (app.status === 'applied' || app.status === 'opportunity') &&
      new Date(app.updated_at) < twoWeeksAgo
    ).length;
    
    // Find hot leads (recent positive responses)
    const hotLeads = applications.filter(app => 
      (app.status === 'interview' || app.status === 'offer') &&
      new Date(app.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    // Calculate source performance
    const sourcePerformance = {};
    const sources = [...new Set(applications.map(app => app.source).filter(Boolean))];
    
    sources.forEach(source => {
      const sourceApps = applications.filter(app => app.source === source);
      const sourceResponses = sourceApps.filter(app => 
        app.status !== 'applied' && app.status !== 'opportunity'
      );
      sourcePerformance[source] = sourceApps.length > 0 ? 
        Math.round((sourceResponses.length / sourceApps.length) * 100) : 0;
    });
    
    return {
      responseRate,
      staleOpportunities,
      hotLeads,
      sourcePerformance
    };
  } catch (error) {
    console.error('Error getting opportunity pipeline data:', error);
    return { responseRate: 0, staleOpportunities: 0, hotLeads: 0, sourcePerformance: {} };
  }
}

module.exports = router;