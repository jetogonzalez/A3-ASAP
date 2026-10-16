/*
 * Muestras de material para las opciones del configurador. Un ícono dice
 * «esto es brillante»; la persona igual no sabe cómo se ve. Esto pinta una
 * tarjeta sobre la mesa con la luz que le corresponde a cada acabado, como
 * las fotos de producto de una imprenta, pero hecho con CSS: no hay fotos que
 * mantener y la muestra siempre coincide con lo que se imprime.
 */

export type SwatchKind =
  | "papel-mate"
  | "papel-brillante"
  | "sin-laminado"
  | "laminado-mate"
  | "laminado-brillante"
  | "sin-uv"
  | "uv"
  | "esquina-recta"
  | "esquina-redonda"
  | "una-cara"
  | "doble-cara";

/** Grano de papel: ruido fractal en un SVG. Se multiplica sobre el color de la hoja. */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0 0.33 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

const INK = "#0e5a33";
const MATTE_PAPER = "#f4efe6";

/** La tarjeta recostada sobre la mesa, vista un poco desde arriba. */
const TILT = "translate(-50%, -46%) perspective(420px) rotateX(36deg) rotateZ(-9deg)";

export function FinishSwatch({ kind }: { kind: SwatchKind }) {
  return (
    <span
      className="swatch relative block h-24 w-full overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_30%_10%,#f3f1ed,#ddd8d0_70%,#cfc9bf)]"
      aria-hidden="true"
    >
      {kind === "esquina-recta" || kind === "esquina-redonda" ? (
        <CornerScene rounded={kind === "esquina-redonda"} />
      ) : kind === "una-cara" || kind === "doble-cara" ? (
        <SidesScene double={kind === "doble-cara"} />
      ) : (
        <FinishScene kind={kind} />
      )}
    </span>
  );
}

function FinishScene({ kind }: { kind: SwatchKind }) {
  const dark = kind === "uv" || kind === "sin-uv";
  const matte = kind === "papel-mate" || kind === "laminado-mate" || kind === "sin-laminado" || dark;
  const glossy = kind === "papel-brillante" || kind === "laminado-brillante";
  const laminated = kind === "laminado-mate" || kind === "laminado-brillante";

  return (
    <span
      className="absolute left-1/2 top-1/2 block aspect-[85/55] w-[76%] overflow-hidden rounded-[2px] shadow-[0_16px_18px_-12px_rgba(40,32,20,0.55),0_2px_3px_rgba(40,32,20,0.18)]"
      style={{
        transform: TILT,
        background: dark ? "#1c1e20" : matte ? MATTE_PAPER : "#ffffff",
      }}
    >
      <PrintedArt dark={dark} deep={laminated} muted={matte && !laminated && !dark} />

      {/* El grano solo se ve donde no hay capa encima que lo tape. */}
      {matte && !laminated ? (
        <span className="absolute inset-0 opacity-70 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
      ) : null}

      {/* Luz de ambiente: más clara arriba, como bajo una lámpara. */}
      <span className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.18),transparent_45%,rgba(0,0,0,0.07))]" />

      {kind === "laminado-mate" ? (
        /* Terciopelo: un brillo ancho y apagado, sin borde definido. */
        <span className="absolute inset-0 bg-[radial-gradient(70%_80%_at_32%_22%,rgba(255,255,255,0.32),transparent_70%)]" />
      ) : null}

      {glossy ? (
        <>
          {/* El reflejo de una ventana: dos paños blancos con el borde nítido. */}
          <span className="absolute -top-[10%] left-[18%] h-[130%] w-[16%] -skew-x-[18deg] bg-white/55 blur-[1px]" />
          <span className="absolute -top-[10%] left-[38%] h-[130%] w-[7%] -skew-x-[18deg] bg-white/35 blur-[1px]" />
          <span className="swatch-sweep absolute inset-0" />
        </>
      ) : null}

      {kind === "uv" ? <UvShine /> : null}

      {laminated ? <FilmCorner glossy={kind === "laminado-brillante"} /> : null}
    </span>
  );
}

