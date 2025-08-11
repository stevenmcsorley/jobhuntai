# Behavioral Interview Simulator: A Feature Blueprint (Multi-Framework)

This document outlines the plan to build a flexible, multi-framework Behavioral Interview Simulator. This feature will be integrated into the existing Test Hub, allowing for practice with various industry-standard techniques like STAR and SOAR.

## 1. Core Vision

The goal is to create a powerful, AI-powered practice room where users can hone their skills for behavioral interviews using multiple frameworks. The simulator will actively coach the user on their chosen method (e.g., STAR, SOAR), providing detailed, actionable feedback and tracking their progress over time.

## 2. Key Features

*   **Multi-Framework Support**: Users can select their desired behavioral framework (e.g., "Behavioral (STAR)", "Behavioral (SOAR)") from the Test Type dropdown.
*   **AI-Powered Framework Analysis**: The AI coach will be dynamically instructed to analyze the user's answer against the specific components of the chosen framework (e.g., Situation, Task, Action, Result for STAR; Situation, Obstacle, Action, Result for SOAR).
*   **Structured, Actionable Feedback**: The results view will display a dedicated breakdown for each component of the chosen framework, providing a score and specific feedback for each part.
*   **Seamless Integration**: The feature will be fully integrated into the Test Hub, with all sessions saved to the Test History for progress tracking and analysis by the Guidance Hub.

## 3. Technical Implementation Plan

### Phase 1: Backend - A Flexible AI Coaching Engine

1.  **Update `behavioralTestGenerator.js`:**
    *   Create a single, powerful function: `evaluateBehavioralAnswer(question, userAnswer, framework)`.
    *   This function will dynamically generate the AI prompt based on the `framework` provided (e.g., `"behavioral_star"`, `"behavioral_soar"`), instructing the AI to evaluate against the specific components of that framework.

2.  **Update `testGenerator.js`:**
    *   The `evaluateAnswer` function will check if the test `type` starts with `"behavioral_"`. If it does, it will pass the request to the new `evaluateBehavioralAnswer` function along with the specific framework type.

3.  **Database:**
    *   No schema changes are required. The `type` column in the `test_sessions` table will store the specific framework used (e.g., `"behavioral_star"`, `"behavioral_soar"`).

### Phase 2: Frontend - A Unified User Experience

1.  **Update `TestHubPage.js`:**
    *   Add **"Behavioral (STAR)"** and **"Behavioral (SOAR)"** as new options to the "Test Type" dropdown.
    *   Create a single, flexible `BehavioralResults` component that can render the correct feedback labels (e.g., "Task" vs. "Obstacle") based on the session's `type`.

## 4. User Workflow

1.  The user navigates to the **Test Hub** and selects their desired test type, for example, "Behavioral (SOAR)".
2.  The simulator presents them with a question.
3.  The user submits their answer.
4.  The AI evaluates the answer against the **SOAR** criteria.
5.  The user is presented with a detailed breakdown of their answer, with specific feedback on their Situation, **Obstacle**, Action, and Result.
6.  The session score is saved to their **Test History**.
7.  Later, the **Guidance Hub** can analyze their performance across all behavioral frameworks.