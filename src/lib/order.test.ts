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
    assert.equal(totals.printingCents, 836 * 3);
    assert.equal(totals.delivery.id, "express");
    assert.equal(totals.delivery.cents, 1725);
    assert.equal(totals.totalCents, 836 * 3 + 1725 + totals.shipping.cents);
    /* Viernes 16: Express de tarjetas es 1 día hábil, llega el lunes. */
    assert.equal(totals.delivery.days, 1);
    assert.equal(totals.delivery.latest.slice(0, 10), "2026-10-19");
  });

  it("separa base e IVA y los dos suman el total", () => {
    const totals = orderTotals([card("standard")], "2026-10-16T14:00:00.000Z");
    assert.equal(totals.totalCents, 836 + 403);
    assert.equal(totals.iva.baseCents + totals.iva.ivaCents, totals.totalCents);
    assert.equal(totals.iva.baseCents, 1077);
    assert.equal(totals.iva.ivaCents, 162);
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

describe("proforma", async () => {
  const { decodeQuote, encodeQuote, quoteNumber } = await import("./quote");
  const payload = {
    v: 1 as const,
    issued: "2026-10-16T14:00:00.000Z",
    client: { name: "Ñandú Diseño Cía. Ltda.", document: "1790012345001", email: "compras@ñandú.ec", phone: "099 123 4567" },
    items: [card("express")],
  };

  it("viaja en el enlace sin perder tildes ni eñes", () => {
    assert.deepEqual(decodeQuote(encodeQuote(payload)), payload);
  });

  it("rechaza un enlace alterado", () => {
    assert.equal(decodeQuote("no-es-una-proforma"), null);
  });

  it("da siempre el mismo número para el mismo contenido", () => {
    assert.equal(quoteNumber(payload), quoteNumber({ ...payload }));
    assert.match(quoteNumber(payload), /^PRO-261016-[0-9A-Z]{6}$/);
  });
});

describe("diseño", async () => {
  const { isCanvaUrl } = await import("./artwork");
  const { cartItemSchema } = await import("./schema");

  it("acepta enlaces de Canva y rechaza los de otros sitios", () => {
    assert.equal(isCanvaUrl("https://www.canva.com/design/DAGx1y2z3/abc/view?utm_content=x"), true);
    assert.equal(isCanvaUrl("https://canva.link/a1b2c3"), true);
    assert.equal(isCanvaUrl("https://www.canva.com/es_419/"), false);
    assert.equal(isCanvaUrl("https://canva.com.evil.io/design/x"), false);
    assert.equal(isCanvaUrl("http://www.canva.com/design/x"), false);
  });

  it("lee carritos guardados antes de Canva como archivo subido", () => {
    const parsed = cartItemSchema.parse({
      id: "7fe65618-8805-4348-9420-ea425add1579",
      configuration: card("standard"),
      artwork: { url: "https://abc.public.blob.vercel-storage.com/artes/logo-x.pdf", filename: "logo.pdf" },
    });
    assert.equal(parsed.artwork?.source, "archivo");
  });

  it("no deja pasar un enlace de Canva como archivo subido", () => {
    const result = cartItemSchema.safeParse({
      id: "7fe65618-8805-4348-9420-ea425add1579",
      configuration: card("standard"),
      artwork: { source: "archivo", url: "https://www.canva.com/design/x/view", filename: "x.pdf" },
    });
    assert.equal(result.success, false);
  });
});

describe("whatsapp", async () => {
  const { WHATSAPP_NUMBER, whatsappHref } = await import("./whatsapp");
  it("manda los pedidos al número de la tienda", () => {
    assert.equal(WHATSAPP_NUMBER, "593962956566");
    assert.match(whatsappHref("Hola"), /^https:\/\/wa\.me\/593962956566\?text=Hola$/);
  });
});

describe("proforma compartida antes del correo y teléfono", () => {
  it("un enlace viejo sin esos campos se sigue abriendo", async () => {
    const { decodeQuote, encodeQuote } = await import("./quote");
    const { defaultConfiguration } = await import("./catalog");
    const old = { v: 1 as const, issued: "2026-10-02T14:00:00.000Z", client: { name: "Cliente", document: "" }, items: [defaultConfiguration("85x55")] };
    const decoded = decodeQuote(encodeQuote(old));
    assert.equal(decoded?.client.name, "Cliente");
    assert.equal(decoded?.client.email, "");
  });
});
