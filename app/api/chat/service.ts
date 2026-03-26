/**
 * AI Agents Service – Multi-Agent Prompt Engineering Pipeline
 *
 * This service orchestrates four prompt engineering techniques:
 *
 *  1. Directional Stimulus Prompting  – enriches vague user inputs with domain
 *     keywords before any LLM call is made.
 *
 *  2. Chain-of-Thought (CoT)          – SRS generation is split into three
 *     explicit reasoning stages:
 *       • Planner Agent    → extracts stakeholders, goals, requirements
 *       • Generator Agent  → writes the full SRS with traceability links
 *       • Validator Agent  → scores the SRS and flags initial issues
 *
 *  3. Tree-of-Thoughts (ToT)          – post-generation conflict detection
 *     with look-ahead reasoning and backtrack-based resolution proposals.
 *
 *  4. Self-Consistency                – SRS evaluation runs across 3 parallel
 *     reasoning paths (IEEE, Security, UX); issues are majority-vote filtered.
 *
 * Deterministic heuristic checks (ambiguity word list, atomicity, completeness,
 * verifiability via LLM) are retained and applied on top of AI-derived scores
 * for the final weighted metric calculation.
 */

import { runPipeline } from '@/app/lib/prompts/promptEngine';
import { COT_SRS_PIPELINE } from '@/app/lib/prompts/cotPrompts';
import { evaluateWithSelfConsistency } from '@/app/lib/prompts/selfConsistencyPrompts';
import { injectDirectionalStimulus } from '@/app/lib/prompts/directionalStimulusPrompts';
import { detectConflictsWithToT } from '@/app/lib/prompts/totPrompts';

// ─────────────────────────────────────────────
// Public Types (unchanged interface for API consumers)
// ─────────────────────────────────────────────

export type SRSMetrics = {
    overall: number;
    completeness: number;
    consistency: number;
    unambiguity: number;
    traceability: number;
};

export type SRSIssue = {
    type: string;
    text: string;
    suggestion: string;
};

export type GenerateResponse = {
    content: string;
    metrics: SRSMetrics;
    issues: SRSIssue[];
    /** Diagnostic metadata exposed for research/debug purposes */
    pipeline?: {
        stimulusInjected: boolean;
        injectedKeywords: string[];
        conflictsDetected: number;
        agentsRun: string[];
    };
};

export type EvaluateResponse = {
    metrics: SRSMetrics;
    issues: SRSIssue[];
};

// ─────────────────────────────────────────────
// Main Service Class
// ─────────────────────────────────────────────

export class AIAgentsService {

    // ──────────────────────────────────────────
    // 1. SRS Generation (CoT + Stimulus + ToT)
    // ──────────────────────────────────────────

