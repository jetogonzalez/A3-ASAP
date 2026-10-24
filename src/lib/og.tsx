import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * Piezas comunes de las imágenes para compartir (Open Graph): la que sale al
 * pegar un enlace en WhatsApp, redes o correo. ImageResponse no lee WebP ni
 * woff2, así que aquí viven copias en JPG de las fotos y la fuente Outfit en
 * woff (licencia OFL), en src/assets/og. next.config incluye esa carpeta en
 * las rutas que la leen.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/* Colores de marca (los mismos de globals.css). */
export const OG = {
  ink: "#141414",
  soft: "#5c6570",
  line: "#e3e6ea",
  paper: "#f6f7f9",
  brand: "#4660ff",
  /* Los mismos tramos de la barra de la portada: negro y azules del logo. */
  bar: ["#141414", "#1c2a99", "#2d43d6", "#4660ff"],
};

const dir = join(process.cwd(), "src/assets/og");

export async function ogFonts() {
  const [regular, semibold] = await Promise.all([
    readFile(join(dir, "outfit-400.woff")),
    readFile(join(dir, "outfit-600.woff")),
  ]);
  return [
    { name: "Outfit", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Outfit", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
}

export async function ogPhoto(slug: string): Promise<string | null> {
  try {
    const data = await readFile(join(dir, `${slug}.jpg`));
    return `data:image/jpeg;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function ogLogo(): Promise<string> {
  const svg = await readFile(join(dir, "logo.svg"));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

/* La barra de arriba, igual que en la portada. */
export function OgColorBar() {
  return (
    <div style={{ display: "flex", width: "100%", height: 8 }}>
      {OG.bar.map((color) => (
        <div key={color} style={{ flex: 1, background: color }} />
      ))}
    </div>
  );
}
