import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateArtwork, postscriptPageMm, worstStatus, type ArtworkFacts } from "./preflight-rules";

const card = { widthMm: 85, heightMm: 55, bleedMm: 3 };
const pdf = (over: Partial<ArtworkFacts>): ArtworkFacts => ({
  kind: "pdf",
  readable: true,
  pages: [{ widthMm: 91, heightMm: 61 }],
  minImagePpi: null,
  missingFonts: [],
  ...over,
});
const find = (facts: ArtworkFacts, id: string, spec: Parameters<typeof evaluateArtwork>[1] = card) =>
  evaluateArtwork(facts, spec).find((check) => check.id === id);

describe("revisión del archivo", () => {
  it("da por bueno un PDF vectorial con sangrado", () => {
    const checks = evaluateArtwork(pdf({}), { ...card, sides: 1 });
    assert.equal(worstStatus(checks), "ok");
  });

  it("acepta la página girada", () => {
    assert.equal(find(pdf({ pages: [{ widthMm: 61, heightMm: 91 }] }), "tamano")?.status, "ok");
  });

  it("avisa cuando falta el sangrado", () => {
    const check = find(pdf({ pages: [{ widthMm: 85, heightMm: 55 }] }), "tamano");
    assert.equal(check?.status, "warn");
    assert.match(check?.title ?? "", /Sin sangrado/);
  });

  it("marca un tamaño que no corresponde", () => {
    assert.equal(find(pdf({ pages: [{ widthMm: 210, heightMm: 297 }] }), "tamano")?.status, "error");
  });

  it("pide el reverso si se eligieron dos lados", () => {
    assert.equal(find(pdf({}), "paginas", { ...card, sides: 2 })?.status, "warn");
  });

  it("califica la resolución de las imágenes", () => {
    assert.equal(find(pdf({ minImagePpi: 96 }), "resolucion")?.status, "error");
    assert.equal(find(pdf({ minImagePpi: 200 }), "resolucion")?.status, "warn");
    assert.equal(find(pdf({ minImagePpi: 300 }), "resolucion")?.status, "ok");
  });

  it("avisa de fuentes sin incrustar", () => {
    assert.equal(find(pdf({ missingFonts: ["Gotham-Bold"] }), "fuentes")?.status, "warn");
  });

  it("rechaza un archivo que no es lo que dice", () => {
    assert.equal(worstStatus(evaluateArtwork({ kind: "unknown", readable: false, pages: [], minImagePpi: null, missingFonts: [] }, card)), "error");
  });

  it("lee el tamaño de un EPS desde su encabezado", () => {
    const page = postscriptPageMm("%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 258 173\n%%HiResBoundingBox: 0 0 257.95 172.91\n");
    assert.ok(page);
    assert.equal(Math.round(page.widthMm), 91);
    assert.equal(Math.round(page.heightMm), 61);
  });
});
