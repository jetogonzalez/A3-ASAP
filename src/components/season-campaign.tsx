import { WhatsappLogo } from "@/components/whatsapp-logo";
import { SEASONS } from "@/lib/seasons";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * La campaña de temporada en la portada: kits armados (varias piezas juntas)
 * para cotizar con un toque. No repite las tarjetas de producto que ya están
 * arriba en las fotos ni abajo en el carrusel: aquí se venden combinaciones.
 * Solo se ve cuando la temporada está activa (data-season-only).
 */
export function SeasonCampaign() {
  return (
    <>
      {SEASONS.filter((season) => season.campaign).map((season) => {
        const campaign = season.campaign!;
        return (
          <section key={season.id} data-season-only={season.id} className="season-campaign" aria-labelledby={`campana-${season.id}`}>
            <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
              <p className="text-sm font-semibold text-ink-soft">{season.name}</p>
              <h2 id={`campana-${season.id}`} className="mt-1 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                {campaign.title}
              </h2>
              <p className="mt-2 max-w-xl leading-7 text-ink-soft">{campaign.text}</p>
              <ul className="mt-8 grid gap-4 md:grid-cols-3">
                {campaign.kits.map((kit, index) => (
                  <li key={kit.name} className="kit-card flex flex-col rounded-[22px] bg-sheet p-5 ring-1 ring-line">
                    <span className="kit-number grid size-10 place-items-center rounded-full text-sm font-semibold tabular-nums" aria-hidden="true">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{kit.name}</h3>
                    <p className="mt-0.5 text-sm leading-6 text-ink-soft">{kit.for}</p>
                    <ul className="mt-4 mb-6 flex flex-wrap gap-1.5" aria-label={`Lleva: ${kit.items.join(", ")}`}>
                      {kit.items.map((item) => (
                        <li key={item} className="rounded-full bg-paper-deep px-3 py-1 text-sm font-medium">
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={whatsappHref(`Hola ASAP, quiero cotizar el «${kit.name}» (${kit.items.join(", ").toLowerCase()}) con mi marca para ${season.name}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
                    >
                      <WhatsappLogo size={18} />
                      Cotizar este kit
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </>
  );
}
