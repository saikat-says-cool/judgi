# 🚀 JudgiAI MVP Development Plan & Progress

This document outlines the step-by-step plan to build the JudgiAI MVP, tracking progress as we go.

---

**Current Status:** Canvas UI with integrated AI assistant is now functional, with document persistence, a dedicated editor view, and AI content insertion.

---

## Phase 1: Core UI & Chat Infrastructure

### 1.1 Basic Layout & Navigation (DONE)
- [x] Landing page for unauthenticated users (`/`).
- [x] Login/Signup page with Supabase Auth UI (`/login`).
- [x] Protected route for the main application (`/app`).
- [x] Main application page (`/app`) with "Chat" and "Canvas" tabs.

### 1.2 Research Chat Interface (DONE)
- [x] **1.2.1 Chat Layout:** Implement a basic chat layout within the "Chat" tab (input field, message display area).
- [x] **1.2.2 Message Display:** Display user and AI messages.
- [x] **1.2.3 Chat Input:** Create an input component for users to type questions.
- [x] **1.2.4 Send Message Functionality:** Handle sending messages and displaying them.
- [x] **1.2.5 Chat History Storage:** Store chat messages in Supabase database.
- [x] **1.2.6 Fetch Chat History:** Retrieve and display past conversations.
- [x] **1.2.7 New Chat Welcome UI:** Implemented a centered welcome interface for new, empty chats, transitioning to full chat on first message.

### 1.3 AI Integration (LongCat API)
- [x] **1.3.1 Integrate LongCat API:** Set up the client-side integration for `getLongCatCompletion`.
- [ ] **1.3.2 Research Modes:** Implement "Quick Lookup", "Deep Think", "Deeper Research" selection. (The underlying functionality is there, but the UI for selecting modes is not yet built.)
- [ ] **1.3.3 Contextual Search:** Integrate `searchLegalDocuments` and `searchCurrentNews` based on research mode and user country. (Temporarily dormant for future engineering.)
- [x] **1.3.4 Display AI Response:** Render AI's response, including citations.
- [x] **1.3.5 AI Persona & Parameters:** Adjusted AI persona to a general assistant (like ChatGPT) and set parameters (temperature, top_p, max_tokens) to normal-like values. This change is foundational for future, more refined prompt engineering.

## Phase 2: Copilot Canvas Infrastructure

### 2.1 Canvas Layout (DONE)
- [x] **2.1.1 Basic Text Editor:** Implemented a basic text editor (`WritingCanvas`) within the "Canvas" tab.
- [x] **2.1.2 Split-Screen Layout:** Created a resizable split-screen layout in `CanvasEditorPage` with `WritingCanvas` on the left and `CanvasAIAssistant` on the right.
- [x] **2.1.3 AI Assistant Integration:** Integrated a dedicated AI assistant (`CanvasAIAssistant`) into the right panel of the canvas. The AI assistant receives the content from the `WritingCanvas` as context for its responses.

### 2.2 Interactivity (DONE)
- [x] **2.2.1 Canvas Home Page:** Implemented a landing page (`CanvasHomePage`) for the Canvas tab, allowing users to create new documents or open recent ones.
- [x] **2.2.2 Document Persistence:** Implemented saving and loading of writing content and AI chat history to/from the Supabase `documents` table.
- [x] **2.2.3 Document Management:** Added functionality to rename and delete documents from the `CanvasHomePage`.
- [x] **2.2.4 Unsaved Changes Warning:** Implemented a dialog to warn users about unsaved changes when attempting to close the `CanvasEditorPage`.
- [x] **2.2.5 Floating Close Button:** Added a floating close button to the `CanvasEditorPage` to return to the `CanvasHomePage`.
- [x] **2.2.6 AI Content Insertion:** Enabled the AI assistant to insert its responses directly into the `WritingCanvas` with a dedicated button.
- [ ] **2.2.7 Export Functionality:** Implement "Export as .docx" button.

## Phase 3: Enhancements & Refinements

### 3.1 User Experience (DONE)
- [x] **3.1.1 User Profile Management:** Allow users to update their profile (e.g., country). (Implicitly handled by `getLongCatCompletion` fetching country from profiles, but no direct UI for user to update it yet.)
- [x] **3.1.2 UI/UX Improvements:** Styling, loading states, error handling. (Implemented chat auto-scrolling, improved empty chat state, optimized tab bar size and position, enabled independent scrolling for the chat window, replaced top tabs with a responsive sidebar for navigation, added conversation management features to the sidebar, fixed sidebar overflow for chat items, and conditionally hide sidebar in Canvas editor view.)
- [x] **3.1.3 Responsiveness:** Ensure the application is responsive across devices.
- [x] **3.1.4 Global Font Update:** Changed the application's global font to 'Comfortaa'.

---