# ASAP

Tienda en línea de productos personalizados para Quito y los valles. Hoy vende tarjetas de presentación: el cliente elige tamaño, cantidad y acabados, ve el precio en USD con el envío incluido y cierra el pago por WhatsApp.

## Cómo funciona un pedido

1. El cliente arma su tarjeta y la agrega al carrito, que vive en su navegador.
2. Si adjunta el diseño, el archivo sube directo a Vercel Blob.
3. En el checkout llena entrega, factura y forma de pago (transferencia o Deuna).
4. El servidor valida los datos y vuelve a calcular el precio con la tabla PVP. Lo que mande el navegador no cuenta.
5. El cliente ve el recibo y un botón que abre WhatsApp con el mensaje ya escrito: productos, total, enlace al arte, datos de factura y dirección.
6. La tienda responde con los datos para pagar.

No hay base de datos. El pedido queda en el chat de WhatsApp de la tienda; el recibo se guarda solo en el navegador del cliente.

## Precios y entrega

- La impresión sale de la hoja PVP (couche 300 g, sin IVA), en `src/lib/catalog.ts`.
- El envío se cobra por peso: $3.50 el primer kilo y $0.75 por cada kilo adicional, sin IVA (`src/lib/ecuador.ts`).
- Hay tres ritmos de entrega (`src/lib/delivery.ts`): $8 y $15 sin IVA. El recargo va una sola vez por pedido, con el ritmo más rápido que se haya elegido.
- **IVA 15 %** (`src/lib/tax.ts`): se suma a cada valor y el cliente siempre ve el precio final. Checkout, recibo, proforma y WhatsApp separan subtotal sin IVA e IVA para la factura. Si cambia la tarifa, se cambia `IVA_PERCENT`.

## WhatsApp de la tienda

Los pedidos y proformas llegan al 096 295 6566. El número está en `src/lib/whatsapp.ts` (`WHATSAPP_NUMBER`, con 593 y sin el 0).

## Diseñar en Canva

El botón abre un lienzo del tamaño de la tarjeta con 3 mm de sangrado a 300 ppp (Canva Connect API). Al tocar «Volver» en Canva, `/api/canva/regreso` exporta el diseño en PDF y PNG, lo guarda en Vercel Blob y vuelve al configurador con el arte puesto. El inicio de sesión de Canva y los tokens viajan en cookies cifradas: no hay base de datos.

La tienda vive en **https://estoesasap.com**. En canva.com/developers (app ASAP Diseños, Outside Canva):

- Redirect URLs: `https://estoesasap.com/api/canva/callback` y la de la vista previa, para probar ramas.
- Return URL: `https://estoesasap.com/api/canva/regreso`. Canva acepta una sola: mientras se prueba una vista previa, va la dirección de esa vista previa.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | La agrega Vercel al conectar un Blob Store público al proyecto. Sin ella, la web pide mandar el arte por WhatsApp. |
| `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET` | De la app **ASAP Diseños** en canva.com/developers. Con las dos (y el Blob) aparece el botón «Diseñar en Canva». |

Para probar la subida en local: `vercel env pull .env.local`.

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
```

## Seguridad incluida

Cabeceras: CSP, `nosniff`, anti-clickjacking, referrer, COOP, CORP y Permissions-Policy con cámara, micrófono, ubicación, pago y USB cerrados. HSTS solo entra en producción.

El precio lo recalcula el servidor. Los textos se limpian, el sector tiene que ser de Quito o los valles, la cédula y el RUC se validan con su dígito verificador, y el arte se acepta solo como PDF, PNG o JPG de hasta 8 MB. Si al terminar la subida los bytes no corresponden a esos formatos, el archivo se borra.

Los archivos de Vercel Blob son públicos pero con un nombre al azar: solo quien tiene el enlace los abre.
