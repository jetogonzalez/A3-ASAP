import { ImageResponse } from "next/og";
import { OG, OG_SIZE, OgColorBar, ogFonts, ogLogo, ogPhoto } from "@/lib/og";

/* La imagen que sale al compartir estoesasap.com: titular y productos. */
export const alt = "Esto es ASAP: imprime lo de tu marca, sin complicarte. Tarjetas, tazas, camisetas, etiquetas y más en Quito.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [fonts, logo, ...photos] = await Promise.all([
    ogFonts(),
    ogLogo(),
    ogPhoto("tarjetas-de-presentacion"),
    ogPhoto("tazas-mugs"),
    ogPhoto("gorras"),
    ogPhoto("etiquetas"),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: OG.paper, fontFamily: "Outfit" }}>
        <OgColorBar />
        <div style={{ display: "flex", flex: 1, padding: "56px 64px", gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img> */}
            <img src={logo} width={260} height={97} alt="" style={{ marginLeft: -24 }} />
            <div style={{ display: "flex", marginTop: 36, fontSize: 64, fontWeight: 600, lineHeight: 1.02, letterSpacing: -2, color: OG.ink }}>
              Imprime lo de tu marca, sin complicarte.
            </div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 28, lineHeight: 1.35, color: OG.soft }}>
              Tarjetas, tazas, camisetas, etiquetas y más. Quito y los valles.
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", width: 440, gap: 16 }}>
            {photos.map((photo, index) =>
              photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img>
                <img key={index} src={photo} width={212} height={158} alt="" style={{ borderRadius: 20, objectFit: "cover" }} />
              ) : null,
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
