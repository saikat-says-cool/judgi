# ⚙️ MVP Specification: AI Legal Copilot

## 🧭 1️⃣ Overview
**Product Name (working):** JudgiAI
**Tagline:** “Your AI partner for research, reasoning, and drafting.”
**Core Concept:**
A web-based AI workspace for lawyers and law students that combines:
- Conversational legal research (ChatGPT-style chat trained on Indian case law)
- AI-assisted drafting (a smart writing canvas with a live copilot)
Together, they create a seamless workflow — from asking → understanding → writing → exporting.

## 🎯 2️⃣ Primary User Segment
- **Law Students** — need to study cases quickly, summarize judgments, and write briefs.
- **Early-Career Lawyers / Associates** — need to find precedents, draft petitions, and prepare for court efficiently.
- (Future expansion): Law firms, research institutes, and corporate legal teams.

## 💡 3️⃣ Problem Statement
Legal professionals spend 60–70% of their time reading, researching, and reformatting legal documents.
- Current legal tools (Manupatra, SCC Online, Indian Kanoon) are keyword-based, not contextual.
- Word processors are isolated from legal databases, forcing constant switching between tools.
This results in:
- Wasted hours searching for precedents
- Missed relevant cases
- Manual, repetitive drafting
- Higher operational costs for firms

## 🚀 4️⃣ Solution Overview
JudgiAI combines AI-powered legal research and drafting into a single interface.
### 🔹 (A) Research Chat Interface
A conversational space where users can:
- Ask natural-language legal questions (“Show me major cases about Article 370.”)
- Get structured responses with citations and case summaries.
- Explore “Deep Think” or “Deeper Research” modes for multi-case analysis.
- Save findings directly into their workspace.

### 🔹 (B) Copilot Canvas (AI Writing Space)
A separate writing tab with a blank editor + live AI assistant that:
- Auto-completes arguments based on context.
- Suggests relevant precedents while typing.
- Reformats drafts into proper legal language or structure (petition, summary, etc.).
- Auto-generates footnotes/citations.
- Exports outputs to .docx / .pdf in one click.
Together, these two components form a closed research–drafting loop.

## 🧱 5️⃣ MVP Scope (Exactly What We’ll Build First)
We’ll build a functional MVP (not full product) focusing on core experience, not scale.
### 🧩 Core Features (MVP v1)
**Frontend**
- Web interface (Next.js / React + Tailwind)
- Left panel → Research Chat
- Right panel → Copilot Canvas (toggle view)
- “Mode” selector: Quick Lookup, Deep Think, Deeper Research
- Simple login (email / Google)
- “Save to Canvas” button
- “Export as .docx” button