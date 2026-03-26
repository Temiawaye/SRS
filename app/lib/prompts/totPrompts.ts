/**
 * Tree-of-Thoughts (ToT) Prompts – Conflict Detection & Resolution
 *
 * Technique: Tree-of-Thoughts (ToT)
 * ──────────────────────────────────
 * When requirements conflict with each other (e.g. "highly secure" vs
 * "zero-latency login"), a single LLM pass cannot look ahead to see the
 * downstream consequences of accepting both as-is.
 *
 * Tree-of-Thoughts solves this by asking the model to:
 *  1. ENUMERATE candidate conflict pairs in the SRS
 *  2. EVALUATE each conflict's severity and downstream impact using look-ahead
 *  3. BACKTRACK and propose a reconciled requirement or flag as unresolved
 *
 * This produces a list of ConflictNode objects that are merged into the `issues`
 * array returned by generateSRS, with type === "conflict".
 *
 * Classic conflict patterns detected:
 *  - Performance vs Security (latency vs encryption overhead)
 *  - Scalability vs Consistency (CAP theorem trade-offs)
 *  - Usability vs Compliance (simplified UX vs regulatory requirements)
 *  - Cost vs Reliability (redundancy vs budget constraints)
 */

import { callGroq } from './promptEngine';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConflictNode = {
    /** IDs or short descriptions of the two conflicting requirements */
    requirementA: string;
    requirementB: string;
    /** Nature of the trade-off */
    conflictDescription: string;
    /** Look-ahead: what goes wrong at implementation time if both are kept */
    downstreamImpact: string;
    severity: ConflictSeverity;
    /** Proposed reconciled requirement (if model can find one), else null */
    resolution: string | null;
    /** If true, the conflict cannot be automatically resolved */
    requiresHumanDecision: boolean;
    /** Formatted as SRS issue for the issues array */
    asIssue: {
        type: 'conflict';
        text: string;
        suggestion: string;
    };
};

type ToTRawResult = {
    conflicts: {
        requirementA: string;
        requirementB: string;
        conflictDescription: string;
        downstreamImpact: string;
        severity: ConflictSeverity;
        resolution: string | null;
        requiresHumanDecision: boolean;
    }[];
};

// ─────────────────────────────────────────────
// Tree-of-Thoughts Prompt
// ─────────────────────────────────────────────

function buildToTMessages(srsContent: string) {
    return [
        {
            role: 'system' as const,
            content: `You are a Requirements Conflict Analyser using Tree-of-Thoughts reasoning.

Your task is to detect conflicting requirements in an SRS document and evaluate their impact.

Follow this structured thinking process:

STEP 1 – ENUMERATE: List all pairs of requirements that may be in tension with each other.
Common conflict patterns:
  • Performance vs Security (e.g., "< 100ms response" vs "end-to-end encryption")
  • Scalability vs Consistency (e.g., "global availability" vs "ACID transactions")
  • Usability vs Compliance (e.g., "one-click login" vs "MFA required")
  • Cost vs Reliability (e.g., "minimal infrastructure cost" vs "99.99% uptime")

STEP 2 – EVALUATE: For each candidate conflict pair, reason about:
  a) Is this a real conflict or just a tension that good engineering can resolve?
  b) What is the downstream impact if both requirements are kept as-is?
  c) How severe is the conflict? (LOW / MEDIUM / HIGH / CRITICAL)

STEP 3 – BACKTRACK & RESOLVE: For each confirmed conflict:
  a) Propose a reconciled requirement that satisfies both constraints partially, OR
  b) Mark it as requiresHumanDecision = true if no automated resolution exists.

You MUST respond in pure JSON matching this exact structure (no markdown wrapping):
{
  "conflicts": [
    {
      "requirementA": "Exact text or ID of first requirement",
      "requirementB": "Exact text or ID of second requirement",
      "conflictDescription": "Why these two requirements are in tension",
      "downstreamImpact": "What happens at implementation if both are kept unchanged",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "resolution": "Proposed reconciled requirement text, or null if unresolvable",
      "requiresHumanDecision": true | false
    }
  ]
}

If no conflicts are found, return: { "conflicts": [] }`,
        },
        {
            role: 'user' as const,
            content: `Analyse the following SRS document for conflicting requirements using Tree-of-Thoughts.

Think through each potential conflict step by step before committing to your answer.

${srsContent}`,
        },
    ];
}

// ─────────────────────────────────────────────
// Main ToT Conflict Detector
// ─────────────────────────────────────────────

/**
 * Runs Tree-of-Thoughts conflict detection on a generated SRS document.
 * Returns an array of ConflictNode objects (empty if no conflicts detected).
 */
export async function detectConflictsWithToT(
    srsContent: string
): Promise<ConflictNode[]> {
    const messages = buildToTMessages(srsContent);

    let raw: string;
    try {
        raw = await callGroq(messages, {
            temperature: 0.3,
            responseFormat: 'json_object',
        });
    } catch (err) {
        console.error('[ToT] Failed to call Groq for conflict detection:', err);
        return [];
    }

    let parsed: ToTRawResult;
    try {
        parsed = JSON.parse(raw);
    } catch {
        console.warn('[ToT] Failed to parse conflict detection output.');
        return [];
    }

    if (!Array.isArray(parsed?.conflicts)) return [];

    return parsed.conflicts.map((c) => ({
        requirementA: c.requirementA,
        requirementB: c.requirementB,
        conflictDescription: c.conflictDescription,
        downstreamImpact: c.downstreamImpact,
        severity: c.severity ?? 'MEDIUM',
        resolution: c.resolution ?? null,
        requiresHumanDecision: c.requiresHumanDecision ?? false,
        asIssue: {
            type: 'conflict' as const,
            text: `[${c.severity ?? 'MEDIUM'} CONFLICT] ${c.conflictDescription} — Between: "${c.requirementA}" and "${c.requirementB}". Downstream impact: ${c.downstreamImpact}`,
            suggestion: c.resolution
                ? `Reconcile as: "${c.resolution}"`
                : 'This conflict requires a human stakeholder decision before implementation.',
        },
    }));
}
