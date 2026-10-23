import { useId } from "react";
import { inkFor } from "@/lib/palette";

/*
 * Ilustración de cada producto de lanzamiento, dibujada en SVG con la tinta de
 * su familia. Sirve en el slider del inicio, en las familias y en la ficha
 * mientras no haya fotos. El cuadrito de color con el círculo blanco es «tu
 * logo»: así se entiende qué parte se personaliza.
 */

const SHADOW = "rgba(20,20,40,0.13)";
const LINE = "#e2e4ea";
const PAPER = "#ffffff";
const INK = "#141414";

type Palette = { accent: string; deep: string; tint: string };

export function ProductIllustration({
  productId,
  family,
  className = "",
  framed = true,
}: {
  productId: string;
  family: string;
  className?: string;
  /** Con fondo de la tinta de la familia; sin él, para ponerla sobre otro color. */
  framed?: boolean;
}) {
  const palette = inkFor(family);
  const uid = useId().replace(/:/g, "");
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      style={framed ? { background: `radial-gradient(120% 100% at 30% 10%, #ffffff, ${palette.tint} 65%)` } : undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 400 300" className="product-illustration absolute inset-0 h-full w-full">
        <ellipse cx="200" cy="262" rx="128" ry="11" fill={SHADOW} />
        <g className="product-illustration-body">{scene(productId, palette, uid)}</g>
      </svg>
    </span>
  );
}

function Mark({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={size * 0.24} fill={color} />
      <circle cx={x + size / 2} cy={y + size / 2} r={size * 0.22} fill={PAPER} />
    </g>
  );
}

function scene(id: string, p: Palette, uid: string) {
  switch (id) {
    case "ESF":
      return <Pens p={p} />;
    case "TMT":
      return <Bottles p={p} uid={uid} />;
    case "TAZ":
      return <Mug p={p} uid={uid} />;
    case "CAM":
      return <Tee p={p} />;
    case "GOR":
      return <Cap p={p} />;
    case "TOT":
      return <Tote p={p} />;
    case "PRG":
      return <GiftPaper p={p} uid={uid} />;
    case "ETQ":
      return <Stickers p={p} />;
    case "TRJ":
      return <GiftCards p={p} />;
    case "CAL":
      return <Calendar p={p} />;
    case "CUA":
      return <Notebooks p={p} />;
    default:
      return <Mark x={160} y={110} size={80} color={p.accent} />;
  }
}

function Pen({ y, body, clip }: { y: number; body: string; clip: string }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path d="M-122 0 L-104 -8 L-104 8 Z" fill="#c9ccd4" />
      <path d="M-128 0 L-120 -3 L-120 3 Z" fill={INK} />
      <rect x="-104" y="-9" width="214" height="18" rx="9" fill={body} stroke={body === PAPER ? LINE : "none"} strokeWidth="2" />
      <rect x="-40" y="-4" width="70" height="8" rx="4" fill={PAPER} opacity={body === PAPER ? 0 : 0.35} />
      <rect x="60" y="-15" width="48" height="6" rx="3" fill={clip} />
      <rect x="104" y="-9" width="10" height="18" rx="4" fill={clip} />
    </g>
  );
}

function Pens({ p }: { p: Palette }) {
  return (
    <g transform="translate(200 150) rotate(-22)">
      <Pen y={-42} body={PAPER} clip={p.accent} />
      <Pen y={0} body={p.accent} clip={p.deep} />
      <Pen y={42} body={INK} clip="#9aa0ab" />
      <rect x="-30" y="-46" width="44" height="8" rx="4" fill={p.accent} />
    </g>
  );
}

