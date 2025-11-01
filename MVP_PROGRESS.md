# 🚀 JudgiAI MVP Development Plan & Progress

This document outlines the step-by-step plan to build the JudgiAI MVP, tracking progress as we go.

---

**Current Status:** The JudgiAI Minimum Viable Product (MVP) is now fully implemented. This includes all core UI, chat infrastructure, comprehensive AI integration with LongCat and Langsearch (featuring research modes, API key rotation, and detailed latency feedback), the full Copilot Canvas with rich text editing and AI-assisted drafting actions, user profile management, performance optimizations, accessibility enhancements, robust error handling, code maintainability refactoring, and AI awareness of the current date and time. **Voice input via AssemblyAI has also been successfully integrated, with robust lifecycle management for the recorder and clear loading states during transcription. Browser retention has been improved to prevent state loss when navigating away and returning to a tab, and a Vercel deployment syntax error has been resolved. Furthermore, a flicker when starting new chats has been addressed, and a React warning related to the `viewportRef` prop in `ScrollArea` has been fixed. The user interface has been significantly enhanced for a first-class feel, and the landing page now features world-class SaaS copy and design, incorporating the brand's square shape subtly throughout.**

---

## Phase 1: Core UI & Chat Infrastructure (DONE)

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

### 1.3 AI Integration (LongCat API) (DONE)
- [x] **1.3.1 Integrate LongCat API:** Set up the client-side integration for `getLongCatCompletion`.
- [x] **1.3.2 Research Modes:** Implemented "Quick Lookup", "Deep Think", "Deeper Research" selection UI in both the main chat and canvas AI assistant.
- [x] **1.3.3 Contextual Search:** Integrated `searchLegalDocuments` and `searchCurrentNews` based on research mode and user country, injecting results into the AI's system prompt. **Enhanced Langsearch query construction for better legal relevance.**
- [x] **1.3.4 Display AI Response:** Render AI's response, including citations.
    - [x] **Instructed AI to format citations as Markdown links `[Case Title](URL)` in `src/services/longcatApi.ts` system prompt.**
    - [x] **Fixed dark links in Markdown rendering by setting `--tw-prose-invert-links` to `hsl(var(--foreground))` in `src/globals.css` for better visibility.**
    - [x] **Refined Markdown link visibility by adding a direct CSS override for `a` tags within `.prose.dark\:prose-invert` to ensure they use `hsl(var(--foreground)) !important`.**
    - [x] **Refined the AI system prompt to encourage more relevant citations and hyperlinks as possible from the provided research results.**
- [x] **1.3.5 AI Persona & Parameters:** Adjusted AI persona to a general assistant (like ChatGPT) and set parameters (temperature, top_p, max_tokens) to normal-like values. This change is foundational for future, more refined prompt engineering.
- [x] **1.3.6 Rotating API Keys:** Implemented a system to manage multiple hardcoded API keys for both Langsearch and LongCat, automatically rotating to the next key upon encountering a rate limit (HTTP 429) error.
- [x] **1.3.7 LongCat API Optimization:** Optimized LongCat API calls to dynamically use the `LongCat-Flash-Thinking` model with `enable_thinking: true` and `thinking_budget: 1024` when "Deep Think" or "Deeper Research" modes are selected, allowing for more in-depth AI processing.
- [x] **1.3.8 Strict Chat Prompting**: Implemented distinct system prompts for the chat and canvas interfaces, ensuring the AI in the chat strictly provides conversational responses and never uses document modification tags.

## Phase 2: Copilot Canvas Infrastructure (DONE)

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

## Phase 3: Enhancements & Refinements (DONE)

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
- [x] **3.1.17 Specific AI Document Action Loading Messages:** Implemented specific loading messages in the Canvas Copilot's chat interface (e.g., "JudgiAI is appending to document...", "JudgiAI is replacing document content...") when the AI is actively modifying the document, providing clearer feedback during the "lag" period before chat content appears.
- [x] **3.1.18 Enhanced UI and Landing Page**: The overall user interface has been made more attractive and first-class, with a revamped landing page featuring world-class SaaS copy and a subtle square brand pattern integrated into backgrounds.

### 3.2 Bug Fixes (DONE)
- [x] **3.2.1 Persistent JSX Parsing Errors:** Resolved recurring `Unexpected token Card` errors in `src/components/CanvasAIAssistant.tsx` through comprehensive rewrites and rebuilds.
- [x] **3.2.2 Import Syntax Error:** Fixed `Expected 'from', got '=>'` syntax error in `src/pages/ChatPage.tsx`.
- [x] **3.2.3 Dark Links in Markdown:** Fixed an issue where links within Markdown content were too dark to read against the background by adjusting the `--tw-prose-invert-links` variable in `src/globals.css`.
- [x] **3.2.4 Hyperlinked Text Visibility:** Addressed the issue where hyperlinked text was indistinguishable by adding a direct CSS override for `a` tags within `.prose.dark\:prose-invert` to ensure they use `hsl(var(--foreground)) !important`.
- [x] **3.2.5 Italicized, Quoted, and Bullet-Pointed Text Visibility:** Fixed visibility issues for italicized text, blockquotes, and list items within Markdown by adding direct CSS overrides to ensure they use `hsl(var(--foreground)) !important`.
- [x] **3.2.6 Voice Recorder Unresponsiveness:** Refactored the `VoiceRecorder` component (`src/components/VoiceRecorder.tsx`) to ensure its `useEffect` hook correctly manages the `MediaRecorder` lifecycle, preventing premature stopping and ensuring the "tick" button correctly triggers transcription after audio collection. This resolved the issue where the microphone button appeared unresponsive.
- [x] **3.2.7 Supabase Client Warning**: Updated `SessionContext.tsx` to import and use the singleton Supabase client from `src/integrations/supabase/client.ts`, resolving the warning about multiple GoTrueClient instances.
- [x] **3.2.8 React Router Warning**: Moved the navigation logic in `LandingPage.tsx` into a `useEffect` hook to prevent React warnings about state updates during the render phase.
- [x] **3.2.9 Browser Retention/State Persistence**: Refined the `useEffect` dependencies in `ChatPage.tsx` and `CanvasEditorPage.tsx` to ensure that the component's state (chat messages, document content, etc.) is correctly loaded or reset based on the URL parameters (`conversationId` or `documentId`), preventing loss of context when navigating away and returning to a tab.
- [x] **3.2.10 Vercel Deployment Syntax Error**: Fixed an "Unexpected ')'" syntax error in `src/pages/CanvasEditorPage.tsx` that was causing Vercel deployments to fail.
- [x] **3.2.11 Chat Flicker on New Conversation**: Addressed a temporary flicker when sending the first message in a new chat by introducing an `isInitializingNewChat` state and refining the `useEffect` logic in `ChatPage.tsx`.
- [x] **3.2.12 ScrollArea `viewportRef` Warning**: Fixed a React warning where the `viewportRef` prop was being passed to a native DOM element within the `ScrollArea` component by explicitly filtering it out in `src/components/ui/scroll-area.tsx`.

---