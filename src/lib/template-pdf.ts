const MM = 72 / 25.4;
const BLEED_MM = 3;
const SAFE_MM = 4;
const MARK_MM = 8;
const CAPTION_MM = 8;

export type TemplateSpec = {
  widthMm: number;
  heightMm: number;
};

function pt(mm: number): number {
  return Math.round(mm * MM * 100) / 100;
}

function pdfText(value: string): string {
  return value.replace(/[()\\]/g, (char) => `\\${char}`);
}

function roundedPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h / 2);
  if (radius <= 0) return `${x} ${y} ${w} ${h} re`;
  const k = radius * 0.5522847498;
  return [
    `${x + radius} ${y} m`,
    `${x + w - radius} ${y} l`,
    `${x + w - radius + k} ${y} ${x + w} ${y + radius - k} ${x + w} ${y + radius} c`,
    `${x + w} ${y + h - radius} l`,
    `${x + w} ${y + h - radius + k} ${x + w - radius + k} ${y + h} ${x + w - radius} ${y + h} c`,
    `${x + radius} ${y + h} l`,
    `${x + radius - k} ${y + h} ${x} ${y + h - radius + k} ${x} ${y + h - radius} c`,
    `${x} ${y + radius} l`,
    `${x} ${y + radius - k} ${x + radius - k} ${y} ${x + radius} ${y} c`,
    "h",
  ].join("\n");
}

export function templatePageMm(spec: TemplateSpec) {
  return {
    widthMm: spec.widthMm + (BLEED_MM + MARK_MM) * 2,
    heightMm: spec.heightMm + (BLEED_MM + MARK_MM) * 2 + CAPTION_MM,
  };
}

export function cardTemplatePdf(spec: TemplateSpec, rounded: boolean): Uint8Array {
  const page = templatePageMm(spec);
  const pageW = pt(page.widthMm);
  const pageH = pt(page.heightMm);
  const origin = pt(MARK_MM);
  const trimX = pt(MARK_MM + BLEED_MM);
  const trimY = pt(MARK_MM + BLEED_MM + CAPTION_MM);
  const trimW = pt(spec.widthMm);
  const trimH = pt(spec.heightMm);
  const safe = pt(SAFE_MM);
  const corner = rounded ? pt(3) : 0;
  const mark = pt(4);
  const gap = pt(1.2);

  const marks = [
    `${trimX - gap - mark} ${trimY} m ${trimX - gap} ${trimY} l`,
    `${trimX} ${trimY - gap - mark} m ${trimX} ${trimY - gap} l`,
    `${trimX + trimW + gap} ${trimY} m ${trimX + trimW + gap + mark} ${trimY} l`,
    `${trimX + trimW} ${trimY - gap - mark} m ${trimX + trimW} ${trimY - gap} l`,
    `${trimX - gap - mark} ${trimY + trimH} m ${trimX - gap} ${trimY + trimH} l`,
    `${trimX} ${trimY + trimH + gap} m ${trimX} ${trimY + trimH + gap + mark} l`,
    `${trimX + trimW + gap} ${trimY + trimH} m ${trimX + trimW + gap + mark} ${trimY + trimH} l`,
    `${trimX + trimW} ${trimY + trimH + gap} m ${trimX + trimW} ${trimY + trimH + gap + mark} l`,
  ].join("\n");

  const trim = roundedPath(trimX, trimY, trimW, trimH, corner);
  const safePath = roundedPath(trimX + safe, trimY + safe, trimW - safe * 2, trimH - safe * 2, Math.max(0, corner - safe));
  const labelY = pt(3.2);
  const caption = pdfText(`${spec.widthMm} x ${spec.heightMm} mm   Sangrado ${BLEED_MM} mm   Margen ${SAFE_MM} mm`);
  const roundedNote = rounded ? "Puntas redondeadas" : "";

  const content = [
    "0.96 g",
    `0 0 ${pageW} ${pageH} re f`,
    "1 g",
    `${trim} f`,
    "0 G",
    "0.6 w",
    `${marks} S`,
    "0.35 G",
    "[1.5 1.5] 0 d",
    `${trim} S`,
    "0.05 0.48 0.23 RG",
    `${safePath} S`,
    "[] 0 d",
    "0 g",
    "BT",
    "/F1 7 Tf",
    `1 0 0 1 ${origin} ${roundedNote ? labelY + 9 : labelY} Tm`,
    `(${caption}) Tj`,
    roundedNote ? `0 -9 Td (${roundedNote}) Tj` : "",
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let offset = "%PDF-1.4\n".length;
  const chunks = ["%PDF-1.4\n"];
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(offset);
    const chunk = `${index + 1} 0 obj\n${body}\nendobj\n`;
    chunks.push(chunk);
    offset += Buffer.byteLength(chunk);
  });

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const start of offsets) {
    xref += `${String(start).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  chunks.push(xref);
  return new TextEncoder().encode(chunks.join(""));
}
