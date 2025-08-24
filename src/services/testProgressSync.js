const knex = require('knex')(require('../../knexfile').development);

/**
 * Service to sync test results with learning task progress
 */
class TestProgressSync {

  /**
   * Update learning task progress based on completed test
   * @param {number} testSessionId - ID of the completed test session
   * @param {number} userId - User ID who took the test
   */
  async updateProgressFromTest(testSessionId, userId) {
    try {
      // Get the test session details
      const testSession = await knex('test_sessions')
        .where({ id: testSessionId })
        .first();

      if (!testSession) {
        console.log(`⚠️ Test session ${testSessionId} not found`);
        return;
      }

      console.log(`🔄 Syncing test results for skill: ${testSession.skill}, score: ${testSession.score}%`);

      // Find learning tasks for this skill that are not yet completed
      const learningTasks = await knex('learning_tasks')
        .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
        .join('development_programs', 'weekly_plans.program_id', 'development_programs.id')
        .where('development_programs.user_id', userId)
        .where('development_programs.status', 'active')
        .where('learning_tasks.skill_name', testSession.skill)
        .where('learning_tasks.task_type', 'test')
        .where('learning_tasks.test_completed', false)
        .select('learning_tasks.*', 'weekly_plans.program_id')
        .orderBy('learning_tasks.scheduled_date');

      if (learningTasks.length === 0) {
        console.log(`📝 No pending learning tasks found for skill: ${testSession.skill}`);
        return;
      }

      // Update the first matching learning task
      const taskToUpdate = learningTasks[0];
      const testDuration = this.calculateTestDuration(testSession);

      await knex('learning_tasks')
        .where({ id: taskToUpdate.id })
        .update({
          test_session_id: testSessionId,
          test_completed: true,
          test_score: testSession.score,
          test_duration_minutes: testDuration,
          test_taken_at: testSession.completed_at,
          status: testSession.score >= 70 ? 'completed' : 'completed', // Mark as completed regardless of pass/fail
          actual_minutes: testDuration,
          completed_at: testSession.completed_at
        });

      console.log(`✅ Updated learning task ${taskToUpdate.id} with test results`);

      // Update development progress
      await this.updateDevelopmentProgress(taskToUpdate.program_id, testSession.skill, testSession.score >= 70);

      return {
        taskId: taskToUpdate.id,
        skill: testSession.skill,
        score: testSession.score,
        passed: testSession.score >= 70
      };

    } catch (error) {
      console.error('Error updating progress from test:', error);
      throw error;
    }
  }

  /**
   * Calculate test duration from session data
   * @param {Object} testSession - Test session object
   * @returns {number} Duration in minutes
   */
  calculateTestDuration(testSession) {
    // For now, return a default duration
    // Later we can add actual timing to test sessions
    return 45; // Default test duration
  }

  /**
   * Update development progress statistics
   * @param {number} programId - Program ID
   * @param {string} skillName - Skill name
   * @param {boolean} testPassed - Whether the test was passed
   */
  async updateDevelopmentProgress(programId, skillName, testPassed) {
    try {
      const progress = await knex('development_progress')
        .where({ program_id: programId, skill_name: skillName })
        .first();

      if (!progress) {
        console.log(`⚠️ No progress tracking found for ${skillName} in program ${programId}`);
        return;
      }

      // Count completed tasks
      const taskStats = await knex('learning_tasks')
        .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
        .where('weekly_plans.program_id', programId)
        .where('learning_tasks.skill_name', skillName)
        .select(
          knex.raw('COUNT(*) as total_tasks'),
          knex.raw('SUM(CASE WHEN learning_tasks.status = "completed" THEN 1 ELSE 0 END) as completed_tasks'),
          knex.raw('SUM(CASE WHEN learning_tasks.test_completed = 1 THEN 1 ELSE 0 END) as tests_taken'),
          knex.raw('SUM(CASE WHEN learning_tasks.test_score >= 70 THEN 1 ELSE 0 END) as tests_passed'),
          knex.raw('AVG(learning_tasks.test_score) as avg_test_score'),
          knex.raw('SUM(learning_tasks.actual_minutes) as total_minutes')
        )
        .first();

      const completionPercentage = taskStats.total_tasks > 0 
        ? (taskStats.completed_tasks / taskStats.total_tasks) * 100 
        : 0;

      await knex('development_progress')
        .where({ program_id: programId, skill_name: skillName })
        .update({
          total_tasks: taskStats.total_tasks,
          completed_tasks: taskStats.completed_tasks,
          tests_taken: taskStats.tests_taken || 0,
          tests_passed: taskStats.tests_passed || 0,
          average_test_score: Math.round(taskStats.avg_test_score || 0),
          actual_study_minutes: taskStats.total_minutes || 0,
          completion_percentage: completionPercentage,
          last_activity_date: new Date(),
          updated_at: new Date()
        });

      console.log(`📊 Updated progress for ${skillName}: ${completionPercentage.toFixed(1)}% complete`);

    } catch (error) {
      console.error('Error updating development progress:', error);
    }
  }

  /**
   * Get recent test results for a user's current program
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Recent test results
   */
  async getRecentTestResults(userId) {
    try {
      const results = await knex('learning_tasks')
        .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
        .join('development_programs', 'weekly_plans.program_id', 'development_programs.id')
        .leftJoin('test_sessions', 'learning_tasks.test_session_id', 'test_sessions.id')
        .where('development_programs.user_id', userId)
        .where('development_programs.status', 'active')
        .where('learning_tasks.task_type', 'test')
        .where('learning_tasks.test_completed', true)
        .select(
          'learning_tasks.*',
          'test_sessions.score',
          'test_sessions.completed_at as test_completed_at'
        )
        .orderBy('test_sessions.completed_at', 'desc')
        .limit(10);

      return results;
    } catch (error) {
      console.error('Error getting recent test results:', error);
      return [];
    }
  }
}

module.exports = new TestProgressSync();