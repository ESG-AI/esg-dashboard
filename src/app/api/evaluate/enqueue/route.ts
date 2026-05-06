import { NextResponse } from "next/server";
import { evaluationQueue } from "@/workers/queue";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { s3_object_keys, filenames, document_types, results } = body;

    if (!s3_object_keys || !s3_object_keys.length) {
      return NextResponse.json(
        { error: "s3_object_keys array is required" },
        { status: 400 },
      );
    }

    // Add 4 jobs to BullMQ, one for each GRI type
    const griTypes = ["governance", "economic", "social", "environmental"];
    const jobIds = [];

    for (const griType of griTypes) {
      const job = await evaluationQueue.add("evaluate-pdf", {
        s3_object_keys,
        filenames,
        document_types,
        // Optional `results` payload — include if the caller provides precomputed analysis
        results: results ?? null,
        gri_type: griType,
        user_id: userId,
      });
      jobIds.push(job.id);
    }

    return NextResponse.json({
      status: "queued",
      jobIds,
    });
  } catch (error: any) {
    console.error("Error enqueueing job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
