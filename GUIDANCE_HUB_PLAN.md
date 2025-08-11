# AI-Powered Guidance Hub: A Feature Blueprint

This document outlines the plan for a new AI-Powered Guidance Hub. This feature will extend the Test Hub, transforming it from a testing tool into a personalized learning and development platform.

## 1. Core Vision

The Guidance Hub will act as a personal AI tutor. It will automatically analyze a user's entire test history to identify their weakest subjects and specific conceptual misunderstandings. It will then provide a concrete, actionable learning plan to help the user improve.

## 2. Key Features

*   **Automatic Weakness Identification**: The hub will analyze all past test results to identify and rank the topics where the user has the lowest average scores.
*   **In-Depth Topic Analysis**: For any given topic, the user can trigger a deeper analysis. The AI will review all incorrect answers for that topic and generate:
    *   A **Summary of Weaknesses**: A high-level overview of the core concepts the user is struggling with (e.g., "Difficulty with asynchronous operations in JavaScript").
    *   A **Personalized Learning Plan**: A list of concrete, actionable steps the user can take to improve, such as specific concepts to review, small projects to build, or tutorials to watch.
*   **Detailed Question Review**: The analysis will include a list of the specific questions the user answered incorrectly, allowing them to see the exact problems that are causing issues.

## 3. Technical Implementation Plan

### Phase 1: Backend - The Analysis Engine

1.  **AI Service (`guidanceGenerator.js`):**
    *   This new service will contain the core logic for the feature.
    *   It will accept a list of incorrectly answered questions on a specific topic.
    *   It will use a carefully crafted prompt to instruct the AI to analyze these mistakes and generate the "Summary of Weaknesses" and "Recommended Learning Plan".

2.  **API Endpoints (`server.js`):**
    *   `GET /api/guidance/summary`: This endpoint will query the `test_sessions` table, calculate the average score for each unique skill, and return a ranked list of the user's weakest topics.
    *   `GET /api/guidance/:topic`: This endpoint will:
        1.  Find all test sessions for the given `:topic`.
        2.  Retrieve all `test_results` for those sessions where `is_correct` is `false`.
        3.  Pass the list of incorrect questions to the `guidanceGenerator.js` service.
        4.  Return the AI-generated learning plan and the list of incorrect questions.

### Phase 2: Frontend - The User Experience

1.  **New Page (`GuidancePage.js`):**
    *   A new page will be created and linked in the main sidebar.

2.  **Guidance Hub Dashboard:**
    *   The initial view will display a series of cards, each representing one of the user's weakest topics, showing the topic name and their average score. This provides an immediate, at-a-glance overview of where to focus.

3.  **Personalized Plan View:**
    *   Clicking on a topic card will trigger a call to the `/api/guidance/:topic` endpoint.
    *   The view will then display the detailed, AI-generated learning plan, including the summary of weaknesses, the actionable steps, and the list of incorrect questions for review.

## 4. User Workflow

1.  The user navigates to the "Guidance Hub" page.
2.  They are presented with a summary of their weakest subjects (e.g., "React: 45% Avg. Score").
3.  They click on "React" to get a detailed improvement plan.
4.  The hub displays the AI-generated plan, showing them what they're struggling with, how to fix it, and the exact questions they got wrong.
5.  Armed with this knowledge, the user can study and then go back to the **Test Hub** to practice and improve their score.
