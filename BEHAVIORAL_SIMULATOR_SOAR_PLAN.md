# Behavioral Simulator SOAR Upgrade: A Feature Blueprint

This document outlines the plan to upgrade the existing Behavioral Interview Simulator to include the **SOAR method** (Situation, Obstacle, Action, Result). This upgrade will be a minimal-impact enhancement, directly integrating into the existing Test Hub infrastructure.

## 1. Core Vision

The goal is to enhance the Behavioral Simulator, giving users a new tool to practice answering questions that specifically highlight their problem-solving and resilience skills. This will be achieved by adding a "SOAR Mode" that uses a dedicated AI coach to evaluate answers against the SOAR criteria.

## 2. Key Features

*   **New "SOAR" Test Type**: Users will be able to select "Behavioral (SOAR)" as a new test type in the Test Hub.
*   **Targeted Question Generation**: The simulator will provide questions that are well-suited for demonstrating how the user overcomes challenges.
*   **AI-Powered SOAR Analysis**: A new AI evaluation prompt will analyze the user's answer against the four SOAR criteria:
    *   **Situation**: Was the context clear?
    *   **Obstacle**: Was the core challenge or problem well-defined?
    *   **Action**: Were the user's specific actions to overcome the obstacle clear?
    *   **Result**: Was the positive outcome clearly stated?
*   **Seamless Integration**: The new feature will be fully integrated into the existing Test Hub, including progress tracking in the Test History and the potential for future analysis in the Guidance Hub.

## 3. Technical Implementation Plan

### Phase 1: Backend - A Smarter AI Coach

1.  **Update `behavioralTestGenerator.js`:**
    *   Add a new function: `evaluateSOARAnswer(question, userAnswer)`.
    *   This function will use a new, dedicated prompt that instructs the AI to score and provide feedback on each of the four SOAR components.

2.  **Update `testGenerator.js`:**
    *   Modify the `evaluateAnswer` function to be aware of the test type.
    *   If the type is `"behavioral_soar"`, it will call the new `evaluateSOARAnswer` function. Otherwise, it will use the existing evaluation logic.

3.  **Database:**
    *   No schema changes are required. The `type` column in the `test_sessions` table will simply store `"behavioral_soar"`.

### Phase 2: Frontend - A Seamless User Experience

1.  **Update `TestHubPage.js`:**
    *   Add a "Behavioral (SOAR)" option to the "Test Type" dropdown in the `TestConfiguration` component.
    *   Create a new `BehavioralSOARResults` component, which will be a modified version of the existing `BehavioralResults` component, designed to display feedback for "Obstacle" instead of "Task".
    *   Update the main `TestResults` component to render the new `BehavioralSOARResults` view when the session type is `"behavioral_soar"`.

## 4. User Workflow

1.  The user navigates to the **Test Hub** and selects the "Behavioral (SOAR)" test type.
2.  The simulator presents them with a question.
3.  The user submits their answer.
4.  The AI evaluates the answer against the SOAR criteria.
5.  The user is presented with a detailed breakdown of their answer, with specific feedback on how to improve their Situation, **Obstacle**, Action, and Result.
6.  The session score is saved to their **Test History** for progress tracking.
