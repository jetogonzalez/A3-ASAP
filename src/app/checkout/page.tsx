import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Entrega",
  description: "Datos de contacto y envío en Quito y los valles.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-5xl">Entrega</h1>
      <p className="mt-3 max-w-xl leading-7 text-ink-soft">
        Por ahora enviamos a Quito y los valles. El total de impresión sale de la tabla PVP y el envío es una tarifa de demostración.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
