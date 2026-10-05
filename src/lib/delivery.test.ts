import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliveryWindow, formatLongDate } from "./delivery";
import { cardTemplatePdf } from "./template-pdf";
import { shippingQuote } from "./ecuador";
import { cartGrams, packageGrams } from "./weight";

describe("entrega", () => {
  it("cuenta días hábiles desde un viernes en Ecuador", () => {
    const window = deliveryWindow("2026-10-02T14:00:00.000Z");
    assert.equal(formatLongDate(window.earliest), "viernes 9 de octubre");
    assert.equal(formatLongDate(window.latest), "miércoles 14 de octubre");
  });

  it("adelanta la fecha en las dos opciones de pago", () => {
    const priority = deliveryWindow("2026-10-02T14:00:00.000Z", "priority");
    const express = deliveryWindow("2026-10-02T14:00:00.000Z", "express");
    assert.equal(formatLongDate(priority.earliest), "miércoles 7 de octubre");
    assert.equal(formatLongDate(express.earliest), "martes 6 de octubre");
    assert.equal(formatLongDate(express.latest), "miércoles 7 de octubre");
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
  it("cobra el primer kilo y recarga por kilo empezado", () => {
    assert.equal(shippingQuote(231).cents, 350);
    assert.equal(shippingQuote(1000).cents, 350);
    assert.equal(shippingQuote(1001).cents, 425);
    assert.equal(shippingQuote(1585).cents, 425);
    assert.equal(shippingQuote(2400).cents, 500);
  });

  it("cobra el mínimo aunque el paquete sea liviano", () => {
    assert.equal(shippingQuote(0).cents, 350);
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