/** Lo impreso: logo, nombre y datos. Sobre el arte es donde más se nota el acabado. */
function PrintedArt({ dark, deep, muted }: { dark: boolean; deep: boolean; muted: boolean }) {
  const ink = dark ? "#e9e4da" : INK;
  return (
    <span className="absolute inset-0" style={{ opacity: muted ? 0.86 : 1, filter: deep ? "saturate(1.18) brightness(0.94)" : undefined }}>
      {dark ? null : <span className="absolute inset-y-0 left-0 w-[34%]" style={{ background: INK }} />}
      <span
        className="absolute left-[9%] top-[30%] h-[38%] aspect-square rounded-full"
        style={{ background: dark ? "#2a2d30" : "#f4efe6" }}
      />
      <span className="absolute left-[44%] top-[26%] h-[11%] w-[40%] rounded-[1px]" style={{ background: ink }} />
      <span className="absolute left-[44%] top-[46%] h-[6%] w-[28%] rounded-[1px] opacity-60" style={{ background: ink }} />
      <span className="absolute left-[44%] top-[66%] h-[5%] w-[34%] rounded-[1px] opacity-45" style={{ background: ink }} />
      <span className="absolute left-[44%] top-[76%] h-[5%] w-[24%] rounded-[1px] opacity-45" style={{ background: ink }} />
    </span>
  );
}

/** El barniz UV va solo sobre el logo: se ve como un charco de luz encima del negro mate. */
function UvShine() {
  return (
    <span className="absolute left-[9%] top-[30%] h-[38%] aspect-square overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]">
      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.05)_48%,rgba(255,255,255,0.35)_80%)]" />
      <span className="swatch-sweep absolute inset-0" />
    </span>
  );
}

/** La película del laminado levantada en la esquina: se ve que es una capa aparte. */
function FilmCorner({ glossy }: { glossy: boolean }) {
  return (
    <>
      {/* Donde se levantó, queda la tarjeta sin capa y con la sombra de la película. */}
      <span
        className="absolute bottom-0 right-0 h-[36%] w-[22%]"
        style={{
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
          background: "linear-gradient(315deg, #efe9de 40%, #cfc7b9)",
        }}
      />
      {/* La película doblada hacia adentro, como la punta de una página. */}
      <span
        className="absolute bottom-0 right-0 h-[36%] w-[22%] drop-shadow-[-1px_-1px_1.5px_rgba(0,0,0,0.25)]"
        style={{
          clipPath: "polygon(0 100%, 100% 0, 0 0)",
          background: glossy
            ? "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(214,224,236,0.9) 55%, rgba(255,255,255,0.92))"
            : "linear-gradient(135deg, rgba(244,241,236,0.98), rgba(214,208,198,0.95))",
        }}
      />
    </>
  );
}

/** De cerca, la esquina. Detrás asoma otra tarjeta para que se lea el canto. */
function CornerScene({ rounded }: { rounded: boolean }) {
  const radius = rounded ? "22px" : "2px";
  return (
    <>
      <span
        className="absolute left-[30%] top-[30%] block h-[130%] w-[110%] bg-[#e7e1d6]"
        style={{ borderRadius: radius, transform: "rotate(-6deg)", boxShadow: "0 6px 10px -6px rgba(40,32,20,0.4)" }}
      />
      <span
        className="absolute left-[22%] top-[20%] block h-[130%] w-[110%] overflow-hidden"
        style={{
          borderRadius: radius,
          background: MATTE_PAPER,
          transform: "rotate(-6deg)",
          boxShadow: "0 14px 18px -10px rgba(40,32,20,0.5), 0 1px 2px rgba(40,32,20,0.2)",
        }}
      >
        <span className="absolute inset-0 opacity-60 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
        <span className="absolute left-[10%] top-[16%] h-[18%] aspect-square rounded-full" style={{ background: INK }} />
        <span className="absolute left-[36%] top-[20%] h-[6%] w-[30%] rounded-[1px]" style={{ background: INK }} />
      </span>
    </>
  );
}

/** Dos tarjetas en abanico: la de atrás muestra el reverso, impreso o en blanco. */
function SidesScene({ double }: { double: boolean }) {
  return (
    <>
      <span
        className="absolute left-1/2 top-1/2 block aspect-[85/55] w-[60%] overflow-hidden rounded-[2px] shadow-[0_10px_14px_-10px_rgba(40,32,20,0.5)]"
        style={{ transform: "translate(-30%, -62%) rotate(9deg)", background: double ? INK : "#fbf9f5" }}
      >
        {double ? (
          /* El reverso impreso asoma por la derecha, que es lo que queda a la vista. */
          <span className="absolute right-[10%] top-[22%] h-[30%] aspect-square rounded-full bg-[#f4efe6]" />
        ) : null}
      </span>
      <span
        className="absolute left-1/2 top-1/2 block aspect-[85/55] w-[60%] overflow-hidden rounded-[2px] bg-[#fbf9f5] shadow-[0_14px_16px_-10px_rgba(40,32,20,0.55)]"
        style={{ transform: "translate(-74%, -38%) rotate(-7deg)" }}
      >
        <PrintedArt dark={false} deep={false} muted={false} />
      </span>
    </>
  );
}
