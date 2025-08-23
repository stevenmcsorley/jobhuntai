const Groq = require('groq-sdk');
const cvVersioning = require('./cvVersioning');
const crypto = require('crypto');
const knex = require('knex')(require('../../knexfile').development);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';
const CACHE_DURATION_HOURS = 24; // Cache analysis for 24 hours
const ANALYSIS_EXPIRY_DAYS = 7; // Consider analysis stale after 7 days

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * CV Analysis Service
 * Analyzes CVs and provides improvement suggestions
 */

class CVAnalyzer {
  /**
   * Generate a content hash for change detection
   * @param {string} content - Content to hash
   * @returns {string} SHA-256 hash
   */
  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate cache key for analysis
   * @param {number} userId - User ID
   * @param {string} type - Analysis type
   * @param {string} contentHash - Content hash
   * @param {Object} params - Additional parameters
   * @returns {string} Cache key
   */
  generateCacheKey(userId, type, contentHash, params = {}) {
    const paramStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return `cv_analysis:${userId}:${type}:${contentHash}:${crypto.createHash('md5').update(paramStr).digest('hex')}`;
  }

  /**
   * Check if analysis exists and is still valid
   * @param {number} userId - User ID
   * @param {string} contentHash - Content hash
   * @param {string} analysisType - Type of analysis
   * @returns {Promise<Object|null>} Existing analysis or null
   */
  async getExistingAnalysis(userId, contentHash, analysisType = 'general') {
    try {
      const analysis = await knex('cv_analysis')
        .where({
          user_id: userId,
          content_hash: contentHash,
          analysis_type: analysisType
        })
        .where('expires_at', '>', knex.fn.now())
        .orderBy('analyzed_at', 'desc')
        .first();

      if (analysis) {
        console.log(`Found existing analysis for user ${userId}, type: ${analysisType}`);
        return {
          ...analysis.analysis_results,
          version: analysis.cv_version,
          analyzed_at: analysis.analyzed_at,
          is_cached: true
        };
      }
      return null;
    } catch (error) {
      console.error('Error checking existing analysis:', error);
      return null;
    }
  }

