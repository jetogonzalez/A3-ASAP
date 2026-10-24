/*
 * Temporadas: versiones de la página para fechas especiales del Ecuador. Por
 * ahora solo se ven con el botón flotante «Temporada» (se guarda en este
 * navegador); no se activan solas por fecha hasta que el equipo decida cuándo.
 *
 * Una temporada cambia la portada: etiqueta, título, texto, fotos (si hay),
 * decoración animada, barra de carga y una sección de kits para cotizar. Todo
 * en pastel, como el resto del sitio; los botones siguen siendo los de la marca.
 *
 * Para sumar una temporada basta con agregarla aquí: el CSS sale de «look»
 * (components/season-styles.tsx) y la decoración de «decor».
 */

/** Un kit: una combinación lista para cotizar. No repite las tarjetas de producto de la página. */
export type Kit = { name: string; for: string; items: string[] };

/** Formas de la decoración animada (globals.css, .piece-*). */
export type DecorShape = "confeti" | "serpentina" | "destello" | "estrella" | "titila" | "gota" | "corazon" | "petalo";

export type SeasonLook = {
  /** Fondo de la sección de kits: un tinte del sitio, que ya tiene su versión oscura. */
  panel: string;
  /** El circulito con el número de cada kit. */
  kit: string;
  /** El color del punto que late junto a la etiqueta. */
  accent: string;
  /** Fondo liso de la portada (en modo oscuro se usa el del sitio). */
  bg: string;
  /** Los tres tonos de la barra de carga de arriba. */
  bar: [string, string, string];
  decor: { seed: number; count: number; colors: string[]; shapes: DecorShape[] };
};

export type SeasonId =
  | "normal"
  | "reyes"
  | "carnaval"
  | "san-valentin"
  | "dia-madre"
  | "dia-padre"
  | "regreso-clases"
  | "fiestas-quito"
  | "navidad"
  | "fin-de-ano";

export type Season = {
  id: SeasonId;
  name: string;
  /** Cuándo es, para el selector. */
  when: string;
  /** Mes y día aproximados, para ordenar el selector desde la próxima fecha. */
  date?: { month: number; day: number };
  /** La etiqueta de arriba del título de la portada. */
  badge: string;
  /** El título grande de la portada. */
  title: string;
  /** El texto bajo el título: no repite la etiqueta ni el título. */
  subtitle: string;
  /** La campaña de la portada: kits armados para la temporada (no repite productos de la página). */
  campaign?: { title: string; text: string; kits: Kit[] };
  look?: SeasonLook;
};

