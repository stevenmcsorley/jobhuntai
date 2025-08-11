# Project Overview

This project is a comprehensive, automated job hunting tool designed to scrape, filter, analyze, and apply for jobs, with a web-based dashboard for tracking progress.

## Architecture

The application is built with a modern, modular architecture:

*   **Backend**: A Node.js application using **Express.js** to expose a REST API. This backend orchestrates the scraping, analysis, and application processes.
*   **Services**: The core logic is separated into distinct services for scraping, CV matching, applying for jobs, and generating interview prep.
*   **Adapters**: A key feature of the architecture is its use of the **adapter pattern**. This allows for easy extension to new job sources. The application currently includes adapters for **CWJobs**, **LinkedIn**, and **Indeed.com**.
*   **Database**: All data is persisted in a local **SQLite** database (`jobhunt.db`). The schema is managed via migrations using **Knex.js**.
*   **Frontend**: The primary user interface is a **React** application that provides a rich, interactive dashboard for controlling and monitoring the job hunt. A legacy Python **Flask** dashboard is also available.

## Core Components

### 1. Backend Services

*   **Scraper Service (`scraper.js`)**: This service is responsible for orchestrating the job scraping process. It takes an array of adapters, runs them in sequence, filters the results based on keywords, and saves new, relevant jobs to the database.
*   **Analysis Service (`analyzer.js`)**: This service scrapes the full, detailed job description from a job's URL and saves it to the database. This is a prerequisite for the CV matching and interview prep features.
*   **Matcher Service (`matcher.js`)**: This service uses the **Groq AI API** to perform a "CV match". It sends the user's CV (from `cv.txt`) and a job's full description to the AI and stores the resulting match score and key reasons in the database.
*   **Applier Service (`applier.js`)**: This service uses **Puppeteer** to automate the process of applying for jobs on the source website. It handles both "easy apply" and external applications.
*   **Interview Prep Service (`interviewPrep.js`)**: This service also uses the **Groq AI API**. It takes a job's details and generates a comprehensive set of interview preparation notes, including likely technical and behavioral questions, a company overview, and potential talking points.

### 2. React Dashboard

The React dashboard is the main control center for the application. It allows the user to:

*   **Trigger Scrapes**: A dropdown button allows the user to trigger a scrape for all sources at once, or for a single source (CWJobs, LinkedIn, or Indeed).
*   **View Data**: The dashboard displays tables of all applied jobs and jobs that require follow-up. It also shows key statistics and a chart of application activity.
*   **Manage Applications**: The user can update the status of any application (e.g., to "Interviewing", "Rejected", etc.) directly from the UI.
*   **Perform Deep Analysis**: For any job, the user can open a "Deep Analysis" modal. From here, they can:
    *   View the full job description.
    *   Trigger a CV match and see the results.
    *   Generate and view AI-powered interview preparation notes.