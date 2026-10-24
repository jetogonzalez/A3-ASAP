import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { artworkContentType, looksLikeArtwork } from "./artwork";
import { deliveryWindow, formatLongDate, orderLeadDays } from "./delivery";
import { cardTemplatePdf } from "./template-pdf";
import { shippingQuote } from "./ecuador";
import { cartGrams, packageGrams } from "./weight";

describe("entrega", () => {
  it("cuenta días hábiles desde un viernes en Ecuador", () => {
    /* Standard de tarjetas: 72 h = 3 días hábiles, sin contar el fin de semana. */
    const window = deliveryWindow("2026-10-02T14:00:00.000Z");
    assert.equal(window.days, 3);
    assert.equal(formatLongDate(window.latest), "miércoles 7 de octubre");
  });

  it("adelanta la fecha con Priority (48 h) y Express (24 h)", () => {
    const priority = deliveryWindow("2026-10-02T14:00:00.000Z", "priority");
    const express = deliveryWindow("2026-10-02T14:00:00.000Z", "express");
    assert.equal(formatLongDate(priority.latest), "martes 6 de octubre");
    assert.equal(formatLongDate(express.latest), "lunes 5 de octubre");
  });

  it("en un pedido con varios productos toma el tiempo mayor", () => {
    assert.equal(orderLeadDays([100, 1000], "standard"), 3);
    assert.equal(orderLeadDays([], "express"), 1);
  });
});

describe("formatos de archivo", () => {
  it("acepta PDF, EPS y AI y rechaza imágenes", () => {
    assert.equal(artworkContentType({ name: "logo.PDF" }), "application/pdf");
    assert.equal(artworkContentType({ name: "logo.ai" }), "application/postscript");
    assert.equal(artworkContentType({ name: "logo.eps" }), "application/postscript");
    assert.equal(artworkContentType({ name: "logo.jpg" }), null);
    assert.equal(artworkContentType({ name: "logo.png" }), null);
    assert.equal(artworkContentType({ name: "logo.cdr" }), null);
  });

  it("revisa los primeros bytes del archivo subido", () => {
    const bytes = (text: string) => new TextEncoder().encode(text);
    assert.equal(looksLikeArtwork(bytes("%PDF-1.7")), true);
    assert.equal(looksLikeArtwork(bytes("%!PS-Adobe-3.0 EPSF")), true);
    assert.equal(looksLikeArtwork(new Uint8Array([0xc5, 0xd0, 0xd3, 0xc6])), true);
    assert.equal(looksLikeArtwork(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), false);
  });
});

describe("plantilla", () => {
  it("genera un PDF del formato clásico", () => {
    const pdf = Buffer.from(
      cardTemplatePdf({ widthMm: 85, heightMm: 55 }, false),
    );
    const text = pdf.toString("latin1");
    assert.equal(text.startsWith("%PDF-1.4"), true);
    assert.match(text, /MediaBox \[0 0 303\.31 240\.94\]/);
    assert.match(text, /Sangrado 3 mm/);
    assert.equal(text.includes("Puntas redondeadas"), false);
  });

  it("marca las puntas redondeadas", () => {
    const pdf = Buffer.from(cardTemplatePdf({ widthMm: 55, heightMm: 55 }, true));
    assert.match(pdf.toString("latin1"), /Puntas redondeadas/);
  });
});

describe("shippingQuote", () => {
  it("cobra el primer kilo y recarga por kilo empezado, con IVA", () => {
    /* $3.50 y $0.75 sin IVA: $4.03 y $0.86 con el 15 %. */
    assert.equal(shippingQuote(231).cents, 403);
    assert.equal(shippingQuote(1000).cents, 403);
    assert.equal(shippingQuote(1001).cents, 489);
    assert.equal(shippingQuote(1585).cents, 489);
    assert.equal(shippingQuote(2400).cents, 575);
  });

  it("cobra el mínimo aunque el paquete sea liviano", () => {
    assert.equal(shippingQuote(0).cents, 403);
  });
});

describe("packageGrams", () => {
  const base = {
    sizeId: "85x55",
    sides: 1,
    paper: "mate",
    uv: false,
    rounded: false,
    delivery: "standard",
  } as const;

  it("sale del gramaje del papel y de la superficie", () => {
    /* 1000 clásicas en couché de 300 g: 4,675 cm² × 300 g/m² = 1402 g, más el empaque. */
    assert.equal(packageGrams({ ...base, quantity: 1000, laminate: "none" }), 1483);
    assert.equal(packageGrams({ ...base, quantity: 100, laminate: "none" }), 220);
  });

  it("el laminado suma película en las dos caras", () => {
    assert.equal(packageGrams({ ...base, quantity: 1000, laminate: "mate" }), 1585);
  });

  it("la cuadrada pesa menos que la clásica", () => {
    const square = packageGrams({ ...base, sizeId: "55x55", quantity: 500, laminate: "none" });
    const classic = packageGrams({ ...base, quantity: 500, laminate: "none" });
    assert.ok(square < classic);
  });
});

describe("cartGrams", () => {
  it("no cobra el empaque una vez por producto", () => {
    const item = {
      sizeId: "85x55",
      quantity: 100,
      sides: 1,
      paper: "mate",
      laminate: "none",
      uv: false,
      rounded: false,
      delivery: "standard",
    } as const;
    assert.equal(cartGrams([item, item]), packageGrams(item) * 2 - 80);
    assert.equal(cartGrams([]), 0);
  });
});
