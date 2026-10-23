import { PRODUCT, QUANTITIES } from "@/lib/catalog";
import { DELIVERY_OPTIONS } from "@/lib/delivery";
import { EXTRA_KILO_CENTS, FIRST_KILO_CENTS } from "@/lib/ecuador";
import { LAUNCH_PRODUCTS } from "@/lib/launch-products";
import { formatUsd } from "@/lib/money";
import { IVA_PERCENT } from "@/lib/tax";

/*
 * Preguntas frecuentes. Se muestran en /ayuda y salen igual en el JSON-LD
 * (FAQPage) y en /llms.txt, así lo que leen Google y los asistentes de IA es
 * exactamente lo que ve el cliente. Todo sale de los datos del catálogo: si
 * cambia un plazo o una tarifa, la respuesta cambia sola.
 */

export type Faq = { question: string; answer: string };

const delivery = DELIVERY_OPTIONS.map(
  (option) =>
    `${option.name}: ${option.earliestDays} a ${option.latestDays} días hábiles${option.cents === 0 ? " (incluido)" : ` (+ ${formatUsd(option.cents)})`}`,
).join("; ");

const minimums = [
  `${PRODUCT.name.toLowerCase()} desde ${QUANTITIES[0]}`,
  ...LAUNCH_PRODUCTS.map((product) => `${product.name.toLowerCase()} desde ${product.quantities[0]}`),
].join(", ");

export const FAQS: Faq[] = [
  {
    question: "¿Qué es Esto es ASAP?",
    answer:
      "Una tienda en línea de productos personalizados con tu marca en Quito, Ecuador: tarjetas de presentación, promocionales, textil, empaque y papelería. Armas el producto en la web y cierras el pedido por WhatsApp.",
  },
  {
    question: "¿Dónde entregan?",
    answer: `En Quito y los valles (Cumbayá, Tumbaco, Los Chillos y alrededores), a domicilio. El envío se cobra por peso: ${formatUsd(FIRST_KILO_CENTS)} hasta 1 kg y ${formatUsd(EXTRA_KILO_CENTS)} por cada kilo adicional.`,
  },
  {
    question: "¿Cuánto tarda mi pedido?",
    answer: `Hay tres ritmos de entrega, contados desde que confirmamos el pago y tenemos tu archivo, con producción y mensajería incluidas. ${delivery}.`,
  },
  {
    question: "¿Los precios incluyen IVA?",
    answer: `Sí. Todos los precios se muestran en dólares con el IVA del ${IVA_PERCENT} % incluido, y el envío aparece en el total antes de pagar.`,
  },
  {
    question: "¿Cuál es el pedido mínimo?",
    answer: `Depende del producto: ${minimums}.`,
  },
  {
    question: "¿Cómo envío mi diseño?",
    answer:
      "Puedes diseñarlo en Canva desde la web con el tamaño exacto y 3 mm de sangrado, subir un PDF, PNG o JPG de hasta 8 MB, pegar el enlace de un diseño de Canva o adjuntarlo por WhatsApp al finalizar el pedido.",
  },
  {
    question: "¿Puedo pedir una proforma?",
    answer:
      "Sí. En la sección Proforma pones el nombre de tu empresa, la guardas en PDF o compartes el enlace para que la aprueben, y luego la conviertes en pedido.",
  },
  {
    question: "¿Cómo pago y confirmo el pedido?",
    answer:
      "Al terminar se abre WhatsApp con el pedido ya escrito. Te respondemos con los datos para pagar y, cuando se confirma el pago, empezamos a imprimir.",
  },
];
