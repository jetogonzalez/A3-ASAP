import type { Metadata } from "next";
import { SHIPPING_TABLE } from "@/lib/ecuador";

export const metadata: Metadata = {
  title: "Envío",
  description: "Tarifas de demostración para Quito y los valles.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Quito y valles</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]">Envío y retiro</h1>
      <p className="mt-4 leading-7 text-ink-soft">
        Por ahora el envío llega a Quito y a los valles: Cumbayá, Tumbaco, Los Chillos y alrededores. El retiro es en Quito. La tarifa es de demostración y se suma al pagar.
      </p>
      <table className="mt-8 w-full border-collapse text-left text-sm">
        <caption className="sr-only">Tarifas de envío de demostración en Quito y los valles</caption>
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
        Producción estimada de las tarjetas: 4 días hábiles antes de salir del taller. El retiro es en Quito.
      </p>
    </div>
  );
}