  /**
   * Save analysis results to database
   * @param {number} userId - User ID
   * @param {number} cvVersion - CV version
   * @param {string} contentHash - Content hash
   * @param {Object} analysisResults - Analysis results
   * @param {string} analysisType - Type of analysis
   * @param {string} contentPreview - Preview of content
   * @param {number} duration - Analysis duration in ms
   * @returns {Promise<number>} Analysis ID
   */
  async saveAnalysis(userId, cvVersion, contentHash, analysisResults, analysisType, contentPreview, duration) {
    try {
      // Mark previous analyses as not latest
      await knex('cv_analysis')
        .where({ user_id: userId, analysis_type: analysisType })
        .update({ is_latest: false });

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ANALYSIS_EXPIRY_DAYS);

      // Insert new analysis
      const [analysisId] = await knex('cv_analysis').insert({
        user_id: userId,
        cv_version: cvVersion,
        content_hash: contentHash,
        analysis_type: analysisType,
        analysis_results: JSON.stringify(analysisResults),
        overall_score: analysisResults.overall_score || 0,
        ats_score: analysisResults.ats_score || 0,
        content_preview: contentPreview,
        ai_model_used: GROQ_MODEL,
        analysis_duration_ms: duration,
        is_latest: true,
        expires_at: expiresAt
      });

      console.log(`Saved new analysis ${analysisId} for user ${userId}, version ${cvVersion}`);
      return analysisId;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze CV content with caching and change detection
   * @param {number} userId - User ID
   * @param {string} cvContent - CV content to analyze (optional, uses current if not provided)
   * @param {boolean} forceAnalysis - Force new analysis even if cached version exists
   * @returns {Promise<Object>} Analysis results with suggestions
   */
  async analyzeCv(userId, cvContent = null, forceAnalysis = false) {
    const startTime = Date.now();
    
    try {
      // Get CV content
      let content = cvContent;
      let version = null;
      
      if (!content) {
        const currentCv = await cvVersioning.getCurrentCv(userId);
        if (!currentCv) {
          throw new Error('No CV found for analysis');
        }
        content = currentCv.content;
        version = currentCv.version;
      }

      const contentHash = this.generateContentHash(content);
      const contentPreview = content.substring(0, 500);
      
      // Check for existing analysis unless forced
      if (!forceAnalysis) {
        const existingAnalysis = await this.getExistingAnalysis(userId, contentHash, 'general');
        if (existingAnalysis) {
          return existingAnalysis;
        }
      }

      console.log(`Performing new CV analysis for user ${userId}, version ${version}`);
      
      // Perform AI analysis
      const analysis = await this.performAiAnalysis(content);
      const duration = Date.now() - startTime;
      
      // Save analysis to database
      await this.saveAnalysis(
        userId, 
        version, 
        contentHash, 
        analysis, 
        'general', 
        contentPreview, 
        duration
      );
      
      return {
        ...analysis,
        version,
        analyzed_at: new Date().toISOString(),
        is_cached: false,
        analysis_duration_ms: duration
      };
    } catch (error) {
      console.error('CV Analysis error:', error);
      throw error;
    }
  }

  /**
   * Perform AI-powered analysis of CV content
   * @param {string} content - CV content
   * @returns {Promise<Object>} AI analysis results
   */
  async performAiAnalysis(content) {
    try {
      // Create a content-based seed for more consistent results
      const contentHash = this.generateContentHash(content);
      const numericSeed = parseInt(contentHash.slice(0, 8), 16) % 1000;
      
      const chat = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert CV/resume analysis agent. Analyze the provided CV and provide comprehensive improvement suggestions.

IMPORTANT: For consistency, base your scoring on these objective criteria:
1. Overall Structure & Formatting (20 points max)
2. Content Quality & Impact (25 points max)
3. Professional Summary/Objective (15 points max)
4. Work Experience Section (20 points max)
5. Skills Section (10 points max)
6. Education Section (5 points max)
7. ATS Optimization (5 points max)

Use the analysis seed: ${numericSeed} to ensure consistent evaluation of similar content.

Provide specific, actionable feedback with examples where possible. Be constructive and professional.`
          },
          {
            role: 'user',
            content: `Please analyze this CV and provide detailed improvement suggestions (Analysis ID: ${contentHash.slice(0, 8)}):

---
${content}
---

Return ONLY valid JSON with these keys:
- overall_score: number 0-100 (sum of objective criteria above)
- strengths: array of strings (what's working well)
- weaknesses: array of strings (areas needing improvement)
- structure_feedback: object with {score: 0-100, suggestions: array of strings}
- content_feedback: object with {score: 0-100, suggestions: array of strings}
- ats_score: number 0-100 (ATS compatibility score)
- missing_sections: array of strings (important sections that are missing)
- improvement_priority: array of objects with {area: string, priority: "high"|"medium"|"low", suggestion: string}
- industry_insights: array of strings (industry-specific recommendations)
- action_items: array of objects with {task: string, priority: "high"|"medium"|"low", estimated_time: string}

Be specific and actionable. Maintain consistent scoring for identical content.`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(chat.choices[0].message.content || '{}');
      
      // Ensure all required fields exist with defaults
      return {
        overall_score: result.overall_score || 0,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        structure_feedback: result.structure_feedback || { score: 0, suggestions: [] },
        content_feedback: result.content_feedback || { score: 0, suggestions: [] },
        ats_score: result.ats_score || 0,
        missing_sections: result.missing_sections || [],
        improvement_priority: result.improvement_priority || [],
        industry_insights: result.industry_insights || [],
        action_items: result.action_items || []
      };
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error('Failed to perform AI analysis of CV');
    }
  }

  /**
   * Compare two CV versions and highlight improvements
   * @param {number} userId - User ID  
   * @param {number} version1 - First version number
   * @param {number} version2 - Second version number
   * @returns {Promise<Object>} Comparison results
   */
  async compareVersions(userId, version1, version2) {
    try {
      const [cv1, cv2] = await Promise.all([
        cvVersioning.getCvVersion(userId, version1),
        cvVersioning.getCvVersion(userId, version2)
      ]);

      if (!cv1 || !cv2) {
        throw new Error('One or both CV versions not found');
      }

      // Analyze both versions
      const [analysis1, analysis2] = await Promise.all([
        this.performAiAnalysis(cv1.content),
        this.performAiAnalysis(cv2.content)
      ]);

      // Calculate improvements
      const scoreImprovement = analysis2.overall_score - analysis1.overall_score;
      const atsImprovement = analysis2.ats_score - analysis1.ats_score;

      return {
        version1: {
          number: version1,
          analysis: analysis1,
          created_at: cv1.created_at
        },
        version2: {
          number: version2,
          analysis: analysis2,
          created_at: cv2.created_at
        },
        improvements: {
          overall_score_change: scoreImprovement,
          ats_score_change: atsImprovement,
          new_strengths: analysis2.strengths.filter(s => !analysis1.strengths.includes(s)),
          resolved_weaknesses: analysis1.weaknesses.filter(w => !analysis2.weaknesses.includes(w)),
          remaining_weaknesses: analysis2.weaknesses.filter(w => analysis1.weaknesses.includes(w))
        },
        compared_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Version comparison error:', error);
      throw error;
    }
  }

  /**
   * Get CV optimization suggestions for a specific job
   * @param {number} userId - User ID
   * @param {Object} jobDescription - Job description object
   * @returns {Promise<Object>} Job-specific optimization suggestions
   */
  async getJobOptimizationSuggestions(userId, jobDescription) {
    try {
      const currentCv = await cvVersioning.getCurrentCv(userId);
      if (!currentCv) {
        throw new Error('No CV found for optimization');
      }

      const chat = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert CV optimization agent. Analyze how the candidate's CV can be specifically optimized for the given job description.

Focus on:
1. Keyword alignment and ATS optimization
2. Relevant experience highlighting
3. Skills gap analysis
4. Content restructuring suggestions
5. Specific phrases and terminology to include
6. Sections to emphasize or de-emphasize
7. Quantifiable achievements to add or improve`
          },
          {
            role: 'user',
            content: `Optimize this CV for the specific job posting:

CURRENT CV:
---
${currentCv.content}
---

JOB DESCRIPTION:
---
${jobDescription.description}
---

JOB TITLE: ${jobDescription.title}
COMPANY: ${jobDescription.company}

Return ONLY valid JSON with:
- optimization_score: number 0-100 (how well CV matches job currently)
- critical_keywords: array of strings (must-have keywords missing from CV)
- recommended_changes: array of objects with {section: string, current: string, suggested: string, reason: string}
- experience_adjustments: array of objects with {experience: string, suggestion: string, priority: "high"|"medium"|"low"}
- skills_to_emphasize: array of strings (skills to highlight more prominently)
- skills_to_add: array of strings (relevant skills to consider adding)
- content_suggestions: array of objects with {area: string, suggestion: string, example: string}
- ats_optimization: array of strings (specific ATS improvements needed)
- estimated_match_improvement: number 0-100 (expected match % after optimizations)`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(chat.choices[0].message.content || '{}');
      
      return {
        job: {
          title: jobDescription.title,
          company: jobDescription.company,
          id: jobDescription.id
        },
        cv_version: currentCv.version,
        optimization: result,
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Job optimization error:', error);
      throw error;
    }
  }

  /**
   * Get latest analysis for user
   * @param {number} userId - User ID
   * @param {string} analysisType - Type of analysis
   * @returns {Promise<Object|null>} Latest analysis or null
   */
  async getLatestAnalysis(userId, analysisType = 'general') {
    try {
      const analysis = await knex('cv_analysis')
        .where({
          user_id: userId,
          analysis_type: analysisType,
          is_latest: true
        })
        .first();

      if (!analysis) return null;

      return {
        ...analysis.analysis_results,
        version: analysis.cv_version,
        analyzed_at: analysis.analyzed_at,
        expires_at: analysis.expires_at,
        content_preview: analysis.content_preview,
        overall_score: analysis.overall_score,
        ats_score: analysis.ats_score,
        is_cached: true
      };
    } catch (error) {
      console.error('Error getting latest analysis:', error);
      return null;
    }
  }

  /**
   * Check if CV has changed since last analysis
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Change detection result
   */
  async detectChanges(userId) {
    try {
      const currentCv = await cvVersioning.getCurrentCv(userId);
      if (!currentCv) {
        return { hasChanges: false, reason: 'No CV found' };
      }

      const currentHash = this.generateContentHash(currentCv.content);
      const latestAnalysis = await knex('cv_analysis')
        .where({
          user_id: userId,
          analysis_type: 'general',
          is_latest: true
        })
        .first();

      if (!latestAnalysis) {
        return {
          hasChanges: true,
          reason: 'No previous analysis found',
          currentVersion: currentCv.version,
          needsAnalysis: true
        };
      }

      const hasChanges = currentHash !== latestAnalysis.content_hash;
      const isExpired = new Date() > new Date(latestAnalysis.expires_at);
      
      return {
        hasChanges: hasChanges || isExpired,
        reason: hasChanges ? 'Content has changed' : isExpired ? 'Analysis expired' : 'No changes detected',
        currentVersion: currentCv.version,
        lastAnalyzedVersion: latestAnalysis.cv_version,
        lastAnalyzedAt: latestAnalysis.analyzed_at,
        isExpired,
        needsAnalysis: hasChanges || isExpired
      };
    } catch (error) {
      console.error('Error detecting changes:', error);
      return { hasChanges: true, reason: 'Error detecting changes', needsAnalysis: true };
    }
  }

  /**
   * Track improvement progress over time with enhanced caching
   * @param {number} userId - User ID
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Object>} Progress tracking data
   */
  async trackProgress(userId, days = 30) {
    try {
      // Check for cached progress data
      const cacheKey = this.generateCacheKey(userId, 'progress', '', { days });
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        return { ...cachedResult, is_cached: true };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get analysis history from database
      const analyses = await knex('cv_analysis')
        .where('user_id', userId)
        .where('analysis_type', 'general')
        .where('analyzed_at', '>=', cutoffDate)
        .orderBy('analyzed_at', 'desc')
        .limit(10);

      if (analyses.length < 2) {
        return {
          message: 'Insufficient analysis history for progress tracking',
          analyses_found: analyses.length,
          last_analyzed: analyses.length > 0 ? analyses[0].analyzed_at : null
        };
      }

      const newestAnalysis = analyses[0];
      const oldestAnalysis = analyses[analyses.length - 1];

      // Calculate improvements
      const scoreImprovement = newestAnalysis.overall_score - oldestAnalysis.overall_score;
      const atsImprovement = newestAnalysis.ats_score - oldestAnalysis.ats_score;

      const progressData = {
        period: `${days} days`,
        analyses_found: analyses.length,
        oldest_analysis: {
          version: oldestAnalysis.cv_version,
          analyzed_at: oldestAnalysis.analyzed_at,
          overall_score: oldestAnalysis.overall_score,
          ats_score: oldestAnalysis.ats_score
        },
        newest_analysis: {
          version: newestAnalysis.cv_version,
          analyzed_at: newestAnalysis.analyzed_at,
          overall_score: newestAnalysis.overall_score,
          ats_score: newestAnalysis.ats_score
        },
        improvements: {
          overall_score_change: scoreImprovement,
          ats_score_change: atsImprovement
        },
        trend_analysis: this.analyzeTrend({ 
          overall_score_change: scoreImprovement, 
          ats_score_change: atsImprovement 
        }),
        recommendations: this.getProgressRecommendations({ 
          overall_score_change: scoreImprovement, 
          ats_score_change: atsImprovement 
        })
      };

      // Cache the result
      await this.saveToCache(cacheKey, progressData, 2); // Cache for 2 hours
      
      return progressData;
    } catch (error) {
      console.error('Progress tracking error:', error);
      throw error;
    }
  }

  /**
   * Save data to cache
   * @param {string} cacheKey - Cache key
   * @param {Object} data - Data to cache
   * @param {number} hours - Hours to cache for
   */
  async saveToCache(cacheKey, data, hours = CACHE_DURATION_HOURS) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
      
      await knex('cv_analysis_cache')
        .insert({
          user_id: data.user_id || 0,
          cache_key: cacheKey,
          analysis_type: 'progress',
          cached_result: JSON.stringify(data),
          expires_at: expiresAt
        })
        .onConflict('cache_key')
        .merge({
          cached_result: JSON.stringify(data),
          expires_at: expiresAt,
          hit_count: knex.raw('hit_count + 1'),
          last_accessed_at: knex.fn.now()
        });
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  /**
   * Get data from cache
   * @param {string} cacheKey - Cache key
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getFromCache(cacheKey) {
    try {
      const cached = await knex('cv_analysis_cache')
        .where('cache_key', cacheKey)
        .where('expires_at', '>', knex.fn.now())
        .first();

      if (cached) {
        // Update hit count and last accessed
        await knex('cv_analysis_cache')
          .where('id', cached.id)
          .update({
            hit_count: cached.hit_count + 1,
            last_accessed_at: knex.fn.now()
          });
        
        return cached.cached_result;
      }
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Analyze improvement trend
   * @param {Object} improvements - Improvement data
   * @returns {Object} Trend analysis
   */
  analyzeTrend(improvements) {
    const overallTrend = improvements.overall_score_change > 0 ? 'improving' : 
                        improvements.overall_score_change < 0 ? 'declining' : 'stable';
    
    const atsTrend = improvements.ats_score_change > 0 ? 'improving' : 
                     improvements.ats_score_change < 0 ? 'declining' : 'stable';

    return {
      overall: overallTrend,
      ats_compatibility: atsTrend,
      strengths_added: improvements.new_strengths?.length || 0,
      weaknesses_resolved: improvements.resolved_weaknesses?.length || 0,
      momentum: improvements.overall_score_change >= 5 ? 'strong' : 
                improvements.overall_score_change >= 2 ? 'moderate' : 'slow'
    };
  }

  /**
   * Generate progress-based recommendations
   * @param {Object} improvements - Improvement data
   * @returns {Array} Progress recommendations
   */
  getProgressRecommendations(improvements) {
    const recommendations = [];

    if (improvements.overall_score_change < 0) {
      recommendations.push({
        priority: 'high',
        suggestion: 'Recent changes may have negatively impacted CV quality. Review latest edits.',
        action: 'Consider reverting to a previous version or seeking professional review'
      });
    }

    if (improvements.overall_score_change === 0) {
      recommendations.push({
        priority: 'medium',
        suggestion: 'No improvement detected in overall CV quality',
        action: 'Consider making more substantial changes or getting professional feedback'
      });
    }

    if (improvements.ats_score_change < -5) {
      recommendations.push({
        priority: 'high',
        suggestion: 'ATS compatibility has decreased significantly',
        action: 'Review keyword usage and formatting for ATS optimization'
      });
    }

    if (improvements.overall_score_change > 5) {
      recommendations.push({
        priority: 'low',
        suggestion: `Great progress! CV quality improved by ${improvements.overall_score_change} points`,
        action: 'Continue building on these improvements'
      });
    }

    if (improvements.ats_score_change > 5) {
      recommendations.push({
        priority: 'low',
        suggestion: `Excellent ATS optimization! Score improved by ${improvements.ats_score_change} points`,
        action: 'Maintain these improvements in future edits'
      });
    }

    return recommendations;
  }

  /**
   * Clean up expired cache entries
   * @returns {Promise<number>} Number of entries cleaned up
   */
  async cleanupExpiredCache() {
    try {
      const deletedCount = await knex('cv_analysis_cache')
        .where('expires_at', '<', knex.fn.now())
        .del();
      
      console.log(`Cleaned up ${deletedCount} expired cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }
  }

  /**
   * Generate intelligent career insights based on CV and test data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Career insights and recommendations
   */
  async generateCareerInsights(userId) {
    try {
      const latestAnalysis = await this.getLatestAnalysis(userId);
      
      if (!latestAnalysis) {
        return {
          message: 'Run a CV analysis first to get career insights',
          insights: []
        };
      }

      // Mock career insights for now (can be enhanced with real AI later)
      const insights = {
        careerLevel: latestAnalysis.overall_score >= 80 ? 'Senior' : latestAnalysis.overall_score >= 60 ? 'Mid-Level' : 'Junior',
        marketReadiness: latestAnalysis.overall_score >= 75 && latestAnalysis.ats_score >= 80 ? 'Ready' : 'Building',
        recommendations: [
          latestAnalysis.overall_score < 80 ? 'Focus on improving CV content quality' : 'Maintain high CV standards',
          latestAnalysis.ats_score < 85 ? 'Optimize for applicant tracking systems' : 'ATS optimization is strong',
          'Continue building verified skills through testing'
        ]
      };

      return insights;
    } catch (error) {
      console.error('Error generating career insights:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new CVAnalyzer();

// Also export the class for testing
module.exports.CVAnalyzer = CVAnalyzer;