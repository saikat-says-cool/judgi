"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const instructionsMarkdown = `
# 📚 JudgiAI User Guide: Your AI Partner for Legal Excellence

Welcome to JudgiAI, the intelligent AI workspace designed to revolutionize legal research, reasoning, and drafting for legal professionals and students. This guide will walk you through every feature, ensuring you harness the full power of JudgiAI.

---

## 🚀 Getting Started

1.  **Account Creation/Login**:
    *   Access JudgiAI via the landing page.
    *   Click "Get Started" or "Login" to proceed.
    *   You can sign up or log in securely using your email and password, or with your Google account.
    *   Once logged in, you'll be redirected to the main application interface.

2.  **Main Interface Overview**:
    *   **Sidebar (Left)**: Your primary navigation hub. It allows you to switch between the **Research Chat**, **Copilot Canvas**, **Profile Settings**, and this **Instructions** page. It also displays your recent chats and documents.
    *   **Main Content Area (Right)**: This area dynamically changes based on your sidebar selection, displaying either the chat interface or the canvas editor.

---

## 💬 Research Chat Interface

The Research Chat is your conversational AI partner for legal inquiries. Ask questions, get structured answers, and save key findings directly to your Canvas.

### Asking Questions

*   Simply type your legal question or query into the input field at the bottom of the chat.
*   Press \`Enter\` or click the \`Send\` button (paper airplane icon) to submit your query.

### Research Modes: Tailor Your AI's Depth

Before sending a message, you can select a research mode to control how deeply JudgiAI searches for information.

*   **No Research**:
    *   **Purpose**: For quick, general knowledge questions or when you want the AI to rely solely on its pre-trained knowledge.
    *   **When to Use**: Ideal for definitions, basic explanations, or brainstorming without needing external data.
*   **Moderate Research**:
    *   **Purpose**: The AI will perform a focused search, fetching up to **10 relevant legal documents** to inform its response.
    *   **When to Use**: Suitable for initial case exploration, understanding specific legal concepts with supporting precedents, or when you need a balanced overview.
*   **Deep Research**:
    *   **Purpose**: The AI conducts an extensive search, retrieving up to **20 legal documents** and **10 current news articles** to provide a comprehensive answer.
    *   **When to Use**: Essential for in-depth analysis, complex legal problems requiring broad context, or when current events might influence legal interpretation.

### AI Model Modes: Control AI's Thinking Process

Independently of research depth, you can choose how the AI processes your request.

*   **Auto**:
    *   **Purpose**: The standard, efficient AI model (`LongCat-Flash-Chat`) for quick and direct responses.
    *   **When to Use**: Most everyday queries, general information, or when speed is a priority.
*   **Deep Think**:
    *   **Purpose**: Activates a more analytical AI model (`LongCat-Flash-Thinking`) with an enhanced "thinking budget." This allows the AI to perform more complex reasoning and provide more detailed, nuanced responses.
    *   **When to Use**: For intricate legal problems, strategic advice, or when you need the AI to delve deeper into logical connections and implications.

### Interpreting AI Responses

*   **Structured Summaries**: AI responses are formatted for clarity, often including summaries of cases, statutes, or legal principles.
*   **Citations**: JudgiAI diligently includes citations for legal research results. These will appear as **Markdown links** (e.g., \`[Kesavananda Bharati v. State of Kerala](https://indiankanoon.org/doc/1551775/)\`). Click on these links to open the source document in a new tab for verification and deeper reading.
*   **Loading Indicators**: While JudgiAI is processing, you'll see a spinning square icon and detailed status messages (e.g., "Searching legal documents...", "Generating AI response...") to keep you informed.

### Voice Input

*   **Start Recording**: If the input field is empty, a microphone icon will appear. Click it to start recording your query.
*   **Audio Level Feedback**: A pulsating microphone icon provides visual feedback on your audio input level.
*   **Send/Cancel**: Click the \`Check\` icon to send your recorded message for transcription and AI processing, or the \`X\` icon to cancel the recording.
*   **Transcription Status**: A "Transcribing audio..." message will appear while your speech is being converted to text.

### Saving to Canvas

*   After an AI response, a \`Save to Canvas\` button (floppy disk icon) will appear below the message.
*   Clicking this button will open a dialog:
    *   **Select Existing Document**: Choose one of your existing documents from the list to append the AI's response to it.
    *   **Create New Document**: Enter a new title to create a brand new document in your Canvas, and the AI's response will be its initial content.
*   Click \`Save\` to complete the action.

---

## ✍️ Copilot Canvas (AI Writing Space)

The Copilot Canvas is your dedicated environment for drafting legal documents with live AI assistance.

### Creating or Opening Documents

*   **From Canvas Home**: Navigate to the "Canvas" tab in the sidebar. Here, you can:
    *   Click \`Create New Canvas\` to start a fresh document.
    *   Select any of your "Recent Canvases" to continue working on an existing document.
*   **From Chat**: Use the "Save to Canvas" feature in the Research Chat to create a new document or append to an existing one.

### Rich Text Editor

The left panel of the Canvas is your rich text editor, powered by TipTap. It supports comprehensive formatting without needing to switch modes.

*   **Basic Formatting**:
    *   **Bold**: \`B\` icon
    *   **Italic**: \`I\` icon
    *   **Underline**: \`U\` icon
    *   **Strikethrough**: \`S\` icon
    *   **Inline Code**: \`</>\` icon
*   **Block Types**:
    *   **Paragraph**: Default text.
    *   **Headings**: \`H1\`, \`H2\`, \`H3\` icons (via the \`Type\` dropdown).
    *   **Lists**: \`Bullet List\` and \`Ordered List\` icons.
    *   **Blockquote**: \`Quote\` icon.
*   **Text Alignment**:
    *   Align Left, Center, Right, Justify icons.
*   **Undo/Redo**: \`Undo\` and \`Redo\` icons for quick revisions.
*   **Highlight**: \`Highlight\` icon to apply text highlighting.
*   **Note**: Font family selection has been removed to maintain a consistent aesthetic.

### AI Assistant Chat (within Canvas)

The right panel is your dedicated AI Assistant, providing contextual help based on your document content.

*   **Asking Questions**: Type your questions or commands into the input field. The AI will use the content of your document as context.
*   **Drafting Actions**: Use the \`Drafting Actions\` dropdown for common legal drafting tasks:
    *   **Summarize Document**: Get a concise summary of your current document.
    *   **Draft as Petition**: Reformat your content into a legal petition structure.
    *   **Improve Legal Language**: Enhance the clarity and professionalism of your writing.
    *   **Expand Last Section**: Get the AI to elaborate on the most recent section of your document.
    *   **Suggest Next Argument**: Receive AI suggestions for logical next steps or arguments.
    *   **Suggest Precedents for Document**: Obtain relevant legal precedents with citations based on your content.
    *   **Generate Footnotes/Citations**: Ask the AI to review and add appropriate footnotes or citations directly into your document.

### AI Document Updates: How the AI Modifies Your Document

The AI Assistant can directly modify your document using special tags. You'll see a conversational message in the chat explaining what the AI has done.

*   **Replacing Content (\`<DOCUMENT_REPLACE>\`)**:
    *   **Action**: The AI will completely overwrite the entire content of your document with its new output.
    *   **When Used**: For major restructuring, polishing, significant edits, or when the AI needs to start fresh based on your command.
*   **Appending Content (\`<DOCUMENT_WRITE>\`)**:
    *   **Action**: The AI will add its new output to the very end of your existing document.
    *   **When Used**: For adding new sections, arguments, or continuations.
*   **AI Writing Indicator**: While the AI is actively modifying your document, a message like "JudgiAI is appending..." or "JudgiAI is replacing document content..." will appear at the bottom of the writing canvas, providing clear feedback.

### Document Management

*   **Document Title**: Edit the document title directly in the input field at the top of the editor.
*   **Auto-Save**: Your document content and AI chat history are automatically saved every 5 seconds when changes are detected.
*   **Manual Save**: Click the \`Save\` icon (floppy disk) at the top to manually save your changes at any time.
*   **Unsaved Changes Warning**: If you try to navigate away with unsaved changes, a dialog will prompt you to save or discard your work.
*   **Deleting Documents**: From the Canvas Home page, you can delete documents using the \`Trash2\` icon next to each document.

### Exporting Documents

*   Click the \`File Down\` icon at the top of the editor.
*   Choose either \`Download as DOCX\` or \`Download as PDF\` to export your document in the desired format.

---

## ⚙️ Sidebar Navigation

The sidebar provides quick access to key areas of the application.

*   **New Chat**: Start a fresh conversation in the Research Chat.
*   **Canvas**: Go to your Canvas Home page to manage documents.
*   **Profile**: Access your profile settings to update personal information.
*   **Instructions**: View this detailed user guide.
*   **Recent Chats**: Quickly jump back into your ongoing conversations.
*   **Recent Documents**: Access your recently edited legal documents.
*   **Expand/Collapse**: On desktop, click the \`Chevron Left/Right\` icon to expand or collapse the sidebar. On mobile, use the \`Menu\` icon to open/close the sidebar sheet.

---

## 👤 Profile Settings

Manage your personal information here.

*   **Access**: Click the \`Profile\` link in the sidebar.
*   **Update Details**: Edit your first name, last name, and country.
*   **Save Changes**: Click \`Save Changes\` to update your profile.
*   **Country Context**: Your specified country helps the AI provide more relevant legal context in its responses.

---

## 🔒 Security & Privacy

JudgiAI is built with your security in mind:

*   **Supabase Backend**: Leverages Supabase for robust authentication and database management.
*   **Row Level Security (RLS)**: Ensures that your data is private and only accessible by you.
*   **API Key Rotation**: Utilizes multiple API keys for external AI services (LongCat, Langsearch, AssemblyAI) and automatically rotates them to enhance reliability and manage rate limits.

---

## ✨ Tips for Best Results

*   **Be Clear and Specific**: The more precise your prompts, the better the AI's response.
*   **Experiment with Modes**: Try different Research and AI Model modes to find the best fit for your task.
*   **Review Critically**: Always review AI-generated content and research results for accuracy and relevance.
*   **Use Citations**: Leverage the provided citations to delve deeper into the source material.

---

We hope this guide helps you make the most of JudgiAI. Happy drafting and researching!
`;

const InstructionsContent: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 bg-background text-foreground">
      <div className="w-full max-w-4xl p-6 bg-card shadow-lg rounded-lg prose dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {instructionsMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default InstructionsContent;