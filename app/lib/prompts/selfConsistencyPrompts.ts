/**
 * Self-Consistency Prompts – Quality Evaluation
 *
 * Technique: Self-Consistency
 * ────────────────────────────
 * Running a single LLM evaluation pass risks false negatives where the model
 * "lets a vague requirement slide". To combat this, we run THREE independent
 * evaluation passes using different reasoning personas/paths:
 *
 *   Path A – IEEE 29148 Standards Reviewer (technical precision)
 *   Path B – Security & Privacy Domain Expert
 *   Path C – End-User / Usability Advocate
 *
 * An issue is only reported as "confirmed" if ≥ 2 out of 3 paths flag it.
 * Metric scores are averaged across all three passes.
 *
 * Why this matters:
 *   Dramatically reduces hallucinations and single-pass blind spots.
 *   A requirement that only one path declares ambiguous is likely a
 *   borderline case; one that all three flag is definitively a problem.
 */

import { callGroq } from './promptEngine';
import type { GroqMessage } from './promptEngine';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type EvalMetrics = {
    overall: number;
    completeness: number;
    consistency: number;
    unambiguity: number;
    traceability: number;
};

export type EvalIssue = {
    type: string;
    text: string;
    suggestion: string;
    /** Internal: how many reasoning paths flagged this issue */
    votes?: number;
    /** Internal: which paths flagged it */
    flaggedBy?: string[];
};

export type EvalPassResult = {
    pathName: string;
    metrics: EvalMetrics;
    issues: EvalIssue[];
};

export type ConsistencyEvalResult = {
    metrics: EvalMetrics;
    issues: EvalIssue[];
    pathResults: EvalPassResult[];
};

// ─────────────────────────────────────────────
// Shared JSON schema instruction (injected into every path)
// ─────────────────────────────────────────────
const JSON_SCHEMA_INSTRUCTION = `You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
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
      "type": "string (e.g. 'ambiguity', 'completeness', 'security', 'usability')",
      "text": "precise description of the issue citing the specific requirement",
      "suggestion": "actionable, specific fix"
    }
  ]
}`;

// ─────────────────────────────────────────────
// Reasoning Path Definitions
// ─────────────────────────────────────────────

function buildPathAMessages(documentContent: string): GroqMessage[] {
    return [
        {
            role: 'system',
            content: `You are an IEEE 29148-certified SRS reviewer.
Your evaluation lens is technical precision and standards compliance.

Think step by step:
1. Check whether all required SRS sections per IEEE 29148 are present.
2. Are functional requirements numbered and uniquely identifiable?
3. Are requirements written using "shall" (mandatory) vs "should" (optional) correctly?
4. Are there measurable acceptance criteria for non-functional requirements?
5. Identify any requirements that are compound (violate atomicity).

${JSON_SCHEMA_INSTRUCTION}`,
        },
        {
            role: 'user',
            content: `Evaluate the following SRS document from the perspective of IEEE 29148 standards compliance. Think step by step before scoring.

${documentContent}`,
        },
    ];
}

function buildPathBMessages(documentContent: string): GroqMessage[] {
    return [
        {
            role: 'system',
            content: `You are a Security & Privacy domain expert evaluating an SRS.
Your evaluation lens is security risks, data protection, and compliance.

Think step by step:
1. Does the document address authentication and authorisation requirements?
2. Are data retention, privacy, and GDPR/CCPA concerns addressed?
3. Are error-handling and exception scenarios specified?
4. Are there requirements for audit logging, penetration testing, or encryption standards?
5. Flag any requirement that could introduce a security vulnerability if implemented naively.

${JSON_SCHEMA_INSTRUCTION}`,
        },
        {
            role: 'user',
            content: `Evaluate the following SRS document from a Security & Privacy perspective. Think step by step before scoring.

${documentContent}`,
        },
    ];
}

function buildPathCMessages(documentContent: string): GroqMessage[] {
    return [
        {
            role: 'system',
            content: `You are an End-User Advocate and UX expert evaluating an SRS.
Your evaluation lens is usability, accessibility, and clarity for the intended audience.

Think step by step:
1. Are user stories or use-case references included for functional requirements?
2. Are accessibility requirements (WCAG 2.1) considered?
3. Is the language clear enough for a non-technical stakeholder to review?
4. Are error messages and fallback states described?
5. Flag any requirement that a real user would find confusing or incomplete.

${JSON_SCHEMA_INSTRUCTION}`,
        },
        {
            role: 'user',
            content: `Evaluate the following SRS document from an End-User and UX perspective. Think step by step before scoring.

${documentContent}`,
        },
    ];
}

