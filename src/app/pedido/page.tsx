import type { Metadata } from "next";
import { OrderReceipt } from "@/components/order-receipt";

export const metadata: Metadata = {
  title: "Confirma tu pedido",
  robots: { index: false, follow: false },
};

export default function ReceiptPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <OrderReceipt />
    </div>
  );
}