    /**
     * Generates an SRS document using the full multi-agent pipeline:
     *   Directional Stimulus → CoT Pipeline (Planner→Generator→Validator) → ToT Conflict Detection
     */
    static async generateSRS(
        idea: string,
        targetAudience: string,
        features: string,
        techStack?: string,
        additionalContext?: string
    ): Promise<GenerateResponse> {

        try {
            // ── Step A: Directional Stimulus Prompting ──────────────────────
            const {
                enrichedIdea,
                injectedStimuli,
                vaguenessReport,
            } = injectDirectionalStimulus(idea, features, additionalContext ?? '');

            console.log(
                `[AIAgentsService] Directional Stimulus: vague=${vaguenessReport.isVague}, ` +
                `injected=${injectedStimuli.length} keywords`
            );

            // ── Step B: CoT Pipeline (Planner → Generator → Validator) ──────
            const pipelineResults = await runPipeline(COT_SRS_PIPELINE, {
                idea: enrichedIdea,
                targetAudience: targetAudience || 'General Audience',
                features: features || 'Standard Features',
                techStack: techStack || '',
                additionalContext: additionalContext ?? '',
                previousOutputs: [],
            });

            // Extract outputs from each agent
            const generatorResult = pipelineResults.find(
                (r) => r.agentName === 'Generator Agent'
            );
            const validatorResult = pipelineResults.find(
                (r) => r.agentName === 'Validator Agent'
            );

            const srsContent: string =
                (generatorResult?.parsed as { content?: string })?.content ??
                generatorResult?.rawOutput ??
                '# Error\nSRS generation failed. Please try again.';

            const validatorData = validatorResult?.parsed as {
                metrics?: SRSMetrics;
                issues?: SRSIssue[];
            } | undefined;

            let metrics: SRSMetrics = validatorData?.metrics ?? {
                overall: 50,
                completeness: 50,
                consistency: 50,
                unambiguity: 50,
                traceability: 50,
            };

            let issues: SRSIssue[] = validatorData?.issues ?? [];

            // ── Step C: Apply Deterministic Heuristics ──────────────────────
            // These override/refine the AI-provided metric scores with
            // rule-based checks for extra reliability.
            metrics.completeness = Math.round(
                blendScores(this.checkCompleteness(srsContent) * 100, metrics.completeness)
            );
            metrics.consistency = Math.round(
                blendScores(this.checkAtomicity(srsContent) * 100, metrics.consistency)
            );
            metrics.unambiguity = Math.round(
                blendScores(this.checkAmbiguity(srsContent) * 100, metrics.unambiguity)
            );
            try {
                const verifiabilityScore = await this.checkVerifiability(srsContent);
                metrics.traceability = Math.round(
                    blendScores(verifiabilityScore * 100, metrics.traceability)
                );
            } catch {
                /* keep validator score if verifiability check fails */
            }

            // Weighted overall
            metrics.overall = Math.round(
                metrics.completeness * 0.2 +
                metrics.consistency * 0.2 +
                metrics.unambiguity * 0.2 +
                metrics.traceability * 0.4
            );

            // ── Step D: Tree-of-Thoughts Conflict Detection ──────────────────
            const conflictNodes = await detectConflictsWithToT(srsContent);
            const conflictIssues: SRSIssue[] = conflictNodes.map((c) => c.asIssue);
            issues = [...issues, ...conflictIssues];

            console.log(
                `[AIAgentsService] Pipeline complete. ` +
                `Agents: ${pipelineResults.map((r) => r.agentName).join(' → ')}. ` +
                `Conflicts detected: ${conflictNodes.length}`
            );

            return {
                content: srsContent,
                metrics,
                issues,
                pipeline: {
                    stimulusInjected: vaguenessReport.isVague,
                    injectedKeywords: injectedStimuli,
                    conflictsDetected: conflictNodes.length,
                    agentsRun: pipelineResults.map((r) => r.agentName),
                },
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[AIAgentsService] generateSRS failed:', message);
            return {
                content:
                    '# Error Generating SRS\nThere was a problem communicating with the AI service. Please try again.',
                metrics: { overall: 0, completeness: 0, consistency: 0, unambiguity: 0, traceability: 0 },
                issues: [],
            };
        }
    }

    // ──────────────────────────────────────────
    // 2. SRS Evaluation (Self-Consistency)
    // ──────────────────────────────────────────

    /**
     * Evaluates an SRS document using three parallel reasoning paths and
     * aggregates results with majority-vote issue filtering.
     */
    static async evaluateSRS(documentContent: string): Promise<EvaluateResponse> {
        try {
            const { metrics, issues } = await evaluateWithSelfConsistency(documentContent);

            // Apply deterministic overrides
            metrics.completeness = Math.round(
                blendScores(this.checkCompleteness(documentContent) * 100, metrics.completeness)
            );
            metrics.consistency = Math.round(
                blendScores(this.checkAtomicity(documentContent) * 100, metrics.consistency)
            );
            metrics.unambiguity = Math.round(
                blendScores(this.checkAmbiguity(documentContent) * 100, metrics.unambiguity)
            );
            try {
                const verifiabilityScore = await this.checkVerifiability(documentContent);
                metrics.traceability = Math.round(
                    blendScores(verifiabilityScore * 100, metrics.traceability)
                );
            } catch { /* keep self-consistency score */ }

            metrics.overall = Math.round(
                metrics.completeness * 0.2 +
                metrics.consistency * 0.2 +
                metrics.unambiguity * 0.2 +
                metrics.traceability * 0.4
            );

            return { metrics, issues };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[AIAgentsService] evaluateSRS failed:', message);
            return {
                metrics: { overall: 0, completeness: 0, consistency: 0, unambiguity: 0, traceability: 0 },
                issues: [],
            };
        }
    }

    // ──────────────────────────────────────────
    // 3. Deterministic Heuristic Helpers
    // ──────────────────────────────────────────

    private static checkAmbiguity(text: string): number {
        const ambiguousWords = [
            'fast', 'efficient', 'user-friendly', 'etc', 'appropriate',
            'soon', 'easy', 'simple', 'reasonable', 'flexible',
        ];

        let count = 0;
        ambiguousWords.forEach((word) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) count += matches.length;
        });

        const words = text.split(/\s+/).filter((w) => w.length > 0);
        const totalWords = words.length || 1;
        return Math.max(0, 1 - count / totalWords);
    }

    private static checkAtomicity(text: string): number {
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        if (sentences.length === 0) return 1;

        let multi = 0;
        sentences.forEach((s) => {
            // A sentence with "shall ... and" is likely compound (non-atomic)
            if (
                (s.toLowerCase().includes(' and ') &&
                    s.toLowerCase().includes('shall')) ||
                (s.toLowerCase().includes(' or ') &&
                    s.toLowerCase().includes('shall'))
            ) {
                multi++;
            }
        });

        return 1 - multi / sentences.length;
    }

    private static async checkVerifiability(text: string): Promise<number> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return 0.5;

        try {
            const response = await fetch(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            {
                                role: 'system',
                                content:
                                    'You are a requirements quality checker. Estimate what percentage of requirements in the document are testable and measurable. Return ONLY a decimal number between 0 and 1 (e.g. 0.85). No other text.',
                            },
                            { role: 'user', content: text },
                        ],
                        temperature: 0.1,
                    }),
                }
            );

            if (!response.ok) return 0.5;
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            const score = parseFloat(content);
            return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
        } catch {
            return 0.5;
        }
    }

    private static checkCompleteness(text: string): number {
        const requiredSections = [
            'functional',
            'non-functional',
            'constraints',
            'assumptions',
            'introduction',
            'scope',
        ];

        const lowerText = text.toLowerCase();
        const present = requiredSections.filter((sec) => lowerText.includes(sec));
        return present.length / requiredSections.length;
    }
}

// ─────────────────────────────────────────────
// Utility: Blend AI score with heuristic score
// ─────────────────────────────────────────────

/**
 * Blends a deterministic heuristic score with an AI-derived score.
 * The heuristic is given 40% weight; the AI score gets 60%.
 * This prevents either source from dominating completely.
 */
function blendScores(heuristic: number, aiScore: number): number {
    return heuristic * 0.4 + aiScore * 0.6;
}
