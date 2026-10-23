import { inkFor } from "@/lib/palette";

/*
 * Ilustración de cada familia de productos, hecha con CSS: tarjetas, hojas,
 * revistas, pendones… sobre la mesa, con sombra y grosor. Sirve en el inicio,
 * en el menú y en las fichas mientras no haya fotos de producto. Agregar una
 * familia nueva es sumar un caso aquí.
 */

/* Las escenas pintan con el acento de su familia. */
const INK = "var(--art-accent)";
const CREAM = "#f6f1e7";
const SHADOW = "0 18px 24px -14px rgba(20,20,30,0.38), 0 2px 4px rgba(20,20,30,0.1)";

export type ArtKind = "tarjetas" | "promocionales" | "papeleria" | "catalogos" | "gran-formato" | "pegatinas" | "empaque" | "textil";

export function ProductArt({ kind, className = "" }: { kind: string; className?: string }) {
  const { tint, accent } = inkFor(kind);
  return (
    <span
      className={`product-art relative block overflow-hidden ${className}`}
      style={
        {
          "--art-accent": accent,
          background: `radial-gradient(110% 95% at 35% 15%, #ffffff, ${tint} 62%)`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <span className="product-art-stage absolute inset-0">{scene(kind)}</span>
    </span>
  );
}

function scene(kind: string) {
  switch (kind) {
    case "tarjetas":
      return <Cards />;
    case "papeleria":
      return <Stationery />;
    case "catalogos":
      return <Catalog />;
    case "gran-formato":
      return <Banner />;
    case "pegatinas":
      return <Stickers />;
    case "empaque":
      return <Box />;
    case "textil":
      return <Tote />;
    case "promocionales":
      return <Mug />;
    default:
      return <Cards />;
  }
}

function Lines({ color = INK, top = "30%", left = "12%", width = "46%" }: { color?: string; top?: string; left?: string; width?: string }) {
  return (
    <span className="absolute block" style={{ top, left, width }}>
      <span className="block h-[5px] w-full rounded-full" style={{ background: color }} />
      <span className="mt-[5px] block h-[3px] w-[70%] rounded-full opacity-50" style={{ background: color }} />
      <span className="mt-[4px] block h-[3px] w-[55%] rounded-full opacity-40" style={{ background: color }} />
    </span>
  );
}

function Cards() {
  return (
    <>
      {[
        { x: "30%", y: "48%", r: -16, back: true },
        { x: "26%", y: "40%", r: -6, back: false },
      ].map((card, index) => (
        <span
          key={index}
          className="absolute block aspect-[85/55] w-[46%] overflow-hidden rounded-[3px]"
          style={{
            left: card.x,
            top: card.y,
            transform: `rotate(${card.r}deg)`,
            background: card.back ? INK : CREAM,
            boxShadow: `0 1px 0 #d4ccbd, 0 2px 0 #c6bdac, ${SHADOW}`,
          }}
        >
          {card.back ? (
            <span className="absolute right-[14%] top-[28%] aspect-square h-[40%] rounded-full bg-[#f6f1e7]" />
          ) : (
            <>
              <span className="absolute inset-y-0 left-0 w-[30%]" style={{ background: INK }} />
              <Lines left="40%" width="48%" />
            </>
          )}
        </span>
      ))}
    </>
  );
}

function Stationery() {
  return (
    <>
      <span
        className="absolute left-[20%] top-[14%] block aspect-[21/29.7] w-[38%] rounded-[2px] bg-white"
        style={{ transform: "rotate(-7deg)", boxShadow: SHADOW }}
      >
        <span className="absolute left-[12%] top-[8%] aspect-square w-[16%] rounded-full" style={{ background: INK }} />
        <Lines top="30%" width="70%" />
        <Lines top="52%" width="66%" color="#9aa39d" />
      </span>
      <span
        className="absolute left-[44%] top-[48%] block aspect-[22/11] w-[44%] overflow-hidden rounded-[3px]"
        style={{ background: CREAM, transform: "rotate(5deg)", boxShadow: SHADOW }}
      >
        <span className="absolute inset-x-0 top-0 h-[55%]" style={{ background: "linear-gradient(160deg,#e9e1d1,#f6f1e7)", clipPath: "polygon(0 0,100% 0,50% 100%)" }} />
        <span className="absolute bottom-[16%] left-[10%] h-[8%] w-[30%] rounded-full" style={{ background: INK }} />
      </span>
    </>
  );
}

function Catalog() {
  return (
    <>
      <span
        className="absolute left-[24%] top-[16%] block aspect-[21/29.7] w-[36%] overflow-hidden rounded-r-[4px]"
        style={{ background: "#f3efe6", transform: "rotate(-10deg)", boxShadow: SHADOW }}
      >
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.12),transparent_10%)]" />
      </span>
      <span
        className="absolute left-[34%] top-[14%] block aspect-[21/29.7] w-[36%] overflow-hidden rounded-r-[4px]"
        style={{ background: INK, transform: "rotate(4deg)", boxShadow: `3px 0 0 #e9e3d6, 4px 0 0 #d8d0c0, ${SHADOW}` }}
      >
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.3),transparent_8%)]" />
        <span className="absolute left-[14%] top-[12%] block text-[min(3.4vw,15px)] font-semibold leading-none text-[#f6f1e7]">Catálogo</span>
        <span className="absolute bottom-[10%] left-[14%] right-[14%] top-[34%] rounded-[2px] bg-[#f6f1e7]/15" />
      </span>
    </>
  );
}

