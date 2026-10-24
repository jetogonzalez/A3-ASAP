import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { productHref } from "@/lib/catalog";
import { whatsappHref } from "@/lib/whatsapp";
import { JsonLd } from "@/components/json-ld";
import { FAQS } from "@/lib/faq";
import { faqGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Ayuda y preguntas frecuentes",
  description: "Cómo pedir en ASAP, cómo enviar tu diseño, plazos de entrega, IVA y pedido mínimo. Respuestas rápidas sobre impresión personalizada en Quito.",
  path: "/ayuda",
});

export default function HelpPage() {
  return (
    <LegalPage
      title="Ayuda"
      updated="16 de octubre de 2026"
      intro="ASAP es una tienda de productos personalizados en Quito. Armas tu producto en la web, ves el precio con IVA y envío, y cierras el pedido por WhatsApp."
    >
      <section>
        <h2>Cómo se pide</h2>
        <ul>
          <li>
            Entra a <Link href={productHref()}>Tarjetas de presentación</Link> y elige tamaño, papel, acabados, cantidad y entrega.
          </li>
          <li>Envía tu diseño en la sección «Tu diseño» y agrega el producto al carrito.</li>
          <li>Pon tus datos de entrega y factura. Al continuar se abre WhatsApp con el pedido ya escrito.</li>
          <li>Te respondemos con los datos para pagar y empezamos a imprimir.</li>
        </ul>
      </section>
      <section>
        <h2>Cómo enviar tu diseño</h2>
        <ul>
          <li>Diseñar en Canva: abre un lienzo del tamaño exacto de tu producto, con 3 mm de sangrado.</li>
          <li>Subir archivo: PDF, EPS o AI (Illustrator) de hasta 50 MB. No recibimos JPG, PNG ni Corel; si tu diseño está en otro formato, expórtalo a PDF.</li>
          <li>Enlace de Canva: pega el enlace de un diseño que ya tengas.</li>
          <li>Por WhatsApp: lo adjuntas en el chat al finalizar el pedido.</li>
        </ul>
      </section>
      <section>
        <h2>Diseñar en Canva, paso a paso</h2>
        <ul>
          <li>En «Tu diseño», elige «Diseñar en Canva» y toca «Abrir Canva».</li>
          <li>La primera vez, Canva te pide permiso para que ASAP cree diseños en tu cuenta. Inicia sesión y acepta.</li>
          <li>Se abre el editor de Canva con un lienzo del tamaño de tu producto. Si tu tarjeta es a dos lados, agrega una segunda página para el reverso.</li>
          <li>Cuando termines, toca «Volver» arriba en el editor. ASAP descarga tu diseño en PDF y lo muestra en la vista previa del producto.</li>
          <li>Tu diseño también queda guardado en tu cuenta de Canva, por si quieres cambiarlo después.</li>
        </ul>
      </section>
      <section>
        <h2>Preguntas frecuentes</h2>
        <JsonLd data={faqGraph(FAQS)} />
        {FAQS.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </section>
      <section>
        <h2>¿Necesitas ayuda?</h2>
        <p>
          Escríbenos al{" "}
          <a href={whatsappHref("Hola ASAP, necesito ayuda con mi pedido.")} target="_blank" rel="noopener noreferrer">
            WhatsApp 096 295 6566
          </a>
          . Atendemos pedidos de Quito y los valles.
        </p>
      </section>
    </LegalPage>
  );
}
