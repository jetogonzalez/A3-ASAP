import { jsonLd } from "@/lib/structured-data";

/* JSON-LD como <script> nativo: son datos, no código (guía de Next, json-ld.md). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
