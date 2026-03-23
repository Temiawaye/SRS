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

            return JSON.parse(messageContent) as EvaluateResponse;

        } catch (error) {
            console.error("Error evaluating SRS via Groq:", error);
            // Fallback for demonstration/error bounding
            return {
                metrics: { overall: 0, completeness: 0, consistency: 0, unambiguity: 0, traceability: 0 },
                issues: []
            };
        }
    }
}
