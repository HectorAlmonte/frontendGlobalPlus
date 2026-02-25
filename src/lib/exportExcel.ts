import * as XLSX from "xlsx";

/**
 * Descarga un array de objetos planos como archivo .xlsx
 * @param data  - Array de objetos (una fila por objeto, claves como cabeceras)
 * @param filename - Nombre del archivo sin extensión
 */
export function downloadXlsx(
  data: Record<string, unknown>[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Retorna la fecha actual en formato YYYY-MM-DD para nombres de archivo */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
