import { DeliveryIcon } from "@/components/delivery-icon";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { DELIVERY_OPTIONS, businessDaysLabel, cardLeadDays } from "@/lib/delivery";
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
      <table className="mt-6 w-full border-collapse text-left text-sm">
        <caption className="mb-2 text-left text-base font-semibold text-ink">Tarjetas de presentación</caption>
        <thead>
          <tr className="border-b border-line text-ink-soft">
            <th scope="col" className="py-2 pr-4 font-medium">Entrega</th>
            <th scope="col" className="py-2 pr-4 font-medium">Plazo</th>
            <th scope="col" className="py-2 font-medium">Recargo</th>
          </tr>
        </thead>
        <tbody>
          {DELIVERY_OPTIONS.map((option) => (
            <tr key={option.id} className="border-b border-line/80">
              <th scope="row" className="py-3 pr-4 font-medium">
                <span className="inline-flex items-center gap-2.5">
                  <DeliveryIcon speed={option.id} size="sm" />
                  {option.name}
                </span>
              </th>
              <td className="py-3 pr-4">
                {businessDaysLabel(cardLeadDays(100, option.id))}
              </td>
              <td className="py-3">{option.cents === 0 ? "Incluido" : `+ ${formatUsd(option.cents)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="mt-8 text-base font-semibold">Los demás productos</h3>
      <p className="mt-1 text-sm leading-6 text-ink-soft">Plazo normal (Standard). Si lo necesitas antes, te confirmamos Priority o Express por WhatsApp.</p>
      <ul className="mt-3 divide-y divide-line/80 border-y border-line/80 text-sm">
        {LAUNCH_PRODUCTS.map((product) => (
          <li key={product.id} className="flex justify-between gap-4 py-2.5">
            <span className="font-medium">{product.name}</span>
            <span className="text-ink-soft">{product.leadTime}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-6 text-ink-soft">
        Para que te hagas una idea del peso: mil tarjetas clásicas laminadas pesan 1,58 kg y cien pesan 231 g.
      </p>
    </div>
  );
}
