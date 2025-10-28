# 🚀 JudgiAI MVP Development Plan & Progress

This document outlines the step-by-step plan to build the JudgiAI MVP, tracking progress as we go.

---

**Current Status:** Initial Setup Complete (UI Reset, Supabase Reset, Landing Page, Login, Protected Routes, Chat/Canvas Tabs are in place).

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

### 2.1 Canvas Layout
- [ ] **2.1.1 Basic Text Editor:** Implement a basic text editor within the "Canvas" tab.

### 2.2 Interactivity
- [ ] **2.2.1 Save to Canvas:** Implement functionality to transfer content from Chat to Canvas.
- [ ] **2.2.2 Export Functionality:** Implement "Export as .docx" button.

## Phase 3: Enhancements & Refinements

### 3.1 User Experience
- [x] **3.1.1 User Profile Management:** Allow users to update their profile (e.g., country). (Implicitly handled by `getLongCatCompletion` fetching country from profiles, but no direct UI for user to update it yet.)
- [x] **3.1.2 UI/UX Improvements:** Styling, loading states, error handling. (Implemented chat auto-scrolling, improved empty chat state, optimized tab bar size and position, enabled independent scrolling for the chat window, replaced top tabs with a responsive sidebar for navigation, and added conversation management features to the sidebar.)
- [x] **3.1.3 Responsiveness:** Ensure the application is responsive across devices.

---