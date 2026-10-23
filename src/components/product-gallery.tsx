"use client";

import { useRef, useState } from "react";
import { CardPreview } from "@/components/card-preview";
import { Card3D } from "@/components/finish-swatch";
import { ProductPhoto } from "@/components/product-photo";
import type { Configuration } from "@/lib/catalog";

/*
 * Galería del producto, al estilo de las fichas de imprenta: la muestra que
 * se edita y, al lado, la misma tarjeta fotografiada en escenas (sobre la
 * mesa, en pila, de cerca). Todo sale de la configuración actual, así que
 * cada escena cambia apenas eliges otro papel, laminado o esquina.
 */

type Slide = { id: string; label: string; scene: React.ReactNode };

/* Las miniaturas son la misma escena achicada: así coinciden siempre con la grande. */
const SCENE_WIDTH = 520;
const SCENE_HEIGHT = 360;
const THUMB_WIDTH = 76;

export function ProductGallery({
  config,
  front,
  back,
  children,
}: {
  config: Configuration;
  front: string | null;
  back: string | null;
  /** La muestra editable: es la primera foto de la galería. */
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);

  const slides: Slide[] = [
    { id: "muestra", label: "Tu tarjeta", scene: <FlatScene config={config} front={front} /> },
    { id: "mesa", label: "Sobre la mesa", scene: <TableScene config={config} front={front} back={back} /> },
    { id: "pila", label: "En pila", scene: <StackScene config={config} front={front} /> },
    { id: "detalle", label: "De cerca", scene: <DetailScene config={config} front={front} /> },
    { id: "foto", label: "Foto de referencia", scene: <PhotoScene /> },
  ];

  function go(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  return (
    <div>
      <div
        className="group/gallery relative touch-pan-y"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") swipeStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (swipeStart.current === null) return;
          const distance = event.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(distance) > 48) go(index + (distance < 0 ? 1 : -1));
        }}
        aria-roledescription="carrusel"
        aria-label="Fotos del producto"
      >
        {/* La primera foto va en el flujo y le da la altura a todas las demás. */}
        <div className={`gallery-slide ${index === 0 ? "is-active" : ""}`} aria-hidden={index !== 0}>
          {children}
        </div>
        {slides.slice(1).map((slide, offset) => (
          <div
            key={slide.id}
            className={`gallery-slide absolute inset-0 overflow-hidden rounded-[28px] ${index === offset + 1 ? "is-active" : ""}`}
            aria-hidden={index !== offset + 1}
          >
            <Stage>{slide.scene}</Stage>
          </div>
        ))}

        <ArrowButton side="left" onClick={() => go(index - 1)} />
        <ArrowButton side="right" onClick={() => go(index + 1)} />
      </div>

      <div className="mt-3 flex items-center gap-2" role="tablist" aria-label="Elegir foto">
        {slides.map((slide, position) => {
          const active = position === index;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={slide.label}
              onClick={() => go(position)}
              className={`gallery-thumb relative shrink-0 cursor-pointer overflow-hidden rounded-xl ring-offset-2 ring-offset-sheet ${
                active ? "ring-2 ring-pick" : "ring-1 ring-line hover:ring-ink/30"
              }`}
              style={{ width: THUMB_WIDTH, height: (THUMB_WIDTH * SCENE_HEIGHT) / SCENE_WIDTH }}
            >
              <span
                className="pointer-events-none absolute left-0 top-0 block origin-top-left"
                style={{ width: SCENE_WIDTH, height: SCENE_HEIGHT, transform: `scale(${THUMB_WIDTH / SCENE_WIDTH})` }}
                aria-hidden="true"
              >
                <Stage>{slide.scene}</Stage>
              </span>
            </button>
          );
        })}
        <p className="ml-auto text-sm text-ink-soft" aria-live="polite">
          <span className="hidden font-medium text-ink sm:inline">{slides[index].label} · </span>
          {index + 1}/{slides.length}
        </p>
      </div>
    </div>
  );
}

/** Foto de estudio de referencia: las demás escenas muestran tu tarjeta tal como la armas. */
function PhotoScene() {
  return (
    <div className="absolute inset-0">
      <ProductPhoto slug="tarjetas-de-presentacion" alt="Tarjetas de presentación, foto de referencia" sizes="(min-width: 1024px) 560px, 100vw" />
    </div>
  );
}

