import { ARTWORK_FORMATS_LABEL, MAX_ARTWORK_MB } from "@/lib/artwork";
import { PRODUCT, QUANTITIES, SIZES } from "@/lib/catalog";
import { DELIVERY_OPTIONS, businessDaysLabel, cardLeadDays } from "@/lib/delivery";
import { EXTRA_KILO_CENTS, FIRST_KILO_CENTS } from "@/lib/ecuador";
import { explain } from "@/lib/glossary";
import { LAUNCH_PRODUCTS } from "@/lib/launch-products";
import { formatUsd } from "@/lib/money";
import { QUOTE_VALID_DAYS } from "@/lib/quote";
import { IVA_PERCENT } from "@/lib/tax";

/*
 * Centro de ayuda: categorías y artículos. Cada artículo tiene su página
 * (/ayuda/<categoría>/<artículo>), entra al buscador y al sitemap, y sale en
 * /llms.txt para los asistentes de IA. Los datos que cambian (plazos, envío,
 * mínimos, formatos, glosario) salen del catálogo, así que el artículo nunca
 * contradice a la ficha del producto. Para agregar un artículo, súmalo aquí.
 */

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "tip"; text: string }
  | { type: "warn"; text: string }
  | { type: "link"; href: string; label: string };

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  /** Una frase: sale en la lista, en el buscador y como descripción para Google. */
  summary: string;
  /** Palabras con las que la gente busca, aunque no estén en el título. */
  keywords: string[];
  body: HelpBlock[];
  /** Los más consultados salen en la portada del centro de ayuda. */
  popular?: boolean;
};

export type HelpCategory = { slug: string; title: string; description: string; icon: "pedido" | "diseno" | "entrega" | "producto" | "factura" | "sitio" };

export const HELP_CATEGORIES: HelpCategory[] = [
  { slug: "pedidos-y-pagos", title: "Pedidos y pagos", description: "Cómo pedir, pagar, cambiar o cancelar.", icon: "pedido" },
  { slug: "diseno-y-archivos", title: "Diseño y archivos", description: "Formatos, sangrado, Canva y la revisión del archivo.", icon: "diseno" },
  { slug: "entregas-y-envios", title: "Entregas y envíos", description: "Plazos, niveles de entrega y costo del envío.", icon: "entrega" },
  { slug: "productos-y-materiales", title: "Productos y materiales", description: "Qué imprimimos, mínimos, técnicas y papeles.", icon: "producto" },
  { slug: "facturas-y-proformas", title: "Facturas y proformas", description: "Factura a tu nombre y proformas para la empresa.", icon: "factura" },
  { slug: "el-sitio", title: "Privacidad y accesibilidad", description: "Qué guardamos y cómo ajustar la página a ti.", icon: "sitio" },
];

const deliveryRows = DELIVERY_OPTIONS.map((option) => [
  option.name,
  businessDaysLabel(cardLeadDays(100, option.id)),
  option.cents === 0 ? "Incluido" : `+ ${formatUsd(option.cents)} por pedido`,
]);

const leadRows = LAUNCH_PRODUCTS.map((product) => [product.name, product.leadTime]);

const minimumRows = [
  [PRODUCT.name, `${QUANTITIES[0]} unidades`],
  ...LAUNCH_PRODUCTS.map((product) => [product.name, `${product.quantities[0]} unidades`]),
];

const glossaryTerms = (terms: string[]) =>
  terms.flatMap((term) => {
    const meaning = explain(term);
    return meaning ? [`${term}: ${meaning}`] : [];
  });

