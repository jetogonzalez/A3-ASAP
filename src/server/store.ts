import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { DocumentType } from "@/lib/text";

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "asap-data") : path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

export type StoredArtwork = {
  id: string;
  filename: string;
  bytes: number;
};

export type StoredOrder = {
  id: string;
  number: string;
  createdAt: string;
  items: Array<{
    description: string;
    quantity: number;
    totalCents: number;
    lines: Array<{ label: string; cents: number; included?: boolean }>;
    artwork: StoredArtwork | null;
  }>;
  customer: {
    name: string;
    document: { type: DocumentType; label: string; number: string };
    email: string;
    phone: string;
    province: string;
    city: string;
    address: string;
    reference: string;
  };
  shipping: { method: "envio"; label: string; detail: string; cents: number; grams: number };
  payment: { method: "transfer" | "deuna"; label: string };
  notes: string;
  subtotalCents: number;
  totalCents: number;
};

const MAX_BYTES = 8 * 1024 * 1024;

type UploadMeta = {
  id: string;
  filename: string;
  storedName: string;
  bytes: number;
  tokenHash: string;
  createdAt: string;
};

async function ensureDirs(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true, mode: 0o700 });
  await mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function detectFile(buffer: Buffer): { ext: "pdf" | "png" | "jpg" } | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { ext: "pdf" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: "png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg" };
  }
  return null;
}

export async function saveUpload(file: File, filename: string): Promise<
  | { ok: true; id: string; token: string; filename: string }
  | { ok: false; message: string }
> {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { ok: false, message: "El archivo debe pesar entre 1 byte y 8 MB." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return { ok: false, message: "El archivo supera 8 MB." };
  }
  const detected = detectFile(buffer);
  if (!detected) {
    return { ok: false, message: "Solo aceptamos PDF, PNG o JPG reales." };
  }

  await ensureDirs();
  const id = crypto.randomUUID();
  const token = randomBytes(32).toString("hex");
  const storedName = `${id}.${detected.ext}`;
  const meta: UploadMeta = {
    id,
    filename,
    storedName,
    bytes: buffer.length,
    tokenHash: sha256(token),
    createdAt: new Date().toISOString(),
  };

  await writeFile(path.join(UPLOAD_DIR, storedName), buffer, { mode: 0o600 });
  await writeFile(path.join(UPLOAD_DIR, `${id}.json`), JSON.stringify(meta), { mode: 0o600 });
  return { ok: true, id, token, filename };
}

export async function verifyUpload(id: string, token: string, filename: string): Promise<StoredArtwork | null> {
  if (!/^[a-f0-9-]{36}$/i.test(id) || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const raw = await readFile(path.join(UPLOAD_DIR, `${id}.json`), "utf8");
    const meta = JSON.parse(raw) as UploadMeta;
    const expectedName = [`${id}.pdf`, `${id}.png`, `${id}.jpg`];
    if (meta.id !== id || meta.filename !== filename) return null;
    if (!expectedName.includes(meta.storedName)) return null;
    if (!safeEqualHex(meta.tokenHash, sha256(token))) return null;
    await readFile(path.join(UPLOAD_DIR, meta.storedName));
    return { id, filename: meta.filename, bytes: meta.bytes };
  } catch {
    return null;
  }
}

async function readOrders(): Promise<StoredOrder[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function saveOrder(order: StoredOrder): Promise<void> {
  await ensureDirs();
  const orders = await readOrders();
  orders.push(order);
  const temp = `${ORDERS_FILE}.tmp`;
  await writeFile(temp, JSON.stringify(orders), { mode: 0o600 });
  await rename(temp, ORDERS_FILE);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const orders = await readOrders();
  return orders.find((order) => order.id === id) ?? null;
}
