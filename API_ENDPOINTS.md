# JobHunt AI - Complete API Reference

## Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user (client-side token management)
- `PUT /api/auth/change-password` - Change user password

## Job Management
- `GET /api/jobs` - Retrieves all jobs for authenticated user
- `POST /api/jobs` - Manually adds a single job
- `PATCH /api/jobs/:id` - Updates a job's details (e.g., description)
- `POST /api/jobs/bulk` - Bulk imports jobs from a JSON array
- `POST /api/jobs/scrape?source=<source>` - Triggers a scrape for a single source

## Job Analysis & AI Features
- `POST /api/jobs/:id/analyze` - Scrapes and stores the full description for a job
- `POST /api/jobs/:id/match` - Runs a CV match for a job (includes test history analysis)
- `POST /api/jobs/:id/interview-prep` - Generates interview prep notes
- `POST /api/jobs/:id/generate-cover-letter` - Generates a cover letter
- `POST /api/jobs/:id/generate-company-info` - Generates a company summary
- `POST /api/jobs/:id/extract-skills` - Extracts skills from a job description
- `POST /api/jobs/:id/tailor-cv` - Generates a tailored CV for the job
- `POST /api/jobs/:id/auto-apply` - Auto-applies to a job (if configured)

## Application Management
- `GET /api/applications` - Retrieves all applications for authenticated user
- `POST /api/applications/:id/apply` - Triggers an application for an opportunity
- `PATCH /api/applications/:id` - Updates the status of an application
- `DELETE /api/applications/:id` - Deletes an application and its associated job

## Application Notes
- `GET /api/applications/:id/notes` - Get notes for an application
- `POST /api/applications/:id/notes` - Add a note to an application

## Interview Management
- `GET /api/interviews` - Retrieves all interviews for authenticated user
- `POST /api/applications/:id/interviews` - Adds an interview for an application
- `PATCH /api/interviews/:id` - Updates an interview (schedule, notes, status)
- `DELETE /api/interviews/:id` - Deletes an interview

## Test Hub (AI-Powered Skills Testing)
- `POST /api/tests/start` - Starts a new test session (universal skill testing)
- `POST /api/tests/submit-answer` - Submits an answer for evaluation
- `GET /api/tests/history` - Retrieves all past test sessions for authenticated user
- `GET /api/tests/sessions/:id` - Retrieves the full results for a single test session
- `POST /api/tests/sessions/:id/reset-incorrect` - Resets incorrect answers for retake
- `GET /api/tests/sessions/:id/continue` - Resumes an in-progress test session
- `DELETE /api/tests/sessions/:id` - Deletes a test session and all its results
- `GET /api/tests/prompts` - Retrieves the AI prompt matrix (admin/debug)

## Guidance Hub (AI Learning Plans)
- `GET /api/guidance/summary` - Gets a summary of the user's weakest topics
- `GET /api/guidance/:topic` - Gets a personalized learning plan for a topic

## CV Management
- `GET /api/cv` - Retrieves the user's CV content
- `POST /api/cv` - Updates the user's CV content
- `POST /api/cv/upload` - Upload CV file (supports multiple formats)

## Master Profile System
- `GET /api/profile` - Fetch all master profile data for authenticated user
- `POST /api/profile/seed` - Parse CV and populate profile tables
- `POST /api/profile` - Create or update the main profile
- `GET /api/profile/download` - Download the master profile as a text file

### Profile Skills
- `POST /api/profile/skills` - Add a skill
- `DELETE /api/profile/skills/:id` - Delete a skill

### Profile Work Experience
- `POST /api/profile/work-experiences` - Add work experience
- `PUT /api/profile/work-experiences/:id` - Update work experience
- `DELETE /api/profile/work-experiences/:id` - Delete work experience

### Profile Projects
- `POST /api/profile/projects` - Add a project
- `PUT /api/profile/projects/:id` - Update a project
- `DELETE /api/profile/projects/:id` - Delete a project

### Profile Education
- `POST /api/profile/education` - Add education entry
- `PUT /api/profile/education/:id` - Update education entry
- `DELETE /api/profile/education/:id` - Delete education entry

## Analytics & Insights
- `GET /api/matches` - Retrieves all CV match results for authenticated user
- `GET /api/stats` - Retrieves dashboard and stats page data
- `GET /api/dashboard-stats` - Get dashboard-specific statistics
- `GET /api/market-fit` - Analyzes skill frequency across all jobs

## User Preferences
- `GET /api/preferences` - Retrieves user preferences
- `POST /api/preferences` - Updates user preferences

## Automation & Background Jobs
- `POST /api/hunt` - Triggers the proactive job hunter
- `POST /api/run` - Triggers a full scrape, match, and apply cycle

## Multi-User Support
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

All data is automatically filtered by `user_id` to ensure data isolation between users.

## Demo Account
For testing and development:
- **Email**: jobhunter@localhost  
- **Password**: password123

## Universal AI Testing System
The Test Hub supports any skill domain "from goat herding to CTO" with intelligent domain detection and appropriate question generation for:
- Technical skills (programming, frameworks, tools)
- Leadership and management
- Practical trades and crafts
- Creative and artistic skills
- Academic subjects
- Professional domains

## Enhanced CV Matching
CV matching now includes:
- Test history analysis (passed and failed tests)
- Intelligent test suggestions based on skill gaps
- Flexible skill matching between test names and job requirements
- Complete test attempt tracking regardless of score