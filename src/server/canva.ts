import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { SIZES, type SizeId } from "@/lib/catalog";

/*
 * Integración con la Canva Connect API. El cliente entra con su propia cuenta
 * de Canva, diseña sobre un lienzo del tamaño de la tarjeta y vuelve a la
 * tienda. No hay base de datos: lo que hay que recordar entre un paso y otro
 * viaja en cookies cifradas con el secret de la app.
 */

const API = "https://api.canva.com/rest/v1";
const AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
const SCOPES = "design:content:read design:content:write design:meta:read";
const KEYS = createRemoteJWKSet(new URL(`${API}/connect/keys`));

export const OAUTH_COOKIE = "asap_canva_oauth";
export const SESSION_COOKIE = "asap_canva_sesion";
export const RETURN_COOKIE = "asap_canva_volver";

type Credentials = { clientId: string; clientSecret: string };

export function canvaCredentials(): Credentials | null {
  const clientId = process.env.CANVA_CLIENT_ID?.trim();
  const clientSecret = process.env.CANVA_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function canvaEnabled(): boolean {
  return canvaCredentials() !== null && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/* ---------- Cookies cifradas ---------- */

function key(secret: string): Buffer {
  return createHash("sha256").update(`asap-canva:${secret}`).digest();
}

export function seal(value: unknown, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unseal<T>(sealed: string | undefined, secret: string): T | null {
  if (!sealed) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

/* ---------- Lo que se recuerda entre pasos ---------- */

/** El trabajo en curso: qué tarjeta se diseña y a qué página volver. */
export type CanvaJob = {
  sizeId: SizeId;
  sides: 1 | 2;
  back: string;
  correlation: string;
};

export type OAuthPending = CanvaJob & { verifier: string; state: string };

export type CanvaSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

/** Solo se vuelve a una página del configurador: nada de redirecciones abiertas. */
export function safeBackPath(value: string | null | undefined): string {
  if (value && /^\/producto\/[a-z0-9-]+(\?[\w=&%.,-]*)?$/i.test(value)) return value;
  return "/producto/tarjetas-de-presentacion";
}

/* ---------- OAuth con PKCE ---------- */

export function newPkce(): { verifier: string; challenge: string; state: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge, state: randomBytes(24).toString("base64url") };
}

export function authorizeUrl(credentials: Credentials, challenge: string, state: string, redirectUri: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

async function tokenRequest(credentials: Credentials, body: Record<string, string>): Promise<CanvaSession> {
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  const response = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  if (!response.ok) throw new CanvaError("token", response.status);
  const data = (await response.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    /* Un minuto de margen para no usar un token a punto de vencer. */
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
}

export function exchangeCode(credentials: Credentials, code: string, verifier: string, redirectUri: string) {
  return tokenRequest(credentials, {
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });
}

/** Cada refresh token sirve una sola vez: siempre hay que guardar el nuevo. */
export async function freshSession(credentials: Credentials, session: CanvaSession): Promise<CanvaSession> {
  if (session.expiresAt > Date.now()) return session;
  return tokenRequest(credentials, { grant_type: "refresh_token", refresh_token: session.refreshToken });
}

/* ---------- Diseños ---------- */

/** 3 mm de sangrado por lado, a 300 ppp: lo que pide la imprenta. */
const BLEED_MM = 3;
const DPI = 300;

export function designPixels(sizeId: SizeId): { width: number; height: number } {
  const size = SIZES[sizeId];
  const toPx = (mm: number) => Math.round(((mm + BLEED_MM * 2) / 25.4) * DPI);
  return { width: toPx(size.widthMm), height: toPx(size.heightMm) };
}

export async function createDesign(accessToken: string, job: CanvaJob): Promise<string> {
  const size = SIZES[job.sizeId];
  const response = await fetch(`${API}/designs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "type_and_asset",
      design_type: { type: "custom", ...designPixels(job.sizeId) },
      title: `ASAP · Tarjeta ${size.name.toLowerCase()} ${size.sizeLabel}`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new CanvaError("design", response.status);
  const data = (await response.json()) as { design: { urls: { edit_url: string } } };
  const edit = new URL(data.design.urls.edit_url);
  edit.searchParams.set("correlation_state", job.correlation);
  return edit.toString();
}

/** Verifica el token con el que Canva devuelve al cliente y saca el diseño. */
export async function verifyReturn(credentials: Credentials, token: string) {
  const { payload } = await jwtVerify(token, KEYS, { audience: credentials.clientId });
  if (payload.type !== "rti" || typeof payload.design_id !== "string") {
    throw new CanvaError("return", 400);
  }
  return {
    designId: payload.design_id,
    correlation: typeof payload.correlation_state === "string" ? payload.correlation_state : "",
  };
}

type ExportFormat = { type: "pdf"; export_quality: "regular" } | { type: "png"; export_quality: "regular" };

/** Pide la exportación y espera a que Canva la tenga lista (unos segundos). */
export async function exportDesign(accessToken: string, designId: string, format: ExportFormat): Promise<string[]> {
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
  const created = await fetch(`${API}/exports`, {
    method: "POST",
    headers,
    body: JSON.stringify({ design_id: designId, format }),
    cache: "no-store",
  });
  if (!created.ok) throw new CanvaError("export", created.status);
  let job = ((await created.json()) as { job: ExportJob }).job;

  const started = Date.now();
  while (job.status === "in_progress" && Date.now() - started < 40_000) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const poll = await fetch(`${API}/exports/${encodeURIComponent(job.id)}`, { headers, cache: "no-store" });
    if (!poll.ok) throw new CanvaError("export", poll.status);
    job = ((await poll.json()) as { job: ExportJob }).job;
  }
  if (job.status !== "success" || !job.urls?.length) throw new CanvaError("export", 500);
  return job.urls;
}

type ExportJob = { id: string; status: "in_progress" | "success" | "failed"; urls?: string[] };

export class CanvaError extends Error {
  constructor(
    readonly step: "token" | "design" | "return" | "export",
    readonly status: number,
  ) {
    super(`canva_${step}_${status}`);
  }
}
