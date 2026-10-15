/**
 * Starts the in-memory S3 mock as a standalone server so the R2 archive flow can
 * be exercised end-to-end against a running Next.js instance:
 *
 *   npx tsx tests/s3-mock-server.mts                       # listens on 9999
 *   R2_ACCOUNT_ID=test R2_ACCESS_KEY_ID=test \
 *   R2_SECRET_ACCESS_KEY=test R2_BUCKET=test-bucket \
 *   R2_ENDPOINT=http://127.0.0.1:9999 npm start
 *
 * Then POST /api/zip and fetch the returned downloadUrl.
 */

import { startS3Mock } from "./s3-mock.mts";

const port = Number(process.env.MOCK_PORT ?? 9999);
const mock = await startS3Mock(port);

console.log(`S3 mock listening on ${mock.url}`);
console.log(`Set R2_ENDPOINT=${mock.url} and R2_BUCKET=test-bucket`);

const shutdown = async () => {
  await mock.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
