import { ImageResponse } from "next/og";
import { PRODUCT, defaultConfiguration } from "@/lib/catalog";
import { familyBySlug } from "@/lib/families";
import { launchProductBySlug } from "@/lib/launch-products";
import { formatUsd } from "@/lib/money";
import { OG, OG_SIZE, OgColorBar, ogFonts, ogLogo, ogPhoto } from "@/lib/og";
import { inkFor } from "@/lib/palette";
import { quote } from "@/lib/pricing";

/* La imagen al compartir un producto: su foto, nombre, mínimo y plazo. */
export const alt = "Producto personalizado de Esto es ASAP";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const launch = launchProductBySlug(slug);
  const family = launch ? familyBySlug(launch.family) : familyBySlug("tarjetas");
  const ink = inkFor(launch?.family ?? "tarjetas");
  const name = launch?.name ?? PRODUCT.name;
  const summary = launch?.summary ?? "Couché 300 g, mate o brillante, con acabados. Precio final al instante.";
  const chips = launch
    ? [`Desde ${launch.quantities[0].toLocaleString("es-EC")} u.`, `Producción ${launch.leadTime}`]
    : [`100 desde ${formatUsd(quote({ ...defaultConfiguration("85x55"), quantity: 100 }).printingCents)}`, "Pídelo en línea"];

  const [fonts, logo, photo] = await Promise.all([ogFonts(), ogLogo(), ogPhoto(launch ? launch.slug : PRODUCT.slug)]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#ffffff", fontFamily: "Outfit" }}>
        <OgColorBar />
        <div style={{ display: "flex", flex: 1, padding: 48, gap: 48, alignItems: "center" }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img>
            <img src={photo} width={560} height={418} alt="" style={{ borderRadius: 32, objectFit: "cover" }} />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img> */}
            <img src={logo} width={190} height={71} alt="" style={{ marginLeft: -18 }} />
            <div style={{ display: "flex", marginTop: 28, fontSize: 24, fontWeight: 600, color: ink.deep }}>{family?.label ?? "Productos"}</div>
            <div style={{ display: "flex", marginTop: 6, fontSize: 60, fontWeight: 600, lineHeight: 1.02, letterSpacing: -1.5, color: OG.ink }}>{name}</div>
            <div style={{ display: "flex", marginTop: 16, fontSize: 26, lineHeight: 1.35, color: OG.soft }}>{summary}</div>
            <div style={{ display: "flex", marginTop: 28, gap: 12 }}>
              {chips.map((chip) => (
                <div key={chip} style={{ display: "flex", padding: "8px 18px", borderRadius: 999, fontSize: 22, fontWeight: 600, background: ink.tint, color: ink.deep }}>
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
