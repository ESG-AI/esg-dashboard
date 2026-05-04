import { NextResponse } from "next/server";
import { evaluationQueue } from "@/workers/queue";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    
    if (!jobId) {
        return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }
    
    try {
        const job = await evaluationQueue.getJob(jobId);
        
        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }
        
        const state = await job.getState();
        const progress = job.progress;
        
        if (state === "completed") {
            return NextResponse.json({
                status: "completed",
                results: job.returnvalue,
                data: job.data
            });
        } else if (state === "failed") {
            return NextResponse.json({
                status: "failed",
                error: job.failedReason
            }, { status: 500 });
        } else {
            return NextResponse.json({
                status: state, // e.g., 'active', 'waiting', 'delayed'
                progress,
                data: job.data
            });
        }
    } catch (error: any) {
        console.error("Error checking job status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
