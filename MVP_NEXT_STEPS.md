# 🚀 JudgiAI MVP Next Steps: Remaining Features, Optimizations, and Future Considerations

This document outlines the next phases of development for JudgiAI, building upon the current MVP progress. It covers features still needed for the core MVP, areas for optimization, and potential future enhancements.

---

**Current Status:** The JudgiAI Minimum Viable Product (MVP) is now fully implemented. This includes all core UI, chat infrastructure, comprehensive AI integration with LongCat and Langsearch (featuring research modes, API key rotation, and detailed latency feedback), the full Copilot Canvas with rich text editing and AI-assisted drafting actions, user profile management, performance optimizations, accessibility enhancements, robust error handling, code maintainability refactoring, and AI awareness of the current date and time. **Voice input via AssemblyAI has also been successfully integrated, with robust lifecycle management for the recorder and clear loading states during transcription. Browser retention has been improved to prevent state loss when navigating away and returning to a tab, and a Vercel deployment syntax error has been resolved. Furthermore, a flicker when starting new chats has been addressed, and a React warning related to the `viewportRef` prop in `ScrollArea` has been fixed. The user interface has been significantly enhanced for a first-class feel, and the landing page now features world-class SaaS copy and design, incorporating the brand's square shape subtly throughout. New, detailed instruction pages have been added, accessible both publicly and within the authenticated app, with a new navigation link in the sidebar and a 'Learn More' button on the landing page.**

---

## Phase 1: Remaining Features for MVP (DONE)

### 1.1 Structured Responses with Citations in Research Chat (DONE)
- [x] **Action Needed**: Enhance the chat message rendering to parse and display citations from the AI's response in a structured and user-friendly manner. This might involve specific Markdown parsing or AI output formatting to highlight citations.

### 1.2 "Save Findings to Canvas" from Research Chat (DONE)
- [x] **Action Needed**: Implement a user interface element (e.g., a "Save to Canvas" button or a context menu option) within the Research Chat that allows users to select and transfer AI-generated content to an new or existing document in the Canvas.

### 1.3 AI-Assisted Drafting Features in Copilot Canvas (DONE)
- [x] **Action Needed**: All core AI-assisted drafting features for the MVP are now implemented as on-demand actions.

---

## Phase 2: Optimizations and Improvements (DONE)

### 2.1 User Profile Management UI (DONE)
- [x] **Action Needed**: Create a dedicated profile settings page or component where users can manage their profile details.

### 2.2 Additional Authentication Providers (DONE)
- [x] **Action Needed**: Configure the Supabase Auth UI to include Google (or other desired OAuth providers) for easier sign-up and login.

### 2.3 Performance for Large Documents (DONE)
- [x] **Action Needed**: Implemented debounced content updates for the `RichTextEditor` in `CanvasEditorPage.tsx` to reduce the frequency of state updates and auto-saves while typing, improving overall performance.

### 2.4 Enhanced AI Response Latency Feedback (DONE)
- [x] **Action Needed**: For "Deep Think" and "Deeper Research" modes, consider providing more granular feedback on what the AI is doing (e.g., "Searching legal databases...", "Analyzing cases...", "Synthesizing information...") to manage user expectations during longer processing times. Implemented `onStatusUpdate` callback in `getLongCatCompletion` and integrated into `CanvasAIAssistant` and `ChatPage` to display detailed messages.

### 2.5 AI Awareness of Current Date and Time (DONE)
- [x] **Action Needed**: Injected the current date and time into the AI's system prompt in `src/services/longcatApi.ts`.

### 2.6 Accessibility Review (DONE)
- [x] **Action Needed**: Conduct a thorough accessibility audit to ensure the application is usable by individuals with disabilities, covering keyboard navigation, screen reader compatibility, color contrast, and ARIA attributes. Added `aria-label` attributes to all icon-only buttons across the application for improved screen reader support.

### 2.7 Robust Error Handling and User Feedback (DONE)
- [x] **Action Needed**: Implement more detailed and user-friendly error messages, potentially with options for users to report issues or retry actions. Enhance logging for better debugging of complex AI interactions. Implemented more specific error messages for API and network issues in `longcatApi.ts` and `legalDocumentService.ts`, and improved console logging.

### 2.8 Code Maintainability and Scalability (DONE)
- [x] **Action Needed**: Regularly review and refactor components, hooks, and services to ensure clear separation of concerns, reduce coupling, and improve overall maintainability as the application scales. Refactored the `parseAIResponse` function into a shared utility (`src/utils/aiResponseParser.ts`) to eliminate duplication and centralize AI response parsing logic.

### 2.9 AI Output Styling Integration (DONE)
- [x] **Action Needed**: Removed AI output font styling to align with the removal of font selection features.

---

## Phase 3: Future Considerations (Beyond Immediate MVP)

These are features that could significantly enhance the application but are likely beyond the immediate MVP scope:

### 3.1 Advanced Export Options
*   Customizable export templates (e.g., specific legal formats).
*   Option to include chat history alongside the document content in exports.

### 3.2 Document Version Control
*   Implement a system to track changes to documents, allowing users to view and revert to previous versions.

### 3.3 Collaboration Features
*   Enable multiple users to view, edit, or comment on documents and conversations.
*   Sharing documents with specific permissions.

### 3.4 Integration with External Legal Databases
*   Direct integration with popular Indian legal databases (e.g., Manupatra, SCC Online) for more targeted and comprehensive research.

### 3.5 Advanced AI Capabilities
*   Summarization of very long documents or case law.
*   Sentiment analysis of legal texts.
*   Automated contract review and clause extraction.

### 3.6 User Feedback and Rating System
*   Allow users to rate the quality of AI responses and document suggestions to help improve the AI model over time.

---

## Phase 4: Professional Features - AI Model & Research Control

### 4.1 Independent AI Model and Research Depth Controls (DONE)
- [x] **Action Taken**: Renamed research mode options to "No Research", "Moderate Research", and "Deep Research". Introduced a new independent toggle for AI model selection: "Auto" (using `LongCat-Flash-Chat`) and "Deep Think" (using `LongCat-Flash-Thinking`). The research mode now exclusively controls the depth of Langsearch calls, while the AI model toggle exclusively controls the LongCat model used. These controls are implemented in both `ChatPage.tsx` and `CanvasAIAssistant.tsx`.
- [x] **Action Taken**: Increased the research depth for "Moderate Research" to 10 legal documents and for "Deep Research" to 20 legal documents and 10 news articles.