export const HELP_ARTICLES: HelpArticle[] = [
  /* ---------- Pedidos y pagos ---------- */
  {
    slug: "como-hacer-un-pedido",
    category: "pedidos-y-pagos",
    title: "Cómo hacer un pedido",
    summary: "Eliges el producto, lo armas, envías tu diseño y confirmas por WhatsApp.",
    keywords: ["comprar", "pedir", "ordenar", "carrito", "whatsapp", "cotizar", "cotización"],
    popular: true,
    body: [
      { type: "p", text: "Todo se arma en la web y el pedido se cierra por WhatsApp, con todo ya escrito." },
      {
        type: "steps",
        items: [
          "Elige el producto en Productos o en el buscador.",
          "Elige las opciones: tamaño, material, cantidad y nivel de entrega.",
          "Envía tu diseño: diseñalo en Canva desde la web, sube un archivo o adjúntalo luego por WhatsApp.",
          "Pon tus datos de entrega y factura. Al continuar se abre WhatsApp con el pedido escrito.",
          "Te respondemos con los datos para pagar. Cuando se confirma el pago y tenemos el archivo, empezamos a producir.",
        ],
      },
      {
        type: "tip",
        text: "Las tarjetas de presentación muestran el precio final al instante y van al carrito. Los demás productos se cotizan: armas el pedido y te respondemos con el precio por WhatsApp.",
      },
      { type: "link", href: "/productos", label: "Ver todos los productos" },
    ],
  },
  {
    slug: "como-pagar",
    category: "pedidos-y-pagos",
    title: "Cómo pago mi pedido",
    summary: "Por transferencia bancaria o Deuna, con los datos que te enviamos por WhatsApp.",
    keywords: ["pago", "pagar", "transferencia", "deuna", "tarjeta de crédito", "efectivo"],
    popular: true,
    body: [
      { type: "p", text: "El pago se coordina por WhatsApp cuando confirmas el pedido. Aceptamos:" },
      { type: "list", items: ["Transferencia bancaria.", "Deuna."] },
      { type: "p", text: "Empezamos a producir cuando recibimos el pago y tu diseño. Desde ese momento cuentan los días de entrega." },
    ],
  },
  {
    slug: "precio-iva-y-envio",
    category: "pedidos-y-pagos",
    title: "¿El precio incluye IVA y envío?",
    summary: `Sí: todos los precios van en dólares con el IVA del ${IVA_PERCENT} % y el envío se suma antes de pagar.`,
    keywords: ["iva", "impuesto", "precio final", "costos ocultos", "dólares", "usd"],
    body: [
      { type: "p", text: `Todos los precios están en dólares y ya incluyen el IVA del ${IVA_PERCENT} %. No hay costos escondidos.` },
      {
        type: "list",
        items: [
          "El envío se calcula por peso y aparece en el total antes de que pidas.",
          "Priority y Express suman un recargo, una sola vez por pedido.",
          "En los productos que se cotizan, te enviamos el precio final con IVA por WhatsApp.",
        ],
      },
    ],
  },
  {
    slug: "cambiar-o-cancelar",
    category: "pedidos-y-pagos",
    title: "Cambiar o cancelar un pedido",
    summary: "Avísanos por WhatsApp antes de que el pedido entre a producción.",
    keywords: ["cancelar", "cambiar", "modificar", "reclamo", "devolución", "llegó mal", "dañado"],
    body: [
      { type: "p", text: "Si necesitas cambiar o cancelar un pedido, avísanos por WhatsApp antes de que entre a producción." },
      { type: "p", text: "Si algo llega mal impreso o dañado, escríbenos con fotos apenas lo recibas y lo resolvemos." },
      { type: "warn", text: "Imprimimos el archivo tal como lo envías. Revisa ortografía y datos antes de confirmar." },
      { type: "link", href: "/terminos", label: "Leer los términos completos" },
    ],
  },

  /* ---------- Diseño y archivos ---------- */
  {
    slug: "formatos-de-archivo",
    category: "diseno-y-archivos",
    title: "Qué formatos de archivo aceptan",
    summary: `${ARTWORK_FORMATS_LABEL}, hasta ${MAX_ARTWORK_MB} MB. No recibimos JPG, PNG ni Corel.`,
    keywords: ["pdf", "eps", "ai", "illustrator", "jpg", "png", "corel", "cdr", "imagen", "formato", "peso", "mb"],
    popular: true,
    body: [
      { type: "p", text: `Recibimos archivos de diseño en ${ARTWORK_FORMATS_LABEL} (Illustrator), de hasta ${MAX_ARTWORK_MB} MB.` },
      {
        type: "list",
        items: [
          "PDF: el más recomendado. Exporta en calidad de imprenta.",
          "AI: guárdalo con «Crear archivo compatible con PDF» activado.",
          "EPS: con las fuentes convertidas a contornos.",
        ],
      },
      {
        type: "warn",
        text: "No recibimos JPG, PNG ni archivos de Corel: una imagen suele llegar con poca resolución y se ve pixelada al imprimir. Si tu diseño está en otro formato, expórtalo a PDF.",
      },
      { type: "tip", text: "Si diseñas en Canva, descárgalo como «PDF para impresión» o usa Diseñar en Canva desde la web, que ya lo prepara." },
    ],
  },
  {
    slug: "preparar-archivo-para-imprenta",
    category: "diseno-y-archivos",
    title: "Cómo preparar tu archivo para imprenta",
    summary: "Tamaño con sangrado, 300 ppp, CMYK, fuentes incrustadas y márgenes de seguridad.",
    keywords: ["cmyk", "rgb", "resolución", "ppp", "dpi", "margen", "sangrado", "fuentes", "contornos", "calidad"],
    popular: true,
    body: [
      { type: "p", text: "Con estos puntos tu diseño se imprime como lo ves:" },
      {
        type: "list",
        items: [
          "Usa la plantilla del tamaño que vas a pedir.",
          "Deja 3 mm de sangrado por lado y 4 mm de margen de seguridad para textos y logos.",
          "Trabaja en CMYK. Un archivo RGB se convierte y el color puede cambiar un poco.",
          "Fotos a 300 ppp al tamaño real de impresión.",
          "Incrusta las fuentes o conviértelas a contornos.",
          "Texto de al menos 6 pt y líneas de al menos 0,25 pt.",
          "Sin sobreimpresión y con cobertura de tinta de hasta 300 %.",
          "Evita un marco pegado al borde: el corte puede comerlo.",
        ],
      },
      { type: "tip", text: "Al subir tu archivo, la web revisa sola el tamaño, el sangrado, la resolución y las fuentes, y te dice qué corregir." },
    ],
  },
  {
    slug: "que-es-el-sangrado",
    category: "diseno-y-archivos",
    title: "Qué es el sangrado y por qué importa",
    summary: "Son 3 mm extra por lado para que al cortar no queden filos blancos.",
    keywords: ["sangrado", "bleed", "borde blanco", "corte", "plantilla", "margen"],
    body: [
      {
        type: "p",
        text: "Al cortar, la cuchilla puede moverse un poco. Por eso el fondo y las fotos que llegan al borde deben pasarse 3 mm de la línea de corte: ese excedente es el sangrado.",
      },
      {
        type: "table",
        head: ["Tarjeta", "Tamaño final", "Con sangrado"],
        rows: Object.values(SIZES).map((size) => [
          size.name,
          `${size.widthMm} × ${size.heightMm} mm`,
          `${size.widthMm + 6} × ${size.heightMm + 6} mm`,
        ]),
      },
      { type: "p", text: "Además, deja 4 mm de margen hacia adentro para textos y logos, así no quedan pegados al corte." },
      { type: "link", href: "/plantilla/85x55?puntas=0", label: "Descargar la plantilla de tarjeta clásica (PDF)" },
    ],
  },
  {
    slug: "revision-automatica-del-archivo",
    category: "diseno-y-archivos",
    title: "La revisión automática de tu archivo",
    summary: "Qué revisa la web al subir tu diseño y qué hacer con cada aviso.",
    keywords: ["revisión", "verificar", "chequeo", "preflight", "aviso", "error", "pixelado", "fuentes sin incrustar"],
    body: [
      { type: "p", text: "Cuando subes un archivo, la web lo lee en tu navegador (no sale de tu equipo para esto) y te muestra una lista de chequeo:" },
      {
        type: "table",
        head: ["Revisión", "Qué mira"],
        rows: [
          ["Tamaño y sangrado", "Que mida lo del producto más 3 mm por lado."],
          ["Páginas", "En tarjetas a dos lados, que haya frente y reverso."],
          ["Resolución", "Los ppp reales de cada foto al tamaño impreso. Lo ideal son 300."],
          ["Fuentes", "Que vayan incrustadas o convertidas a contornos."],
        ],
      },
      {
        type: "list",
        items: [
          "Bien: no hay nada que hacer.",
          "Revisar: se puede imprimir, pero conviene corregirlo.",
          "Corregir: así no va a quedar bien; vuelve a exportarlo.",
        ],
      },
      { type: "tip", text: "Puedes pedir igual: antes de imprimir revisamos el archivo y te escribimos si hace falta algo. En un EPS solo se puede revisar el tamaño." },
    ],
  },
  {
    slug: "disenar-en-canva",
    category: "diseno-y-archivos",
    title: "Diseñar en Canva, paso a paso",
    summary: "Abres un lienzo del tamaño exacto desde la web y vuelves con el diseño listo.",
    keywords: ["canva", "plantilla", "diseñar", "editor", "enlace de canva"],
    body: [
      {
        type: "steps",
        items: [
          "En «Tu diseño», elige «Diseñar en Canva» y toca «Abrir Canva».",
          "La primera vez, Canva te pide permiso para que ASAP cree diseños en tu cuenta. Inicia sesión y acepta.",
          "Se abre el editor con un lienzo del tamaño de tu producto. Si es a dos lados, agrega una segunda página para el reverso.",
          "Al terminar, toca «Volver» arriba en el editor. ASAP descarga tu diseño en PDF y lo muestra en la vista previa.",
        ],
      },
      { type: "p", text: "Tu diseño también queda guardado en tu cuenta de Canva, por si quieres cambiarlo después." },
      { type: "tip", text: "¿Ya tienes el diseño en Canva? Pega el enlace en «Enlace» (Compartir › Cualquier persona con el enlace)." },
    ],
  },
  {
    slug: "no-tengo-diseno",
    category: "diseno-y-archivos",
    title: "No tengo diseño, ¿qué hago?",
    summary: "Usa la plantilla, diseña en Canva o cuéntanos la idea y te ayudamos.",
    keywords: ["sin diseño", "logo", "ayuda", "diseñador", "propuesta", "idea"],
    body: [
      {
        type: "list",
        items: [
          "Descarga la plantilla del producto y arma el diseño en tu programa.",
          "Diseña en Canva desde la web, con el tamaño ya listo.",
          "En los productos que se cotizan, elige «Ayuda» en «Tu diseño» y cuéntanos la idea: te mandamos una propuesta.",
        ],
      },
    ],
  },

  /* ---------- Entregas y envíos ---------- */
  {
    slug: "cuanto-tarda",
    category: "entregas-y-envios",
    title: "¿Cuánto tarda mi pedido?",
    summary: "Depende del producto y la cantidad. Cuenta desde el pago y el archivo, en días hábiles.",
    keywords: ["tiempo", "plazo", "demora", "cuándo llega", "días", "urgente", "rápido"],
    popular: true,
    body: [
      { type: "p", text: "Cada producto tiene su plazo según la cantidad. Los días hábiles cuentan desde que confirmamos el pago y tenemos tu archivo." },
      { type: "p", text: `${PRODUCT.name}:` },
      { type: "table", head: ["Nivel", "Plazo", "Recargo"], rows: deliveryRows },
      { type: "p", text: "Plazo normal (Standard) de los demás productos:" },
      { type: "table", head: ["Producto", "Plazo"], rows: leadRows },
      { type: "tip", text: "Si lo necesitas antes, pide Priority o Express. En los productos que se cotizan, te confirmamos el plazo por WhatsApp." },
    ],
  },
  {
    slug: "niveles-de-entrega",
    category: "entregas-y-envios",
    title: "Standard, Priority y Express",
    summary: "Tres niveles de entrega: el normal incluido y dos más rápidos con recargo.",
    keywords: ["standard", "priority", "express", "prioridad", "urgente", "recargo"],
    body: [
      {
        type: "list",
        items: [
          "Standard: el plazo normal, incluido en el precio.",
          `Priority: lo adelantamos. Recargo de ${formatUsd(DELIVERY_OPTIONS[1].cents)} con IVA.`,
          `Express: para urgencias. Recargo de ${formatUsd(DELIVERY_OPTIONS[2].cents)} con IVA.`,
        ],
      },
      { type: "p", text: "El recargo se cobra una sola vez por pedido, aunque lleve varios productos." },
    ],
  },
  {
    slug: "pedido-con-varios-productos",
    category: "entregas-y-envios",
    title: "Si pido varios productos, ¿cuándo llega?",
    summary: "Todo llega junto, cuando está listo el producto que más demora.",
    keywords: ["varios productos", "pedido combinado", "juntos", "separado"],
    body: [
      { type: "p", text: "Un pedido sale completo: llega cuando está listo el producto que más demora." },
      { type: "p", text: "Si eliges distintos niveles de entrega, todo sale al más rápido que elegiste y el recargo se cobra una vez." },
      { type: "tip", text: "Si necesitas algo urgente y lo demás puede esperar, haz dos pedidos." },
    ],
  },
  {
    slug: "zonas-y-costo-de-envio",
    category: "entregas-y-envios",
    title: "Dónde entregan y cuánto cuesta el envío",
    summary: "A domicilio en Quito y los valles. Se cobra por peso.",
    keywords: ["envío", "domicilio", "quito", "cumbayá", "tumbaco", "los chillos", "valles", "guayaquil", "cuenca", "costo"],
    popular: true,
    body: [
      { type: "p", text: "Por ahora entregamos a domicilio en Quito y los valles: Cumbayá, Tumbaco, Los Chillos y alrededores." },
      {
        type: "table",
        head: ["Peso", "Tarifa con IVA"],
        rows: [
          ["Hasta 1 kg", formatUsd(FIRST_KILO_CENTS)],
          ["Cada kilo adicional", `+ ${formatUsd(EXTRA_KILO_CENTS)}`],
        ],
      },
      { type: "p", text: "En las tarjetas, la web calcula el peso y el envío aparece en el total antes de pagar. En los productos que se cotizan, va incluido en la cotización." },
      { type: "link", href: "/envio", label: "Ver la página de envío" },
    ],
  },

  /* ---------- Productos y materiales ---------- */
  {
    slug: "que-imprimimos",
    category: "productos-y-materiales",
    title: "Qué productos imprimimos",
    summary: "Tarjetas, promocionales, textil, empaque y papelería con tu marca.",
    keywords: ["productos", "catálogo", "qué hacen", "merchandising", "regalos corporativos"],
    body: [
      {
        type: "table",
        head: ["Producto", "Para qué"],
        rows: [[PRODUCT.name, "Se piden en línea con precio al instante."], ...LAUNCH_PRODUCTS.map((product) => [product.name, product.summary])],
      },
      { type: "link", href: "/productos", label: "Ver todos los productos" },
    ],
  },
  {
    slug: "pedido-minimo",
    category: "productos-y-materiales",
    title: "¿Cuál es el pedido mínimo?",
    summary: "Depende del producto: desde 5 unidades en tazas y toma todos.",
    keywords: ["mínimo", "cantidad", "unidades", "pocas", "una sola"],
    popular: true,
    body: [{ type: "table", head: ["Producto", "Desde"], rows: minimumRows }],
  },
  {
    slug: "tecnicas-de-impresion",
    category: "productos-y-materiales",
    title: "Técnicas de impresión: DTF, UV DTF, sublimación",
    summary: "Qué técnica usamos en cada producto y cómo queda.",
    keywords: ["dtf", "uv dtf", "sublimación", "estampado", "técnica", "durabilidad", "lavable"],
    body: [
      { type: "list", items: glossaryTerms(["DTF", "UV DTF", "Sublimación", "Estampado"]) },
      { type: "p", text: "En cada ficha de producto ves qué técnica lleva y, si hay más de una, puedes elegir." },
    ],
  },
  {
    slug: "glosario",
    category: "productos-y-materiales",
    title: "Glosario de términos de imprenta",
    summary: "Tiro y retiro, troquelado, couché, laminado y más, en palabras simples.",
    keywords: ["glosario", "tiro", "retiro", "troquelado", "couché", "laminado", "full color", "papel cera"],
    body: [
      {
        type: "list",
        items: glossaryTerms([
          "Full color",
          "Un color",
          "Tiro",
          "Tiro y retiro",
          "Recto",
          "Troquelado",
          "Couché 300 g",
          "Cartulina fina",
          "Papel cera",
          "Adhesivo",
          "Bond 90 g",
          "Laminado",
        ]),
      },
    ],
  },
  {
    slug: "tarjetas-tamanos-y-acabados",
    category: "productos-y-materiales",
    title: "Tarjetas: tamaños, papel y acabados",
    summary: "Clásica o cuadrada, couché 300 g mate o brillante, con laminado, UV o puntas.",
    keywords: ["tarjetas de presentación", "laminado", "uv selectivo", "puntas redondeadas", "mate", "brillante"],
    body: [
      { type: "table", head: ["Tamaño", "Medida"], rows: Object.values(SIZES).map((size) => [size.name, size.sizeLabel]) },
      {
        type: "list",
        items: [
          "Papel couché 300 g, mate o brillante.",
          "Impresión a uno o dos lados.",
          "Acabados opcionales: laminado mate o brillante, UV selectivo y puntas redondeadas.",
          `Cantidades: ${QUANTITIES.join(", ")}.`,
        ],
      },
      { type: "link", href: `/producto/${PRODUCT.slug}`, label: "Armar tarjetas" },
    ],
  },

  /* ---------- Facturas y proformas ---------- */
  {
    slug: "factura",
    category: "facturas-y-proformas",
    title: "¿Hacen factura?",
    summary: "Sí. Pones tu RUC o cédula al hacer el pedido y la factura sale a tu nombre.",
    keywords: ["factura", "ruc", "cédula", "sri", "electrónica", "empresa"],
    popular: true,
    body: [
      { type: "p", text: "Sí. Al hacer el pedido pones tu RUC o cédula y los datos de facturación, y la factura sale a tu nombre." },
      { type: "p", text: "Si necesitas cambiar un dato de la factura, avísanos por WhatsApp antes de pagar." },
    ],
  },
  {
    slug: "proforma",
    category: "facturas-y-proformas",
    title: "Cómo sacar una proforma",
    summary: `Con número, fecha y ${QUOTE_VALID_DAYS} días hábiles de validez, en PDF o con enlace.`,
    keywords: ["proforma", "cotización", "presupuesto", "empresa", "aprobación", "pdf"],
    body: [
      {
        type: "steps",
        items: [
          "Entra a Proforma.",
          "Pon el nombre de tu empresa y tus datos.",
          "Agrega las tarjetas que necesitas. Para otros productos, pídenos la proforma por WhatsApp y te la enviamos.",
          "Guárdala en PDF o comparte el enlace para que la aprueben.",
        ],
      },
      { type: "p", text: `La proforma vale ${QUOTE_VALID_DAYS} días hábiles. Cuando la aprueben, la conviertes en pedido.` },
      { type: "link", href: "/proforma", label: "Hacer una proforma" },
    ],
  },

  /* ---------- El sitio ---------- */
  {
    slug: "cookies-y-datos",
    category: "el-sitio",
    title: "Qué datos guardamos",
    summary: "Solo lo necesario para que la tienda funcione. Sin publicidad ni seguimiento.",
    keywords: ["cookies", "privacidad", "datos", "borrar", "seguimiento"],
    body: [
      { type: "p", text: "Este navegador guarda tu carrito, tu último pedido, tus ajustes de accesibilidad y el permiso de Canva. No usamos publicidad ni seguimiento." },
      { type: "link", href: "/privacidad", label: "Leer la política de privacidad" },
    ],
  },
  {
    slug: "accesibilidad",
    category: "el-sitio",
    title: "Ajustar la página: contraste, texto y modo oscuro",
    summary: "El botón azul de abajo a la derecha cambia contraste, tamaño del texto y tema.",
    keywords: ["accesibilidad", "contraste", "modo oscuro", "letra grande", "tamaño del texto", "movimiento"],
    body: [
      { type: "p", text: "Toca el botón azul con la figura de accesibilidad, abajo a la derecha. Puedes elegir:" },
      {
        type: "list",
        items: [
          "Tema claro, oscuro o el de tu sistema.",
          "Contraste alto (nivel AAA).",
          "Texto más grande.",
          "Menos movimiento.",
          "Enlaces subrayados.",
        ],
      },
      { type: "p", text: "Tu elección queda guardada en este navegador." },
    ],
  },
];

