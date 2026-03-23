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
};

export type EvaluateResponse = {
    metrics: SRSMetrics;
    issues: SRSIssue[];
};

export class AIAgentsService {
    /**
     * Calls the Groq API utilizing the llama-3.3-70b-versatile model to generate an SRS
     * and structured feedback in a single prompt.
     */
    static async generateSRS(idea: string, targetAudience: string, features: string, context?: string): Promise<GenerateResponse> {

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("Missing GROQ_API_KEY environment variable. Returning fallback content.");
            throw new Error("API Key is missing.");
        }

        const systemPrompt = `You are an expert Software Requirements Specification (SRS) generator and reviewer.
Your goal is to take a project description and output a thorough, professional SRS document.
You must ALSO act as a reviewer and provide quality metrics and a list of identified issues/suggestions.

You MUST respond in pure JSON format matching this exact structure, with no extra markdown wrapping the json block (e.g. do not output \`\`\`json):
{
    "content": "The full markdown formatted SRS document. Include sections for Purpose, Scope, Overall Description, Features, and Non-functional Requirements.",
    "metrics": {
        "overall": 0-100,
        "completeness": 0-100,
        "consistency": 0-100,
        "unambiguity": 0-100,
        "traceability": 0-100
    },
    "issues": [
        {
            "type": "string (e.g., 'ambiguity', 'completeness', 'security')",
            "text": "description of the issue found in the initial prompt or the generated text",
            "suggestion": "actionable advice to fix it"
        }
    ]
}`;

        const userPrompt = `Please generate an SRS for the following project:
Project Idea: ${idea}
Target Audience: ${targetAudience || 'General Audience'}
Key Features: ${features || 'Standard Features'}
Additional Context: ${context || 'No additional context provided'}`;

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Groq API error:", response.status, errorData);
                throw new Error(`Groq API returned status ${response.status}`);
            }

            const data = await response.json();
            const messageContent = data.choices[0]?.message?.content;

            if (!messageContent) {
                throw new Error("No content returned from Groq.");
            }

            const parsedContent = JSON.parse(messageContent) as GenerateResponse;

            // 🔹 Apply Deterministic & AI Evaluators
            const text = parsedContent.content;
            parsedContent.metrics.completeness = Math.round(this.checkCompleteness(text) * 100);
            parsedContent.metrics.consistency = Math.round(this.checkAtomicity(text) * 100);
            parsedContent.metrics.unambiguity = Math.round(this.checkAmbiguity(text) * 100);
            parsedContent.metrics.traceability = Math.round(await this.checkVerifiability(text) * 100);

            // Recalculate Overall Score (Weighted)
            parsedContent.metrics.overall = Math.round(
                (parsedContent.metrics.completeness * 0.2) +
                (parsedContent.metrics.consistency * 0.2) +
                (parsedContent.metrics.unambiguity * 0.2) +
                (parsedContent.metrics.traceability * 0.4)
            );

            return parsedContent;

        } catch (error) {
            console.error("Error generating SRS via Groq:", error);
            // Fallback for demonstration/error bounding
            return {
                content: "# Error Generating SRS\nThere was a problem communicating with the AI service. Please try again.",
                metrics: { overall: 0, completeness: 0, consistency: 0, unambiguity: 0, traceability: 0 },
                issues: []
            };
        }
    }

    /**
     * Calls the Groq API to evaluate an existing SRS document
     * returning only structured feedback and metrics.
     */
    static async evaluateSRS(documentContent: string): Promise<EvaluateResponse> {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("Missing GROQ_API_KEY environment variable. Returning fallback content.");
            throw new Error("API Key is missing.");
        }

        const systemPrompt = `You are an expert Software Requirements Specification (SRS) reviewer.
Your goal is to evaluate the provided SRS document and provide quality metrics and a list of identified issues/suggestions.

You MUST respond in pure JSON format matching this exact structure, with no extra markdown wrapping the json block (e.g. do not output \`\`\`json):
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
            "type": "string (e.g., 'ambiguity', 'completeness', 'security')",
            "text": "description of the issue found in the document",
            "suggestion": "actionable advice to fix it"
        }
    ]
}`;

        const userPrompt = `Please evaluate the following SRS document:\n\n${documentContent}`;

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Groq API error:", response.status, errorData);
                throw new Error(`Groq API returned status ${response.status}`);
            }

            const data = await response.json();
            const messageContent = data.choices[0]?.message?.content;

            if (!messageContent) {
                throw new Error("No content returned from Groq.");
            }

            const result = JSON.parse(messageContent) as EvaluateResponse;

            // 🔹 Apply Deterministic & AI Evaluators
            result.metrics.completeness = Math.round(this.checkCompleteness(documentContent) * 100);
            result.metrics.consistency = Math.round(this.checkAtomicity(documentContent) * 100);
            result.metrics.unambiguity = Math.round(this.checkAmbiguity(documentContent) * 100);
            result.metrics.traceability = Math.round(await this.checkVerifiability(documentContent) * 100);

            // Recalculate Overall Score (Weighted)
            result.metrics.overall = Math.round(
                (result.metrics.completeness * 0.2) +
                (result.metrics.consistency * 0.2) +
                (result.metrics.unambiguity * 0.2) +
                (result.metrics.traceability * 0.4)
            );

            return result;

        } catch (error) {
            console.error("Error evaluating SRS via Groq:", error);
            // Fallback for demonstration/error bounding
            return {
                metrics: { overall: 0, completeness: 0, consistency: 0, unambiguity: 0, traceability: 0 },
                issues: []
            };
        }
    }

    // 🔹 Evaluation Helper Methods
    // -----------------------------

    private static checkAmbiguity(text: string): number {
        const ambiguousWords = ["fast", "efficient", "user-friendly", "etc", "appropriate"];
        let count = 0;

        ambiguousWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            const matches = text.match(regex);
            if (matches) count += matches.length;
        });

        const words = text.split(/\s+/).filter(w => w.length > 0);
        const totalWords = words.length || 1;
        return Math.max(0, 1 - count / totalWords);
    }

    private static checkAtomicity(text: string): number {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length === 0) return 1;

        let multi = 0;
        sentences.forEach(s => {
            if (s.toLowerCase().includes(" and ") || s.toLowerCase().includes(" or ")) {
                multi++;
            }
        });

        return 1 - multi / sentences.length;
    }

    private static async checkVerifiability(text: string): Promise<number> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return 0.5;

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "Classify if each requirement is testable. Return percentage score only (e.g. 0.85). Do not include any other text."
                        },
                        { role: "user", content: text }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) return 0.5;
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            return parseFloat(content) || 0.5;
        } catch (error) {
            console.error("Error checking verifiability:", error);
            return 0.5;
        }
    }

    private static checkCompleteness(text: string): number {
        const sections = ["functional", "non-functional", "constraints", "assumptions"];
        let present = 0;

        sections.forEach(sec => {
            if (text.toLowerCase().includes(sec)) present++;
        });

        return present / sections.length;
    }
}
