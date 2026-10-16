/** Agrega parámetros a la página del configurador sin perder lo que ya traía. */
function withParams(path: string, entries: Record<string, string>): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  for (const [key, value] of Object.entries(entries)) params.set(key, value);
  return `${base}?${params.toString()}#tu-diseno`;
}

export function withCanvaStatus(path: string, status: string): string {
  return withParams(path, { canva: status });
}

export function withCanvaDesign(path: string, design: { pdf: string; front: string; back: string | null }): string {
  return withParams(path, {
    canva: "listo",
    canva_pdf: design.pdf,
    canva_frente: design.front,
    ...(design.back ? { canva_reverso: design.back } : {}),
  });
}
