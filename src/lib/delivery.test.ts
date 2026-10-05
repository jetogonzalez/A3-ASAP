import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliveryWindow, formatLongDate } from "./delivery";
import { cardTemplatePdf } from "./template-pdf";

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
