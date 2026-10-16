"use client";

import { useRef } from "react";

/**
 * Mueve la luz sobre la muestra según dónde esté el cursor o el dedo. Escribe
 * variables CSS directo en el nodo: nada de estado, así no se vuelve a pintar
 * React en cada movimiento.
 */
export function LightStage({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1);
    node.style.setProperty("--lx", `${Math.round(x * 100)}%`);
    node.style.setProperty("--ly", `${Math.round(y * 100)}%`);
    node.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    node.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
  }

  function rest() {
    const node = ref.current;
    if (!node) return;
    for (const name of ["--lx", "--ly", "--rx", "--ry"]) node.style.removeProperty(name);
  }

  return (
    <div id={id} ref={ref} onPointerMove={move} onPointerLeave={rest} className={`light-stage ${className}`}>
      {children}
    </div>
  );
}
