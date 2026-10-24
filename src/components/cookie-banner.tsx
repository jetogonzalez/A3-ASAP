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

/*
 * La galletita: redonda, mordida, con chispas de chocolate. Lleva un adorno
 * distinto en cada temporada (gorro de Navidad, corona de Reyes, flor en mayo…);
 * el CSS deja ver solo el de la temporada activa (data-season-only).
 */
function Cookie() {
  return (
    <span className="cookie-tile mt-0.5 grid size-16 shrink-0 place-items-center rounded-2xl">
      <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true" className="cookie-bob overflow-visible">
        <defs>
          <mask id="cookie-bite">
            <rect width="64" height="64" fill="#fff" />
            <circle cx="53" cy="20" r="7.5" fill="#000" />
            <circle cx="57" cy="29" r="5.5" fill="#000" />
          </mask>
        </defs>
        <g mask="url(#cookie-bite)">
          <circle cx="32" cy="38" r="23" fill="#d6964f" />
          <circle cx="32" cy="37" r="20.5" fill="#efbd78" />
          <ellipse cx="25" cy="29" rx="10" ry="5.5" fill="#f8d9a6" opacity="0.7" />
          <path d="M20.5 27.5c1.8-1.6 4.3-1 4.6 1.2.3 2-2 3.2-3.9 2.6-1.6-.5-2.2-2.5-.7-3.8Z" fill="#6b4226" />
          <path d="M35.5 34c2-1.3 4.5-.4 4.5 1.8 0 2.1-2.6 3-4.4 2.2-1.5-.7-1.6-2.9-.1-4Z" fill="#6b4226" />
          <path d="M22 44.5c1.9-1.4 4.4-.6 4.6 1.6.2 2.1-2.4 3.1-4.2 2.3-1.6-.7-1.9-2.8-.4-3.9Z" fill="#6b4226" />
          <path d="M39.5 48c1.6-1 3.6-.3 3.7 1.4.1 1.7-1.9 2.4-3.4 1.8-1.3-.5-1.5-2.3-.3-3.2Z" fill="#6b4226" />
          <path d="M14 37c1.3-.9 3-.3 3.1 1.2.1 1.4-1.6 2.1-2.8 1.5-1.1-.5-1.3-2-.3-2.7Z" fill="#6b4226" />
          <path d="M45.5 39.5c1.2-.8 2.8-.2 2.9 1.1.1 1.3-1.5 1.9-2.6 1.4-1-.5-1.2-1.9-.3-2.5Z" fill="#6b4226" />
          <circle cx="21.6" cy="28.6" r="0.9" fill="#a06a43" />
          <circle cx="36.8" cy="35" r="0.9" fill="#a06a43" />
        </g>
        <circle cx="48" cy="27.5" r="1.1" fill="#d6964f" />
        <circle cx="50.5" cy="33" r="0.8" fill="#d6964f" />

        {/* Normal: chispas de los colores de la marca. */}
        <g data-season-only="normal">
          <rect x="29" y="22" width="5" height="2.6" rx="1.3" fill="#4660ff" transform="rotate(-20 31.5 23.3)" />
          <rect x="29" y="47" width="5" height="2.6" rx="1.3" fill="#ff5a2c" transform="rotate(25 31.5 48.3)" />
          <rect x="43" y="44" width="5" height="2.6" rx="1.3" fill="#2db84b" transform="rotate(-35 45.5 45.3)" />
          <rect x="15" y="44" width="4.5" height="2.6" rx="1.3" fill="#ffc727" transform="rotate(15 17 45.3)" />
        </g>

        {/* Fiestas de Quito: chispas rojas y azules y un banderín. */}
        <g data-season-only="fiestas-quito">
          <rect x="29" y="22" width="5" height="2.6" rx="1.3" fill="#e5484d" transform="rotate(-20 31.5 23.3)" />
          <rect x="29" y="47" width="5" height="2.6" rx="1.3" fill="#3d6fe0" transform="rotate(25 31.5 48.3)" />
          <rect x="43" y="44" width="5" height="2.6" rx="1.3" fill="#e5484d" transform="rotate(-35 45.5 45.3)" />
          <path d="M17 21V3" stroke="#8a6a4a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M17.6 3.5h11l-3 3.5 3 3.5h-11Z" fill="#3d6fe0" />
          <path d="M17.6 3.5h11l-3 3.5h-8Z" fill="#e5484d" />
        </g>

        {/* Navidad: gorro rojo con pompón. */}
        <g data-season-only="navidad" transform="rotate(-14 24 14)">
          <path d="M12 19c2-9 9-15 19-15-2.5 3-3 8-1 14Z" fill="#e5484d" />
          <circle cx="31.5" cy="4.5" r="3.4" fill="#fff" stroke="#e8e2d8" />
          <rect x="10" y="16" width="23" height="6.5" rx="3.25" fill="#fff" stroke="#e8e2d8" />
        </g>

        {/* Año nuevo: gorrito de fiesta dorado y chispas plateadas. */}
        <g data-season-only="fin-de-ano">
          <g transform="rotate(-12 25 12)">
            <path d="M15 21 25 1l10 20Z" fill="#b9c4f0" />
            <path d="M18.4 14.2 31.6 14.2M21.4 8.2l7.2 0" stroke="#e6c36a" strokeWidth="2.2" />
            <circle cx="25" cy="1.5" r="2.6" fill="#e6c36a" />
          </g>
          <rect x="31" y="46" width="5" height="2.6" rx="1.3" fill="#c9ced9" transform="rotate(25 33.5 47.3)" />
          <rect x="43" y="44" width="5" height="2.6" rx="1.3" fill="#e6c36a" transform="rotate(-35 45.5 45.3)" />
        </g>

        {/* Reyes: corona dorada. */}
        <g data-season-only="reyes" transform="rotate(-10 24 12)">
          <path d="M12 21V8l6 5.5L24 4l6 9.5L36 8v13Z" fill="#f0c75e" stroke="#c99a2e" strokeWidth="1" strokeLinejoin="round" />
          <circle cx="18" cy="17" r="1.6" fill="#e57b8e" />
          <circle cx="24" cy="17" r="1.6" fill="#7b9be8" />
          <circle cx="30" cy="17" r="1.6" fill="#6fbf8e" />
        </g>

        {/* Carnaval: chispas de colores y una gota de agua. */}
        <g data-season-only="carnaval">
          <rect x="29" y="22" width="5" height="2.6" rx="1.3" fill="#ff8fb1" transform="rotate(-20 31.5 23.3)" />
          <rect x="29" y="47" width="5" height="2.6" rx="1.3" fill="#7fd3ef" transform="rotate(25 31.5 48.3)" />
          <rect x="43" y="44" width="5" height="2.6" rx="1.3" fill="#ffd76e" transform="rotate(-35 45.5 45.3)" />
          <rect x="15" y="44" width="4.5" height="2.6" rx="1.3" fill="#8fdcae" transform="rotate(15 17 45.3)" />
          <path d="M16 4c3 4.5 5 7.3 5 9.6a5 5 0 0 1-10 0C11 11.3 13 8.5 16 4Z" fill="#7fd3ef" />
          <ellipse cx="14.4" cy="13" rx="1" ry="1.6" fill="#fff" opacity="0.8" />
        </g>

        {/* San Valentín: glaseado en forma de corazón. */}
        <g data-season-only="san-valentin">
          <path d="M32 49.5c-8-5.4-12.5-9.8-12.5-15a6.4 6.4 0 0 1 12.5-2 6.4 6.4 0 0 1 12.5 2c0 5.2-4.5 9.6-12.5 15Z" fill="#f59ab5" stroke="#fff" strokeWidth="1.4" />
          <ellipse cx="26" cy="33.5" rx="2.2" ry="1.4" fill="#fff" opacity="0.6" />
        </g>

        {/* Día de la Madre: una flor. */}
        <g data-season-only="dia-madre">
          <circle cx="19" cy="9" r="4.2" fill="#f7b3c8" />
          <circle cx="26.5" cy="12" r="4.2" fill="#f7b3c8" />
          <circle cx="24.5" cy="19.5" r="4.2" fill="#f7b3c8" />
          <circle cx="16.5" cy="20" r="4.2" fill="#f7b3c8" />
          <circle cx="13" cy="13" r="4.2" fill="#f7b3c8" />
          <circle cx="19.7" cy="14.6" r="3.4" fill="#f9d98f" />
        </g>

        {/* Día del Padre: corbatín. */}
        <g data-season-only="dia-padre">
          <path d="M20 9.5 29.5 14v4L20 22.5Z" fill="#5fb3a1" />
          <path d="M39 9.5 29.5 14v4l9.5 4.5Z" fill="#5fb3a1" />
          <rect x="27" y="12.5" width="5" height="7" rx="1.5" fill="#3f8f7e" />
        </g>

        {/* Regreso a clases: birrete. */}
        <g data-season-only="regreso-clases" transform="rotate(-8 26 12)">
          <path d="M17 13v6c3 2 15 2 18 0v-6Z" fill="#2b2f45" />
          <path d="M8 10 26 3l18 7-18 7Z" fill="#3a3f5c" />
          <path d="M26 10l10 4v8" stroke="#f2b84b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="23" r="1.8" fill="#f2b84b" />
        </g>
      </svg>
    </span>
  );
}