export const SEASONS: Season[] = [
  {
    id: "normal",
    name: "Normal",
    when: "Todo el año",
    badge: "Productos personalizados",
    title: "Imprime lo de tu marca, sin complicarte.",
    subtitle: "Tazas, camisetas, etiquetas, cuadernos, tarjetas y más. Lo armas aquí en pocos pasos.",
  },
  {
    id: "reyes",
    name: "Día de Reyes",
    when: "6 de enero",
    date: { month: 1, day: 6 },
    badge: "Día de Reyes",
    title: "El último regalo de la temporada, con tu logo.",
    subtitle: "Detalles para la rosca de la oficina y para empezar enero cerca de tus clientes.",
    campaign: {
      title: "Tres kits, como los tres reyes",
      text: "Elige uno y te lo cotizamos. Lo ajustamos a tu equipo.",
      kits: [
        { name: "Kit de la rosca", for: "Para compartir en la oficina", items: ["Etiquetas", "Papel de regalo", "Tarjeta de regalo"] },
        { name: "Kit de los tres regalos", for: "Un detalle completo para tus clientes", items: ["Taza", "Cuaderno", "Esfero"] },
        { name: "Kit de vuelta al trabajo", for: "Para recibir al equipo en enero", items: ["Calendario", "Toma todos", "Tote bag"] },
      ],
    },
    look: {
      panel: "var(--tint-lilac)",
      kit: "#e6dcff",
      accent: "#9b7be0",
      bg: "#f7f5ff",
      bar: ["#cdbdf5", "#f3dc9a", "#b9c8f7"],
      decor: { seed: 53, count: 11, colors: ["#e8c766", "#b7a2ef", "#f3d27a", "#9fb4f2"], shapes: ["titila", "estrella", "destello"] },
    },
  },
  {
    id: "carnaval",
    name: "Carnaval",
    when: "Febrero o marzo",
    date: { month: 2, day: 20 },
    badge: "Carnaval",
    title: "Colores, espuma y tu marca en cada camiseta.",
    subtitle: "Gorras, toma todos y tote bags para el viaje, la comparsa o la fiesta de la oficina.",
    campaign: {
      title: "Kits para el feriado",
      text: "Elige uno y te lo cotizamos. Pide con tiempo: antes del feriado los plazos se llenan.",
      kits: [
        { name: "Kit del viaje", for: "Para la playa o la sierra", items: ["Gorra", "Toma todos", "Tote bag"] },
        { name: "Kit de la comparsa", for: "Para que el grupo salga igual", items: ["Camiseta", "Gorra"] },
        { name: "Kit de la oficina", for: "Para celebrar con el equipo antes del feriado", items: ["Camiseta", "Etiquetas", "Tarjeta de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-cyan)",
      kit: "#ffe39a",
      accent: "#ff8fb1",
      bg: "#f3fbff",
      bar: ["#9fe0f5", "#ffe39a", "#ffb3c9"],
      decor: { seed: 61, count: 14, colors: ["#7fd3ef", "#ff9fbd", "#ffd76e", "#8fdcae"], shapes: ["confeti", "gota", "serpentina"] },
    },
  },
  {
    id: "san-valentin",
    name: "San Valentín",
    when: "14 de febrero",
    date: { month: 2, day: 14 },
    badge: "San Valentín",
    title: "Detalles con cariño, y con tu marca.",
    subtitle: "Para tus clientes, tu equipo o tu tienda: empaques y regalos personalizados.",
    campaign: {
      title: "Kits para el 14 de febrero",
      text: "Elige uno y te lo cotizamos. Puedes cambiar lo que quieras.",
      kits: [
        { name: "Kit para tu tienda", for: "Para que cada pedido llegue con amor", items: ["Papel de regalo", "Etiquetas", "Tarjeta de regalo"] },
        { name: "Kit para regalar", for: "Un detalle listo para entregar", items: ["Taza", "Tarjeta de regalo", "Papel de regalo"] },
        { name: "Kit del equipo", for: "Para agradecer en la oficina", items: ["Cuaderno", "Esfero", "Tarjeta de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-magenta)",
      kit: "#ffd3e0",
      accent: "#f07fa0",
      bg: "#fff6f8",
      bar: ["#ffc2d4", "#ffd9c2", "#f5b5d8"],
      decor: { seed: 71, count: 12, colors: ["#f59ab5", "#ffb8a8", "#f7c6da", "#e88aa6"], shapes: ["corazon", "destello", "corazon"] },
    },
  },
  {
    id: "dia-madre",
    name: "Día de la Madre",
    when: "Segundo domingo de mayo",
    date: { month: 5, day: 10 },
    badge: "Día de la Madre",
    title: "Para la mamá que lo hace todo.",
    subtitle: "Tazas, cuadernos y tote bags con su nombre, una foto o el logo de tu negocio.",
    campaign: {
      title: "Kits para mamá",
      text: "Elige uno y te lo cotizamos. Pide con tiempo: en mayo los plazos se llenan.",
      kits: [
        { name: "Kit para consentirla", for: "Un regalo que usa todos los días", items: ["Taza", "Tote bag", "Tarjeta de regalo"] },
        { name: "Kit para organizarse", for: "Para la mamá que no para", items: ["Cuaderno", "Calendario", "Esfero"] },
        { name: "Kit para tu negocio", for: "Para vender más en mayo", items: ["Papel de regalo", "Etiquetas", "Tarjeta de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-peach)",
      kit: "#ffd8c7",
      accent: "#f3a07f",
      bg: "#fff8f3",
      bar: ["#ffd0bd", "#f9c6dc", "#d9cbf7"],
      decor: { seed: 83, count: 12, colors: ["#f7b3c8", "#ffc9a8", "#d8c4f5", "#f9d98f"], shapes: ["petalo", "petalo", "destello"] },
    },
  },
  {
    id: "dia-padre",
    name: "Día del Padre",
    when: "Tercer domingo de junio",
    date: { month: 6, day: 18 },
    badge: "Día del Padre",
    title: "Un regalo que sí va a usar.",
    subtitle: "Gorras, tazas y camisetas con su nombre, su equipo o el logo de la empresa.",
    campaign: {
      title: "Kits para papá",
      text: "Elige uno y te lo cotizamos. Puedes cambiar lo que quieras.",
      kits: [
        { name: "Kit del fin de semana", for: "Para el partido o el paseo", items: ["Gorra", "Camiseta", "Toma todos"] },
        { name: "Kit del escritorio", for: "Para su día a día en la oficina", items: ["Taza", "Cuaderno", "Esfero"] },
        { name: "Kit para tu negocio", for: "Para vender más en junio", items: ["Papel de regalo", "Etiquetas", "Tarjeta de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-teal)",
      kit: "#c9ece4",
      accent: "#5fb3a1",
      bg: "#f3fbf9",
      bar: ["#b5e3d8", "#c7d6f7", "#f0d9a8"],
      decor: { seed: 97, count: 11, colors: ["#8fd1c2", "#a9bff2", "#f1d08f"], shapes: ["confeti", "destello", "confeti"] },
    },
  },
  {
    id: "regreso-clases",
    name: "Regreso a clases",
    when: "Sierra: septiembre · Costa: abril",
    date: { month: 9, day: 1 },
    badge: "Regreso a clases",
    title: "Todo listo para el primer día.",
    subtitle: "Cuadernos, etiquetas y esferos con su nombre o con el logo del colegio.",
    campaign: {
      title: "Kits para el año escolar",
      text: "Elige uno y te lo cotizamos. Para colegios, academias y familias.",
      kits: [
        { name: "Kit del estudiante", for: "Para marcar todo con su nombre", items: ["Cuaderno", "Etiquetas", "Esfero"] },
        { name: "Kit del colegio", for: "Para entregar a cada alumno", items: ["Cuaderno", "Tote bag", "Toma todos"] },
        { name: "Kit del profe", for: "Para agradecer a los docentes", items: ["Taza", "Calendario", "Tarjeta de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-yellow)",
      kit: "#ffe9a8",
      accent: "#f2b84b",
      bg: "#fffbef",
      bar: ["#ffe39a", "#a9d8f5", "#b9e6c4"],
      decor: { seed: 109, count: 13, colors: ["#ffd36b", "#8fcbf0", "#9fdcb2", "#f7a8a8"], shapes: ["confeti", "serpentina", "confeti"] },
    },
  },
  {
    id: "fiestas-quito",
    name: "Fiestas de Quito",
    when: "1 al 6 de diciembre",
    date: { month: 12, day: 1 },
    badge: "Fiestas de Quito",
    title: "Que viva Quito, y que viva tu marca.",
    subtitle: "Camisetas, gorras y toma todos con tu logo para el desfile, la chiva o el evento de la empresa.",
    campaign: {
      title: "Kits listos para las fiestas",
      text: "Elige uno y te lo cotizamos. Puedes cambiar lo que quieras.",
      kits: [
        { name: "Kit del equipo", for: "Para que todos salgan igual", items: ["Camiseta", "Gorra", "Toma todos"] },
        { name: "Kit de la feria", for: "Para tu stand o tu evento", items: ["Tote bag", "Etiquetas", "Esferos"] },
        { name: "Kit del brindis", for: "Para regalar a clientes y aliados", items: ["Taza", "Tarjeta de regalo", "Papel de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-blue)",
      kit: "#ffd9d9",
      accent: "#ef6b6b",
      bg: "#f4f7ff",
      bar: ["#f4a8a8", "#e9b5d6", "#a9c1f5"],
      decor: { seed: 7, count: 12, colors: ["#ef6b6b", "#6b95ec", "#f59a9a", "#8fb0f0"], shapes: ["confeti", "confeti", "serpentina"] },
    },
  },
  {
    id: "navidad",
    name: "Navidad",
    when: "25 de diciembre",
    date: { month: 12, day: 25 },
    badge: "Temporada de regalos",
    title: "Esta Navidad, regala tu marca.",
    subtitle: "Tazas, cuadernos, calendarios y más con tu logo, para tu equipo y tus clientes.",
    campaign: {
      title: "Kits de regalo navideños",
      text: "Tres combinaciones listas para cotizar. Pide con tiempo: en diciembre los plazos se llenan.",
      kits: [
        { name: "Kit para clientes", for: "Un detalle que se queda en el escritorio", items: ["Taza", "Tarjeta de regalo", "Etiqueta"] },
        { name: "Kit para el equipo", for: "Un regalo para cada persona", items: ["Taza", "Tote bag", "Tarjeta de regalo"] },
        { name: "Kit de empaque", for: "Para que cada pedido llegue de fiesta", items: ["Papel de regalo", "Etiquetas", "Tarjeta de regalo"] },
      ],
    },
    look: {
      panel: "var(--tint-green)",
      kit: "#fde9b3",
      accent: "#e57b8e",
      bg: "#fbf8f1",
      bar: ["#a5dcb9", "#f4dc8f", "#f3b0bb"],
      decor: { seed: 19, count: 15, colors: ["#f0c75e", "#6fbf8e", "#e57b8e", "#f3d27a"], shapes: ["destello", "estrella", "destello", "titila"] },
    },
  },
  {
    id: "fin-de-ano",
    name: "Fin de año",
    when: "31 de diciembre",
    date: { month: 12, day: 31 },
    badge: "Año nuevo",
    title: "Cierra el año con tu marca en alto.",
    subtitle: "Calendarios, cuadernos y tazas para que enero empiece con tu logo a la vista.",
    campaign: {
      title: "Kits para despedir el año",
      text: "Elige uno y te lo cotizamos. Puedes cambiar lo que quieras.",
      kits: [
        { name: "Kit de año nuevo", for: "Para que el equipo empiece organizado", items: ["Calendario", "Cuaderno", "Esfero"] },
        { name: "Kit de agradecimiento", for: "Para cerrar el año con tus clientes", items: ["Taza", "Tarjeta de regalo", "Papel de regalo"] },
        { name: "Kit de la fiesta", for: "Para la celebración de la empresa", items: ["Camiseta", "Gorra", "Toma todos"] },
      ],
    },
    look: {
      panel: "var(--tint-yellow)",
      kit: "#f6e3a8",
      accent: "#d9b45a",
      bg: "#fbf9f4",
      bar: ["#f3dfa0", "#d9dde8", "#b9c4f0"],
      decor: { seed: 127, count: 15, colors: ["#e6c36a", "#c9ced9", "#a9b7ee", "#f3d98f"], shapes: ["destello", "confeti", "titila"] },
    },
  },
];

export const SEASON_IDS = SEASONS.map((season) => season.id);
export const SEASON_KEY = "asap-temporada";

/**
 * Las temporadas en el orden del calendario, empezando por la próxima a
 * partir de hoy. «Normal» va primero.
 */
export function seasonsFrom(today: Date): Season[] {
  const key = (season: Season) => {
    if (!season.date) return -1;
    const thisYear = new Date(today.getFullYear(), season.date.month - 1, season.date.day);
    const days = Math.floor((thisYear.getTime() - today.getTime()) / 86_400_000);
    return days >= -1 ? days : days + 365;
  };
  return [...SEASONS].sort((a, b) => key(a) - key(b));
}