/** La mesa: un fondo lila de la marca con luz arriba y perspectiva para las tarjetas 3D. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-full min-h-[340px] w-full overflow-hidden rounded-[28px] bg-[radial-gradient(110%_95%_at_35%_12%,#ffffff,#ecebff_60%,#d9daf6)]"
      style={{ perspective: "1100px" }}
    >
      <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(40,40,90,0.12)]" />
      {children}
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Foto siguiente"}
      className={`gallery-arrow absolute top-1/2 z-20 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-sheet/90 text-ink shadow-[0_6px_16px_-8px_rgba(26,29,33,0.5)] backdrop-blur ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={side === "left" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/* ---------- Escenas ---------- */

function paperOf(config: Configuration) {
  const matte = config.paper === "mate" && config.laminate !== "brillante";
  return { paper: matte ? "#f7f3ec" : "#ffffff", edge: "#d6cfc2" };
}

function radiusOf(config: Configuration, cardWidth: number) {
  /* 3 mm de radio sobre 85 mm de ancho, a la escala de la tarjeta dibujada. */
  return config.rounded ? Math.round((3 / 85) * cardWidth * 1.6) : 2;
}

/** La muestra de frente, para la miniatura de la primera foto. */
function FlatScene({ config, front }: { config: Configuration; front: string | null }) {
  const square = config.sizeId === "55x55";
  return (
    <span
      className={`absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 overflow-hidden shadow-[0_24px_40px_-24px_rgba(28,23,18,0.6)] ${
        square ? "aspect-square w-[46%]" : "aspect-[85/55] w-[72%]"
      }`}
      style={{ borderRadius: radiusOf(config, 370) }}
    >
      <CardPreview config={config} face="front" fill artworkUrl={front} />
    </span>
  );
}

function TableScene({ config, front, back }: { config: Configuration; front: string | null; back: string | null }) {
  const square = config.sizeId === "55x55";
  const { paper, edge } = paperOf(config);
  const width = square ? 36 : 56;
  const radius = radiusOf(config, (SCENE_WIDTH * width) / 100);
  return (
    <>
      {config.sides === 2 ? (
        <Card3D paper={paper} edge={edge} width={`${width}%`} square={square} radius={radius} turn={14} tilt={54} shiftX={70} shiftY={-36} thickness={5} shadow={14}>
          <CardPreview config={config} face="back" fill artworkUrl={back} />
        </Card3D>
      ) : null}
      <Card3D
        paper={paper}
        edge={edge}
        width={`${width}%`}
        square={square}
        radius={radius}
        turn={-12}
        tilt={54}
        shiftX={config.sides === 2 ? -44 : 0}
        shiftY={config.sides === 2 ? 26 : 4}
        lift={config.sides === 2 ? 6 : 0}
        thickness={5}
        shadow={14}
      >
        <CardPreview config={config} face="front" fill artworkUrl={front} />
      </Card3D>
    </>
  );
}

/** Varias tarjetas apiladas, un poco desordenadas: así se ve el canto y la cantidad. */
function StackScene({ config, front }: { config: Configuration; front: string | null }) {
  const square = config.sizeId === "55x55";
  const { paper, edge } = paperOf(config);
  const width = square ? 34 : 52;
  const radius = radiusOf(config, (SCENE_WIDTH * width) / 100);
  const layers = [
    { turn: -4, x: 6, y: 10 },
    { turn: -11, x: -4, y: 6 },
    { turn: -7, x: 2, y: 2 },
    { turn: -15, x: -6, y: -2 },
    { turn: -10, x: 0, y: -6 },
  ];
  return (
    <>
      {layers.map((layer, position) => {
        const top = position === layers.length - 1;
        return (
          <Card3D
            key={position}
            paper={paper}
            edge={edge}
            width={`${width}%`}
            square={square}
            radius={radius}
            turn={layer.turn}
            tilt={56}
            shiftX={layer.x}
            shiftY={layer.y}
            lift={position * 5}
            thickness={5}
            shadow={position === 0 ? 16 : 3}
          >
            {top ? <CardPreview config={config} face="front" fill artworkUrl={front} /> : null}
          </Card3D>
        );
      })}
    </>
  );
}

/** La esquina de cerca: ahí se notan el grano, el brillo y el redondeado. */
function DetailScene({ config, front }: { config: Configuration; front: string | null }) {
  const square = config.sizeId === "55x55";
  const { paper, edge } = paperOf(config);
  const width = square ? 66 : 92;
  const radius = config.rounded ? 34 : 3;
  return (
    <Card3D
      paper={paper}
      edge={edge}
      width={`${width}%`}
      square={square}
      radius={radius}
      turn={-10}
      tilt={38}
      shiftX={SCENE_WIDTH * 0.1}
      shiftY={SCENE_HEIGHT * 0.12}
      thickness={7}
      shadow={18}
    >
      <CardPreview config={config} face="front" fill artworkUrl={front} />
    </Card3D>
  );
}
