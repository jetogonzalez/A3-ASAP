/*
 * Qué significa cada término de imprenta, en palabras simples. Se muestra
 * debajo de la opción para que nadie tenga que adivinar qué es «UV DTF» o
 * «tiro y retiro». Si se agrega una opción nueva con un término técnico, se
 * explica aquí.
 */
const GLOSSARY: Record<string, string> = {
  "UV DTF": "Impresión UV que se adhiere a superficies duras. Colores vivos que aguantan el uso.",
  DTF: "Transfer a todo color que se fija con calor sobre la tela. Flexible y lavable.",
  "Sublimación": "La tinta se funde dentro de la superficie: no se pela ni se raya.",
  Estampado: "Tu logo impreso directo sobre el cuerpo del esfero.",
  "Full color": "Todos los colores, como una foto.",
  "Un color": "Una sola tinta. Más económico, ideal para logos simples.",
  Tiro: "Impreso por un solo lado.",
  "Tiro y retiro": "Impreso por los dos lados.",
  Recto: "Corte en línea recta, con esquinas a escuadra.",
  Troquelado: "Corte con la forma de tu diseño (círculo, silueta, etc.).",
  "Couché 300 g": "Cartulina gruesa y lisa, con un brillo suave.",
  "Couché 300 g, laminado": "Cartulina gruesa con una capa protectora que la hace más resistente.",
  "Cartulina fina": "Más delgada y flexible, con acabado mate.",
  "Papel cera": "Papel delgado y semitransparente, típico para envolver.",
  Adhesivo: "Papel con pegamento por detrás, listo para pegar.",
  "Bond 90 g": "Papel liso de cuaderno, un poco más grueso que el de oficina.",
  "Bond 90 g, tiro y retiro": "Papel liso de cuaderno, impreso por los dos lados.",
  Laminado: "Capa protectora que resiste el roce y la humedad.",
  "Económico": "Cuerpo plástico: buena opción para grandes cantidades.",
  Premium: "Mejor acabado y escritura más suave.",
  "Plástico": "Liviano y resistente a golpes.",
  "Metálico": "Acero inoxidable: mantiene la temperatura.",
  Blanda: "Portada flexible, más liviana.",
  Dura: "Portada rígida, más resistente.",
  "Sobre mesa (12 páginas)": "Se para solo en el escritorio, un mes por página.",
  Plegado: "Una sola pieza doblada, compacta.",
  "Varias tallas": "Nos dices cuántas de cada talla por WhatsApp.",
  "Única": "Ajustable, sirve para la mayoría.",
};

export function explain(term: string): string | undefined {
  return GLOSSARY[term];
}
