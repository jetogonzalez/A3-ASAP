import Link from "next/link";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import type { HelpBlock, HelpCategory } from "@/lib/help-center";
import { whatsappHref } from "@/lib/whatsapp";

/* Piezas compartidas del centro de ayuda: el cuerpo de un artículo, los íconos y el bloque de contacto. */

export function HelpBody({ blocks }: { blocks: HelpBlock[] }) {
  return (
    <div className="space-y-5 text-[1.0625rem] leading-8">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return <p key={index}>{block.text}</p>;
          case "list":
            return (
              <ul key={index} className="list-disc space-y-1.5 pl-6 marker:text-ink-soft">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={index} className="space-y-3">
                {block.items.map((item, step) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-on-ink tabular-nums">
                      {step + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={index} className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full border-collapse text-left text-base">
                  <thead className="bg-paper-deep">
                    <tr>
                      {block.head.map((cell) => (
                        <th key={cell} scope="col" className="px-4 py-2.5 font-semibold">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {block.rows.map((row) => (
                      <tr key={row.join("|")}>
                        {row.map((cell, column) =>
                          column === 0 ? (
                            <th key={column} scope="row" className="px-4 py-2.5 font-medium">
                              {cell}
                            </th>
                          ) : (
                            <td key={column} className="px-4 py-2.5 text-ink-soft">
                              {cell}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "tip":
            return (
              <p key={index} className="rounded-2xl bg-brand-soft px-5 py-4 text-base leading-7">
                <span className="font-semibold">Consejo: </span>
                {block.text}
              </p>
            );
          case "warn":
            return (
              <p key={index} className="rounded-2xl border border-alert-line bg-alert-soft px-5 py-4 text-base leading-7">
                <span className="font-semibold">Importante: </span>
                {block.text}
              </p>
            );
          case "link":
            return (
              <p key={index}>
                <Link href={block.href} className="font-semibold text-brand-deep underline underline-offset-4">
                  {block.label} →
                </Link>
              </p>
            );
        }
      })}
    </div>
  );
}

export function HelpIcon({ icon, className = "" }: { icon: HelpCategory["icon"]; className?: string }) {
  const paths: Record<HelpCategory["icon"], React.ReactNode> = {
    pedido: (
      <>
        <path d="M5 7h14l-1.3 10.2A2 2 0 0 1 15.7 19H8.3a2 2 0 0 1-2-1.8L5 7Z" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
      </>
    ),
    diseno: (
      <>
        <path d="M4 20l3.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
        <path d="M13.5 7.5l3 3" />
      </>
    ),
    entrega: (
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </>
    ),
    producto: (
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
      </>
    ),
    factura: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    sitio: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="7.6" r="1.2" fill="currentColor" stroke="none" />
        <path d="M7.5 10.5h9M12 10.5v4M12 14.5l-2.2 4M12 14.5l2.2 4" />
      </>
    ),
  };
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[icon]}
    </svg>
  );
}

/* Todos los temas con el mismo ícono: cuadrito azul pálido con el trazo del azul del logo. */
export const CATEGORY_TINT: Record<HelpCategory["icon"], string> = {
  pedido: "brand-tile",
  diseno: "brand-tile",
  entrega: "brand-tile",
  producto: "brand-tile",
  factura: "brand-tile",
  sitio: "brand-tile",
};

export function HelpContact({ compact = false }: { compact?: boolean }) {
  return (
    <aside aria-label="Contacto" className={`rounded-[22px] bg-ink text-on-ink ${compact ? "p-5" : "p-6 md:p-8"}`}>
      <h2 className={`${compact ? "text-lg" : "text-2xl"} font-semibold tracking-tight`}>¿No encontraste lo que buscabas?</h2>
      <p className="mt-1.5 leading-7 opacity-80">Escríbenos por WhatsApp y te ayudamos con tu pedido, tu archivo o lo que necesites imprimir.</p>
      <a
        href={whatsappHref("Hola ASAP, tengo una consulta.")}
        target="_blank"
        rel="noopener noreferrer"
        className="press mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-sheet px-5 font-semibold text-ink hover:opacity-90"
      >
        <WhatsappLogo size={20} brand />
        WhatsApp 096 295 6566
      </a>
    </aside>
  );
}
