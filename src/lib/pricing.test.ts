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
  it("suma acabados con IVA sobre la impresión y no mezcla los dos lados", () => {
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
    /* Matriz v1.4 (TPR, CLA2L, 50 u.) sin IVA: 8.11 + 4 + 35 + 3. Cada valor lleva su 15 %. */
    assert.equal(priced.baseCents, 933);
    assert.equal(priced.laminateCents, 460);
    assert.equal(priced.uvCents, 4025);
    assert.equal(priced.cornersCents, 345);
    assert.equal(priced.totalCents, 5763);
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
    assert.equal(priced.totalCents, 935);
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
    /* Express: 75 % del subtotal de impresión. */
    assert.equal(priced.deliveryCents, Math.round(935 * 0.75));
    assert.equal(priced.totalCents, 935 + 701);
  });
});

describe("código de producto", () => {
  it("arma el SKU de la configuración", async () => {
    const { skuFor } = await import("./sku");
    const { defaultConfiguration } = await import("./catalog");
    assert.equal(skuFor({ ...defaultConfiguration("85x55"), quantity: 500, sides: 2 }), "TPR-8555-2L-M-0500");
    assert.equal(
      skuFor({ ...defaultConfiguration("55x55"), quantity: 1000, sides: 1, paper: "brillante", laminate: "brillante", uv: true, rounded: true }),
      "TPR-5555-1L-B-LB-UV-R-1000",
    );
  });
});

describe("productos de la matriz", async () => {
  const { LAUNCH_PRODUCTS, launchQuote } = await import("./launch-products");
  const find = (slug: string) => {
    const product = LAUNCH_PRODUCTS.find((candidate) => candidate.slug === slug);
    assert.ok(product);
    return product;
  };

  it("todos los productos tienen precio con sus opciones de inicio", () => {
    for (const product of LAUNCH_PRODUCTS) {
      const selection = Object.fromEntries(product.options.map((option) => [option.id, option.choices[0]]));
      assert.ok(launchQuote(product, selection, product.quantities[0], "standard"), `${product.name} sin precio`);
    }
  });

  it("toma la variante de la prenda y los lados, con IVA", () => {
    const hoodie = find("camisetas-hoodies");
    const priced = launchQuote(hoodie, { prenda: "Hoodie", lados: "2 lados", talla: "M", tintas: "Full color", impresion: "DTF" }, 25, "standard");
    /* HOO2L, 25 u.: 30.9429 sin IVA por unidad. */
    assert.equal(priced?.variant, "HOO2L");
    assert.equal(priced?.runCents, Math.round(Math.round(3094.29 * 25) * 1.15));
  });

  it("suma el laminado del calendario y el 75 % de Express", () => {
    const calendar = find("calendarios");
    const selection = { tipo: "Sobre mesa (12 páginas)", tamano: "A5 (15 × 21 cm)", impresion: "Tiro", acabado: "Laminado", tintas: "Full color", papel: "Couché 300 g" };
    const priced = launchQuote(calendar, selection, 100, "express");
    assert.equal(priced?.extras[0]?.cents, 1035);
    assert.equal(priced?.deliveryCents, Math.round((priced?.printingCents ?? 0) * 0.75));
  });

  it("lo que la matriz no tiene se cotiza por WhatsApp", () => {
    const thanks = find("tarjetas-de-regalo");
    const selection = { tamano: "9 × 5 cm plegada", papel: "Couché 300 g", impresion: "Tiro", corte: "Recto", tintas: "Full color" };
    assert.equal(launchQuote(thanks, selection, 50, "standard"), null);
  });
});
