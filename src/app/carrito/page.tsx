import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Pedido",
  description: "Revisa las tarjetas antes de la entrega.",
};

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-5xl">Tu pedido</h1>
      <p className="mt-3 max-w-xl leading-7 text-ink-soft">
        Los precios se recalculan con la misma tabla del configurador. El envío entra en el siguiente paso.
      </p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
