const Redis = require("ioredis");
const r = new Redis("redis://localhost:6379", { maxRetriesPerRequest: null });
console.log(r.options.maxRetriesPerRequest);
r.disconnect();
