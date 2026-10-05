# Pliego

Imprenta de demostración para Ecuador. El cliente elige tarjetas de presentación, arma tamaño, cantidad y acabados, y ve el precio en USD antes de pedir.

Los precios de impresión salen de la hoja PVP (couche 300 g). El envío es una tarifa local de prueba, solo dentro de Ecuador.

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

## Qué queda en este equipo

- El pedido se guarda en `data/orders.json`.
- El archivo de impresión, si lo adjuntas, queda en `data/uploads/`.
- Esa carpeta no se publica y no entra en git.
- El pago con tarjeta no llama a ningún banco. Se valida el número y se guardan solo la marca y los últimos 4 dígitos.

## Seguridad incluida

Cabeceras: CSP, `nosniff`, anti-clickjacking, referrer, COOP, CORP y Permissions-Policy con cámara, micrófono, ubicación, pago y USB cerrados. HSTS solo entra en producción.

El precio lo recalcula el servidor al confirmar. Los textos se limpian, la provincia tiene que ser de Ecuador, y el archivo se acepta solo si los bytes son PDF, PNG o JPG de hasta 8 MB.
