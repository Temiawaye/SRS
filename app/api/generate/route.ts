import { NextResponse } from 'next/server';
import { AIAgentsService } from '../chat/service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idea, targetAudience, features, techStack, context } = body;

        if (!idea) {
            return NextResponse.json({ error: 'Project idea is required' }, { status: 400 });
        }

        // Call the multi-agent generation pipeline
        const result = await AIAgentsService.generateSRS(idea, targetAudience, features, techStack, context);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("API /generate Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate SRS' }, { status: 500 });
    }
}
