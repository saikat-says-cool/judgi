# Welcome to JudgiAI

**JudgiAI: Your AI partner for research, reasoning, and drafting.**

JudgiAI is an intelligent web-based AI workspace designed for legal professionals and students. It seamlessly integrates AI-powered legal research and drafting into a single, intuitive interface, streamlining the workflow from asking questions to understanding, writing, and exporting legal documents.

## ✨ Key Features

*   **Research Chat Interface**: A conversational AI space where users can:
    *   Ask natural-language legal questions (e.g., "Show me major cases about Article 370.").
    *   Receive structured responses with citations and case summaries.
    *   Explore "Quick Lookup", "Deep Think", and "Deeper Research" modes for varying levels of analysis.
    *   Save findings directly into their Canvas workspace.
*   **Copilot Canvas (AI Writing Space)**: A dedicated writing environment with a live AI assistant that:
    *   Provides a rich text editor with comprehensive formatting options (bold, italic, underline, headings, lists, alignment, font selection).
    *   Offers on-demand drafting actions (e.g., summarize, reformat as petition, improve legal language, suggest arguments, suggest precedents, generate footnotes/citations).
    *   Allows users to control the font family of AI-generated content.
    *   Supports saving and loading documents with their associated AI chat history.
    *   Exports documents to `.docx` and `.pdf` formats.
*   **User Authentication & Profiles**: Secure login/signup via Supabase, with user profiles storing basic information like name and country for contextual AI responses.
*   **Responsive Design**: The application is designed to be fully responsive across various devices, featuring a dynamic sidebar for navigation.
*   **Real-time Updates**: Utilizes Supabase's real-time capabilities for instant updates to conversations and documents across the application.
*   **Robust AI Integration**: Powered by LongCat for conversational AI and Langsearch for legal document and news research, with intelligent API key rotation and detailed latency feedback.

## ⚙️ Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, React Router
*   **Backend/Database**: Supabase (Authentication, PostgreSQL Database, Realtime)
*   **AI Services**: LongCat API (AI Chat & Document Co-pilot), Langsearch API (Legal Research)
*   **Utilities**: `lucide-react` for icons, `react-markdown` for Markdown rendering, `docx` and `jspdf` for document exports.

## 🚀 Getting Started

To run this application locally:

1.  **Install Dependencies**: `npm install`
2.  **Start Development Server**: `npm run dev`

Ensure your Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are correctly configured.

---