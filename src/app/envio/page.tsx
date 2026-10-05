import type { Metadata } from "next";
import { SHIPPING_TABLE } from "@/lib/ecuador";

export const metadata: Metadata = {
  title: "Envío",
  description: "Envío a domicilio en Quito y los valles.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Quito y valles</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]">Envío</h1>
      <p className="mt-4 leading-7 text-ink-soft">
        Por ahora llegamos a Quito y a los valles: Cumbayá, Tumbaco, Los Chillos y alrededores. Todo va a domicilio y se cobra según el peso del paquete, así que te pasamos el valor al confirmar el pedido.
      </p>
      <table className="mt-8 w-full border-collapse text-left text-sm">
        <caption className="sr-only">Envío en Quito y los valles</caption>
        <thead>
          <tr className="border-b border-line text-ink-soft">
            <th scope="col" className="py-2 pr-4 font-medium">Zona</th>
            <th scope="col" className="py-2 pr-4 font-medium">Tarifa</th>
            <th scope="col" className="py-2 font-medium">Plazo</th>
          </tr>
        </thead>
        <tbody>
          {SHIPPING_TABLE.map((row) => (
            <tr key={row.zone} className="border-b border-line/80">
              <th scope="row" className="py-3 pr-4 font-medium">{row.zone}</th>
              <td className="py-3 pr-4">{row.price}</td>
              <td className="py-3">{row.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm leading-6 text-ink-soft">
        Producción estimada de las tarjetas: 4 días hábiles antes de salir del taller. Mientras más tarjetas pidas, más pesa la caja y más cuesta llevarla; por eso el envío se cotiza al cerrar el pedido.
      </p>
    </div>
  );
}
