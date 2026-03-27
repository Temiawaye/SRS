/**
 * Chain-of-Thought (CoT) Prompts – SRS Generation Pipeline
 *
 * Technique: Chain-of-Thought (CoT)
 * ─────────────────────────────────
 * Instead of asking the LLM to "write an SRS" in one shot, we break the task
 * into three explicit reasoning stages. Each stage's output feeds the next,
 * forcing the model to lay out its thinking before committing to a section.
 *
 * Stages:
 *  1. Planner Agent   – Identifies stakeholders, goals, and raw requirements
 *  2. Generator Agent – Writes the full SRS using the Planner's structured plan
 *  3. Validator Agent – Reviews the SRS for issues and produces quality metrics
 *
 * Why this improves traceability:
 *  Every functional requirement in the Generator output is anchored to a
 *  stakeholder goal identified by the Planner, making the link explicit
 *  and machine-readable.
 */

import type { PipelineStep, PipelineContext } from './promptEngine';

// ─────────────────────────────────── Stage 1 ───────────────────────────────────

export const plannerStep: PipelineStep = {
  agentName: 'Planner Agent',

  buildMessages: (ctx: PipelineContext) => [
    {
      role: 'system',
      content: `You are the Planner Agent in a multi-agent SRS generation system.
Your ONLY job is to analyse a project description and produce a structured plan.

Think step by step:
1. Who are the primary and secondary stakeholders?
2. What are each stakeholder's high-level goals and success criteria?
3. What functional capabilities must the system provide to reach those goals?
4. What non-functional constraints (performance, security, compliance) apply?
5. Are there any known ambiguities or unknowns to flag for the Generator?

You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
{
  "stakeholders": [
    { "name": "string", "role": "string", "goals": ["string"] }
  ],
  "functionalAreas": [
    {
      "area": "string (e.g. Authentication)",
      "linkedStakeholders": ["string"],
      "rawRequirements": ["string – must be specific and testable"]
    }
  ],
  "nonFunctionalConstraints": ["string"],
  "openAmbiguities": ["string"]
}`,
    },
    {
      role: 'user',
      content: `Project Idea: ${ctx.idea}
Target Audience: ${ctx.targetAudience || 'General Audience'}
Key Features: ${ctx.features || 'Standard Features'}
Tech Stack: ${ctx.techStack || 'Not specified — infer appropriate technologies'}
Additional Context: ${ctx.additionalContext || 'None'}

Think step by step, then produce the structured plan. Where a Tech Stack is specified, ensure that the functional and non-functional requirements reflect the capabilities and constraints of those specific technologies.`,
    },
  ],

  options: { temperature: 0.4, responseFormat: 'json_object' },
};

// ─────────────────────────────────── Stage 2 ───────────────────────────────────

