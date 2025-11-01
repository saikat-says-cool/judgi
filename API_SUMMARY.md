# JudgiAI Technical Summary: APIs and Core Functionalities

This document provides a technical overview of the JudgiAI application, focusing on its API integrations, particularly with Supabase, LongCat, Langsearch, and AssemblyAI, and how these components work together to deliver the core features.

## 1. Overview of JudgiAI

JudgiAI is an AI legal copilot designed for legal professionals and students. It offers two primary workspaces:
*   **Research Chat Interface**: A conversational AI for legal research.
*   **Copilot Canvas**: An AI-assisted writing environment for drafting legal documents.

The application is built using React, TypeScript, and Tailwind CSS, leveraging `shadcn/ui` components for a modern and responsive user interface.

## 2. Core API Integrations

JudgiAI relies on three main API integrations:

### 2.1. Supabase (Backend-as-a-Service)

Supabase serves as the backend for JudgiAI, handling authentication, database management, and real-time updates.

*   **Client Setup**: The Supabase client is initialized in `src/integrations/supabase/client.ts` using environment variables for the URL and public key. The `SessionContextProvider` now correctly imports and uses this singleton client, resolving warnings about multiple client instances.
*   **Authentication**:
    *   User authentication (sign-up, sign-in, session management) is handled by `@supabase/auth-ui-react` and `SessionContextProvider`.
    *   The login page (`src/pages/Login.tsx`) is configured to support email/password and Google OAuth providers.
    *   User profiles are stored in the `public.profiles` table, automatically created and populated on new user sign-up via a PostgreSQL trigger (`handle_new_user` function).
    *   A dedicated `ProfileSettingsPage` allows users to view and update their profile information (first name, last name, country).
*   **Database**:
    *   **`public.profiles`**: Stores user-specific profile data (first name, last name, avatar URL, country).
    *   **`public.conversations`**: Stores metadata for chat conversations (ID, user ID, title, timestamps).
    *   **`public.chats`**: Stores individual chat messages, linked to `conversations` (ID, user ID, conversation ID, role, content, timestamp).
    *   **`public.documents`**: Stores legal documents created in the Canvas (ID, user ID, title, content (HTML), chat history (JSONB), timestamps).
*   **Real-time Updates**: Supabase channels are used in `Sidebar.tsx` and `CanvasHomePage.tsx` to listen for `postgres_changes` on `conversations` and `documents` tables, ensuring the UI reflects updates in real-time (e.g., new chats, renamed documents).
*   **Row Level Security (RLS)**: RLS is strictly enforced on all tables (`profiles`, `conversations`, `chats`, `documents`) to ensure users can only access, modify, or delete their own data. Policies are defined for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations, typically restricting access to `auth.uid() = user_id` or `auth.uid() = id`.

### 2.2. LongCat API (AI Chat and Document Co-pilot)

The LongCat API powers the conversational AI capabilities in both the chat interface and the canvas assistant.

*   **Client Initialization**: The `OpenAI` client is initialized in `src/services/longcatApi.ts` with a `baseURL` pointing to `https://api.longcat.chat/openai` and an `apiKey`.
*   **API Key Rotation**:
    *   A list of hardcoded LongCat API keys is maintained in `src/utils/longcatApiKeys.ts`.
    *   The `getLongCatApiKey()` and `rotateLongCatApiKey()` functions manage the rotation of keys.
    *   If a `429 (Too Many Requests)` error is encountered, the system automatically retries the request with the next available API key.
*   **`getLongCatCompletion` Function**:
    *   This asynchronous generator function handles streaming AI responses.
    *   **AI Model Selection (`aiModelMode`)**: A new independent parameter (`auto` or `deep_think`) determines the underlying LongCat model.
        *   `auto` mode uses `LongCat-Flash-Chat`.
        *   `deep_think` mode uses `LongCat-Flash-Thinking` with `enable_thinking: true` and `thinking_budget: 1024` for more in-depth processing.
    *   **Research Modes (`researchMode`)**: The `researchMode` parameter (`no_research`, `moderate_research`, `deep_research`) now *only* controls the depth of external research calls to Langsearch.
        *   `no_research`: No external research.
        *   `moderate_research`: Fetches 10 legal documents.
        *   `deep_research`: Fetches 20 legal documents and 10 news articles.
    *   **System Prompt Construction**:
        *   The system prompt (`systemPrompt`) is dynamically constructed to define JudgiAI's persona as a legal assistant.
        *   It includes the **current date and time** for contextual awareness.
        *   It includes instructions for document manipulation using `<DOCUMENT_REPLACE>` and `<DOCUMENT_WRITE>` tags.
        *   It incorporates the user's country (fetched from Supabase `profiles`) for contextual awareness.
        *   Crucially, it injects `researchResults` (from Langsearch) and `currentDocumentContent` (from the Canvas) into the prompt, providing the AI with relevant context.
        *   **Strict Chat Prompting**: The system prompt is now strictly differentiated for the chat interface, explicitly forbidding the use of document modification tags (`<DOCUMENT_REPLACE>`, `<DOCUMENT_WRITE>`) to ensure the AI behaves purely conversationally in that context.
    *   **Streaming Responses**: The function yields chunks of the AI's response, allowing for real-time display in the UI.
    *   **Document Update Tags**: The AI is instructed to use `<DOCUMENT_REPLACE>` to overwrite the entire document or `<DOCUMENT_WRITE>` to append content. These tags are parsed client-side to update the `RichTextEditor`.
    *   **Enhanced Latency Feedback**: An `onStatusUpdate` callback is used to provide granular feedback on AI processing stages (e.g., "Searching legal databases...", "Generating AI response...") to the UI.
    *   **Robust Error Handling**: Includes specific error messages for API errors (429, 401) and network issues, with detailed console logging.
    *   **Large Input Handling**: LongCat Flash models are optimized for handling large context windows, making them suitable for the increased volume of research results.

