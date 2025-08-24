const Groq = require('groq-sdk');
const knex = require('knex')(require('../../knexfile').development);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Skills Development Plan Generator
 * Creates personalized weekly learning programs based on CV skills and market demands
 */
class DevelopmentPlanGenerator {
  
  /**
   * Create a new development program for a user
   * @param {number} userId - User ID
   * @param {Object} options - Program options
   * @returns {Promise<Object>} Created program
   */
  async createDevelopmentProgram(userId, options = {}) {
    const {
      duration = 12, // weeks
      focusAreas = [], // specific skills to focus on
      intensity = 'medium', // low, medium, high (hours per week)
      targetRole = null // specific job role they're targeting
    } = options;

    try {
      // Deactivate any existing active programs
      await knex('development_programs')
        .where({ user_id: userId, status: 'active' })
        .update({ status: 'completed', updated_at: new Date() });

      // Get user's current skills and profile
      const userSkills = await knex('skills').where({ user_id: userId });
      const userProfile = await knex('profiles').where({ user_id: userId }).first();
      
      // Get recommended skills from existing service
      const skillRecommendations = await this.getSkillRecommendations(userId);
      
      // Generate AI-powered learning plan
      const programPlan = await this.generateLearningPlan(
        userSkills, 
        userProfile, 
        skillRecommendations,
        { duration, focusAreas, intensity, targetRole }
      );

      // Create the program
      const [programId] = await knex('development_programs').insert({
        user_id: userId,
        title: programPlan.title,
        description: programPlan.description,
        start_date: new Date(),
        target_end_date: new Date(Date.now() + (duration * 7 * 24 * 60 * 60 * 1000)),
        weeks_duration: duration,
        skills_focus: JSON.stringify(programPlan.skillsFocus),
        status: 'active'
      });

      // Generate weekly plans
      await this.generateWeeklyPlans(programId, programPlan.weeklyPlans);
      
      // Initialize progress tracking using actual user skills from master profile
      const userSkillNames = userSkills.map(s => s.name || s.skill_name);
      console.log('🎯 Initializing progress tracking with CV skills:', userSkillNames);
      await this.initializeProgressTracking(programId, userSkillNames);

      return {
        programId,
        ...programPlan,
        message: `Created ${duration}-week development program: "${programPlan.title}"`
      };
    } catch (error) {
      console.error('Error creating development program:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered learning plan
   */
  async generateLearningPlan(userSkills, userProfile, recommendations, options) {
    const skillNames = userSkills.map(s => s.name).join(', ');
    const recommendedSkills = recommendations.map(r => r.skill).join(', ');
    const profession = this.extractProfession(userProfile, userSkills);

    const prompt = `
Create a personalized ${options.duration}-week skills development program.

LEARNER PROFILE:
- Role: ${profession}
- Current Skills: ${skillNames}
- Recommended Skills: ${recommendedSkills}
- Target Role: ${options.targetRole || 'Career advancement'}
- Intensity: ${options.intensity} (${this.getHoursPerWeek(options.intensity)} hours/week)
- Focus Areas: ${options.focusAreas.join(', ') || 'Market-driven skills'}

PROGRAM REQUIREMENTS:
- ${options.duration} weeks total
- Mix of study, practice, testing, and projects
- Progressive difficulty (beginner → intermediate → advanced)
- Include both current skill enhancement and new skill acquisition
- Focus on market-demanded skills for ${profession}
- Include hands-on projects and testing milestones

Return ONLY valid JSON with this structure:
{
  "title": "Program name",
  "description": "Program overview",
  "skillsFocus": ["skill1", "skill2", "skill3"],
  "weeklyThemes": [
    {
      "week": 1,
      "theme": "Week theme",
      "primarySkill": "main skill focus",
      "objectives": ["objective1", "objective2"],
      "dailyTasks": [
        {
          "day": "Monday",
          "skill": "skill name",
          "type": "study|practice|test|project",
          "title": "task title",
          "description": "what to do",
          "resources": "suggested resources",
          "estimatedMinutes": 90,
          "difficulty": "beginner|intermediate|advanced"
        },
        {
          "day": "Tuesday", 
          "skill": "skill name",
          "type": "practice",
          "title": "task title",
          "description": "what to do",
          "resources": "suggested resources", 
          "estimatedMinutes": 90,
          "difficulty": "intermediate"
        },
        {
          "day": "Wednesday",
          "skill": "skill name", 
          "type": "study",
          "title": "task title",
          "description": "what to do",
          "resources": "suggested resources",
          "estimatedMinutes": 90,
          "difficulty": "intermediate"
        },
        {
          "day": "Thursday",
          "skill": "skill name",
          "type": "practice", 
          "title": "task title",
          "description": "what to do",
          "resources": "suggested resources",
          "estimatedMinutes": 90,
          "difficulty": "intermediate"
        },
        {
          "day": "Friday",
          "skill": "skill name",
          "type": "project",
          "title": "task title", 
          "description": "what to do",
          "resources": "suggested resources",
          "estimatedMinutes": 120,
          "difficulty": "advanced"
        },
        {
          "day": "Saturday",
          "skill": "skill name",
          "type": "test",
          "title": "task title",
          "description": "what to do", 
          "resources": "suggested resources",
          "estimatedMinutes": 60,
          "difficulty": "intermediate"
        },
        {
          "day": "Sunday",
          "skill": "skill name",
          "type": "review",
          "title": "task title",
          "description": "what to do",
          "resources": "suggested resources",
          "estimatedMinutes": 60,
          "difficulty": "beginner"
        }
      ]
    }
  ]
}

CRITICAL: Each week MUST have exactly 7 dailyTasks (Monday through Sunday). This creates a full weekly timetable with different activities each day.

Focus on practical, career-relevant learning that builds toward employability.
`;

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-70b-instant",
      messages: [
        {
          role: "system",
          content: "You are an expert career development coach and technical skills trainer. Create comprehensive, personalized learning programs."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const plan = JSON.parse(completion.choices[0].message.content);
    return {
      title: plan.title,
      description: plan.description,
      skillsFocus: plan.skillsFocus,
      weeklyPlans: plan.weeklyThemes
    };
  }

  /**
   * Generate weekly plans (without tasks initially)
   */
  async generateWeeklyPlans(programId, weeklyThemes) {
    const startDate = new Date();
    
    for (let i = 0; i < weeklyThemes.length; i++) {
      const theme = weeklyThemes[i];
      const weekStartDate = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEndDate = new Date(weekStartDate.getTime() + (6 * 24 * 60 * 60 * 1000));

      // Create weekly plan (without tasks initially)
      await knex('weekly_plans').insert({
        program_id: programId,
        week_number: theme.week,
        theme: theme.theme,
        start_date: weekStartDate,
        end_date: weekEndDate,
        objectives: theme.objectives.join('; '),
        estimated_hours: 10, // Default estimate, will be updated when tasks are generated
        status: i === 0 ? 'current' : 'upcoming'
      });
    }
  }

  /**
   * Generate tasks for a specific week
   */
  async generateWeeklyTasks(userId, weekNumber) {
    try {
      const program = await knex('development_programs')
        .where({ user_id: userId, status: 'active' })
        .first();

      if (!program) {
        throw new Error('No active program found');
      }

      const weekPlan = await knex('weekly_plans')
        .where({ program_id: program.id, week_number: weekNumber })
        .first();

      if (!weekPlan) {
        throw new Error(`Week ${weekNumber} not found in program`);
      }

      // Check if tasks already exist for this week
      const existingTasks = await knex('learning_tasks')
        .where({ weekly_plan_id: weekPlan.id });

      if (existingTasks.length > 0) {
        return {
          message: `Week ${weekNumber} tasks already exist`,
          tasks: existingTasks
        };
      }

      // Get user skills and profile for context
      const userSkills = await knex('skills').where({ user_id: userId });
      const userProfile = await knex('profiles').where({ user_id: userId }).first();
      
      // Get current program skills (from development_progress table)
      const programSkills = await knex('development_progress')
        .where({ program_id: program.id })
        .pluck('skill_name');
      
      // If no program skills exist, fall back to user skills
      let skillsToUse = programSkills;
      if (programSkills.length === 0) {
        console.log('⚠️ No program skills found, falling back to user CV skills');
        skillsToUse = userSkills.map(s => s.name || s.skill_name).slice(0, 10); // Limit to 10 skills
      }
      
      console.log(`🎯 Generating tasks for week ${weekNumber} using skills:`, skillsToUse);
      
      if (skillsToUse.length === 0) {
        throw new Error('No skills available for task generation. Please add skills to your program or update your CV.');
      }
      
      // Generate AI-powered tasks for this specific week using program skills
      const weeklyTasks = await this.generateWeeklyTasksWithAI(
        weekPlan, 
        userSkills, 
        userProfile,
        skillsToUse
      );

      // Create the tasks in database
      const createdTasks = [];
      const startDate = new Date(weekPlan.start_date);

      for (let dayIndex = 0; dayIndex < weeklyTasks.length; dayIndex++) {
        const task = weeklyTasks[dayIndex];
        const taskDate = new Date(startDate.getTime() + (dayIndex * 24 * 60 * 60 * 1000));

        const [taskId] = await knex('learning_tasks').insert({
          weekly_plan_id: weekPlan.id,
          skill_name: task.skill || 'General',
          task_type: task.type,
          title: task.title,
          description: task.description || '',
          resources: task.resources || '',
          estimated_minutes: task.estimatedMinutes || 60,
          difficulty: this.mapDifficulty(task.difficulty),
          scheduled_date: taskDate,
          priority: this.getPriorityFromType(task.type)
        });

        createdTasks.push({ id: taskId, ...task });
      }

      // Update week's estimated hours
      const totalHours = weeklyTasks.reduce((sum, task) => sum + (task.estimatedMinutes / 60), 0);
      await knex('weekly_plans')
        .where({ id: weekPlan.id })
        .update({ estimated_hours: totalHours });

      return {
        message: `Generated ${weeklyTasks.length} tasks for week ${weekNumber}`,
        tasks: createdTasks,
        weekTheme: weekPlan.theme
      };
    } catch (error) {
      console.error('Error generating weekly tasks:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered tasks for a specific week
   */
  async generateWeeklyTasksWithAI(weekPlan, userSkills, userProfile, skillsFocus) {
    const profession = userProfile?.summary?.split('.')[0] || 'Software Developer';

    // Use ONLY the program skills that were passed in
    const programSkillsText = skillsFocus.join(', ');

    // Debug logging
    console.log('🔍 Debug skills for task generation:');
    console.log('- Using Program Skills:', programSkillsText);
    console.log('- Skills Count:', skillsFocus.length);

    const prompt = `
Generate 7 daily learning tasks for this week's theme: "${weekPlan.theme}"

AVAILABLE SKILLS (use ONLY these exact skill names):
${programSkillsText}

REQUIREMENTS:
- Exactly 7 tasks (Monday through Sunday)  
- EVERY SINGLE TASK must be type "test"
- Use ONLY the skills listed above
- Cycle through the available skills for the 7 days
- Use ONLY the exact skill names - NO descriptions or contexts
- Title format: "Test: [skill name]" - NOTHING ELSE
- Do NOT add "for Serverless" or "Fundamentals" or any descriptions
- Example: "Test: React" NOT "Test: React Components for Serverless"
- Simply use the skill names exactly as provided
- 30-60 minutes per test

Return ONLY valid JSON object with tasks array:
{
  "tasks": [
    {
      "day": "Monday",
      "skill": "[use actual skill from available skills]",
      "type": "test",
      "title": "Test: [same skill name]",
      "description": "Knowledge test covering [skill] competency",
      "resources": "",
      "estimatedMinutes": 45,
      "difficulty": "intermediate"
    }
  ]
}

Make tasks specific and actionable for ${weekPlan.theme}.
`;

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-70b-instant",
      messages: [
        {
          role: "system",
          content: "You are a learning plan generator. Create specific, actionable daily tasks."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Handle tasks array response
    if (result.tasks && Array.isArray(result.tasks)) {
      // Force all tasks to be test type (failsafe)
      return result.tasks.map(task => ({
        ...task,
        type: 'test' // Force override in case AI doesn't follow instructions
      }));
    }
    
    // Fallback for legacy array format
    if (Array.isArray(result)) {
      return result.map(task => ({
        ...task,
        type: 'test' // Force override
      }));
    }
    
    // Last resort: create default test tasks
    return this.getDefaultWeeklyTasks(weekPlan.theme, skillsFocus, userSkills);
  }

  /**
   * Fallback default tasks if AI fails
   */
  getDefaultWeeklyTasks(theme, skillsFocus, userSkills = []) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const difficulties = ['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced', 'intermediate', 'beginner'];
    
    // ALWAYS prioritize user's master profile skills
    const userSkillNames = userSkills.map(s => s.name);
    
    console.log('🔍 Fallback task generation:');
    console.log('- User Skills:', userSkillNames);
    console.log('- Focus Skills:', skillsFocus);
    
    // Use master profile skills FIRST, only fall back to focus skills if none
    let availableSkills;
    if (userSkillNames.length > 0) {
      availableSkills = userSkillNames;
      console.log('✅ Using master profile skills');
    } else if (skillsFocus.length > 0) {
      availableSkills = skillsFocus;
      console.log('⚠️ Fallback to focus skills');
    } else {
      availableSkills = ['General Knowledge'];
      console.log('❌ No skills found, using General Knowledge');
    }
    
    return days.map((day, index) => {
      const skill = availableSkills[index % availableSkills.length];
      return {
        day,
        skill,
        type: 'test',
        title: `Test: ${skill}`,
        description: `Knowledge assessment covering ${skill} competency`,
        resources: '',
        estimatedMinutes: 45,
        difficulty: difficulties[index]
      };
    });
  }

  /**
   * Initialize progress tracking for each skill
   */
  async initializeProgressTracking(programId, skillsFocus) {
    for (const skill of skillsFocus) {
      // Check if progress entry already exists
      const existingProgress = await knex('development_progress')
        .where({ program_id: programId, skill_name: skill })
        .first();

      if (!existingProgress) {
        // Count existing tasks for this skill (usually 0 at program creation)
        const totalTasks = await knex('learning_tasks')
          .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
          .where('weekly_plans.program_id', programId)
          .where('learning_tasks.skill_name', skill)
          .count('* as count');

        await knex('development_progress').insert({
          program_id: programId,
          skill_name: skill,
          total_tasks: totalTasks[0].count,
          completed_tasks: 0,
          total_study_minutes: 0,
          actual_study_minutes: 0,
          tests_taken: 0,
          tests_passed: 0,
          average_test_score: 0,
          completion_percentage: 0,
          proficiency_level: 'beginner',
          last_activity_date: new Date(),
          updated_at: new Date()
        });
      }
    }
    console.log(`✅ Initialized progress tracking for ${skillsFocus.length} skills`);
  }

  /**
   * Extract profession from user profile and skills
   */
  extractProfession(userProfile, userSkills) {
    if (!userProfile?.summary) {
      // If no summary, try to infer from skills
      return this.inferProfessionFromSkills(userSkills);
    }

    const summary = userProfile.summary.toLowerCase();
    
    // Check for common profession keywords
    if (summary.includes('marketing') || summary.includes('marketer')) {
      return 'Marketing Professional';
    }
    if (summary.includes('designer') || summary.includes('design')) {
      return 'Designer';
    }
    if (summary.includes('data scientist') || summary.includes('data analyst')) {
      return 'Data Professional';
    }
    if (summary.includes('product manager') || summary.includes('product owner')) {
      return 'Product Manager';
    }
    if (summary.includes('sales') || summary.includes('business development')) {
      return 'Sales Professional';
    }
    if (summary.includes('developer') || summary.includes('engineer') || summary.includes('programmer')) {
      return 'Software Developer';
    }
    if (summary.includes('teacher') || summary.includes('instructor') || summary.includes('educator')) {
      return 'Education Professional';
    }
    if (summary.includes('manager') || summary.includes('leadership')) {
      return 'Management Professional';
    }
    if (summary.includes('consultant') || summary.includes('advisor')) {
      return 'Consultant';
    }
    
    // Try to extract from first sentence
    const firstSentence = userProfile.summary.split('.')[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence.trim();
    }
    
    // Fallback to skills-based inference
    return this.inferProfessionFromSkills(userSkills);
  }

  /**
   * Infer profession from user skills
   */
  inferProfessionFromSkills(userSkills) {
    if (!userSkills?.length) {
      return 'Professional'; // Generic fallback
    }

    const skillNames = userSkills.map(s => s.name.toLowerCase());
    
    // Marketing skills
    const marketingSkills = ['seo', 'sem', 'social media', 'content marketing', 'google ads', 'facebook ads', 'email marketing', 'analytics'];
    if (marketingSkills.some(skill => skillNames.some(userSkill => userSkill.includes(skill)))) {
      return 'Marketing Professional';
    }
    
    // Developer skills
    const devSkills = ['javascript', 'python', 'react', 'node.js', 'java', 'c++', 'html', 'css', 'sql'];
    if (devSkills.some(skill => skillNames.some(userSkill => userSkill.includes(skill)))) {
      return 'Software Developer';
    }
    
    // Design skills
    const designSkills = ['photoshop', 'illustrator', 'figma', 'sketch', 'ui/ux', 'graphic design'];
    if (designSkills.some(skill => skillNames.some(userSkill => userSkill.includes(skill)))) {
      return 'Designer';
    }
    
    // Data skills
    const dataSkills = ['excel', 'tableau', 'power bi', 'python', 'r', 'statistics', 'machine learning'];
    if (dataSkills.some(skill => skillNames.some(userSkill => userSkill.includes(skill)))) {
      return 'Data Professional';
    }
    
    return 'Professional'; // Generic fallback
  }

  /**
   * Get skill recommendations (integrate with existing service)
   */
  async getSkillRecommendations(userId) {
    try {
      // Use the existing skill recommendation service
      const skillRecommendationService = require('./skillRecommendationService');
      const userProfile = await knex('profiles').where({ user_id: userId }).first();
      const recommendations = await skillRecommendationService.generateSkillRecommendations(userProfile, userId);
      
      // Convert to expected format - recommendations are just strings
      return recommendations.map(skill => ({
        skill: skill,
        demand: 'high',
        gap: 'enhancement'
      }));
    } catch (error) {
      console.error('Error getting skill recommendations:', error);
      // Fallback to empty array - the AI will work with user's existing skills
      return [];
    }
  }

  /**
   * Get user's current development program
   */
  async getCurrentProgram(userId) {
    const program = await knex('development_programs')
      .where({ user_id: userId, status: 'active' })
      .first();

    if (!program) return null;

    // Get current week
    const currentWeek = await knex('weekly_plans')
      .where({ program_id: program.id, status: 'current' })
      .first();

    // Get today's tasks
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = await knex('learning_tasks')
      .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
      .where('weekly_plans.program_id', program.id)
      .where('learning_tasks.scheduled_date', today)
      .select('learning_tasks.*');

    // Get progress summary
    const progress = await knex('development_progress')
      .where({ program_id: program.id });

    return {
      program,
      currentWeek,
      todaysTasks,
      progress
    };
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId, completionData = {}) {
    const { actualMinutes, notes, satisfactionRating } = completionData;
    
    await knex('learning_tasks')
      .where({ id: taskId })
      .update({
        status: 'completed',
        actual_minutes: actualMinutes,
        notes: notes,
        satisfaction_rating: satisfactionRating,
        completed_at: new Date()
      });

    // Update progress tracking
    await this.updateProgress(taskId);
    
    return { success: true, message: 'Task completed successfully' };
  }

  /**
   * Update progress tracking
   */
  async updateProgress(taskId) {
    const task = await knex('learning_tasks')
      .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
      .where('learning_tasks.id', taskId)
      .select('learning_tasks.skill_name', 'learning_tasks.actual_minutes', 'weekly_plans.program_id')
      .first();

    if (!task) return;

    // Update development_progress
    const completedTasks = await knex('learning_tasks')
      .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
      .where('weekly_plans.program_id', task.program_id)
      .where('learning_tasks.skill_name', task.skill_name)
      .where('learning_tasks.status', 'completed')
      .count('* as count');

    const totalMinutes = await knex('learning_tasks')
      .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
      .where('weekly_plans.program_id', task.program_id)
      .where('learning_tasks.skill_name', task.skill_name)
      .where('learning_tasks.status', 'completed')
      .sum('actual_minutes as total');

    const progress = await knex('development_progress')
      .where({
        program_id: task.program_id,
        skill_name: task.skill_name
      })
      .first();

    const completionPercentage = (completedTasks[0].count / progress.total_tasks) * 100;

    await knex('development_progress')
      .where({
        program_id: task.program_id,
        skill_name: task.skill_name
      })
      .update({
        completed_tasks: completedTasks[0].count,
        actual_study_minutes: totalMinutes[0].total || 0,
        completion_percentage: completionPercentage,
        last_activity_date: new Date(),
        updated_at: new Date()
      });
  }

  /**
   * Get weekly timetable view
   */
  async getWeeklyTimetable(userId, weekOffset = 0) {
    const program = await knex('development_programs')
      .where({ user_id: userId, status: 'active' })
      .first();

    if (!program) return null;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (weekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const tasks = await knex('learning_tasks')
      .join('weekly_plans', 'learning_tasks.weekly_plan_id', 'weekly_plans.id')
      .leftJoin('test_sessions', 'learning_tasks.test_session_id', 'test_sessions.id')
      .where('weekly_plans.program_id', program.id)
      .whereBetween('learning_tasks.scheduled_date', [startOfWeek, endOfWeek])
      .select(
        'learning_tasks.*', 
        'weekly_plans.theme as week_theme',
        'test_sessions.score as test_score',
        'test_sessions.completed_at as test_completed_at'
      )
      .orderBy('learning_tasks.scheduled_date');

    // Group tasks by day
    const timetable = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach(day => {
      timetable[day] = [];
    });

    tasks.forEach(task => {
      const dayOfWeek = days[new Date(task.scheduled_date).getDay()];
      timetable[dayOfWeek].push(task);
    });

    // Calculate week number based on program start date and current week
    const programStartDate = new Date(program.start_date);
    const programStartWeek = new Date(programStartDate);
    programStartWeek.setDate(programStartDate.getDate() - programStartDate.getDay());
    
    const weeksDiff = Math.floor((startOfWeek - programStartWeek) / (7 * 24 * 60 * 60 * 1000));
    const weekNumber = weeksDiff + 1; // 1-indexed

    return {
      program,
      weekOf: startOfWeek,
      weekNumber,
      timetable,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length
    };
  }

  // Utility methods
  getHoursPerWeek(intensity) {
    const hours = { low: 5, medium: 10, high: 15 };
    return hours[intensity] || 10;
  }

  getPriorityFromType(type) {
    const priorities = {
      test: 'high',
      project: 'high',
      practice: 'medium',
      study: 'medium',
      review: 'low'
    };
    return priorities[type] || 'medium';
  }

  mapDifficulty(difficulty) {
    // Map AI-generated difficulty levels to allowed values
    const difficultyMap = {
      'beginner': 'beginner',
      'intermediate': 'intermediate', 
      'advanced': 'advanced',
      'expert': 'advanced',
      'easy': 'beginner',
      'medium': 'intermediate',
      'hard': 'advanced',
      'basic': 'beginner'
    };
    return difficultyMap[difficulty?.toLowerCase()] || 'intermediate';
  }

  /**
   * Add a skill to the current program
   */
  async addSkillToProgram(userId, skillName) {
    const program = await knex('development_programs')
      .where({ user_id: userId, status: 'active' })
      .first();

    if (!program) {
      throw new Error('No active development program found');
    }

    // Check if skill already exists in progress tracking
    const existingProgress = await knex('development_progress')
      .where({ program_id: program.id, skill_name: skillName })
      .first();

    if (existingProgress) {
      throw new Error(`"${skillName}" is already in your program`);
    }

    // Add skill to progress tracking
    await knex('development_progress').insert({
      program_id: program.id,
      skill_name: skillName,
      total_tasks: 0,
      completed_tasks: 0,
      total_study_minutes: 0,
      actual_study_minutes: 0,
      tests_taken: 0,
      tests_passed: 0,
      average_test_score: 0,
      completion_percentage: 0,
      proficiency_level: 'beginner',
      updated_at: new Date()
    });

    console.log(`✅ Added "${skillName}" to development program ${program.id}`);
    return { skillName, programId: program.id };
  }

  /**
   * Remove a skill from the current program
   */
  async removeSkillFromProgram(userId, skillName) {
    const program = await knex('development_programs')
      .where({ user_id: userId, status: 'active' })
      .first();

    if (!program) {
      throw new Error('No active development program found');
    }

    // Remove from progress tracking
    const deletedRows = await knex('development_progress')
      .where({ program_id: program.id, skill_name: skillName })
      .del();

    if (deletedRows === 0) {
      throw new Error(`"${skillName}" is not in your program`);
    }

    // Remove related learning tasks that haven't been completed yet
    // First get the weekly plan IDs for this program
    const weeklyPlanIds = await knex('weekly_plans')
      .where({ program_id: program.id })
      .pluck('id');

    // Then delete tasks that match the skill and aren't completed
    const deletedTasks = await knex('learning_tasks')
      .whereIn('weekly_plan_id', weeklyPlanIds)
      .where('skill_name', skillName)
      .where('status', '!=', 'completed')
      .del();

    console.log(`🗑️ Removed "${skillName}" from development program ${program.id} (${deletedTasks} pending tasks deleted)`);
    return { skillName, programId: program.id, deletedTasks };
  }

  /**
   * Regenerate all tasks for the current program with updated skills
   */
  async regenerateAllTasks(userId) {
    const program = await knex('development_programs')
      .where({ user_id: userId, status: 'active' })
      .first();

    if (!program) {
      throw new Error('No active development program found');
    }

    // Get current skills from progress tracking
    const currentSkills = await knex('development_progress')
      .where({ program_id: program.id })
      .select('skill_name');

    if (currentSkills.length === 0) {
      throw new Error('No skills found in program. Add some skills first.');
    }

    console.log('🔄 Regenerating all tasks for skills:', currentSkills.map(s => s.skill_name));

    // Delete all non-completed tasks and their weekly plans
    // First get the weekly plan IDs for this program
    const weeklyPlanIds = await knex('weekly_plans')
      .where({ program_id: program.id })
      .pluck('id');

    // Then delete non-completed tasks
    const deletedTasks = await knex('learning_tasks')
      .whereIn('weekly_plan_id', weeklyPlanIds)
      .where('status', '!=', 'completed')
      .del();

    // Delete ALL weekly plans (we'll recreate them)
    await knex('weekly_plans')
      .where({ program_id: program.id })
      .del();

    // Reset progress tracking totals (but keep completed stats)
    await knex('development_progress')
      .where({ program_id: program.id })
      .update({
        total_tasks: 0,
        total_study_minutes: 0,
        updated_at: new Date()
      });

    // Recreate weekly plans first
    const programStartDate = new Date(program.start_date);
    for (let weekNum = 1; weekNum <= program.weeks_duration; weekNum++) {
      const weekStartDate = new Date(programStartDate);
      weekStartDate.setDate(programStartDate.getDate() + ((weekNum - 1) * 7));
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      await knex('weekly_plans').insert({
        program_id: program.id,
        week_number: weekNum,
        theme: `Skills Practice Week ${weekNum}`,
        start_date: weekStartDate,
        end_date: weekEndDate,
        status: weekNum === 1 ? 'current' : 'upcoming',
        objectives: `Focus on skill development and testing`,
        estimated_hours: 10
      });
    }

    // Generate new tasks for all weeks
    const totalWeeks = program.weeks_duration;
    let generatedWeeks = 0;
    
    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      try {
        await this.generateWeeklyTasks(userId, weekNum);
        generatedWeeks++;
      } catch (error) {
        console.warn(`⚠️ Failed to generate week ${weekNum}:`, error.message);
      }
    }

    console.log(`✅ Regenerated tasks for ${generatedWeeks}/${totalWeeks} weeks`);
    return { 
      programId: program.id, 
      deletedTasks, 
      generatedWeeks, 
      totalWeeks,
      skills: currentSkills.map(s => s.skill_name)
    };
  }
}

module.exports = new DevelopmentPlanGenerator();