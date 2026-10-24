"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Slider horizontal de productos. Se mueve con el dedo, la rueda o las
 * flechas; cada tarjeta encaja al soltar (scroll-snap) y la barra de abajo
 * dice cuánto falta. No se mueve solo: el que mira decide.
 */
export function ProductRail({ label, children }: { label: string; children: React.ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState({ start: true, end: false, ratio: 0, visible: 1 });

  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setProgress({
      start: node.scrollLeft <= 4,
      end: node.scrollLeft >= max - 4,
      ratio: max > 0 ? node.scrollLeft / max : 1,
      visible: node.scrollWidth > 0 ? node.clientWidth / node.scrollWidth : 1,
    });
  }, []);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  const move = (direction: 1 | -1) => {
    const node = track.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  const thumbWidth = Math.max(progress.visible, 0.08);
  /*
   * El carrusel recorta lo que se sale (es un overflow con scroll): por eso
   * lleva aire arriba y abajo, compensado con márgenes negativos, para que la
   * tarjeta pueda subir al pasar el mouse y su sombra no quede cortada.
   *
   * Un corte seco en el borde se veía raro: la tarjeta que asoma se desvanece.
   * Solo del lado donde hay más contenido.
   */
  const fade = `linear-gradient(to right, ${progress.start ? "black" : "transparent"}, black 3rem, black calc(100% - 4.5rem), ${
    progress.end ? "black" : "transparent"
  })`;

  return (
    <div className="relative">
      <ul
        ref={track}
        aria-label={label}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        className="product-rail -mx-5 -mt-3 -mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pt-3 pb-8 sm:gap-4 md:-mx-8 md:scroll-px-8 md:px-8"
      >
        {children}
      </ul>
      <div className="relative mt-5 flex items-center gap-4">
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <span
            className="absolute inset-y-0 rounded-full bg-ink transition-[left] duration-150 ease-out"
            style={{ width: `${thumbWidth * 100}%`, left: `${progress.ratio * (1 - thumbWidth) * 100}%` }}
          />
        </div>
        <div className="flex gap-2">
          <RailButton label="Anteriores" disabled={progress.start} onClick={() => move(-1)} flip />
          <RailButton label="Siguientes" disabled={progress.end} onClick={() => move(1)} />
        </div>
      </div>
    </div>
  );
}

function RailButton({ label, disabled, onClick, flip = false }: { label: string; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="press grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-sheet text-ink transition-[opacity,background-color,border-color] duration-150 hover:border-ink/30 disabled:cursor-default disabled:opacity-35"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={flip ? "rotate-180" : ""}>
        <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Cada tarjeta del slider: ancho fijo para que asome la siguiente. */
export function RailItem({ children }: { children: React.ReactNode }) {
  return <li className="w-[74%] shrink-0 snap-start sm:w-[42%] lg:w-[calc((100%-3rem)/4)]">{children}</li>;
}
