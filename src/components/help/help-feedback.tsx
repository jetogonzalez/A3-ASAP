"use client";

import { useState } from "react";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { whatsappHref } from "@/lib/whatsapp";

/*
 * «¿Te sirvió?» al final de cada artículo. No se envía a ningún lado (no hay
 * seguimiento): si dice que no, le dejamos el WhatsApp con la duda ya escrita.
 */
export function HelpFeedback({ title }: { title: string }) {
  const [answer, setAnswer] = useState<"si" | "no" | null>(null);

  if (answer === "si") {
    return (
      <p role="status" className="rounded-2xl bg-moss-soft px-5 py-4 font-medium">
        ¡Qué bueno! Gracias por contarnos.
      </p>
    );
  }
  if (answer === "no") {
    return (
      <div role="status" className="rounded-2xl border border-line px-5 py-4">
        <p className="font-semibold">Lo sentimos. Cuéntanos tu duda y te respondemos.</p>
        <a
          href={whatsappHref(`Hola ASAP, leí «${title}» en la ayuda y todavía tengo una duda: `)}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
        >
          <WhatsappLogo size={18} />
          Escribir por WhatsApp
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-5 py-4">
      <p className="mr-auto font-semibold">¿Te sirvió este artículo?</p>
      {(
        [
          ["si", "Sí"],
          ["no", "No"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setAnswer(id)}
          className="press inline-flex min-h-11 min-w-20 cursor-pointer items-center justify-center rounded-full border border-line px-5 text-sm font-semibold hover:border-ink/30"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
