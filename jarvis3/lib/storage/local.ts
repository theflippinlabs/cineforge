import fs from "fs";
import path from "path";

const CWD = process.cwd();

interface OutputDirResult {
  absolute: string;
  relative: string;
  url: string;
}

export function ensureOutputDir(subdir: string): OutputDirResult {
  const absolute = path.join(CWD, "public", "outputs", subdir);
  if (!fs.existsSync(absolute)) fs.mkdirSync(absolute, { recursive: true });
  return { absolute, relative: path.join("outputs", subdir), url: `/outputs/${subdir}` };
}

export function generateFilename(type: string, ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${type}-${timestamp}-${random}.${ext}`;
}

export function readDataFile<T>(filename: string): T | null {
  const filePath = path.join(CWD, "data", filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch { return null; }
}

export function writeDataFile(filename: string, data: unknown): void {
  const dir = path.join(CWD, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2), "utf-8");
}

export function appendToDataArray<T>(filename: string, item: T): void {
  const existing = readDataFile<T[]>(filename) ?? [];
  existing.push(item);
  writeDataFile(filename, existing);
}

export function updateInDataArray<T extends { id: string }>(filename: string, id: string, update: Partial<T>): T | null {
  const existing = readDataFile<T[]>(filename) ?? [];
  const idx = existing.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  existing[idx] = { ...existing[idx], ...update };
  writeDataFile(filename, existing);
  return existing[idx];
}

export function deleteOutputFile(filePath: string): void {
  const absolute = path.join(CWD, "public", filePath);
  if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
}
