/**
 * Verifies the Cloudflare R2 archive flow against an in-memory S3-compatible
 * server, so the storage path is exercised without real credentials.
 *
 *   npm run test:r2
 */

import assert from "node:assert/strict";

import { startS3Mock } from "./s3-mock.mts";

let passed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error: unknown) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`  FAIL ${name}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

const mock = await startS3Mock();

process.env.R2_ACCOUNT_ID = "test-account";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_BUCKET = "image-extractor-zips";
process.env.R2_ENDPOINT = mock.url;
process.env.R2_ZIP_TTL_SECONDS = "120";

const { buildArchiveKey, deleteArchive, getArchive, getArchiveTtlSeconds, isR2Configured, putArchive } =
  await import("../src/lib/r2");

console.log("\nR2 archive storage");

await test("isR2Configured reflects the environment", () => {
  assert.equal(isR2Configured(), true);
});

await test("getArchiveTtlSeconds honours R2_ZIP_TTL_SECONDS", () => {
  assert.equal(getArchiveTtlSeconds(), 120);
});

await test("buildArchiveKey produces a namespaced, sanitised key", () => {
  const key = buildArchiveKey("website-images-20260101-101010.zip");
  assert.match(key, /^zips\/\d+-[a-z0-9]+-website-images-20260101-101010\.zip$/);
  assert.equal(buildArchiveKey('weird name "*.zip').includes('"'), false);
});

const payload = Buffer.from("PK\u0003\u0004 pretend zip payload", "utf8");
const key = buildArchiveKey("website-images-20260101-101010.zip");

await test("putArchive uploads the object with metadata", async () => {
  await putArchive(key, payload, "website-images-20260101-101010.zip");
  const stored = mock.objects.get(`image-extractor-zips/${key}`);
  assert.ok(stored, "object should exist in the bucket");
  assert.equal(stored?.body.byteLength, payload.byteLength);
  assert.equal(stored?.contentType, "application/zip");
  assert.equal(stored?.metadata.filename, "website-images-20260101-101010.zip");
});

await test("getArchive streams the stored bytes back", async () => {
  const archive = await getArchive(key);
  assert.ok(archive, "archive should be retrievable");
  assert.equal(archive?.contentLength, payload.byteLength);
  assert.equal(archive?.filename, "website-images-20260101-101010.zip");
  const body = await readStream(archive!.body);
  assert.equal(body.toString("utf8"), payload.toString("utf8"));
});

await test("getArchive returns null for a missing key", async () => {
  assert.equal(await getArchive("zips/does-not-exist.zip"), null);
});

await test("deleteArchive removes the object", async () => {
  await deleteArchive(key);
  assert.equal(mock.objects.has(`image-extractor-zips/${key}`), false);
});

await test("only the configured bucket is addressed", () => {
  assert.ok(
    mock.requests.every((entry) => entry.includes("/image-extractor-zips/")),
    `unexpected paths: ${mock.requests.join(", ")}`,
  );
});

await mock.close();

console.log(`\n${failures.length === 0 ? "PASS" : "FAIL"} ${passed} passed, ${failures.length} failed\n`);

if (failures.length > 0) {
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
