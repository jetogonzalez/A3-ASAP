import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { QUOTE_VALID_DAYS } from "@/lib/quote";
import { whatsappHref } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Términos",
  description: "Cómo funcionan los pedidos, pagos y entregas de ASAP.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos"
      updated="16 de octubre de 2026"
      intro="Estas son las reglas de los pedidos que haces en estoesasap.com. Si algo no está claro, escríbenos antes de pagar."
    >
      <section>
        <h2>Precios</h2>
        <ul>
          <li>Todos los precios están en dólares y ya incluyen el IVA del 15 %.</li>
          <li>El envío se calcula por peso y aparece en el total antes de pedir. Por ahora entregamos en Quito y los valles.</li>
          <li>Las proformas valen {QUOTE_VALID_DAYS} días hábiles desde su fecha.</li>
        </ul>
      </section>
      <section>
        <h2>Pedido y pago</h2>
        <ul>
          <li>El pedido se confirma por WhatsApp. Ahí te pasamos los datos para pagar con transferencia bancaria o Deuna.</li>
          <li>Empezamos a producir cuando recibimos el pago y tu diseño. Las fechas de entrega cuentan desde ese momento, en días hábiles.</li>
        </ul>
      </section>
      <section>
        <h2>Tu diseño</h2>
        <ul>
          <li>Eres responsable del contenido y de tener derecho a usar textos, logos e imágenes de tu diseño.</li>
          <li>Imprimimos el archivo tal como lo envías. Revisa ortografía, datos y que el contenido importante esté a 4 mm del borde.</li>
          <li>El color impreso puede variar un poco frente a la pantalla.</li>
        </ul>
      </section>
      <section>
        <h2>Cambios y reclamos</h2>
        <p>
          Si necesitas cambiar o cancelar un pedido, avísanos antes de que entre a producción. Si algo llega mal impreso o dañado, escríbenos con fotos apenas lo recibas y lo resolvemos.
        </p>
      </section>
      <section>
        <h2>Contacto</h2>
        <p>
          <a href={whatsappHref("Hola ASAP, tengo una consulta.")} target="_blank" rel="noopener noreferrer">
            WhatsApp 096 295 6566
          </a>{" "}
          · Quito, Ecuador
        </p>
      </section>
    </LegalPage>
  );
}
