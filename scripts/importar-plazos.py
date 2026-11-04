"""
Importa los plazos de la matriz de productos a la web.

Lee la hoja Precios (una fila por producto × variante × cantidad, con las
horas de cada nivel) y escribe src/data/lead-times.json. Por cada producto y
cantidad toma el plazo más largo entre sus variantes, para no prometer de más.

Uso:
  python3 scripts/importar-plazos.py ruta/a/Matriz_Productos_ASAP.xlsx

Después: npm test y publicar. Si una celda de horas está vacía, ese nivel
queda «a confirmar» para esa cantidad.

Reglas (las mismas en importar-precios.py):
- ALIASES: productos de la matriz que en la web son uno solo (las dos gorras).
- SKIP: productos que todavía no están en la web (MUGS, hasta aclarar si es
  otro producto o reemplaza a Tazas).
- KEEP: productos cuyo plazo se deja como está en la web hasta que el equipo
  lo confirme (tarjetas: la matriz dice 120 h Standard; la web, 72 h).
"""
import json
import sys
from pathlib import Path

import openpyxl

LEVELS = ("express", "priority", "standard")
ALIASES = {"GODF": "GOR", "GOC": "GOR"}
SKIP = {"MUG"}
KEEP = {"TPR"}


def main(path: str) -> None:
    sheet = openpyxl.load_workbook(path, data_only=True)["Precios"]
    header = [cell.value for cell in sheet[1]]
    col = {name: header.index(name) for name in header if name}
    for needed in ("product_id", "cantidad", "activo", *(f"horas_{level}" for level in LEVELS)):
        if needed not in col:
            sys.exit(f"Falta la columna «{needed}» en la hoja Precios.")

    table: dict[str, dict[int, dict[str, int | None]]] = {}
    for row in sheet.iter_rows(min_row=2, values_only=True):
        product, quantity, active = row[col["product_id"]], row[col["cantidad"]], row[col["activo"]]
        if not product or not quantity or str(active).strip().upper() == "NO":
            continue
        product = ALIASES.get(str(product), str(product))
        if product in SKIP or product in KEEP:
            continue
        entry = table.setdefault(product, {}).setdefault(int(quantity), {level: None for level in LEVELS})
        for level in LEVELS:
            hours = row[col[f"horas_{level}"]]
            if isinstance(hours, (int, float)) and hours > 0:
                current = entry[level]
                entry[level] = int(hours) if current is None else max(current, int(hours))

    target = Path(__file__).resolve().parent.parent / "src" / "data" / "lead-times.json"
    current = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
    output = {
        product: [{"cantidad": quantity, **levels} for quantity, levels in sorted(rows.items())]
        for product, rows in table.items()
    }
    for product in KEEP:
        if product in current:
            output[product] = current[product]
    output = dict(sorted(output.items()))
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Listo: {sum(len(rows) for rows in output.values())} filas de {len(output)} productos en {target}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