function Bottles({ p, uid }: { p: Palette; uid: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`metal-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#c6cad3" />
          <stop offset="0.45" stopColor="#f4f5f8" />
          <stop offset="1" stopColor="#aeb3bd" />
        </linearGradient>
      </defs>
      <rect x="226" y="92" width="58" height="166" rx="24" fill="#ffffff" fillOpacity="0.75" stroke={LINE} strokeWidth="3" />
      <rect x="240" y="70" width="30" height="26" rx="6" fill="#c9a77c" />
      <rect x="236" y="150" width="38" height="46" rx="8" fill={p.tint} />
      <rect x="132" y="70" width="74" height="190" rx="30" fill={`url(#metal-${uid})`} />
      <rect x="148" y="40" width="42" height="36" rx="8" fill={p.accent} />
      <rect x="160" y="30" width="18" height="14" rx="4" fill={p.deep} />
      <Mark x={149} y={140} size={40} color={p.accent} />
    </g>
  );
}

function Mug({ p, uid }: { p: Palette; uid: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`mug-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#e9ebf0" />
          <stop offset="0.4" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3e6ec" />
        </linearGradient>
      </defs>
      <path d="M262 128 C320 128 322 222 262 222" fill="none" stroke="#dfe2e8" strokeWidth="20" strokeLinecap="round" />
      <path d="M118 96 H270 V232 Q270 258 244 258 H144 Q118 258 118 232 Z" fill={`url(#mug-${uid})`} />
      <ellipse cx="194" cy="96" rx="76" ry="12" fill="#d9dce3" />
      <ellipse cx="194" cy="98" rx="66" ry="8" fill="#6b4a32" />
      <rect x="148" y="132" width="92" height="84" rx="14" fill={p.accent} />
      <circle cx="194" cy="164" r="16" fill={PAPER} />
      <rect x="168" y="190" width="52" height="7" rx="3.5" fill={PAPER} opacity="0.8" />
    </g>
  );
}

function Tee({ p }: { p: Palette }) {
  const tee = "M-60 -92 L-25 -104 Q0 -84 25 -104 L60 -92 L100 -52 L72 -27 L58 -40 L58 84 L-58 84 L-58 -40 L-72 -27 L-100 -52 Z";
  return (
    <g>
      <g transform="translate(160 160) scale(0.86) rotate(-6)">
        <path d={tee} fill={p.deep} />
        <path d="M-25 -104 Q0 -60 25 -104" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="6" />
      </g>
      <g transform="translate(222 166)">
        <path d={tee} fill={PAPER} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M-25 -104 Q0 -84 25 -104" fill="none" stroke={LINE} strokeWidth="5" />
        <Mark x={-26} y={-58} size={52} color={p.accent} />
        <rect x="-22" y="4" width="44" height="7" rx="3.5" fill={p.accent} opacity="0.55" />
      </g>
    </g>
  );
}

function Cap({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M96 196 Q196 172 334 202 Q318 236 214 232 Q124 230 96 196 Z" fill={p.deep} />
      <path d="M118 198 Q114 86 214 84 Q300 86 306 198 Z" fill={p.accent} />
      <path d="M214 84 Q190 140 196 198" fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="4" />
      <path d="M214 84 Q262 136 262 198" fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="4" />
      <circle cx="214" cy="86" r="8" fill={p.deep} />
      <rect x="150" y="134" width="62" height="40" rx="10" fill={PAPER} />
      <circle cx="181" cy="154" r="9" fill={p.accent} />
    </g>
  );
}

function Tote({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M164 112 Q164 46 200 46 Q236 46 236 112" fill="none" stroke="#d6c6a6" strokeWidth="11" strokeLinecap="round" />
      <path d="M118 104 H282 L290 258 H110 Z" fill="#f4ecdc" />
      <path d="M118 104 H282 L283 122 H117 Z" fill="#e9dec8" />
      <circle cx="200" cy="174" r="36" fill={p.accent} />
      <circle cx="200" cy="174" r="13" fill={PAPER} />
      <rect x="168" y="222" width="64" height="8" rx="4" fill={p.accent} opacity="0.6" />
    </g>
  );
}

function GiftPaper({ p, uid }: { p: Palette; uid: string }) {
  return (
    <g>
      <defs>
        <pattern id={`sprig-${uid}`} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <rect width="34" height="34" fill="#fbf7ef" />
          <circle cx="9" cy="10" r="4" fill={p.accent} />
          <path d="M22 26 q5 -9 10 0" fill="none" stroke={p.deep} strokeWidth="2.5" strokeLinecap="round" />
        </pattern>
      </defs>
      <rect x="92" y="70" width="216" height="172" rx="4" fill={`url(#sprig-${uid})`} transform="rotate(-6 200 156)" />
      <path d="M262 92 L318 104 L306 236 L250 222 Z" fill="#efe6d2" opacity="0.9" transform="rotate(-6 200 156)" />
      <circle cx="252" cy="196" r="26" fill={INK} />
      <circle cx="252" cy="196" r="10" fill={p.accent} />
    </g>
  );
}

function Stickers({ p }: { p: Palette }) {
  return (
    <g>
      <g transform="rotate(-5 200 156)">
        <rect x="106" y="56" width="188" height="204" rx="12" fill={PAPER} stroke={LINE} strokeWidth="3" />
        <circle cx="152" cy="106" r="28" fill={p.accent} />
        <circle cx="152" cy="106" r="10" fill={PAPER} />
        <rect x="200" y="78" width="58" height="58" rx="10" fill={INK} />
        <circle cx="229" cy="107" r="11" fill={p.accent} />
        <rect x="126" y="160" width="56" height="56" rx="28" fill="#4660ff" />
        <rect x="204" y="162" width="56" height="56" rx="10" fill="none" stroke={LINE} strokeWidth="3" strokeDasharray="6 6" />
      </g>
      <g transform="translate(262 214) rotate(14)">
        <rect x="-30" y="-30" width="60" height="60" rx="12" fill={p.tint} stroke={p.accent} strokeWidth="3" />
        <circle cx="0" cy="0" r="12" fill={p.accent} />
        <path d="M30 18 L18 30 L30 30 Z" fill="#d5d8df" />
      </g>
    </g>
  );
}

function GiftCards({ p }: { p: Palette }) {
  const heart = "M0 10 C-14 -2 -18 -14 -8 -18 C-3 -20 0 -16 0 -13 C0 -16 3 -20 8 -18 C18 -14 14 -2 0 10 Z";
  return (
    <g>
      <rect x="150" y="70" width="150" height="176" rx="8" fill={p.accent} transform="rotate(9 225 158)" />
      <g transform="rotate(-6 186 160)">
        <rect x="104" y="74" width="164" height="186" rx="8" fill="#fbf8f1" stroke={LINE} strokeWidth="2" />
        <path d={heart} transform="translate(186 136) scale(1.9)" fill={p.accent} />
        <rect x="140" y="186" width="92" height="9" rx="4.5" fill={INK} />
        <rect x="156" y="204" width="60" height="6" rx="3" fill={INK} opacity="0.35" />
      </g>
    </g>
  );
}

function Calendar({ p }: { p: Palette }) {
  const days = Array.from({ length: 15 }, (_, i) => i);
  return (
    <g>
      <path d="M140 74 L300 74 L318 252 L130 252 Z" fill="#d6dae2" />
      <path d="M100 82 L280 82 L296 252 L84 252 Z" fill={PAPER} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 82 L280 82 L283 122 L97 122 Z" fill={p.accent} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={118 + i * 21} y="68" width="7" height="22" rx="3.5" fill="#9aa0ab" />
      ))}
      {days.map((i) => (
        <rect
          key={i}
          x={110 + (i % 5) * 34}
          y={140 + Math.floor(i / 5) * 32}
          width="24"
          height="20"
          rx="4"
          fill={i === 8 ? p.accent : "#eef0f4"}
        />
      ))}
    </g>
  );
}

function Notebooks({ p }: { p: Palette }) {
  return (
    <g>
      <rect x="168" y="62" width="140" height="186" rx="8" fill={p.tint} stroke={p.accent} strokeWidth="3" transform="rotate(8 238 155)" />
      <g transform="rotate(-4 190 158)">
        <rect x="118" y="58" width="150" height="196" rx="8" fill={p.accent} />
        <rect x="118" y="58" width="18" height="196" rx="4" fill={p.deep} />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x="108" y={74 + i * 20} width="22" height="8" rx="4" fill="#c4c8d0" />
        ))}
        <rect x="156" y="98" width="90" height="58" rx="8" fill={PAPER} />
        <rect x="170" y="116" width="56" height="7" rx="3.5" fill={INK} />
        <rect x="170" y="132" width="36" height="6" rx="3" fill={INK} opacity="0.35" />
      </g>
    </g>
  );
}
