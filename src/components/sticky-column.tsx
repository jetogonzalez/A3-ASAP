"use client";

import { useEffect, useRef } from "react";

/**
 * Columna que acompaña el scroll. Si cabe en la pantalla queda fija arriba;
 * si es más alta (galería + descripción abierta), se fija por abajo para que
 * se pueda leer todo sin que nada quede tapado.
 */
export function StickyColumn({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const header = 128;
    const place = () => {
      /* Abajo queda la barra fija del precio: la columna no se mete debajo. */
      const room = window.innerHeight - node.offsetHeight - 104;
      node.style.top = `${Math.min(header, room)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(node);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  return (
    <div ref={ref} className={`lg:sticky ${className}`}>
      {children}
    </div>
  );
}