function Banner() {
  return (
    <>
      <span
        className="absolute left-1/2 top-[8%] block h-[74%] w-[30%] -translate-x-1/2 overflow-hidden rounded-[2px]"
        style={{ background: "var(--art-accent)", boxShadow: SHADOW }}
      >
        <span className="absolute left-[14%] top-[10%] h-[6%] w-[60%] rounded-full bg-[#f6f1e7]" />
        <span className="absolute left-[14%] top-[20%] h-[3%] w-[44%] rounded-full bg-[#f6f1e7]/60" />
        <span className="absolute bottom-[18%] left-[14%] right-[14%] top-[34%] rounded-full bg-[#f6f1e7]/15" />
      </span>
      <span className="absolute left-1/2 top-[81%] block h-[7%] w-[40%] -translate-x-1/2 rounded-[3px] bg-[linear-gradient(180deg,#d9d4cc,#a9a297)] shadow-[0_8px_10px_-6px_rgba(38,28,12,0.6)]" />
    </>
  );
}

function Stickers() {
  const dots = [
    { x: "22%", y: "22%", s: "22%", c: INK },
    { x: "50%", y: "18%", s: "18%", c: "#e5a823" },
    { x: "34%", y: "50%", s: "20%", c: "#d6553b" },
    { x: "60%", y: "48%", s: "24%", c: "#4660ff" },
  ];
  return (
    <span
      className="absolute left-[16%] top-[12%] block h-[76%] w-[68%] rounded-[6px] bg-white"
      style={{ transform: "rotate(-5deg)", boxShadow: SHADOW }}
    >
      {dots.map((dot, index) => (
        <span
          key={index}
          className="absolute block aspect-square rounded-full ring-[3px] ring-white"
          style={{ left: dot.x, top: dot.y, width: dot.s, background: dot.c, boxShadow: "0 0 0 4px rgba(0,0,0,0.05)" }}
        />
      ))}
    </span>
  );
}

function Box() {
  return (
    <span className="absolute left-1/2 top-[18%] block h-[62%] w-[46%] -translate-x-1/2">
      <span className="absolute inset-x-0 top-0 h-[24%] rounded-t-[3px]" style={{ background: "#c79a62", transform: "skewX(-20deg)", transformOrigin: "bottom" }} />
      <span className="absolute inset-x-0 bottom-0 top-[22%] rounded-b-[3px]" style={{ background: "linear-gradient(180deg,#d8ad74,#c4945a)", boxShadow: SHADOW }}>
        <span className="absolute left-1/2 top-[30%] aspect-square w-[30%] -translate-x-1/2 rounded-full" style={{ background: INK }} />
        <span className="absolute inset-y-0 left-[46%] w-[8%] bg-black/5" />
      </span>
    </span>
  );
}

function Tote() {
  return (
    <span className="absolute left-1/2 top-[14%] block h-[70%] w-[44%] -translate-x-1/2">
      <span className="absolute left-[22%] top-0 h-[34%] w-[56%] rounded-t-full border-[5px] border-b-0 border-[#d9cfbd]" />
      <span className="absolute inset-x-0 bottom-0 top-[26%] rounded-[4px]" style={{ background: "#efe7d8", boxShadow: SHADOW }}>
        <span className="absolute left-1/2 top-[28%] aspect-square w-[34%] -translate-x-1/2 rounded-full" style={{ background: INK }} />
        <span className="absolute bottom-[18%] left-1/2 h-[6%] w-[46%] -translate-x-1/2 rounded-full" style={{ background: INK, opacity: 0.6 }} />
      </span>
    </span>
  );
}

function Mug() {
  return (
    <>
      {/* Esfero acostado detrás de la taza. */}
      <span
        className="absolute left-[18%] top-[70%] block h-[5%] w-[56%] rounded-full"
        style={{ background: "linear-gradient(180deg,#f4f4f6,#d5d7dd)", transform: "rotate(-14deg)", boxShadow: SHADOW }}
      >
        <span className="absolute inset-y-0 right-0 w-[22%] rounded-r-full" style={{ background: INK }} />
      </span>
      <span className="absolute left-[30%] top-[16%] block h-[58%] w-[36%]">
        <span className="absolute right-[-22%] top-[22%] h-[44%] w-[34%] rounded-r-full border-[7px] border-l-0 border-[#d9dbe2]" />
        <span
          className="absolute inset-0 overflow-hidden rounded-b-[14px] rounded-t-[4px]"
          style={{ background: "linear-gradient(90deg,#e7e4de,#ffffff 38%,#f1eee9)", boxShadow: SHADOW }}
        >
          <span className="absolute inset-x-0 top-0 h-[10%] bg-[#d9d5ce]" />
          <span className="absolute left-1/2 top-[34%] aspect-square w-[42%] -translate-x-1/2 rounded-[22%]" style={{ background: INK }} />
        </span>
      </span>
    </>
  );
}
