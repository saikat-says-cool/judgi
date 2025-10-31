# 🚀 JudgiAI MVP Development Plan & Progress

This document outlines the step-by-step plan to build the JudgiAI MVP, tracking progress as we go.

---

**Current Status:** The application now features refined AI chat streaming, including improved scrolling behavior, a more dynamic "thinking" indicator, and the prevention of raw document update tags from appearing in the chat during streaming in the canvas co-pilot. Export functionality for DOCX and PDF is also implemented. Research modes have been added to both the main chat and the canvas AI assistant, integrating with the LongCat API for contextual legal research, with enhanced query construction for Langsearch. The Langsearch integration has been further refined to use a two-step process: initial broad retrieval followed by semantic re-ranking for improved relevance, with the Web Search API URL now hardcoded. **Crucially, a rotating API key mechanism has been implemented for both Langsearch and LongCat APIs to handle rate limits, using hardcoded keys.**

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
- [x] **1.3.2 Research Modes:** Implemented "Quick Lookup", "Deep Think", "Deeper Research" selection UI in both the main chat and canvas AI assistant.
- [x] **1.3.3 Contextual Search:** Integrated `searchLegalDocuments` and `searchCurrentNews` based on research mode and user country, injecting results into the AI's system prompt. **Enhanced Langsearch query construction for better legal relevance.**
- [x] **1.3.4 Display AI Response:** Render AI's response, including citations.
- [x] **1.3.5 AI Persona & Parameters:** Adjusted AI persona to a general assistant (like ChatGPT) and set parameters (temperature, top_p, max_tokens) to normal-like values. This change is foundational for future, more refined prompt engineering.
- [x] **1.3.6 Rotating API Keys:** Implemented a system to manage multiple hardcoded API keys for both Langsearch and LongCat, automatically rotating to the next key upon encountering a rate limit (HTTP 429) error.

## Phase 2: Copilot Canvas Infrastructure

### 2.1 Canvas Layout (DONE)
- [x] **2.1.1 Basic Text Editor:** Implemented a basic text editor (`WritingCanvas`) within the "Canvas" tab.
- [x] **2.1.2 Split-Screen Layout:** Created a resizable split-screen layout in `CanvasEditorPage` with `WritingCanvas` on the left and `CanvasAIAssistant` on the right.
- [x] **2.1.3 AI Assistant Integration:** Integrated a dedicated AI assistant (`CanvasAIAssistant`) into the right panel of the canvas. The AI assistant receives the content from the `WritingCanvas` as context for its responses.

### 2.2 Interactivity (DONE)
- [x] **2.2.1 Canvas Home Page:** Implemented a landing page (`CanvasHomePage`) for the Canvas tab, allowing users to create new documents or open recent ones.
- [x] **2.2.2 Document Persistence:** Implemented saving and loading of writing content and AI chat history to/from the Supabase `documents` table.
- [x] **2.2.3 Document Management:** Added functionality to rename and delete documents from the `CanvasHomePage`.
- [x] **2.2.4 Unsaved Changes Warning (Refined):** Implemented a dialog to warn users about unsaved changes when attempting to close the `CanvasEditorPage`, with refined logic to only trigger if actual changes have occurred.
- [x] **2.2.5 Floating Close Button:** Added a floating close button to the `CanvasEditorPage` to return to the `CanvasHomePage`.
- [x] **2.2.6 AI Content Insertion (Enhanced):** Enabled the AI assistant to directly modify (replace, append, delete, shorten, etc.) the `WritingCanvas` content using structured responses, with the AI communicating its actions in the copilot chat.
- [x] **2.2.7 Export Functionality:** Implemented "Export as .docx" and "Export as .pdf" buttons.

## Phase 3: Enhancements & Refinements

### 3.1 User Experience (DONE)
- [x] **3.1.1 User Profile Management:** Allow users to update their profile (e.g., country). (Implicitly handled by `getLongCatCompletion` fetching country from profiles, but no direct UI for user to update it yet.)
- [x] **3.1.2 UI/UX Improvements:** Styling, loading states, error handling. (Implemented chat auto-scrolling, improved empty chat state, optimized tab bar size and position, enabled independent scrolling for the chat window, replaced top tabs with a responsive sidebar for navigation, added conversation management features to the sidebar, fixed sidebar overflow for chat items, conditionally hide sidebar in Canvas editor view, and ensured Markdown rendering for AI responses in both chat and canvas assistant.)
- [x] **3.1.3 Responsiveness:** Ensure the application is responsive across devices.
- [x] **3.1.4 Global Font Update:** Changed the application's global font to 'Comfortaa'.
- [x] **3.1.5 Markdown Rendering in Writing Canvas:** Implemented Markdown rendering in the `WritingCanvas` by default, with a click-to-edit functionality to switch to a raw text editor.
- [x] **3.1.6 Markdown Heading Visibility Fix:** Applied direct CSS overrides to ensure Markdown headings and bold text are clearly visible (white) against the dark background in all Markdown rendered areas.
- [x] **3.1.7 Rich Text Editor Integration:** Replaced the basic `WritingCanvas` with a full-featured `RichTextEditor` using TipTap, providing continuous formatted display while editing.
- [x] **3.1.8 Comprehensive Formatting Toolbar:** Added a toolbar to the `RichTextEditor` with options for bold, italic, underline, strikethrough, inline code, headings (H1, H2, H3), bullet lists, ordered lists, blockquotes, text alignment (left, center, right, justify), undo, and redo.
- [x] **3.1.9 User Font Family Selection:** Implemented a font family dropdown in the `RichTextEditor` that allows users to change the font of selected text, with the dropdown accurately reflecting the active font.
- [x] **3.1.10 AI Output Font Control:** Added a separate font family dropdown to the `CanvasAIAssistant` to control the font of AI-generated content inserted into the writing canvas.
- [x] **3.1.11 Markdown/HTML Conversion Utilities:** Created `src/lib/markdownConverter.ts` to handle seamless conversion between HTML (for the editor) and Markdown (for the AI).
- [x] **3.1.12 Normal Text Visibility Fix (Editor):** Ensured normal paragraph text within the `RichTextEditor` is clearly visible (white) against the dark background.
- [x] **3.1.13 Reduced Line Spacing (Editor):** Adjusted paragraph margins in `src/globals.css` to provide smaller line jumps when pressing Enter in the editor.
- [x] **3.1.14 AI Response Full Width:** Ensured AI responses in both the main chat and canvas assistant chat span the entire horizontal width for improved readability.
- [x] **3.1.15 Smaller Chat Font Size:** Reduced the font size for all chat messages and AI responses in both the main chat and canvas assistant chat to `text-sm`.
- [x] **3.1.16 Refined AI Streaming Display:** Implemented more robust parsing during AI streaming to prevent partial document update tags (like `<DOCUMENT_REPLACE>` or `<DOCUMENT_WRITE>`) and their content from appearing in the chat. The "JudgiAI is thinking..." indicator now disappears as soon as the first character of the AI's response is streamed.

### 3.2 Bug Fixes (DONE)
- [x] **3.2.1 Persistent JSX Parsing Errors:** Resolved recurring `Unexpected token Card` errors in `src/components/CanvasAIAssistant.tsx` through comprehensive rewrites and rebuilds.
- [x] **3.2.2 Import Syntax Error:** Fixed `Expected 'from', got '=>'` syntax error in `src/pages/ChatPage.tsx`.

---