export const generatorStep: PipelineStep = {
  agentName: 'Generator Agent',

  buildMessages: (ctx: PipelineContext) => {
    const plannerOutput = ctx.previousOutputs.find(
      (r) => r.agentName === 'Planner Agent'
    );
    const plan = plannerOutput?.rawOutput ?? '(No planner output available)';

    return [
      {
        role: 'system',
        content: `You are the Generator Agent in a multi-agent SRS generation system.
You have received a structured requirements plan from the Planner Agent.
Your job is to convert that plan into a complete, professional SRS document in Markdown.

Think step by step:
1. Map each Planner functional area to a numbered SRS section.
2. Specify requirements in sufficient detail to enable designers to design a system to satisfy those requirements and testers to verify requirements
3. For every requirement, reference the stakeholder goal it satisfies using the pattern [TRACES: stakeholder-name].
4. Requirements should include, at a minimum, a description of every input (stimulus) into the system, every output (response) from the system, and all functions performed by the system in response to an input or in support of an output
 4.1 Requirements should have characteristics of high quality requirements
 4.2 Requirements should be cross-referenced to their source.
 4.3 Requirements should be uniquely identifiable
 4.4 Requirements should be organized to maximize readability
5. Write Non-Functional Requirements from the planner's constraints list.
6. Add an Assumptions & Dependencies section addressing the planner's open ambiguities.
7. Ensure requirements use precise, measurable language (avoid "fast", "user-friendly", "etc.").

The SRS MUST include these sections:
- 1. Introduction
  - 1.1 Purpose
  - 1.2 Scope
  - 1.3 Definitions
  - 1.4 References  
  - 1.5. Overview
  - 1.6. Risk Analysis
- 2. Overall Description
  - 2.1 System Perspective
  - 2.2 User Classes
  - 2.3 Operating Environment
  - 2.4 Constraints
  - 2.5 Assumptions & Dependencies
- 3. Specific Requirements
    - 3.1 Functional Requirements (numbered as FR-001, FR-002, …)
    - 3.2 Non-Functional Requirements (numbered as NFR-001, NFR-002, …)
    - 3.3 Data Requirements
    - 3.4 Performance Requirements
    - 3.5 Business Rules
    - 3.6 Data Model
- 4. External Interfaces
    - 4.1 User Interface (UI)
    - 4.2 Hardware Interfaces
    - 4.3 Software Interfaces
    - 4.4 Communication Interfaces
- 5. System Features
    - 5.1 Description
    - 5.2 What the feature does
    - 5.3 Inputs
    - 5.4 User prompt 
    - 5.5 Processing
    - 5.6 AI generates structured requirements
    - 5.7 Outputs
    - 5.8 Completed SRS document
    - 5.9 Requirements
    - 5.10 FRs tied to this feature

You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
{
  "content": "The full Markdown-formatted SRS document"
}`,
      },
      {
        role: 'user',
        content: `Original Project Input:
Idea: ${ctx.idea}
Target Audience: ${ctx.targetAudience || 'General Audience'}
Key Features: ${ctx.features || 'Standard Features'}
Tech Stack: ${ctx.techStack || 'Not specified'}

Planner Agent Output (use this as your blueprint):
${plan}

Think step by step, then write the full SRS document. Where the Tech Stack is specified, reference it in relevant sections (e.g., system architecture constraints, API protocol choices, database requirements, deployment environment) and write requirements that are specific to those technologies.`,
      },
    ];
  },

  options: { temperature: 0.5, responseFormat: 'json_object' },
};

// ─────────────────────────────────── Stage 3 ───────────────────────────────────

export const validatorStep: PipelineStep = {
  agentName: 'Validator Agent',

  buildMessages: (ctx: PipelineContext) => {
    const generatorOutput = ctx.previousOutputs.find(
      (r) => r.agentName === 'Generator Agent'
    );
    const srsContent =
      (generatorOutput?.parsed as { content?: string })?.content ??
      generatorOutput?.rawOutput ??
      '(No SRS content available)';

    return [
      {
        role: 'system',
        content: `You are the Validator Agent in a multi-agent SRS generation system.
Your job is to review the generated SRS for quality issues and produce quality metrics.

Think step by step:
1. Check completeness – are all required sections present?
2. Check consistency – do any requirements contradict each other?
3. Check unambiguity – are there vague terms that need precision?
4. Check traceability – does every functional requirement have a [TRACES: …] link?
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
      "type": "string (e.g. 'ambiguity', 'completeness', 'traceability', 'consistency')",
      "text": "description of the issue",
      "suggestion": "actionable fix"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Please review this generated SRS and produce quality metrics and a list of issues.

${srsContent}

Think step by step, then return your validation results.`,
      },
    ];
  },

  options: { temperature: 0.2, responseFormat: 'json_object' },
};

/** Ordered CoT pipeline: Planner → Generator → Validator */
export const COT_SRS_PIPELINE: PipelineStep[] = [
  plannerStep,
  generatorStep,
  validatorStep,
];
