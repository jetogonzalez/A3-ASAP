/*
 * Ícono de cada ritmo de entrega, en el color del material de marca:
 * Standard verde (camión, el ritmo normal), Priority amarillo (reloj que
 * adelanta) y Express naranja (rayo, urgente). Va en un recuadro de su tinta.
 */

type Speed = "standard" | "priority" | "express";

const TONES: Record<Speed, { tint: string; ink: string }> = {
  standard: { tint: "#e3f6e8", ink: "#14713a" },
  priority: { tint: "#fff3c4", ink: "#8a5d00" },
  express: { tint: "#ffe6db", ink: "#c93d17" },
};

function asSpeed(id: string): Speed {
  const key = id.toLowerCase();
  return key === "priority" || key === "express" ? key : "standard";
}

export function DeliveryIcon({ speed, size = "md" }: { speed: string; size?: "sm" | "md" }) {
  const key = asSpeed(speed);
  const tone = TONES[key];
  const box = size === "sm" ? "size-7 rounded-lg" : "size-10 rounded-xl";
  const glyph = size === "sm" ? 16 : 20;
  return (
    <span
      className={`grid shrink-0 place-items-center ${box}`}
      style={{ background: tone.tint, color: tone.ink }}
      aria-hidden="true"
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {key === "standard" ? (
          <>
            <path d="M2.5 6.5h11v9.5h-11z" />
            <path d="M13.5 9.5h4l3.5 3.5v3h-7.5" />
            <circle cx="6.5" cy="17.5" r="1.7" />
            <circle cx="17" cy="17.5" r="1.7" />
          </>
        ) : key === "priority" ? (
          <>
            <circle cx="13" cy="13" r="7.5" />
            <path d="M13 9v4l2.5 2" />
            <path d="M2.5 9h3M1.5 13h3M2.5 17h3" />
          </>
        ) : (
          <path d="M13 2.5 4.5 13.5h6.5l-1 8 8.5-11h-6.5l1-8Z" fill="currentColor" fillOpacity="0.18" />
        )}
      </svg>
    </span>
  );
}
