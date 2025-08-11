# AI-Powered Test Hub: A Feature Blueprint

This document outlines the plan for a new, AI-powered Test Hub within the Job Hunt AI application. The goal is to create a personalized testing and learning platform that helps users improve their skills based on real-world job market data.

## 1. Core Vision

The Test Hub will be a central place where users can take targeted tests on various technical topics. The system will leverage the user's scraped job data to suggest relevant topics, use a powerful AI to generate and evaluate tests, and track user progress over time to highlight areas for improvement.

## 2. Key Features

*   **Personalized Test Suggestions**: The hub will analyze the user's **Market Fit** data to recommend tests on the most in-demand skills.
*   **Flexible Test Configuration**: Users can create custom tests by specifying:
    *   **Topic**: Either from a pre-populated list of top skills or a custom, user-defined topic (e.g., "JavaScript Higher-Order Functions").
    *   **Difficulty**: Junior, Mid-Level, Senior.
    *   **Test Type**: Multiple Choice, Short Answer, Code Challenge.
*   **AI-Powered Generation & Evaluation**:
    *   A dedicated AI service will generate relevant test questions on the fly.
    *   The AI will evaluate user answers, providing not just a "correct/incorrect" verdict but also **detailed, constructive feedback**.
*   **Progress Tracking**: All test sessions and results will be saved to the database, allowing users to view their history and track their improvement over time.
*   **Prompt Matrix Transparency**: An admin section will display the exact prompt templates being sent to the AI, providing transparency and allowing for future customization.

## 3. Technical Implementation Plan

### Phase 1: Backend Foundation (Database & API)

1.  **Database Schema:**
    *   Create a new migration to add two tables:
        *   `test_sessions`: `id`, `skill`, `difficulty`, `score`, `completed_at`.
        *   `test_results`: `id`, `session_id`, `question_text`, `user_answer`, `correct_answer`, `feedback`, `is_correct`.

2.  **AI Service (`testGenerator.js`):**
    *   `generateTestQuestions(topic, difficulty, type)`: Generates a set of questions and answers.
    *   `evaluateAnswer(question, correctAnswer, userAnswer)`: Evaluates the user's answer and provides feedback.
    *   `getPromptMatrix()`: Returns the prompt templates.

3.  **API Endpoints (`server.js`):**
    *   `POST /api/tests/start`: Creates a test session, generates questions, and returns the first one.
    *   `POST /api/tests/submit-answer`: Submits an answer for evaluation, saves the result, and returns the next question.
    *   `GET /api/tests/history`: Retrieves a summary of past test sessions.
    *   `GET /api/tests/prompts`: Retrieves the prompt matrix.

### Phase 2: Frontend UI (React Components)

The existing `TestPage.js` will be replaced with a new `TestHubPage.js` that manages the different views.

1.  **Configuration View**: The initial screen with dropdowns for Topic, Difficulty, and Test Type.
2.  **Active Session View**: A clean, focused view that displays one question at a time and provides an input for the user's answer.
3.  **Results View**: A post-test summary showing the final score and a detailed review of each question, including the AI's feedback.
4.  **History View**: A table displaying all past test sessions and their scores.
5.  **Prompt Matrix View**: A simple, toggleable section to display the AI prompt templates.

## 4. Future Enhancements

This plan establishes a powerful and flexible foundation. Future work could expand the Test Hub into a complete interview preparation platform by adding new, advanced **Test Types**:

*   **System Design Simulator**: The AI would provide a high-level design prompt (e.g., "Design a URL shortener") and act as a Principal Engineer, providing feedback on the user's proposed architecture, focusing on scalability, reliability, and technology choices.
*   **Code Review Challenge**: The AI would generate a code snippet with bugs or bad practices. The user's task would be to identify the issues and refactor the code. The AI would then evaluate the quality of their review and refactoring.
*   **"Explain a Concept" Test**: The AI would prompt the user to explain a complex technical topic to a specific audience (e.g., "Explain CSS Specificity to a junior developer"). The AI would then evaluate the answer based on clarity, accuracy, and simplicity, providing feedback on communication skills.
*   **Adaptive Difficulty**: The difficulty of questions could adjust in real-time based on the user's performance.
*   **Progress Visualization**: The History View could include charts to visualize score improvements over time for specific skills.
*   **Editable Prompts**: The Prompt Matrix section could be enhanced to allow users to edit and save the AI prompts, enabling full customization of the testing engine.
