/**
 * Prompt Engine – Core orchestrator for the multi-agent prompt pipeline.
 *
 * Defines shared types used across all prompt engineering techniques and
 * provides a `runPipeline` helper that sequences agent calls, forwarding
 * each stage's output to the next as context (Chain-of-Thought handoff).
 */

// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────

export type GroqMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type AgentCallOptions = {
    model?: string;
    temperature?: number;
    responseFormat?: 'json_object' | 'text';
};

export type PipelineStepResult = {
    agentName: string;
    rawOutput: string;
    parsed?: Record<string, unknown>;
};

export type PipelineContext = {
    idea: string;
    targetAudience: string;
    features: string;
    techStack?: string;
    additionalContext?: string;
    /** Output accumulated from previous pipeline steps */
    previousOutputs: PipelineStepResult[];
};

export type PipelineStep = {
    agentName: string;
    buildMessages: (ctx: PipelineContext) => GroqMessage[];
    options?: AgentCallOptions;
    parseOutput?: (raw: string) => Record<string, unknown>;
};

// ─────────────────────────────────────────────
// Groq API Call Helper
// ─────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(
    messages: GroqMessage[],
    options: AgentCallOptions = {}
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set.');

    const body: Record<string, unknown> = {
        model: options.model ?? DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
    };

    if (options.responseFormat === 'json_object') {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error ${response.status}: ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from Groq API.');
    return content;
}

// ─────────────────────────────────────────────
// Pipeline Orchestrator
// ─────────────────────────────────────────────

/**
 * Runs a multi-step agent pipeline where each step's output is accumulated
 * into a shared context passed forward to the next step (CoT handoff).
 *
 * @param steps  Ordered list of pipeline steps (agents)
 * @param ctx    Initial pipeline context (user inputs)
 * @returns      All step results in order
 */
export async function runPipeline(
    steps: PipelineStep[],
    ctx: PipelineContext
): Promise<PipelineStepResult[]> {
    const results: PipelineStepResult[] = [];

    for (const step of steps) {
        const messages = step.buildMessages({ ...ctx, previousOutputs: results });
        const raw = await callGroq(messages, step.options);

        let parsed: Record<string, unknown> | undefined;
        if (step.parseOutput) {
            try {
                parsed = step.parseOutput(raw);
            } catch {
                console.warn(`[${step.agentName}] Failed to parse output, storing raw.`);
            }
        } else if (step.options?.responseFormat === 'json_object') {
            try {
                parsed = JSON.parse(raw);
            } catch {
                console.warn(`[${step.agentName}] JSON parse failed, storing raw.`);
            }
        }

        results.push({ agentName: step.agentName, rawOutput: raw, parsed });
    }

    return results;
}
