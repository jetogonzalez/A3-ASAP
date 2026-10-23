"use client";

import Link from "next/link";

/*
 * Aviso de cookies. El sitio solo guarda lo necesario para funcionar (carrito,
 * último pedido, ajustes de accesibilidad y el permiso de Canva); no hay
 * publicidad ni seguimiento, así que no hay nada opcional que rechazar: el
 * aviso informa y se cierra con «Entendido».
 *
 * Se pinta siempre en el servidor y se esconde con CSS cuando <html> tiene
 * data-cookies="ok" (lo pone el script del <head> si ya lo aceptaste). Así
 * no parpadea ni cambia nada al hidratar.
 */

export const COOKIES_KEY = "asap-cookies";

export function CookieBanner() {
  function accept() {
    document.documentElement.dataset.cookies = "ok";
    /* El botón de accesibilidad espera esto para mostrarse en el teléfono. */
    window.dispatchEvent(new Event("asap:cookies"));
    try {
      localStorage.setItem(COOKIES_KEY, "ok");
    } catch {
      /* Sin almacenamiento se oculta igual en esta visita. */
    }
  }

  return (
    <section
      aria-label="Aviso de cookies"
      className="cookie-banner fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[25rem] print:hidden"
    >
      <div className="flex items-start gap-4 rounded-[24px] border border-line bg-sheet p-4 text-ink shadow-[0_24px_48px_-20px_rgba(20,20,20,0.45)]">
        <Cookie />
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Una galletita, nada más</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Solo guardamos lo que hace funcionar la tienda: tu carrito, tus ajustes de accesibilidad y el permiso de Canva. Sin publicidad ni seguimiento.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={accept}
              className="press inline-flex min-h-11 cursor-pointer items-center rounded-full bg-press px-5 text-sm font-semibold text-white hover:bg-press-deep"
            >
              Entendido
            </button>
            <Link href="/privacidad#cookies" className="text-sm font-semibold text-brand-deep underline underline-offset-4">
              Ver qué guardamos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* La galletita: mordida, con chispas de chocolate y una de cada color de marca. */
function Cookie() {
  return (
    <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true" className="cookie-bob mt-0.5 shrink-0">
      <path
        d="M32 4c3 0 5.4.6 7.6 1.6a6.5 6.5 0 0 0 8.4 8.6 6 6 0 0 0 9.8 7.2A28 28 0 1 1 32 4Z"
        fill="#e7b46a"
      />
      <path
        d="M32 8.5c2.3 0 4.2.4 5.8 1.1a10.4 10.4 0 0 0 11.6 9.5 10 10 0 0 0 7.1 6.6A23.5 23.5 0 1 1 32 8.5Z"
        fill="#f2c98a"
      />
      <ellipse cx="22" cy="24" rx="3.6" ry="3" fill="#5b3a21" />
      <ellipse cx="38" cy="33" rx="3.2" ry="2.8" fill="#5b3a21" />
      <ellipse cx="24" cy="42" rx="3.4" ry="2.9" fill="#5b3a21" />
      <ellipse cx="42" cy="47" rx="2.8" ry="2.4" fill="#5b3a21" />
      <ellipse cx="15" cy="34" rx="2.4" ry="2" fill="#5b3a21" />
      <rect x="29" y="18" width="5" height="3" rx="1.5" fill="#4660ff" transform="rotate(-20 31.5 19.5)" />
      <rect x="31" y="45" width="5" height="3" rx="1.5" fill="#ff5a2c" transform="rotate(25 33.5 46.5)" />
      <rect x="45" y="38" width="5" height="3" rx="1.5" fill="#2db84b" transform="rotate(-35 47.5 39.5)" />
      <rect x="17" y="49" width="4.5" height="2.8" rx="1.4" fill="#ffc727" transform="rotate(15 19 50)" />
    </svg>
  );
}
