# AI-SRS Studio

AI-SRS Studio is an AI-assisted requirements-engineering application for generating and evaluating Software Requirements Specification (SRS) and Product Requirements Document (PRD) content. It combines a multi-agent prompt pipeline with deterministic quality checks and stores user projects, generated documents, evaluation metrics, and feedback in Supabase.

## Overview

The application helps software teams turn project ideas into structured requirements documents and then evaluate those documents for quality.

Its generation pipeline uses several prompt-engineering techniques:

```text
User project input
      |
      v
Directional Stimulus Prompting
      |
      v
Planner Agent
      |
      v
Generator Agent
      |
      v
Validator Agent
      |
      v
Tree-of-Thought conflict detection
      |
      v
Generated document + quality metrics + issues
```

Evaluation uses multiple reasoning passes with self-consistency, then combines AI output with deterministic checks.

## Features

- Generate SRS documents from project ideas and requirements
- Generate PRD content through the same multi-agent pipeline
- Planner, Generator, and Validator agent sequence
- Directional Stimulus Prompting for vague input enrichment
- Tree-of-Thought conflict detection
- Self-consistency evaluation across multiple reasoning paths
- Quality scoring for completeness, consistency, unambiguity, and traceability
- Deterministic checks blended with AI-generated scores
- Supabase email/password authentication
- User-scoped projects and generated documents
- Persisted evaluation metrics
- Feedback collection
- Rich document rendering and editing with Tiptap
- Markdown rendering with GitHub Flavored Markdown
- External document evaluation
- Import support for DOCX, PDF, Markdown, and plain text during evaluation
- Browser print/PDF export flow
- Light/dark theme support

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 16, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| AI Inference | Groq OpenAI-compatible API |
| Generation Model | `llama-3.3-70b-versatile` |
| Evaluation Model | `llama-3.1-8b-instant` |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Rich Text | Tiptap |
| Markdown | React Markdown, remark-gfm |
| Document Import | Mammoth, PDF.js |
| Theme | next-themes |

## Architecture

```text
Browser
  |
  +--> Supabase Auth
  |
  +--> Generate / Evaluate pages
             |
             v
       Next.js API routes
             |
             v
      AIAgentsService
             |
      +------+-----------------------------+
      |                                    |
      v                                    v
Groq multi-agent pipeline          Deterministic checks
      |                                    |
      +----------------+-------------------+
                       v
              Document + metrics
                       |
                       v
              Supabase PostgreSQL
```

Supabase Row Level Security policies associate projects and documents with authenticated users.

## Project Structure

```text
SRS/
├── app/
│   ├── Generate/                   # Document generation interface
│   ├── Evaluate/                   # Stored/external document evaluation
│   ├── Feedback/                   # Feedback interface
│   ├── Scores/                     # Evaluation score views
│   ├── api/
│   │   ├── generate/               # Generation route
│   │   └── chat/                   # AI service and evaluation route
│   ├── components/                 # Auth, editor, navigation, document UI
│   ├── lib/prompts/                # Prompt pipelines and techniques
│   └── utils/supabaseClient.ts     # Supabase browser client
├── setup.sql                       # Supabase schema and RLS setup
├── PRD_STUDIO_PROCESSES.md         # Detailed implementation/process notes
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase project
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/Temiawaye/SRS.git
cd SRS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Prepare Supabase

Run `setup.sql` in the Supabase SQL Editor. The script creates:

- `projects`
- `srs_documents`
- `evaluation_metrics`
- `feedbacks`
- Row Level Security policies linked to Supabase Auth users

Review the SQL before applying it to a production project.

### 4. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
GROQ_API_KEY=your_groq_api_key
```

The Supabase client also contains compatibility fallbacks for alternate publishable/anon variable names, but the variables above match the current error guidance and implementation.

Never expose `GROQ_API_KEY` in client-side code.

### 5. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Browser-safe Supabase publishable key |
| `GROQ_API_KEY` | Server-side key used by the AI prompt engine |

The Supabase client also checks `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_PUBLISHABLE_DEFAULT_KEY` as compatibility fallbacks.

## Available Scripts

```bash
npm run dev      # Start development mode
npm run build    # Create a production build
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Usage

### Generate a document

1. Sign in.
2. Open the Generate page.
3. Enter the project idea, target audience, key features, technology stack, and any additional context.
4. Choose the supported document flow.
5. Generate the document.
6. Review the generated content, quality metrics, and identified issues.
7. The project, document, and metrics are persisted to Supabase.

### Evaluate a document

The Evaluate page can assess an existing stored document or imported external content.

Supported imported formats include:

- `.docx`
- `.pdf`
- `.md`
- `.markdown`
- `.txt`

The evaluation produces metrics and actionable issues. The browser print flow can be used to save the rendered document as PDF.

## API / AI Pipeline

### Generation

The generation interface sends project context to the Next.js generation API, which invokes the multi-agent service.

The service performs:

1. Directional stimulus enrichment.
2. Planner-agent analysis.
3. Generator-agent document creation.
4. Validator-agent scoring.
5. Deterministic metric refinement.
6. Tree-of-Thought conflict detection.

### Evaluation

The evaluation route accepts document content and performs self-consistency evaluation using multiple reasoning paths, followed by deterministic score refinement.

The Groq API is called only from server-side code using `GROQ_API_KEY`.

## Database

`setup.sql` defines the core persistence model:

```text
auth.users
    |
    v
 projects
    |
    v
srs_documents
    |
    v
evaluation_metrics

auth.users
    |
    v
 feedbacks
```

RLS policies restrict project, document, and metric access to the owning user, with additional admin-oriented policy conditions defined in the setup script.

## Deployment

The project is compatible with Vercel or another Node.js platform that supports Next.js.

Before deployment:

1. Apply the database schema to the production Supabase project.
2. Configure the Supabase environment variables.
3. Add the server-only `GROQ_API_KEY`.
4. Configure Supabase authentication for the production origin.
5. Run `npm run build`.

## Screenshots

> Screenshots can be added here to showcase generation, document evaluation, quality scores, and the editor.

## Further Documentation

See `PRD_STUDIO_PROCESSES.md` for a detailed explanation of the generation pipeline, evaluation logic, persistence flow, and document rendering process.

## Contributing

1. Create a focused feature branch.
2. Make the required changes.
3. Run `npm run lint` and `npm run build`.
4. Commit with a descriptive message.
5. Push the branch and open a pull request.

## License

No license file is currently present in the repository.

## Author

Maintained by [Temiawaye](https://github.com/Temiawaye).