### 2.3. Langsearch API (Legal Research)

The Langsearch API is used to perform legal document and current news searches, providing relevant context to the LongCat AI.

*   **Endpoints**:
    *   `https://api.langsearch.com/v1/web-search` for initial broad searches.
    *   `https://api.langsearch.com/v1/rerank` for semantic reranking of search results.
*   **API Key Rotation**:
    *   Similar to LongCat, a list of hardcoded Langsearch API keys is managed in `src/utils/langsearchApiKeys.ts`.
    *   `makeLangsearchRequest` handles automatic key rotation and retries on `429` errors.
*   **`searchLegalDocuments` Function**:
    *   Takes a `query`, `count`, and `country` as parameters. The `count` is now dynamically determined by the `researchMode` in `getLongCatCompletion`.
    *   **Two-Step Search Process**:
        1.  **Initial Broad Search**: Uses `web-search` with an enhanced query (e.g., "Indian legal cases about...") to retrieve a larger set of candidate documents (e.g., 10).
        2.  **Semantic Reranking**: The content of these candidate documents is then passed to the `rerank` endpoint along with the original query. This step semantically re-orders the documents by relevance and selects the `top_n` (e.g., 5) most relevant ones.
    *   Results are formatted into `LegalDocument` objects, including title, content, and citation (URL).
*   **`searchCurrentNews` Function**:
    *   Similar two-step process for news articles, using `web-search` with `freshness: "oneDay"` and then `rerank` for relevance. The `count` is also dynamically determined by `researchMode`.
    *   Query construction is adapted for news searches (e.g., "current Indian legal news about...").
*   **Integration with LongCat**: The results from `searchLegalDocuments` and `searchCurrentNews` are injected into the LongCat AI's system prompt as `<LEGAL_RESEARCH_RESULTS>` and `<CURRENT_NEWS_RESULTS>`, providing the AI with up-to-date and relevant information.
*   **Robust Error Handling**: Includes specific error messages for API errors (429, 401) and network issues, with detailed console logging.

### 2.4. AssemblyAI API (Speech-to-Text)

AssemblyAI is integrated to provide voice input capabilities, converting spoken audio into text.

*   **API Key Management**:
    *   A list of hardcoded AssemblyAI API keys is maintained in `src/utils/assemblyAiApiKeys.ts`.
    *   The `transcribeAudio` function manages the rotation of keys, retrying with the next available key upon encountering a `429 (Too Many Requests)` error.
*   **`transcribeAudio` Function**:
    *   This function handles the full speech-to-text workflow using direct REST API calls, ensuring browser compatibility.
    *   **Step 1: Upload Audio**: The recorded audio `Blob` is sent via a `POST` request to `https://api.assemblyai.com/v2/upload` with `Content-Type: application/octet-stream`. This returns an `upload_url`.
    *   **Step 2: Submit Transcription Job**: The `upload_url` is then used in a `POST` request to `https://api.assemblyai.com/v2/transcript` to initiate the transcription process. This returns a `transcriptId`.
    *   **Step 3: Poll for Completion**: The service continuously polls `GET https://api.assemblyai.com/v2/transcript/{transcript_id}` every 3 seconds until the `status` is `completed` or `error`.
    *   Upon completion, the transcribed `text` is returned.
    *   **Robust Error Handling**: Includes specific error messages for API errors (429, 401) and network issues, with detailed console logging and retry logic.

## 3. AI Interaction with the Canvas

The Canvas (`CanvasEditorPage`) is a sophisticated writing environment that integrates directly with the `CanvasAIAssistant`.

