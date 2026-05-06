import { Worker } from "bullmq";
import { connection } from "./queue";

const FASTAPI_URL = process.env.NEXT_PUBLIC_ESG_API || "http://localhost:8000";

const worker = new Worker(
  "evaluation",
  async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data);

    const {
      s3_object_keys,
      filenames,
      document_types,
      gri_type,
      user_id,
      results,
    } = job.data;

    try {
      await job.updateProgress(10);

      // Make the HTTP POST to FastAPI
      const response = await fetch(
        `${FASTAPI_URL}/evaluate-multi?gri_type=${gri_type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            s3_object_keys,
            filenames,
            document_types,
            user_id,
            // forward precomputed results if provided by caller
            results: results ?? null,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FastAPI responded with status: ${response.status} - ${errorText}`,
        );
      }

      await job.updateProgress(90);

      const result = await response.json();

      await job.updateProgress(100);

      // Pass back the gri_type alongside the results so the frontend knows what finished
      return { gri_type, ...result };
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 4,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed successfully!`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});

export default worker;
