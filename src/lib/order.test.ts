import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Configuration } from "./catalog";
import { isArtworkUrl } from "./artwork";
import { orderNumber, orderTotals } from "./order";

const card = (delivery: Configuration["delivery"]): Configuration => ({
  sizeId: "55x55",
  quantity: 100,
  sides: 1,
  paper: "mate",
  laminate: "none",
  uv: false,
  rounded: false,
  delivery,
});

describe("orderTotals", () => {
  it("cobra el recargo de entrega una sola vez, con el ritmo más rápido", () => {
    const totals = orderTotals([card("express"), card("priority"), card("standard")], "2026-10-16T14:00:00.000Z");
    assert.equal(totals.printingCents, 727 * 3);
    assert.equal(totals.delivery.id, "express");
    assert.equal(totals.delivery.cents, 1500);
    assert.equal(totals.totalCents, 727 * 3 + 1500 + totals.shipping.cents);
  });

  it("no cobra nada con el carrito vacío", () => {
    assert.equal(orderTotals([], "2026-10-16T14:00:00.000Z").totalCents, 0);
  });
});

describe("orderNumber", () => {
  it("usa el prefijo ASAP", () => {
    assert.equal(orderNumber("7fe65618-8805-4348-9420-ea425add1579"), "ASAP-7FE65618");
  });
});

describe("isArtworkUrl", () => {
  it("acepta solo enlaces de Vercel Blob en la carpeta de artes", () => {
    assert.equal(isArtworkUrl("https://abc123.public.blob.vercel-storage.com/artes/logo-x7Yz.pdf"), true);
    assert.equal(isArtworkUrl("https://evil.com/artes/logo.pdf"), false);
    assert.equal(isArtworkUrl("http://abc123.public.blob.vercel-storage.com/artes/logo.pdf"), false);
    assert.equal(isArtworkUrl("https://abc123.public.blob.vercel-storage.com/otro/logo.pdf"), false);
  });
});
