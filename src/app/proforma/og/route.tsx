import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { SIZES } from "@/lib/catalog";
import { formatShortDate } from "@/lib/delivery";
import { formatUsd } from "@/lib/money";
import { OG, OG_SIZE, OgColorBar, ogFonts, ogLogo, ogPhoto } from "@/lib/og";
import { orderTotals } from "@/lib/order";
import { decodeQuote, quoteNumber, quoteValidUntil } from "@/lib/quote";

/*
 * La imagen que sale al compartir el enlace de una proforma por WhatsApp o
 * correo: número, cliente, qué lleva y el total con IVA, para que quien la
 * recibe sepa qué es antes de abrirla. Los precios se recalculan con la tabla,
 * igual que la página. Si el enlace no se lee, sale una tarjeta genérica.
 */
export async function GET(request: NextRequest) {
  const encoded = request.nextUrl.searchParams.get("c");
  const payload = encoded ? decodeQuote(encoded) : null;
  const [fonts, logo, photo] = await Promise.all([ogFonts(), ogLogo(), ogPhoto("tarjetas-de-presentacion")]);

  const totals = payload ? orderTotals(payload.items, payload.issued) : null;
  const lines = payload
    ? payload.items.slice(0, 3).map((item) => `${item.quantity.toLocaleString("es-EC")} tarjetas ${SIZES[item.sizeId].name.toLowerCase()}s · ${item.sides} lado${item.sides === 2 ? "s" : ""}`)
    : [];
  const more = payload && payload.items.length > 3 ? payload.items.length - 3 : 0;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: OG.paper, fontFamily: "Outfit" }}>
        <OgColorBar />
        <div style={{ display: "flex", flex: 1, padding: 48, gap: 40 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "#ffffff",
              borderRadius: 28,
              border: `2px solid ${OG.line}`,
              padding: "36px 40px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img> */}
              <img src={logo} width={170} height={63} alt="" style={{ marginLeft: -16 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ display: "flex", fontSize: 22, color: OG.soft }}>Proforma</div>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: OG.ink }}>{payload ? quoteNumber(payload) : "Esto es ASAP"}</div>
              </div>
            </div>
            <div style={{ display: "flex", height: 2, background: OG.line, marginTop: 24 }} />
            {payload && totals ? (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 24 }}>
                <div style={{ display: "flex", fontSize: 22, color: OG.soft }}>Para</div>
                <div style={{ display: "flex", fontSize: 36, fontWeight: 600, color: OG.ink }}>{payload.client.name || "Cliente"}</div>
                <div style={{ display: "flex", flexDirection: "column", marginTop: 18, gap: 6 }}>
                  {lines.map((line) => (
                    <div key={line} style={{ display: "flex", fontSize: 24, color: OG.ink }}>
                      {line}
                    </div>
                  ))}
                  {more ? <div style={{ display: "flex", fontSize: 22, color: OG.soft }}>y {more} más</div> : null}
                </div>
                <div style={{ display: "flex", flex: 1 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", fontSize: 22, color: OG.soft }}>Válida hasta el {formatShortDate(quoteValidUntil(payload.issued))}</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", fontSize: 22, color: OG.soft }}>Total con IVA</div>
                    <div style={{ display: "flex", fontSize: 56, fontWeight: 600, color: OG.ink, letterSpacing: -1 }}>{formatUsd(totals.totalCents)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
                <div style={{ display: "flex", fontSize: 48, fontWeight: 600, color: OG.ink, lineHeight: 1.05 }}>Arma tu proforma en dólares, con IVA.</div>
                <div style={{ display: "flex", fontSize: 26, color: OG.soft, marginTop: 16 }}>Guárdala en PDF o compártela para que la aprueben.</div>
              </div>
            )}
          </div>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img>
            <img src={photo} width={300} height={518} alt="" style={{ borderRadius: 28, objectFit: "cover" }} />
          ) : null}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    },
  );
}
