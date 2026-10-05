import { isSizeId, SIZES } from "@/lib/catalog";
import { cardTemplatePdf } from "@/lib/template-pdf";

type TemplateRouteProps = {
  params: Promise<{ size: string }>;
};

export async function GET(request: Request, { params }: TemplateRouteProps) {
  const { size } = await params;
  if (!isSizeId(size)) {
    return new Response("Plantilla no encontrada", { status: 404 });
  }

  const rounded = new URL(request.url).searchParams.get("puntas") === "1";
  const spec = SIZES[size];
  const pdf = cardTemplatePdf(
    {
      widthMm: spec.widthMm,
      heightMm: spec.heightMm,
    },
    rounded,
  );
  const filename = `pliego-tarjeta-${size}${rounded ? "-puntas" : ""}.pdf`;

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
