/**
 * Chain-of-Thought (CoT) Prompts – PRD Generation Pipeline
 *
 * Technique: Chain-of-Thought (CoT)
 * ─────────────────────────────────
 * Generates a Product Requirements Document (PRD).
 *
 * Stages:
 *  1. Planner Agent   – Identifies problem space, primary user personas, user journeys, and core goals.
 *  2. Generator Agent – Writes the full PRD using the Planner's structured plan.
 *  3. Validator Agent – Reviews the PRD for issues and produces quality metrics.
 */

import type { PipelineStep, PipelineContext } from './promptEngine';

// ─────────────────────────────────── Stage 1 ───────────────────────────────────

export const prdPlannerStep: PipelineStep = {
  agentName: 'Planner Agent',

  buildMessages: (ctx: PipelineContext) => [
    {
      role: 'system',
      content: `You are the Planner Agent in a multi-agent PRD generation system.
Your ONLY job is to analyse a product idea and produce a structured product plan.

Think step by step:
1. What is the core problem being solved? What is the product vision?
2. Who are the primary user personas?
3. What are the key user journeys or flows?
4. What are the success metrics/KPIs for this product?
5. What are the out-of-scope non-goals for an MVP?

You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
{
  "problemStatement": "string",
  "vision": "string",
  "personas": [
    { "name": "string", "characteristics": "string", "needs": ["string"] }
  ],
  "userJourneys": [
    {
      "journey": "string",
      "steps": ["string"]
    }
  ],
  "successMetrics": ["string"],
  "nonGoals": ["string"]
}`,
    },
    {
      role: 'user',
      content: `Project Idea: ${ctx.idea}
Target Audience: ${ctx.targetAudience || 'General Audience'}
Key Features: ${ctx.features || 'Standard Features'}
Tech Stack: ${ctx.techStack || 'Not specified'}
Additional Context: ${ctx.additionalContext || 'None'}

Think step by step, then produce the structured product plan.`,
    },
  ],

  options: { temperature: 0.4, responseFormat: 'json_object' },
};

// ─────────────────────────────────── Stage 2 ───────────────────────────────────

export const prdGeneratorStep: PipelineStep = {
  agentName: 'Generator Agent',

  buildMessages: (ctx: PipelineContext) => {
    const plannerOutput = ctx.previousOutputs.find(
      (r) => r.agentName === 'Planner Agent'
    );
    const plan = plannerOutput?.rawOutput ?? '(No planner output available)';

    return [
      {
        role: 'system',
        content: `You are the Generator Agent in a multi-agent PRD generation system.
You have received a structured product plan from the Planner Agent.
Your job is to convert that plan into a complete, professional PRD document in Markdown.

Current Date: \${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Use this current date for any timestamps or dates requested in the document (like the Decision Log or Changelog).

Think step by step:
1. Outline the Problem Alignment and Vision.
2. Detail the User Personas and their needs.
3. Outline the User Journeys and Features.
4. Detail the Minimum Viable Product (MVP) vs Future Scope (Non-Goals).
5. Specify the Success Metrics.

The PRD MUST include these sections:
- 1. Overview
  - 1.1 Product Vision
  - 1.2 Problem Statement
  - 1.3 Product Summary
- 2. Goals and Success Metrics
  - 2.1 Goals
  - 2.2 Success Metrics (a table with columns: Metric, Target)
- 3. Target Audience & Personas
  - 3.1 Primary persona
  - 3.2 Secondary persona
  - 3.3 Out of Scope users
- 4. Product Features / MVP Scope
  - 4.1 Product Features
  - 4.2 MVP Scope
- 5. Architecture Overview (use Mermaid diagrams)
  - 5.1 High-level Architecture
  - 5.2 Data Model
- 6. User Journeys, Stories & Core Workflows (add Mermaid diagrams for flows after the write up)
  - 6.1 First-Time Setup
  - 6.2 Routine Interaction
  - 6.3 Proactive Nudge
  - 6.4 Detailed Onboarding Flow
- 7. Future Scope & Non-Goals
  - 7.1 Future Scope
  - 7.2 Non-Goals
- 8. Tech Stack & Dependencies
- 9. Decision Log (a table with columns: Decision, Outcome, Date)
- 10. Roadmap Sketch (a table with columns: Phase, Features, Timeline)
- 11. Glossary (a table with columns: Term, Definition)
- 12. Legal & Compliance
 - 12.1 Privacy Policy
 - 12.2 Terms of Service
 - 12.3 Minimum Age Requirement
 - 12.4 AI Provider Terms of Service compliance (if there is any)
 - 12.5 In-Product Disclaimer (a table with columns: context, disclaimer)
- 13. Changelog (a table with columns: Version, Date, Changes)

You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
{
  "content": "The full Markdown-formatted PRD document"
}`,
      },
      {
        role: 'user',
        content: `Original Project Input:
Idea: ${ctx.idea}
Target Audience: ${ctx.targetAudience || 'General'}
Key Features: ${ctx.features || 'Standard Features'}
Tech Stack: ${ctx.techStack || 'Not specified'}

Planner Agent Output (use this as your product blueprint):
${plan}

Think step by step, then write the full PRD document. Address the technical constraints or considerations based on the Tech Stack if provided.`,
      },
    ];
  },

  options: { temperature: 0.5, responseFormat: 'json_object' },
};

// ─────────────────────────────────── Stage 3 ───────────────────────────────────

export const prdValidatorStep: PipelineStep = {
  agentName: 'Validator Agent',

  buildMessages: (ctx: PipelineContext) => {
    const generatorOutput = ctx.previousOutputs.find(
      (r) => r.agentName === 'Generator Agent'
    );
    const prdContent =
      (generatorOutput?.parsed as { content?: string })?.content ??
      generatorOutput?.rawOutput ??
      '(No PRD content available)';

    return [
      {
        role: 'system',
        content: `You are the Validator Agent in a multi-agent PRD generation system.
Your job is to review the generated PRD for quality issues and produce quality metrics.

Think step by step:
1. Check completeness – does it clearly state the problem and define actionable features?
2. Check consistency – do the personas match the features and user journeys?
3. Check unambiguity – are success metrics actionable and clear?
4. Check traceability – does each feature tie back to a problem or persona?
5. Assign scores 0-100 for each dimension.
6. List concrete issues with actionable suggestions.

You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
{
  "metrics": {
    "overall": 0-100,
    "completeness": 0-100,
    "consistency": 0-100,
    "unambiguity": 0-100,
    "traceability": 0-100
  },
  "issues": [
    {
      "type": "string (e.g. 'ambiguity', 'completeness')",
      "text": "description of the issue",
      "suggestion": "actionable fix"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Please review this generated PRD and produce quality metrics and a list of issues.

${prdContent}

Think step by step, then return your validation results.`,
      },
    ];
  },

  options: { temperature: 0.2, responseFormat: 'json_object' },
};

/** Ordered CoT pipeline: Planner → Generator → Validator */
export const COT_PRD_PIPELINE: PipelineStep[] = [
  prdPlannerStep,
  prdGeneratorStep,
  prdValidatorStep,
];