export function helpCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((category) => category.slug === slug);
}

export function helpArticle(category: string, slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((article) => article.category === category && article.slug === slug);
}

export function articlesIn(category: string): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => article.category === category);
}

export function articleHref(article: Pick<HelpArticle, "category" | "slug">): string {
  return `/ayuda/${article.category}/${article.slug}`;
}

/** Todo el texto de un artículo, para buscar y para llms.txt. */
export function articleText(article: HelpArticle): string {
  return article.body
    .map((block) => {
      if (block.type === "list" || block.type === "steps") return block.items.join(" ");
      if (block.type === "table") return [block.head, ...block.rows].map((row) => row.join(" ")).join(" ");
      if (block.type === "link") return block.label;
      return block.text;
    })
    .join(" ");
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Busca en título, palabras clave, resumen y texto, sin importar tildes. Cada
 * palabra de la búsqueda suma; el título y las palabras clave pesan más.
 */
export function searchHelp(query: string, limit = 8): HelpArticle[] {
  const words = normalize(query).split(/\s+/).filter((word) => word.length > 1);
  if (words.length === 0) return [];
  return HELP_ARTICLES.map((article) => {
    const title = normalize(article.title);
    const keys = normalize(article.keywords.join(" "));
    const summary = normalize(article.summary);
    const body = normalize(articleText(article));
    let score = 0;
    for (const word of words) {
      if (title.includes(word)) score += 6;
      if (keys.includes(word)) score += 5;
      if (summary.includes(word)) score += 3;
      if (body.includes(word)) score += 1;
    }
    return { article, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.article);
}
