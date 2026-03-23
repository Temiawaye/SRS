import { NextResponse } from "next/server";
import { AIAgentsService } from "../service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { idea, targetAudience, features } = body;

        if (!idea) {
            return NextResponse.json(
                { error: "Project Outline (idea) is required" },
                { status: 400 }
            );
        }

        const result = await AIAgentsService.generateSRS(
            idea,
            targetAudience || "",
            features || ""
        );

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Error in Generate API Route:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate SRS." },
            { status: 500 }
        );
    }
}
