import { siWhatsapp } from "simple-icons";

/** El color oficial de WhatsApp, para cuando el logo va sobre fondo claro. */
export const WHATSAPP_GREEN = `#${siWhatsapp.hex}`;

/**
 * El logo oficial de WhatsApp, del paquete simple-icons (no un dibujo
 * parecido). Toma el color del texto salvo que se pida el verde de la marca.
 */
export function WhatsappLogo({ size = 18, brand = false, className = "" }: { size?: number; brand?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={brand ? WHATSAPP_GREEN : "currentColor"}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={siWhatsapp.path} />
    </svg>
  );
}
