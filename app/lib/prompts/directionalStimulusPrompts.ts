/**
 * Directional Stimulus Prompting – Vague Input Enrichment
 *
 * Technique: Directional Stimulus Prompting
 * ──────────────────────────────────────────
 * When a user enters a short or vague project idea (e.g., "I want a login page"),
 * the LLM lacks enough signal to produce a quality SRS. This module detects
 * thin/vague inputs and automatically injects domain-specific "stimulus keywords"
 * into the prompt before it reaches the LLM.
 *
 * Detection heuristics:
 *   - Total word count < 25 in the idea field
 *   - Missing any standard SRS signal words (security, auth, data, user, etc.)
 *   - Domain keywords detected (login → security stimulus; payments → PCI stimulus)
 *
 * The enriched prompt steers the LLM toward producing SRS-standard output
 * without changing the user's original intent.
 */

// ─────────────────────────────────────────────
// Stimulus Keyword Libraries
// ─────────────────────────────────────────────

const STIMULUS_LIBRARIES: Record<string, string[]> = {
    auth: [
        'Security Protocols (OAuth 2.0 / JWT)',
        'Session Management',
        'Multi-Factor Authentication (MFA)',
        'Password Hashing (bcrypt / Argon2)',
        'Account Lockout Policy',
        'Data Privacy (GDPR compliance)',
        'Error Handling for invalid credentials',
        'Secure Token Expiry',
    ],
    payment: [
        'PCI-DSS Compliance',
        'Transaction Atomicity (ACID)',
        'Fraud Detection & Rate Limiting',
        'Audit Logging',
        'Idempotent Payment Requests',
        'Refund & Chargeback Workflows',
        'Secure API Gateway',
    ],
    healthcare: [
        'HIPAA Compliance',
        'Patient Data Encryption (at-rest and in-transit)',
        'Role-Based Access Control (RBAC)',
        'Audit Trails for data access',
        'Data Retention Policies',
        'Consent Management',
    ],
    ecommerce: [
        'Product Catalogue Management',
        'Inventory Synchronisation',
        'Shopping Cart Persistence',
        'Order Lifecycle Management',
        'Search & Filtering Algorithms',
        'Wishlist Functionality',
        'Review & Rating Systems',
    ],
    realtime: [
        'WebSocket / Server-Sent Events Infrastructure',
        'Message Delivery Guarantees (at-least-once / exactly-once)',
        'Horizontal Scalability',
        'Connection Resilience & Reconnection Logic',
        'Presence & Online Status',
    ],
    general: [
        'Scalability (horizontal and vertical)',
        'Accessibility (WCAG 2.1 Level AA)',
        'Data Validation & Sanitisation',
        'Performance Benchmarks (response time < 2s)',
        'Error Handling & User-Friendly Messages',
        'Internationalisation (i18n) Support',
        'Logging & Monitoring (ELK / Datadog)',
        'API Documentation (OpenAPI / Swagger)',
    ],
};

// ─────────────────────────────────────────────
// Domain Detection
// ─────────────────────────────────────────────

type Domain = keyof typeof STIMULUS_LIBRARIES;

const DOMAIN_TRIGGERS: Record<Domain, string[]> = {
    auth: ['login', 'signup', 'sign up', 'register', 'authentication', 'authoris', 'authoriz', 'password', 'sso', 'oauth', 'jwt', 'session'],
    payment: ['payment', 'pay', 'checkout', 'billing', 'invoice', 'subscription', 'stripe', 'wallet', 'transaction'],
    healthcare: ['patient', 'hospital', 'clinic', 'doctor', 'medical', 'ehr', 'health', 'hipaa', 'prescription'],
    ecommerce: ['shop', 'store', 'ecommerce', 'e-commerce', 'product', 'cart', 'order', 'inventory', 'catalogue'],
    realtime: ['chat', 'messaging', 'real-time', 'realtime', 'notification', 'live', 'websocket', 'streaming'],
    general: [],
};

function detectDomains(text: string): Domain[] {
    const lower = text.toLowerCase();
    const detected: Domain[] = [];

    for (const [domain, triggers] of Object.entries(DOMAIN_TRIGGERS)) {
        if (triggers.length === 0) continue; // skip 'general' here
        if (triggers.some((t) => lower.includes(t))) {
            detected.push(domain as Domain);
        }
    }

    // Always include general if fewer than 2 specific domains detected
    if (detected.length < 2) detected.push('general');
    return detected;
}

// ─────────────────────────────────────────────
// Vagueness Detection
// ─────────────────────────────────────────────

const SRS_SIGNAL_WORDS = [
    'security', 'authentication', 'authorisation', 'authorization',
    'performance', 'scalab', 'database', 'api', 'interface', 'system',
    'user', 'admin', 'role', 'data', 'feature', 'module',
];

export type VaguenessReport = {
    isVague: boolean;
    wordCount: number;
    missingSrsSignals: string[];
    detectedDomains: Domain[];
};

/**
 * Analyses a user's project idea to determine if Directional Stimulus is needed.
 */
export function analyseVagueness(
    idea: string,
    features: string = '',
    additionalContext: string = ''
): VaguenessReport {
    const combined = `${idea} ${features} ${additionalContext}`.trim();
    const wordCount = combined.split(/\s+/).filter(Boolean).length;
    const lower = combined.toLowerCase();

    const missingSrsSignals = SRS_SIGNAL_WORDS.filter((w) => !lower.includes(w));
    const detectedDomains = detectDomains(combined);

    // Flag as vague if fewer than 25 words OR missing most SRS signal words
    const isVague = wordCount < 25 || missingSrsSignals.length > SRS_SIGNAL_WORDS.length * 0.7;

    return { isVague, wordCount, missingSrsSignals, detectedDomains };
}

// ─────────────────────────────────────────────
// Stimulus Injection
// ─────────────────────────────────────────────

export type EnrichedPromptContext = {
    enrichedIdea: string;
    injectedStimuli: string[];
    vaguenessReport: VaguenessReport;
};

/**
 * Enriches the user's project idea with domain-specific stimulus keywords.
 * If the input is not vague, returns the original idea unchanged.
 *
 * @param idea             Original user idea
 * @param features         Key features string
 * @param additionalContext Additional context
 */
export function injectDirectionalStimulus(
    idea: string,
    features: string = '',
    additionalContext: string = ''
): EnrichedPromptContext {
    const report = analyseVagueness(idea, features, additionalContext);

    if (!report.isVague) {
        return {
            enrichedIdea: idea,
            injectedStimuli: [],
            vaguenessReport: report,
        };
    }

    // Collect unique stimuli from all detected domains (max 6 total)
    const stimuliSet = new Set<string>();
    for (const domain of report.detectedDomains) {
        for (const keyword of STIMULUS_LIBRARIES[domain] ?? []) {
            stimuliSet.add(keyword);
            if (stimuliSet.size >= 6) break;
        }
    }

    const injectedStimuli = Array.from(stimuliSet);

    const enrichedIdea = `${idea}

[SYSTEM DIRECTIVE – SRS Quality Enhancement]
This project requires the following aspects to be addressed in the SRS:
${injectedStimuli.map((s) => `• ${s}`).join('\n')}
Ensure that each of the above aspects is covered as SRS requirements where applicable.`;

    return { enrichedIdea, injectedStimuli, vaguenessReport: report };
}
