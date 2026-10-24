/*
 * Temporadas: versiones de la página para fechas especiales. Por ahora solo
 * se ven con el botón «Ver temporada» del pie (se guarda en este navegador);
 * no se activan solas por fecha hasta que el equipo decida cuándo.
 *
 * Una temporada cambia la portada: título, etiqueta, fotos, confeti, barra
 * de carga y una sección de kits para cotizar. Todo en pastel, como el resto
 * del sitio; los botones siguen siendo los de la marca.
 */

/** Un kit: una combinación lista para cotizar. No repite las tarjetas de producto de la página. */
export type Kit = { name: string; for: string; items: string[] };

export type SeasonId = "normal" | "fiestas-quito" | "navidad";

export type Season = {
  id: SeasonId;
  name: string;
  /** La etiqueta de arriba del título de la portada. */
  badge: string;
  /** El título grande de la portada. */
  title: string;
  /** La campaña de la portada: kits armados para la temporada (no repite productos de la página). */
  campaign?: { title: string; text: string; kits: Kit[] };
};

export const SEASONS: Season[] = [
  { id: "normal", name: "Normal", badge: "Imprenta en línea en Quito y los valles", title: "Imprime lo de tu marca, sin complicarte." },
  {
    id: "fiestas-quito",
    name: "Fiestas de Quito",
    badge: "¡Que viva Quito! Arma lo de tu marca para las fiestas",
    title: "Que viva Quito, y que viva tu marca.",
    campaign: {
      title: "Kits listos para las fiestas",
      text: "Elige uno y te lo cotizamos con tu marca. Puedes cambiar lo que quieras.",
      kits: [
        { name: "Kit del equipo", for: "Para tu gente en el desfile o la chiva", items: ["Camiseta", "Gorra", "Toma todos"] },
        { name: "Kit de la feria", for: "Para tu stand o tu evento", items: ["Tote bag", "Etiquetas", "Esferos"] },
        { name: "Kit del brindis", for: "Para regalar a clientes y aliados", items: ["Taza", "Tarjeta de regalo", "Papel de regalo"] },
      ],
    },
  },
  {
    id: "navidad",
    name: "Navidad",
    badge: "Regalos con tu marca para esta Navidad",
    title: "Esta Navidad, regala tu marca.",
    campaign: {
      title: "Kits de regalo para fin de año",
      text: "Combinaciones listas para tu equipo y tus clientes. Pide con tiempo: en diciembre los plazos se llenan.",
      kits: [
        { name: "Kit para clientes", for: "Un detalle que se queda en el escritorio", items: ["Taza", "Tarjeta de regalo", "Etiqueta"] },
        { name: "Kit para el equipo", for: "Para empezar el año con tu marca", items: ["Cuaderno", "Calendario", "Esfero"] },
        { name: "Kit de empaque", for: "Para que cada pedido llegue de fiesta", items: ["Papel de regalo", "Etiquetas", "Tarjeta de regalo"] },
      ],
    },
  },
];

export const SEASON_KEY = "asap-temporada";