// ─────────────────────────────────────────────
// Aggregation Logic
// ─────────────────────────────────────────────

/**
 * Merges issues from 3 reasoning paths using majority voting.
 * An issue is included in the final list only if ≥ 2 paths flagged it,
 * or if it is critical enough that even 1 vote warrants inclusion
 * (type === 'security').
 */
function aggregateIssues(passResults: EvalPassResult[]): EvalIssue[] {
    // Group issues by approximate similarity (normalise text)
    const issueMap = new Map<string, EvalIssue & { votes: number; flaggedBy: string[] }>();

    for (const pass of passResults) {
        for (const issue of pass.issues) {
            // Create a simplified key: type + first 60 chars of text
            const key = `${issue.type}::${issue.text.slice(0, 60).toLowerCase().trim()}`;

            if (issueMap.has(key)) {
                const existing = issueMap.get(key)!;
                existing.votes += 1;
                existing.flaggedBy.push(pass.pathName);
            } else {
                issueMap.set(key, {
                    ...issue,
                    votes: 1,
                    flaggedBy: [pass.pathName],
                });
            }
        }
    }

    // Keep issues flagged by ≥ 2 paths OR single-path security issues
    return Array.from(issueMap.values()).filter(
        (issue) => issue.votes >= 2 || issue.type?.toLowerCase() === 'security'
    );
}

/** Averages metric scores across all evaluation passes */
function averageMetrics(passResults: EvalPassResult[]): EvalMetrics {
    const count = passResults.length || 1;
    const sum = passResults.reduce(
        (acc, p) => ({
            overall: acc.overall + p.metrics.overall,
            completeness: acc.completeness + p.metrics.completeness,
            consistency: acc.consistency + p.metrics.consistency,
            unambiguity: acc.unambiguity + p.metrics.unambiguity,
            traceability: acc.traceability + p.metrics.traceability,
        }),
        { overall: 0, completeness: 0, consistency: 0, unambiguity: 0, traceability: 0 }
    );

    return {
        overall: Math.round(sum.overall / count),
        completeness: Math.round(sum.completeness / count),
        consistency: Math.round(sum.consistency / count),
        unambiguity: Math.round(sum.unambiguity / count),
        traceability: Math.round(sum.traceability / count),
    };
}

// ─────────────────────────────────────────────
// Main Self-Consistency Evaluator
// ─────────────────────────────────────────────

const PATH_BUILDERS: { name: string; build: (doc: string) => GroqMessage[] }[] = [
    { name: 'IEEE Standards Reviewer', build: buildPathAMessages },
    { name: 'Security & Privacy Expert', build: buildPathBMessages },
    { name: 'End-User Advocate', build: buildPathCMessages },
];

/**
 * Evaluates an SRS document using three independent reasoning paths in parallel.
 * Issues are aggregated with majority-vote logic, and metrics are averaged.
 */
export async function evaluateWithSelfConsistency(
    documentContent: string
): Promise<ConsistencyEvalResult> {
    const passPromises = PATH_BUILDERS.map(async (path) => {
        const messages = path.build(documentContent);
        const raw = await callGroq(messages, {
            temperature: 0.2,
            responseFormat: 'json_object',
        });

        let parsed: { metrics: EvalMetrics; issues: EvalIssue[] };
        try {
            parsed = JSON.parse(raw);
        } catch {
            console.warn(`[Self-Consistency] Failed to parse output from ${path.name}`);
            parsed = {
                metrics: { overall: 50, completeness: 50, consistency: 50, unambiguity: 50, traceability: 50 },
                issues: [],
            };
        }

        return {
            pathName: path.name,
            metrics: parsed.metrics,
            issues: parsed.issues ?? [],
        } as EvalPassResult;
    });

    const pathResults = await Promise.all(passPromises);
    const metrics = averageMetrics(pathResults);
    const issues = aggregateIssues(pathResults);

    // Recalculate overall from component scores (weighted)
    metrics.overall = Math.round(
        metrics.completeness * 0.2 +
        metrics.consistency * 0.2 +
        metrics.unambiguity * 0.2 +
        metrics.traceability * 0.4
    );

    return { metrics, issues, pathResults };
}
