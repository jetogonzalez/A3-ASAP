import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { A11yButton } from "@/components/a11y-panel";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { isProductionSite, siteUrl } from "@/lib/site";
import { siteGraph } from "@/lib/structured-data";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600"],
});

const DESCRIPTION =
  "Tazas, camisetas, gorras, esferos, etiquetas, empaque, cuadernos y tarjetas de presentación con tu marca en Quito. Precio final en dólares con IVA, diseño en Canva y entrega a domicilio en Quito y los valles.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Esto es ASAP · Productos personalizados e impresión en Quito",
    template: "%s · ASAP",
  },
  description: DESCRIPTION,
  applicationName: "Esto es ASAP",
  keywords: [
    "tarjetas de presentación Quito",
    "imprenta Quito",
    "impresión digital Quito",
    "productos personalizados Ecuador",
    "merchandising Quito",
    "regalos corporativos Quito",
    "camisetas personalizadas Quito",
    "tazas personalizadas",
    "etiquetas adhesivas",
    "stickers personalizados",
    "empaque personalizado",
    "Cumbayá",
    "Tumbaco",
    "Los Chillos",
  ],
  category: "shopping",
  alternates: { types: { "text/markdown": "/llms.txt" } },
  /* Solo producción se indexa; las vistas previas de Vercel no. */
  robots: isProductionSite()
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "Esto es ASAP",
    title: "Esto es ASAP · Productos personalizados en Quito",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Esto es ASAP · Productos personalizados en Quito",
    description: DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/*
 * Aplica las preferencias de accesibilidad antes de pintar (sin parpadeo),
 * y esconde el aviso de cookies si ya se aceptó.
 * Lo guardado manda; si no hay nada guardado, se siguen los ajustes del
 * sistema: tema oscuro, más contraste y menos movimiento.
 */
const A11Y_BOOT = `(function(){try{var d=document.documentElement,s=JSON.parse(localStorage.getItem("asap-a11y")||"{}"),m=function(q){return window.matchMedia&&window.matchMedia(q).matches};var t=s.theme||"light";if(t==="system")t=m("(prefers-color-scheme: dark)")?"dark":"light";if(t==="dark")d.dataset.theme="dark";if(s.contrast==="high"||(!s.contrast&&m("(prefers-contrast: more)")))d.dataset.contrast="high";if(s.text&&s.text!=="md")d.dataset.text=s.text;if(s.motion==="reduce")d.dataset.motion="reduce";if(s.links==="underline")d.dataset.links="underline";if(localStorage.getItem("asap-cookies")==="ok")d.dataset.cookies="ok"}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans text-base leading-normal text-ink">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Saltar al contenido
        </a>
        <JsonLd data={siteGraph()} />
        <CartProvider>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <A11yButton />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
