import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultConfiguration } from "../lib/catalog";
import { canvaReturnFromSearch, canvaStartHref } from "../lib/canva-return";
import { designPixels, safeBackPath, seal, unseal } from "./canva";

describe("canva", () => {
  it("guarda y lee las cookies cifradas, y rechaza las alteradas", () => {
    const sealed = seal({ refreshToken: "abc", n: 1 }, "secreto");
    assert.deepEqual(unseal(sealed, "secreto"), { refreshToken: "abc", n: 1 });
    assert.equal(unseal(sealed, "otro-secreto"), null);
    assert.equal(unseal(`${sealed.slice(0, -2)}xx`, "secreto"), null);
  });

  it("arma el lienzo con 3 mm de sangrado a 300 ppp", () => {
    assert.deepEqual(designPixels("85x55"), { width: 1075, height: 720 });
    assert.deepEqual(designPixels("55x55"), { width: 720, height: 720 });
  });

  it("solo vuelve a páginas del configurador", () => {
    assert.equal(safeBackPath("https://malo.com"), "/producto/tarjetas-de-presentacion");
    assert.equal(safeBackPath("//malo.com/producto/x"), "/producto/tarjetas-de-presentacion");
    const href = canvaStartHref({ ...defaultConfiguration(), sides: 2 }, undefined, ["tamano", "papel"]);
    const volver = new URL(href, "https://asap.ec").searchParams.get("volver");
    assert.equal(safeBackPath(volver), volver);
    assert.match(volver ?? "", /elegido=tamano,papel$/);
  });

  it("acepta el diseño de vuelta solo si los archivos son de nuestro Blob", () => {
    const ok = canvaReturnFromSearch({
      canva: "listo",
      canva_pdf: "https://x.public.blob.vercel-storage.com/artes/d.pdf",
      canva_frente: "https://x.public.blob.vercel-storage.com/artes/f.png",
    });
    assert.equal(ok?.status, "listo");
    assert.equal(ok?.design?.back, null);
    const bad = canvaReturnFromSearch({ canva: "listo", canva_pdf: "https://malo.com/artes/d.pdf", canva_frente: "https://malo.com/f.png" });
    assert.equal(bad?.status, "error");
    assert.equal(bad?.design, null);
  });
});

describe("cookies en pedazos", async () => {
  const { readSealed, writeSealed } = await import("./canva");
  it("guarda una sesión larga en varias cookies y la vuelve a leer", () => {
    const jar = new Map<string, string>();
    const writer = {
      set: (name: string, value: string) => jar.set(name, value),
      delete: (name: string) => jar.delete(name),
    };
    const session = { accessToken: "a".repeat(5000), refreshToken: "r".repeat(1200), expiresAt: 1 };
    writeSealed(writer, "sesion", session, "secreto", 60);
    assert.ok(jar.size > 1);
    for (const value of jar.values()) assert.ok(value.length <= 3600);
    const reader = { get: (name: string) => (jar.has(name) ? { value: jar.get(name) ?? "" } : undefined) };
    assert.deepEqual(readSealed(reader, "sesion", "secreto"), session);
  });
});
