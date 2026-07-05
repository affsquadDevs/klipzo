/**
 * Session-only storage (§2.3, §3.5). Large media scratch lives in OPFS (Origin
 * Private File System) — fast, on-device, NEVER uploaded — so a big import survives
 * an accidental refresh. All of it is wiped by clearSession() and should be wiped on
 * session end. There is no cross-session or cross-device persistence of user media.
 */

const SCRATCH_DIR = "klipzo-scratch";

export function supportsOpfs(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function"
  );
}

async function scratchDir(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsOpfs()) return null;
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(SCRATCH_DIR, { create: true });
}

/** Persist bytes to OPFS scratch under `name`. Returns false if OPFS is unavailable. */
export async function writeScratch(name: string, data: Blob | ArrayBuffer): Promise<boolean> {
  const dir = await scratchDir();
  if (!dir) return false;
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
  return true;
}

export async function readScratch(name: string): Promise<File | null> {
  const dir = await scratchDir();
  if (!dir) return null;
  try {
    const handle = await dir.getFileHandle(name);
    return handle.getFile();
  } catch {
    return null;
  }
}

/** Delete ALL scratch media from this device. Backs the "Clear session" control. */
export async function clearSession(): Promise<void> {
  // In-memory state is dropped by the caller (React unmount). Here we wipe OPFS.
  if (!supportsOpfs()) return;
  const root = await navigator.storage.getDirectory();
  try {
    // removeEntry with recursive clears the whole scratch tree.
    await root.removeEntry(SCRATCH_DIR, { recursive: true });
  } catch {
    /* nothing to clear */
  }
}

/**
 * Best-effort wipe on tab close (§2.3). OPFS writes during unload aren't guaranteed,
 * so this is a supplement to the explicit control, not a replacement.
 */
export function installSessionCleanup(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("pagehide", () => {
    void clearSession();
  });
}
