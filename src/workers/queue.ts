import { Queue } from "bullmq";
import Redis from "ioredis";

const redisConfig = process.env.REDIS_URL 
    ? process.env.REDIS_URL 
    : {
        host: process.env.REDISHOST || "localhost",
        port: Number(process.env.REDISPORT) || 6379,
        password: process.env.REDISPASSWORD,
        username: process.env.REDISUSER,
    };

export const connection = new Redis(redisConfig as any, {
    maxRetriesPerRequest: null, // Required by BullMQ
});

export const evaluationQueue = new Queue("evaluation", { connection });
