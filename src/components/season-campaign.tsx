import Link from "next/link";
import { SeasonalProductPhoto } from "@/components/product-photo";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { LAUNCH_PRODUCTS, launchProductHref } from "@/lib/launch-products";
import { SEASONS } from "@/lib/seasons";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * La campaña de temporada en la portada: qué conviene pedir ahora, con fotos
 * de temporada y un botón de WhatsApp con el mensaje ya escrito. Solo se ve
 * cuando la temporada está activa (data-season-only).
 */
export function SeasonCampaign() {
  return (
    <>
      {SEASONS.filter((season) => season.campaign).map((season) => {
        const campaign = season.campaign!;
        const products = campaign.products.flatMap((slug) => {
          const product = LAUNCH_PRODUCTS.find((candidate) => candidate.slug === slug);
          return product ? [product] : [];
        });
        return (
          <section key={season.id} data-season-only={season.id} className="season-campaign" aria-labelledby={`campana-${season.id}`}>
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
              <div>
                <p className="text-sm font-semibold opacity-85">{season.name}</p>
                <h2 id={`campana-${season.id}`} className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  {campaign.title}
                </h2>
                <p className="mt-3 max-w-md leading-7 opacity-90">{campaign.text}</p>
                <ul className="mt-5 space-y-2">
                  {campaign.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
                        <circle cx="9" cy="9" r="8" fill="rgba(255,255,255,0.18)" />
                        <path d="M5.4 9.2 7.9 11.7 12.6 6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {point}
                    </li>
                  ))}
                </ul>
                <a
                  href={whatsappHref(campaign.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-[#141414] hover:bg-white/90"
                >
                  <WhatsappLogo size={20} brand />
                  {campaign.cta}
                </a>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link href={launchProductHref(product)} className="group block overflow-hidden rounded-[20px] bg-white text-[#141414] shadow-[0_18px_36px_-24px_rgba(0,0,0,0.55)]">
                      <span className="block aspect-[4/3] overflow-hidden">
                        <SeasonalProductPhoto slug={product.slug} alt="" sizes="(min-width: 1024px) 300px, 45vw" className="transition-transform duration-500 group-hover:scale-[1.04]" />
                      </span>
                      <span className="flex items-center justify-between gap-2 px-3.5 py-3">
                        <span>
                          <span className="block font-semibold">{product.name}</span>
                          <span className="block text-sm text-[#4b5563]">Desde {product.quantities[0]} u.</span>
                        </span>
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                    </Link>
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
