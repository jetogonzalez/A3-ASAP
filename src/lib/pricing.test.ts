import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toCents } from "./money";
import { quote } from "./pricing";

describe("toCents", () => {
  it("redondea la hoja PVP a centavos", () => {
    assert.equal(toCents("5.6472"), 565);
    assert.equal(toCents("7.2576"), 726);
    assert.equal(toCents("12.1152"), 1212);
    assert.equal(toCents("14.544"), 1454);
    assert.equal(toCents("24.312"), 2431);
    assert.equal(toCents("46.224"), 4622);
    assert.equal(toCents("80.544"), 8054);
    assert.equal(toCents("7.2708"), 727);
    assert.equal(toCents("9.6864"), 969);
    assert.equal(toCents("10.9008"), 1090);
    assert.equal(toCents("17.7384"), 1774);
    assert.equal(toCents("16.6428"), 1664);
    assert.equal(toCents("30.8856"), 3089);
    assert.equal(toCents("29.79"), 2979);
    assert.equal(toCents("57.18"), 5718);
    assert.equal(toCents("4.8"), 480);
    assert.equal(toCents("9.6"), 960);
    assert.equal(toCents("42"), 4200);
    assert.equal(toCents("3.6"), 360);
    assert.equal(toCents("7.2"), 720);
    assert.equal(toCents("12"), 1200);
  });
});

describe("quote", () => {
  it("suma acabados sobre la impresión y no mezcla los dos lados", () => {
    const priced = quote({
      sizeId: "85x55",
      quantity: 50,
      sides: 2,
      paper: "brillante",
      laminate: "mate",
      uv: true,
      rounded: true,
      delivery: "standard",
    });
    assert.equal(priced.baseCents, 726);
    assert.equal(priced.laminateCents, 480);
    assert.equal(priced.uvCents, 4200);
    assert.equal(priced.cornersCents, 360);
    assert.equal(priced.totalCents, 5766);
  });

  it("usa la tabla cuadrada de 100 unidades", () => {
    const priced = quote({
      sizeId: "55x55",
      quantity: 100,
      sides: 1,
      paper: "mate",
      laminate: "none",
      uv: false,
      rounded: false,
      delivery: "standard",
    });
    assert.equal(priced.totalCents, 727);
  });

  it("suma el recargo de la entrega exprés", () => {
    const priced = quote({
      sizeId: "55x55",
      quantity: 100,
      sides: 1,
      paper: "mate",
      laminate: "none",
      uv: false,
      rounded: false,
      delivery: "express",
    });
    assert.equal(priced.deliveryCents, 1500);
    assert.equal(priced.totalCents, 2227);
  });
});
