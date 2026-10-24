/*
 * Temporadas: versiones de la página para fechas especiales. Por ahora solo
 * se ven con el botón «Ver temporada» del pie (se guarda en este navegador);
 * no se activan solas por fecha hasta que el equipo decida cuándo.
 *
 * Una temporada cambia lo decorativo (barra de carga, franja con mensaje,
 * etiqueta de la portada, confeti del fondo). Los botones y textos siguen con
 * los colores de la marca para no perder contraste.
 */

export type SeasonId = "normal" | "fiestas-quito" | "navidad";

export type Season = {
  id: SeasonId;
  name: string;
  /** Lo que dice la franja bajo el encabezado. */
  banner?: { text: string; link: { href: string; label: string } };
  /** La etiqueta de arriba del título de la portada. */
  badge: string;
  /** El título grande de la portada. */
  title: string;
  /** La campaña de la portada: qué ofrecer, por qué ahora y qué productos mostrar. */
  campaign?: { title: string; text: string; points: string[]; products: string[]; message: string; cta: string };
};

export const SEASONS: Season[] = [
  { id: "normal", name: "Normal", badge: "Imprenta en línea en Quito y los valles", title: "Imprime lo de tu marca, sin complicarte." },
  {
    id: "fiestas-quito",
    name: "Fiestas de Quito",
    badge: "¡Que viva Quito! Arma lo de tu marca para las fiestas",
    title: "Que viva Quito, y que viva tu marca.",
    campaign: {
      title: "Las fiestas, con tu marca",
      text: "Para el equipo, la chiva de la empresa o el evento con tus clientes.",
      points: ["Camisetas y gorras desde 25 unidades", "Toma todos desde 5 unidades", "Te confirmamos plazo y precio por WhatsApp"],
      products: ["camisetas-hoodies", "gorras", "toma-todos", "tote-bags"],
      message: "Hola ASAP, quiero cotizar productos con mi marca para Fiestas de Quito.",
      cta: "Cotizar para las fiestas",
    },
    banner: {
      text: "Fiestas de Quito: camisetas, gorras y toma todos con tu marca para tu equipo.",
      link: { href: "/productos/textil", label: "Ver textil" },
    },
  },
  {
    id: "navidad",
    name: "Navidad",
    badge: "Regalos con tu marca para esta Navidad",
    title: "Esta Navidad, regala tu marca.",
    campaign: {
      title: "Regalos de fin de año para tu equipo y tus clientes",
      text: "Arma un detalle con tu marca: una taza, un cuaderno o un calendario, con etiqueta y tarjeta de regalo.",
      points: ["Tazas desde 5 unidades", "Empaque con tu marca: etiquetas y tarjetas de regalo", "Pide con tiempo: en diciembre los plazos se llenan"],
      products: ["tazas-mugs", "cuadernos", "calendarios", "etiquetas"],
      message: "Hola ASAP, quiero cotizar regalos de Navidad con mi marca.",
      cta: "Cotizar regalos de Navidad",
    },
    banner: {
      text: "Navidad: tazas, cuadernos y calendarios con tu marca para regalar. Pide con tiempo.",
      link: { href: "/productos/promocionales", label: "Ver regalos" },
    },
  },
];

export const SEASON_KEY = "asap-temporada";
