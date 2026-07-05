/**
 * .klipzo project files (Batch 3): a self-contained, local-only project you keep on
 * your device. Because Klipzo never uploads media, a portable project must EMBED it —
 * so a .klipzo is a binary container:
 *
 *   "KLPZ" (4B) | version (1B) | manifestLen (4B LE) | manifest JSON | media blobs…
 *
 * Media is stored raw (not base64) to avoid bloat. On load we slice the blobs back
 * into Files and rebuild object URLs. No network — save is a download, open is a
 * local file read.
 */
import type { Project, SourceAsset, MusicTrack } from "../timeline/model";

const MAGIC = "KLPZ";
const VERSION = 1;

interface MediaEntry {
  name: string;
  mime: string;
  size: number;
}

interface Manifest {
  version: number;
  createdWith: string;
  media: MediaEntry[];
  assets: Record<string, Omit<SourceAsset, "file" | "url"> & { mediaIndex: number }>;
  clips: Project["clips"];
  texts: Project["texts"];
  music: Array<Omit<MusicTrack, "file" | "url"> & { mediaIndex: number }>;
}

export class ProjectFileError extends Error {}

/** Serialize a project (with all media embedded) to a downloadable Blob. */
export async function saveProject(project: Project): Promise<Blob> {
  const media: MediaEntry[] = [];
  const blobs: Blob[] = [];
  const fileIndex = new Map<File, number>();

  function addMedia(file: File): number {
    const existing = fileIndex.get(file);
    if (existing !== undefined) return existing;
    const idx = media.length;
    media.push({ name: file.name, mime: file.type, size: file.size });
    blobs.push(file);
    fileIndex.set(file, idx);
    return idx;
  }

  const assets: Manifest["assets"] = {};
  for (const [id, a] of Object.entries(project.assets)) {
    const { file: _f, url: _u, ...rest } = a;
    assets[id] = { ...rest, mediaIndex: addMedia(a.file) };
  }
  const music: Manifest["music"] = project.music.map((m) => {
    const { file: _f, url: _u, ...rest } = m;
    return { ...rest, mediaIndex: addMedia(m.file) };
  });

  const manifest: Manifest = {
    version: VERSION,
    createdWith: "Klipzo",
    media,
    assets,
    clips: project.clips,
    texts: project.texts,
    music,
  };

  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const header = new Uint8Array(4 + 1 + 4);
  header.set(new TextEncoder().encode(MAGIC), 0);
  header[4] = VERSION;
  new DataView(header.buffer).setUint32(5, manifestBytes.length, true);

  return new Blob([header, manifestBytes, ...blobs], { type: "application/x-klipzo" });
}

/** Parse a .klipzo file back into a Project (recreating Files + object URLs). */
export async function loadProject(file: File): Promise<Project> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.length < 9 || new TextDecoder().decode(bytes.slice(0, 4)) !== MAGIC) {
    throw new ProjectFileError("This isn’t a valid Klipzo project file.");
  }
  const manifestLen = new DataView(buf).getUint32(5, true);
  const manifestStart = 9;
  const manifestEnd = manifestStart + manifestLen;
  let manifest: Manifest;
  try {
    manifest = JSON.parse(new TextDecoder().decode(bytes.slice(manifestStart, manifestEnd)));
  } catch {
    throw new ProjectFileError("This project file is corrupt.");
  }

  // Slice each embedded media blob back into a File (in manifest order).
  const files: File[] = [];
  let offset = manifestEnd;
  for (const entry of manifest.media) {
    const slice = buf.slice(offset, offset + entry.size);
    files.push(new File([slice], entry.name, { type: entry.mime }));
    offset += entry.size;
  }

  const assets: Record<string, SourceAsset> = {};
  for (const [id, a] of Object.entries(manifest.assets)) {
    const f = files[a.mediaIndex];
    if (!f) throw new ProjectFileError("Project file is missing embedded media.");
    const { mediaIndex: _m, ...rest } = a;
    assets[id] = { ...rest, file: f, url: URL.createObjectURL(f) };
  }
  const music: MusicTrack[] = manifest.music.map((m) => {
    const f = files[m.mediaIndex]!;
    const { mediaIndex: _m, ...rest } = m;
    return { ...rest, file: f, url: URL.createObjectURL(f) };
  });

  return { assets, clips: manifest.clips, texts: manifest.texts, music };
}
