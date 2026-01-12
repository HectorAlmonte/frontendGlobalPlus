export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX"
  | "DATE"
  | "TIME";

export function normalizeType(type: unknown): FieldType {
  const v = String(type ?? "").toUpperCase();

  switch (v) {
    case "TEXT":
      return "TEXT";
    case "NUMBER":
      return "NUMBER";
    case "TEXTAREA":
      return "TEXTAREA";
    case "SELECT":
      return "SELECT";
    case "CHECKBOX":
      return "CHECKBOX";
    case "DATE":
      return "DATE";
    case "TIME":
      return "TIME";
    default:
      // fallback seguro (nunca rompe UI)
      return "TEXT";
  }
}
