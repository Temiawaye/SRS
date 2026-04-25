# PRD Studio - Detailed Code & Processes Documentation

This document provides a highly detailed explanation of every core process and the precise code mechanisms used to achieve the main goal of PRD Studio: generating, evaluating, and managing Software Requirements Specification (SRS) documents.

## 1. The Main Goal: Multi-Agent AI Document Generation 
The cornerstone of PRD Studio is the generation of rigorous SRS documents via an orchestrated multi-agent Artificial Intelligence pipeline. Instead of relying on a single prompt, the system chains together distinct AI "agents" sequentially, giving each a specific responsibility. 

### The User Interface Entry Point (`app/Generate/page.tsx`)
The generation process starts at the frontend. The `Generate` component gathers user parameters:
- `projectName`
- `idea` (Project Outline)
- `targetAudience`
- `features` (Key Highlights)
- `techStack`
- `context` (Additional constraints)

Once the user clicks generate, the frontend triggers:
```typescript
const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, targetAudience, features, techStack, context })
});
```

### The AI Pipeline Orchestrator (`app/lib/prompts/promptEngine.ts`)
The server delegates the workload to the core prompt engine. The prompt engine (`runPipeline` function) sequences the agent calls, natively enforcing **Chain-of-Thought handoff**. 

```typescript
export async function runPipeline(
    steps: PipelineStep[],
    ctx: PipelineContext
): Promise<PipelineStepResult[]> {
    const results: PipelineStepResult[] = [];
    for (const step of steps) {
        // Build prompt with context incorporating *previous* agents' outputs
        const messages = step.buildMessages({ ...ctx, previousOutputs: results });
        
        // Execute Groq LLM API Call
        const raw = await callGroq(messages, step.options);
        
        // Optionally parse JSON structure
        let parsed: Record<string, unknown> | undefined;
        if (step.parseOutput) parsed = step.parseOutput(raw);

        // Store result for the next agent in the pipeline sequence
        results.push({ agentName: step.agentName, rawOutput: raw, parsed });
    }
    return results;
}
```
The application uses the `llama-3.3-70b-versatile` model hosted on the **Groq API** (`https://api.groq.com/openai/v1/chat/completions`) for nearly instantaneous inference.

### Sequence of AI Agents (`app/api/chat/service.ts`)
Within `AIAgentsService.generateSRS()`, the pipeline executes in exactly this order:

1. **Directional Stimulus Prompting:** 
   *Code Check:* `injectDirectionalStimulus(idea, features, additionalContext)`
   *Purpose:* Analyzes the user's initial prompt. If it detects vagueness, it enriches the prompt by injecting standard domain keywords (e.g., if you say "an app for pictures," it injects "image processing, cloud storage, caching").

2. **Planner Agent:** 
   *Purpose:* The first step in the Chain-of-Thought (`COT_SRS_PIPELINE`). The planner extracts stakeholders, high-level goals, and system boundaries entirely in JSON format, bypassing markdown generation constraints.

3. **Generator Agent:** 
   *Purpose:* Given the Planner's JSON output, the Generator constructs the full structural Markdown of the SRS, guaranteeing robust traceability mapping. 

4. **Validator Agent:** 
   *Purpose:* Reviews the Generator's output, scoring the initial output and identifying potential flaws or omissions.

5. **Conflict Detection via Tree-of-Thoughts (`detectConflictsWithToT`):**
   *Purpose:* Runs independent post-checks spanning specific branches of the generated tree to identify conflicting requirements (e.g., highly secure vs zero-latency caching).

### Deterministic Heuristic Merging (`AIAgentsService`)
To avoid absolute reliance on non-deterministic LLM scoring, the application applies deterministic logic fallbacks:
```typescript
metrics.completeness = Math.round(
    blendScores(this.checkCompleteness(srsContent) * 100, metrics.completeness)
);
```
Where `blendScores()` weights 40% towards a rigid code check (presence of standard format headers, atomic "shall" parsing logic, evaluating for ambiguous phrasing) and 60% towards the AI Validator's valuation.

## 2. Authentication & Data Persistence Flow
Once a document is generated, the state and text content must be securely mapped to the user. 

### Data Layer Execution (`app/Generate/page.tsx` & `app/utils/supabaseClient.ts`)
The Supabase SDK integrates seamlessly with Next.js components: 

```typescript
// Insert into Projects Table
const { data: projectData } = await supabase
    .from('projects')
    .insert([{ user_id: user.id, title: projectTitle, description: idea }])
    .select('id').single();

// Map SRS Document to Project ID
const { data: srsDocData } = await supabase
    .from('srs_documents')
    .insert([{ project_id: projectData.id, content: data, version: 1 }])
    .select('id').single();

// Store deterministic & AI evaluations 
await supabase.from('evaluation_metrics').insert([{
    srs_id: srsDocData.id,
    completeness_score: data.metrics.completeness,
    consistency_score: data.metrics.consistency,
    unambiguity_score: data.metrics.unambiguity,
    traceability_score: data.metrics.traceability
}]);
```

### User Registration & Authorization (`app/login/page.tsx`)
User management relies on `supabase.auth`. The custom components invoke native Supabase hooks enforcing structured security matching.
```typescript
const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username }
    },
});
```
*Note: A strict password regex ensures minimum security standards on client payload execution prior to calling Supabase endpoints.*

## 3. UI Document Rendering and PDF Formatting (`app/components/SrsDocument.tsx`)
The final piece of the PRD Studio architecture involves returning the user their document safely mapped against a reliable styling guideline.

1. **Markdown Parsing:** The raw string output from the LLMs is pumped into the `ReactMarkdown` library with `remarkGfm` plugins to construct GitHub Flavored Markdown (which natively supports tables, lists, and strict formatting rules required for SRS documentation).
2. **Dynamic Table of Contents:** The `SrsDocument` extracts TOC values iteratively over the generation strings parsing literal `#` heading hashes line-by-line:
   ```typescript
   for (const line of content.split('\n')) {
       const h2Match = line.match(/^##\s+(.+)/);
       const h1Match = line.match(/^#\s+(.+)/);
       // Push into an array of TOC objects representing hierarchical document trees 
   }
   ```
3. **PDF Export functionality:** The PRD Studio bypasses complex dependencies (like jsPDF) and delegates natively to `window.print()`. Custom CSS hooks (`@media print`) are utilized to manipulate the internal UI layout (hiding Navigation Headers, Sidebars, UI controls, and removing scrolling constraints)—allowing browsers structurally to map and output it perfectly to physical PDF pages. 
