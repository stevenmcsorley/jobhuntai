-- Database Schema Backup
-- Generated: 2025-08-21T19:07:23.129Z

-- Table: jobs
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  title varchar(255) NOT NULL,
  company varchar(255) NOT NULL,
  location varchar(255),
  url varchar(255) NOT NULL,
  scraped_at datetime NOT NULL,
  source varchar(255) NOT NULL,
  description TEXT,
  interview_prep TEXT,
  cover_letter TEXT,
  posted varchar(255),
  salary varchar(255),
  company_info TEXT,
  tailored_cv TEXT,
  apply_button_text varchar(255),
  skills json
);

-- Table: matches
CREATE TABLE matches (
  id INTEGER PRIMARY KEY,
  job_id INTEGER NOT NULL,
  match boolean NOT NULL,
  score float,
  reasons TEXT,
  checked_at datetime NOT NULL,
  missing_skills TEXT DEFAULT '[]',
  suggested_tests TEXT DEFAULT '[]',
  completed_tests TEXT DEFAULT '[]',
  key_insights TEXT DEFAULT '[]'
);

-- Table: applications
CREATE TABLE applications (
  id INTEGER PRIMARY KEY,
  job_id INTEGER NOT NULL,
  status varchar(255) NOT NULL,
  applied_at datetime,
  meta TEXT
);

-- Table: interviews
CREATE TABLE interviews (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL,
  interview_date datetime NOT NULL,
  interview_type varchar(255) NOT NULL,
  notes TEXT,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived boolean DEFAULT '0'
);

-- Table: preferences
CREATE TABLE preferences (
  key varchar(255) PRIMARY KEY,
  value TEXT,
  stack_keywords TEXT,
  market_fit_skills TEXT
);

-- Table: test_sessions
CREATE TABLE test_sessions (
  id INTEGER PRIMARY KEY,
  skill varchar(255) NOT NULL,
  difficulty varchar(255) NOT NULL,
  score float,
  completed_at datetime NOT NULL,
  type varchar(255) DEFAULT 'short_answer'
);

-- Table: test_results
CREATE TABLE test_results (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  feedback TEXT,
  is_correct boolean,
  options json
);

-- Table: guidance
CREATE TABLE guidance (
  id INTEGER PRIMARY KEY,
  skill varchar(255) NOT NULL,
  guidance_text TEXT NOT NULL,
  source_result_ids TEXT NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: profiles
CREATE TABLE profiles (
  id INTEGER PRIMARY KEY,
  full_name varchar(255),
  email varchar(255),
  phone varchar(255),
  linkedin_url varchar(255),
  github_url varchar(255),
  summary TEXT,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: skills
CREATE TABLE skills (
  id INTEGER PRIMARY KEY,
  name varchar(255) NOT NULL,
  category varchar(255) NOT NULL
);

-- Table: work_experiences
CREATE TABLE work_experiences (
  id INTEGER PRIMARY KEY,
  company varchar(255) NOT NULL,
  title varchar(255) NOT NULL,
  start_date varchar(255),
  end_date varchar(255),
  location varchar(255),
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: experience_highlights
CREATE TABLE experience_highlights (
  id INTEGER PRIMARY KEY,
  experience_id INTEGER,
  highlight_text TEXT NOT NULL,
  keywords varchar(255)
);

-- Table: projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name varchar(255) NOT NULL,
  description TEXT,
  url varchar(255),
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: project_highlights
CREATE TABLE project_highlights (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  highlight_text TEXT NOT NULL,
  keywords varchar(255)
);

-- Table: education
CREATE TABLE education (
  id INTEGER PRIMARY KEY,
  institution varchar(255) NOT NULL,
  degree varchar(255),
  field_of_study varchar(255),
  graduation_date varchar(255),
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: application_notes
CREATE TABLE application_notes (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: cvs
CREATE TABLE cvs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER DEFAULT '1',
  content TEXT,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

