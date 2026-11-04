"""
Importa los precios de la matriz de productos a la web.

Lee la hoja Precios (una fila por producto × variante × cantidad) y escribe
src/data/prices.json con el precio unitario SIN IVA de cada fila activa. La
web muestra con eso «Desde $X c/u + IVA»: el precio unitario más bajo del
producto. El precio final se sigue confirmando por WhatsApp.

Uso:
  python3 scripts/importar-precios.py ruta/a/Matriz_Productos_ASAP.xlsx

La matriz debe traer los valores calculados (un .xlsx descargado de Google o
guardado en Excel los trae). Las tarjetas de presentación no se importan aquí:
su precio sale de la tabla de la hoja Tarjetas (lib/pricing.ts).
"""
import json
import sys
from pathlib import Path

import openpyxl

ALIASES = {"GODF": "GOR", "GOC": "GOR"}
VARIANT_PREFIX = {"GODF": "Dry fit", "GOC": "Camionero"}
SKIP = {"MUG", "TPR"}
# Nombres legibles para variantes cuyo nombre en la matriz se repite o es un código.
LABELS = {
    ("CAL", "MESA - A5 - 1L"): "Sobre mesa A5 · 1 lado",
    ("CAL", "MESA - A5 - 2L"): "Sobre mesa A5 · 2 lados",
    ("CAL", "MESA - A6 - 1L"): "Sobre mesa A6 · 1 lado",
    ("CAL", "MESA - A6 - 2L"): "Sobre mesa A6 · 2 lados",
    ("CAL", "PLEG-A5"): "Plegado A5",
    ("CAL", "PLEG 30X10"): "Plegado 30 × 10 cm",
    ("TRJ", "A5-1L"): "A5 · 1 lado",
    ("TRJ", "A5-2L"): "A5 · 2 lados",
    ("TRJ", "A6-1L"): "A6 · 1 lado",
    ("TRJ", "A6-2L"): "A6 · 2 lados",
}


def label(source: str, code: str, name: str) -> str:
    if (source, code) in LABELS:
        return LABELS[(source, code)]
    if source in VARIANT_PREFIX:
        return VARIANT_PREFIX[source]
    return name.replace(" x ", " × ").replace(" X ", " × ").replace("Estandar", "Estándar")


def main(path: str) -> None:
    sheet = openpyxl.load_workbook(path, data_only=True)["Precios"]
    header = [cell.value for cell in sheet[1]]
    col = {name: header.index(name) for name in header if name}
    for needed in ("product_id", "variante_nombre", "cantidad", "precio_unit_sin_iva", "activo"):
        if needed not in col:
            sys.exit(f"Falta la columna «{needed}» en la hoja Precios.")

    table: dict[str, list[dict]] = {}
    for row in sheet.iter_rows(min_row=2, values_only=True):
        source, quantity, price, active = (row[col[k]] for k in ("product_id", "cantidad", "precio_unit_sin_iva", "activo"))
        if not source or not quantity or str(active).strip().upper() == "NO":
            continue
        if not isinstance(price, (int, float)) or price <= 0:
            continue
        source = str(source)
        if source in SKIP:
            continue
        code = str(row[col["variante_codigo"]] or "").strip() if "variante_codigo" in col else ""
        variant = label(source, code, str(row[col["variante_nombre"]] or "").strip())
        cell = (variant, int(quantity))
        table.setdefault(ALIASES.get(source, source), {}).setdefault(cell, set()).add(round(float(price), 4))

    # Una celda con dos precios distintos (fila repetida en la matriz) queda «a confirmar».
    output = {}
    for product, cells in sorted(table.items()):
        rows = []
        for (variant, quantity), prices in sorted(cells.items()):
            if len(prices) > 1:
                print(f"Aviso: {product} «{variant}» × {quantity} tiene {len(prices)} precios distintos; queda a confirmar.")
                continue
            rows.append({"variante": variant, "cantidad": quantity, "precio": prices.pop()})
        output[product] = rows
    target = Path(__file__).resolve().parent.parent / "src" / "data" / "prices.json"
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Listo: {sum(len(rows) for rows in output.values())} precios de {len(output)} productos en {target}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
