import { NextResponse } from "next/server";
import { evaluationQueue } from "@/workers/queue";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
        return NextResponse.json({ status: "error", message: "jobId is required" }, { status: 400 });
    }

    try {
        const job = await evaluationQueue.getJob(jobId);

        if (!job) {
            return NextResponse.json({ status: "not_found", message: "Job not longer exists (possibly cleared or expired)" });
        }

        const state = await job.getState();
        const progress =
            typeof job.progress === "function"
                ? await job.progress()
                : job.progress ?? 0;

        if (state === "completed") {
            return NextResponse.json({
                status: "completed",
                results: job.returnvalue ?? null,
                data: job.data ?? null
            });
        }

        if (state === "failed") {
            return NextResponse.json({
                status: "failed",
                error: job.failedReason ?? "Unknown error",
            });
        }
        return NextResponse.json({
            status: state, // e.g., 'active', 'waiting', 'delayed'
            progress,
            data: job.data ?? null
        });

    } catch (error: any) {
        console.error("Error checking job status:", error);

        return NextResponse.json(
            {
                status: "error",
                message: error.message || "Internal server error",
            },
            { status: 500 }
        );
    }
}