*   **`RichTextEditor`**: The main writing area uses `@tiptap/react` to provide a rich text editing experience. It stores content as HTML.
    *   Features include bold, italic, underline, strikethrough, code, headings, lists, blockquotes, text alignment, undo/redo, and user-selectable font families.
    *   **Performance Optimization**: Debounced content updates are implemented to reduce the frequency of state updates and auto-saves while typing, improving overall performance for large documents.
*   **Markdown/HTML Conversion**:
    *   `src/lib/markdownConverter.ts` provides utility functions (`markdownToHtml`, `htmlToMarkdownConverter`) to seamlessly convert between Markdown (for AI communication) and HTML (for the `RichTextEditor`).
    *   When AI needs to read the document, the HTML content is converted to Markdown.
    *   When AI generates content for the document, its Markdown output is converted to HTML before being inserted.
*   **AI Document Updates**:
    *   The `CanvasAIAssistant` listens for AI responses containing `<DOCUMENT_REPLACE>` or `<DOCUMENT_WRITE>` tags.
    *   `onAIDocumentUpdate` callback in `CanvasEditorPage` handles these updates:
        *   `DOCUMENT_REPLACE`: Overwrites the entire `writingContent` with the AI's output.
        *   `DOCUMENT_WRITE`: Appends the AI's output to the existing `writingContent`.
    *   AI-generated content is styled with a user-selected font family using **Tailwind CSS classes** (e.g., `font-inter`) instead of inline styles, for better consistency and maintainability.
    *   **Specific Loading Feedback**: During AI document updates, the `aiDocumentAction` state in `CanvasEditorPage` is passed to `CanvasAIAssistant`. This allows the AI assistant's chat interface to display specific messages like "JudgiAI is appending to document..." or "JudgiAI is replacing document content..." instead of a generic "JudgiAI is thinking...", providing clearer user feedback during the AI's operation.
*   **Unsaved Changes**: The `CanvasEditorPage` tracks changes to `writingContent`, `aiChatHistory`, and `documentTitle` to warn users about unsaved work before navigating away. An auto-save mechanism is also implemented.
*   **Export Functionality**: Documents can be exported as `.docx` or `.pdf` using `docx` and `jspdf` libraries, respectively. The HTML content is converted to plain text (via Markdown) for these exports.

## 4. User Interface and Experience

*   **Responsive Sidebar**: A dynamic sidebar (`Sidebar.tsx`) provides navigation between Chat, Canvas, and Profile, and displays recent conversations/documents. It's responsive, collapsing on desktop and becoming a sheet on mobile.
*   **Theming**: The application uses a dark theme by default, with Tailwind CSS and custom CSS variables (`src/globals.css`) ensuring consistent styling.
*   **Loading Indicators**: `Square` icons with `animate-spin` are used as visual loading indicators for AI responses and document loading. These squares are now also integrated as a subtle brand element in backgrounds.
*   **Toast Notifications**: `sonner` is used for user feedback (success, error, loading messages).
*   **Markdown Rendering**: `react-markdown` with `remark-gfm` is used to render Markdown content in chat messages and AI assistant responses, ensuring rich text display.
*   **Accessibility**: `aria-label` attributes have been added to all icon-only buttons across the application for improved screen reader support.
*   **Code Maintainability**: The `parseAIResponse` function has been refactored into a shared utility (`src/utils/aiResponseParser.ts`) to centralize AI response parsing logic, improving code maintainability and scalability.
*   **Voice Input**: Integrated a `VoiceRecorder` component into chat input fields, allowing users to record audio, see a visual audio level, and transcribe it into the input box using AssemblyAI's REST API. **The `VoiceRecorder` component has been refactored to ensure robust lifecycle management, preventing premature stopping and correctly triggering transcription after audio collection. A `isTranscribingAudio` state has been added to disable input and display a loading spinner during the transcription process, providing clear user feedback.**
*   **Browser Retention/State Persistence**: The `useEffect` hooks in `ChatPage.tsx` and `CanvasEditorPage.tsx` have been refined to ensure that the component's state (chat messages, document content, etc.) is correctly loaded or reset based on the URL parameters (`conversationId` or `documentId`), preventing loss of context when navigating away and returning to a tab.
*   **Chat Flicker Fix**: Implemented `isInitializingNewChat` state and refined `useEffect` logic in `ChatPage.tsx` to prevent temporary flicker when starting a new chat.
*   **ScrollArea `viewportRef` Warning Fix**: Modified `src/components/ui/scroll-area.tsx` to explicitly prevent the `viewportRef` prop from being passed to the underlying DOM element rendered by `ScrollAreaPrimitive.Root`, resolving a React warning.
*   **Enhanced Landing Page**: The `LandingPage.tsx` has been significantly updated with world-class SaaS copy, a more engaging layout, and improved visual elements to create a first-class user experience.

This summary highlights the key technical components and their interactions, forming the foundation of the JudgiAI application.