"""
Convierte la matriz de productos (Excel) en src/data/matriz.json, que es lo
que lee la web. Uso:

    python3 scripts/importar-matriz.py ruta/a/Matriz_Productos_ASAP.xlsx

Toma las hojas Productos, PRECIOS, ACABADOS, Tiempos y Config. Los precios
quedan en centavos de dólar, sin IVA (la web suma el IVA). Las filas con
activo = NO se saltan.
"""
import json
import sys
from pathlib import Path

import openpyxl


def cents(value):
    return None if value in (None, "") else round(float(value) * 100)


def hours(value):
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    return int(str(value).lower().replace("h", "").strip())


def rows(sheet):
    header = [cell for cell in next(sheet.iter_rows(min_row=1, max_row=1, values_only=True))]
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if row[0] in (None, ""):
            continue
        yield dict(zip(header, row))


def main(path):
    book = openpyxl.load_workbook(path, data_only=True)
    config = {row["parametro"]: row["valor"] for row in rows(book["Config"])}

    products = {}
    for row in rows(book["Productos"]):
        if str(row.get("activo", "SÍ")).upper().startswith("N"):
            continue
        products[row["product_id"]] = {
            "id": row["product_id"],
            "slug": row["slug"],
            "name": row["nombre"],
            "category": row["categoria"],
            "summary": row["descripcion_corta"],
            "quantities": [int(q) for q in str(row["cantidades_disponibles"]).replace(" ", "").split("/") if q],
            "minimum": int(row["cantidad_minima"] or 0),
            "priority": str(row["acepta_priority"]).upper().startswith("S"),
            "express": str(row["acepta_express"]).upper().startswith("S"),
            "variants": {},
        }

    for row in rows(book["PRECIOS"]):
        product = products.get(row["product_id"])
        if product is None or str(row.get("activo", "SÍ")).upper().startswith("N"):
            continue
        code = str(row["variante_codigo"]).strip()
        variant = product["variants"].setdefault(
            code,
            {
                "code": code,
                "name": row["variante_nombre"],
                "hours": {
                    "standard": hours(row["horas_standard"]),
                    "priority": hours(row["horas_priority"]),
                    "express": hours(row["horas_express"]),
                },
                "unitCents": {},
            },
        )
        # Precio por unidad en milésimas de centavo: las etiquetas cuestan
        # fracciones de centavo y redondear aquí movería el total.
        variant["unitCents"][str(int(row["cantidad"]))] = round(float(row["precio_unit_sin_iva"]) * 100, 4)

    finishes = []
    for row in rows(book["ACABADOS"]):
        for key, name in (("laminado_sin_iva", "laminado"), ("uv_selectivo_sin_iva", "uv"), ("CORTE_sin_iva", "corte")):
            if row.get(key) not in (None, ""):
                finishes.append(
                    {
                        "product": row["product_id"],
                        "variant": str(row["variante_codigo"]).strip(),
                        "quantity": int(row["cantidad"]),
                        "finish": name,
                        "cents": cents(row[key]),
                    }
                )

    speeds = {}
    for row in rows(book["Tiempos"]):
        if row["nivel_id"] in ("STANDARD", "PRIORITY", "EXPRESS"):
            speeds[row["nivel_id"].lower()] = {"name": row["nivel"], "surchargePercent": round(float(row["recargo_pct"] or 0) * 100)}

    data = {
        "version": str(config.get("version", "")),
        "updated": str(config.get("ultima_actualizacion", ""))[:10],
        "ivaPercent": round(float(config.get("iva_tarifa", 0.15)) * 100),
        "speeds": speeds,
        "products": [
            {**product, "variants": list(product["variants"].values())} for product in products.values()
        ],
        "finishes": finishes,
    }
    out = Path(__file__).resolve().parent.parent / "src" / "data" / "matriz.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{out}: {len(data['products'])} productos, {sum(len(p['variants']) for p in data['products'])} variantes, {len(finishes)} acabados")


if __name__ == "__main__":
    main(sys.argv[1])
