import { NextResponse } from "next/server";
import { AIAgentsService } from "../service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { documentContent } = body;

        if (!documentContent) {
            return NextResponse.json(
                { error: "Document content is required" },
                { status: 400 }
            );
        }

        const result = await AIAgentsService.evaluateSRS(documentContent);

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Error in Evaluate API Route:", error);
        return NextResponse.json(
            { error: error.message || "Failed to evaluate SRS." },
            { status: 500 }
        );
    }
}
