/**
 * Environment-only helper (no AWS SDK import) so pages can render the active
 * archive backend without pulling server-only dependencies into the bundle.
 */
export type StorageMode = "r2" | "stream";

export function getStorageMode(): StorageMode {
  const configured = Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
  return configured ? "r2" : "stream";
}

export function isArchiveStorageConfigured(): boolean {
  return getStorageMode() === "r2";
}
