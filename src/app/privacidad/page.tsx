import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { LegalPage } from "@/components/legal-page";
import { whatsappHref } from "@/lib/whatsapp";

export const metadata: Metadata = pageMetadata({
  title: "Privacidad",
  description: "Qué datos usa ASAP, para qué y cómo pedir que los borremos.",
  path: "/privacidad",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacidad"
      updated="16 de octubre de 2026"
      intro="ASAP imprime productos personalizados en Quito, Ecuador. Usamos tus datos solo para preparar, facturar y entregar tu pedido, de acuerdo con la Ley Orgánica de Protección de Datos Personales del Ecuador."
    >
      <section>
        <h2>Qué datos usamos</h2>
        <ul>
          <li>Para la factura y la entrega: nombres, cédula, RUC o pasaporte, correo, teléfono, dirección y sector.</li>
          <li>Lo que elegiste: producto, cantidad, acabados y forma de pago.</li>
          <li>Tu diseño: el archivo que subes, el enlace de Canva que pegas o el diseño que traes desde Canva.</li>
        </ul>
      </section>
      <section>
        <h2>Dónde quedan</h2>
        <ul>
          <li>Tu pedido no se guarda en una base de datos nuestra. La web calcula el total y arma un mensaje que tú envías a nuestro WhatsApp; desde ahí lo atendemos.</li>
          <li>El carrito y el último recibo quedan solo en tu navegador, para que puedas volver a verlos.</li>
          <li>Los archivos de diseño se guardan en Vercel Blob con un nombre al azar. Solo quien tiene el enlace puede abrirlos, y los usamos únicamente para imprimir tu pedido.</li>
        </ul>
      </section>
      <section>
        <h2>Diseñar en Canva</h2>
        <p>
          Si eliges diseñar en Canva, te pedimos permiso en tu cuenta de Canva solo para crear un diseño nuevo del tamaño de tu producto y descargarlo en PDF y PNG cuando vuelves a ASAP. No leemos, cambiamos ni borramos tus otros diseños.
        </p>
        <p>
          El permiso de Canva queda guardado en una cookie cifrada en tu navegador, no en nuestros servidores. Puedes quitarlo cuando quieras desde tu cuenta de Canva, en Configuración, Apps conectadas.
        </p>
      </section>
      <section>
        <h2>Con quién lo compartimos</h2>
        <p>
          No vendemos ni prestamos tus datos. Solo intervienen los servicios que hacen funcionar la tienda: Vercel (donde vive la web y se guardan los archivos), WhatsApp (donde cierras el pedido) y Canva (si eliges diseñar ahí).
        </p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>
          Puedes pedirnos ver, corregir o borrar tus datos y tus archivos. Escríbenos a nuestro{" "}
          <a href={whatsappHref("Hola ASAP, quiero hacer una consulta sobre mis datos.")} target="_blank" rel="noopener noreferrer">
            WhatsApp 096 295 6566
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
