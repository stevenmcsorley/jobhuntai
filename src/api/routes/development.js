const express = require('express');
const router = express.Router();
const developmentPlanGenerator = require('../../services/developmentPlanGenerator');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Create new development program
 */
router.post('/programs', async (req, res) => {
  try {
    const {
      duration = 12,
      focusAreas = [],
      intensity = 'medium',
      targetRole = null
    } = req.body;

    const program = await developmentPlanGenerator.createDevelopmentProgram(req.user.id, {
      duration,
      focusAreas,
      intensity,
      targetRole
    });

    res.json({
      success: true,
      data: program,
      message: `Created ${duration}-week development program`
    });
  } catch (error) {
    console.error('Error creating development program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create development program',
      error: error.message
    });
  }
});

/**
 * Get current active program
 */
router.get('/programs/current', async (req, res) => {
  try {
    const program = await developmentPlanGenerator.getCurrentProgram(req.user.id);
    
    if (!program) {
      return res.json({
        success: true,
        data: null,
        message: 'No active development program found'
      });
    }

    res.json({
      success: true,
      data: program
    });
  } catch (error) {
    console.error('Error getting current program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current program',
      error: error.message
    });
  }
});

/**
 * Get weekly timetable
 */
router.get('/timetable', async (req, res) => {
  try {
    const weekOffset = parseInt(req.query.week || '0');
    const timetable = await developmentPlanGenerator.getWeeklyTimetable(req.user.id, weekOffset);
    
    if (!timetable) {
      return res.json({
        success: true,
        data: null,
        message: 'No active development program found'
      });
    }

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Error getting weekly timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly timetable',
      error: error.message
    });
  }
});

/**
 * Complete a learning task
 */
router.post('/tasks/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { actualMinutes, notes, satisfactionRating } = req.body;

    const result = await developmentPlanGenerator.completeTask(taskId, {
      actualMinutes,
      notes,
      satisfactionRating
    });

    res.json({
      success: true,
      data: result,
      message: 'Task completed successfully'
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
});

/**
 * Update task status
 */
router.patch('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, actualMinutes, notes } = req.body;
    
    const knex = require('knex')(require('../../../knexfile').development);
    
    const updateData = { status };
    if (actualMinutes) updateData.actual_minutes = actualMinutes;
    if (notes) updateData.notes = notes;
    if (status === 'in_progress') updateData.started_at = new Date();
    if (status === 'completed') updateData.completed_at = new Date();

    await knex('learning_tasks')
      .where({ id: taskId })
      .update(updateData);

    res.json({
      success: true,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

/**
 * Generate tasks for a specific week
 */
router.post('/programs/current/weeks/:weekNumber/generate-tasks', async (req, res) => {
  try {
    const { weekNumber } = req.params;
    const result = await developmentPlanGenerator.generateWeeklyTasks(req.user.id, parseInt(weekNumber));
    
    res.json({
      success: true,
      data: result,
      message: `Generated tasks for week ${weekNumber}`
    });
  } catch (error) {
    console.error('Error generating weekly tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly tasks',
      error: error.message
    });
  }
});

/**
 * Get program progress overview
 */
router.get('/programs/current/progress', async (req, res) => {
  try {
    const knex = require('knex')(require('../../../knexfile').development);
    
    const program = await knex('development_programs')
      .where({ user_id: req.user.id, status: 'active' })
      .first();

    if (!program) {
      return res.json({
        success: true,
        data: null,
        message: 'No active program found'
      });
    }

    const progress = await knex('development_progress')
      .where({ program_id: program.id });

    const overallStats = await knex('learning_tasks')
      .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
      .where('weekly_plans.program_id', program.id)
      .select(
        knex.raw('COUNT(*) as total_tasks'),
        knex.raw('SUM(CASE WHEN learning_tasks.status = "completed" THEN 1 ELSE 0 END) as completed_tasks'),
        knex.raw('SUM(CASE WHEN learning_tasks.status = "in_progress" THEN 1 ELSE 0 END) as in_progress_tasks'),
        knex.raw('SUM(estimated_minutes) as total_estimated_minutes'),
        knex.raw('SUM(actual_minutes) as total_actual_minutes')
      )
      .first();

    const weeklyProgress = await knex('weekly_plans')
      .where({ program_id: program.id })
      .select('*')
      .orderBy('week_number');

    res.json({
      success: true,
      data: {
        program,
        skillProgress: progress,
        overallStats,
        weeklyProgress
      }
    });
  } catch (error) {
    console.error('Error getting program progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get program progress',
      error: error.message
    });
  }
});

/**
 * Add skill to current program
 */
router.post('/programs/current/skills', async (req, res) => {
  try {
    const { skillName } = req.body;
    
    if (!skillName || !skillName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    const result = await developmentPlanGenerator.addSkillToProgram(req.user.id, skillName.trim());
    
    res.json({
      success: true,
      data: result,
      message: `Added "${skillName}" to your development program`
    });
  } catch (error) {
    console.error('Error adding skill to program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill to program',
      error: error.message
    });
  }
});

/**
 * Remove skill from current program
 */
router.delete('/programs/current/skills/:skillName', async (req, res) => {
  try {
    const { skillName } = req.params;
    const decodedSkillName = decodeURIComponent(skillName);
    
    const result = await developmentPlanGenerator.removeSkillFromProgram(req.user.id, decodedSkillName);
    
    res.json({
      success: true,
      data: result,
      message: `Removed "${decodedSkillName}" from your development program`
    });
  } catch (error) {
    console.error('Error removing skill from program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove skill from program',
      error: error.message
    });
  }
});

/**
 * Regenerate all tasks with current skills
 */
router.post('/programs/current/regenerate-all-tasks', async (req, res) => {
  try {
    const result = await developmentPlanGenerator.regenerateAllTasks(req.user.id);
    
    res.json({
      success: true,
      data: result,
      message: 'All tasks have been regenerated with current skills'
    });
  } catch (error) {
    console.error('Error regenerating all tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate tasks',
      error: error.message
    });
  }
});

module.exports = router;