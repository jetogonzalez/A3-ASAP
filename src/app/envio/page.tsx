import { DeliveryIcon } from "@/components/delivery-icon";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { DELIVERY_OPTIONS } from "@/lib/delivery";
import { PRODUCT } from "@/lib/catalog";
import { leadTableRows } from "@/lib/lead-times";
import { LAUNCH_PRODUCTS } from "@/lib/launch-products";
import { SHIPPING_TABLE } from "@/lib/ecuador";
import { formatUsd } from "@/lib/money";

export const metadata: Metadata = pageMetadata({
  title: "Envío en Quito y los valles",
  description: "Entrega a domicilio en Quito, Cumbayá, Tumbaco y Los Chillos. Tarifas por peso y tres ritmos de entrega: Standard, Priority y Express.",
  path: "/envio",
});

export default function ShippingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Quito y valles</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]">Envío</h1>
      <p className="mt-4 leading-7 text-ink-soft">
        Por ahora llegamos a Quito y a los valles: Cumbayá, Tumbaco, Los Chillos y alrededores. Todo va a domicilio y se cobra por peso, y el peso lo calcula la web con el papel y la cantidad que elegiste: el valor del envío ya aparece en el total antes de que pagues.
      </p>
      <table className="mt-8 w-full border-collapse text-left text-sm">
        <caption className="sr-only">Envío en Quito y los valles</caption>
        <thead>
          <tr className="border-b border-line text-ink-soft">
            <th scope="col" className="py-2 pr-4 font-medium">Zona</th>
            <th scope="col" className="py-2 font-medium">Tarifa</th>
          </tr>
        </thead>
        <tbody>
          {SHIPPING_TABLE.map((row) => (
            <tr key={row.zone} className="border-b border-line/80">
              <th scope="row" className="py-3 pr-4 font-medium">{row.zone}</th>
              <td className="py-3">{row.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-10 font-display text-3xl">Cuándo llega</h2>
      <p className="mt-3 leading-7 text-ink-soft">
        Cada producto tiene su plazo, según cuántas unidades pides. Los días hábiles cuentan desde que confirmamos el pago y tenemos tu archivo. Si tu pedido lleva varios productos, llega cuando esté listo el que más demora. El recargo se cobra una sola vez por pedido.
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">Plazo por producto, cantidad y nivel de entrega</caption>
          <thead className="bg-paper-deep">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Producto y cantidad
              </th>
              {DELIVERY_OPTIONS.map((option) => (
                <th key={option.id} scope="col" className="px-4 py-2.5 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <DeliveryIcon speed={option.id} size="sm" />
                    {option.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leadTableRows([{ id: "TPR", name: PRODUCT.name }, ...LAUNCH_PRODUCTS]).map(([label, ...times]) => (
              <tr key={label}>
                <th scope="row" className="px-4 py-2.5 font-medium">
                  {label}
                </th>
                {times.map((time, index) => (
                  <td key={index} className={`px-4 py-2.5 ${time === "a confirmar" ? "text-ink-soft" : ""}`}>
                    {time}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        Recargo por pedido: Priority {formatUsd(DELIVERY_OPTIONS[1].cents)} y Express {formatUsd(DELIVERY_OPTIONS[2].cents)}, con IVA. «A confirmar» se coordina por WhatsApp según la carga de trabajo.
      </p>
      <p className="mt-6 text-sm leading-6 text-ink-soft">
        Para que te hagas una idea del peso: mil tarjetas clásicas laminadas pesan 1,58 kg y cien pesan 231 g.
      </p>
    </div>
  );
}
