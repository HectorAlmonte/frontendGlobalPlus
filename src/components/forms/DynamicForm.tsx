// "use client";

// import { useEffect, useMemo, useState } from "react";

// type FieldType =
//   | "TEXT"
//   | "NUMBER"
//   | "TEXTAREA"
//   | "SELECT"
//   | "CHECKBOX"
//   | "RADIO"
//   | "DATE"
//   | "TIME";

// type FormField = {
//   id: string;
//   label: string;
//   name: string;
//   type: FieldType;
//   required: boolean;
//   order: number;
//   options?: any;   // Json en prisma (para SELECT/RADIO)
//   uiConfig?: any;  // Json (QR/autofill)
// };

// type FormDTO = {
//   id: string;
//   name: string;
//   slug: string;
//   description?: string | null;
//   version: number;
//   fields: FormField[];
// };

// export default function DynamicForm({ slug }: { slug: string }) {
//   const API = process.env.NEXT_PUBLIC_API_URL;

//   const [form, setForm] = useState<FormDTO | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [values, setValues] = useState<Record<string, any>>({});
//   const [error, setError] = useState<string | null>(null);
//   const [ok, setOk] = useState<string | null>(null);

//   useEffect(() => {
//     const run = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         setOk(null);

//         const res = await fetch(`${API}/api/forms/${slug}`, {
//           credentials: "include",
//         });

//         if (!res.ok) {
//           const msg = await res.json().catch(() => ({}));
//           throw new Error(msg?.message || `Error cargando formulario (${res.status})`);
//         }

//         const data: FormDTO = await res.json();
//         setForm(data);

//         // init values (vacío)
//         const init: Record<string, any> = {};
//         for (const f of data.fields) init[f.name] = "";
//         setValues(init);
//       } catch (e: any) {
//         setError(e.message || "Error cargando formulario");
//       } finally {
//         setLoading(false);
//       }
//     };

//     run();
//   }, [API, slug]);

//   const sortedFields = useMemo(() => {
//     return (form?.fields ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
//   }, [form]);

//   const setField = (name: string, value: any) => {
//     setValues((prev) => ({ ...prev, [name]: value }));
//   };

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!form) return;

//     try {
//       setSubmitting(true);
//       setError(null);
//       setOk(null);

//       const res = await fetch(`${API}/api/forms/${slug}/submit`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(values),
//       });

//       const body = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         // Si backend manda missing fields
//         const msg =
//           body?.message ||
//           `No se pudo enviar (${res.status})`;
//         throw new Error(msg);
//       }

//       setOk("✅ Enviado correctamente");
//     } catch (e: any) {
//       setError(e.message || "Error enviando formulario");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) return <div className="p-4">Cargando formulario...</div>;
//   if (error) return <div className="p-4 text-red-600">{error}</div>;
//   if (!form) return <div className="p-4">No hay formulario</div>;

//   return (
//     <div className="max-w-2xl">
//       <div className="mb-4">
//         <h1 className="text-xl font-semibold">{form.name}</h1>
//         {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
//         <p className="text-xs text-muted-foreground">Versión: {form.version}</p>
//       </div>

//       <form onSubmit={onSubmit} className="space-y-4">
//         {sortedFields.map((field) => (
//           <FieldRenderer
//             key={field.id}
//             field={field}
//             value={values[field.name]}
//             setValue={(v) => setField(field.name, v)}
//           />
//         ))}

//         {ok && <div className="text-green-600 text-sm">{ok}</div>}
//         {error && <div className="text-red-600 text-sm">{error}</div>}

//         <button
//           type="submit"
//           disabled={submitting}
//           className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-60"
//         >
//           {submitting ? "Enviando..." : "Enviar"}
//         </button>
//       </form>
//     </div>
//   );
// }

// function FieldRenderer({
//   field,
//   value,
//   setValue,
// }: {
//   field: FormField;
//   value: any;
//   setValue: (v: any) => void;
// }) {
//   const label = (
//     <label className="block text-sm font-medium mb-1">
//       {field.label} {field.required ? <span className="text-red-500">*</span> : null}
//     </label>
//   );

//   // SELECT options pueden venir como array
//   const options: string[] = Array.isArray(field.options) ? field.options : [];

//   // Soporte base (hoy)
//   switch (field.type) {
//     case "TEXT":
//     case "NUMBER":
//     case "DATE":
//     case "TIME":
//       return (
//         <div>
//           {label}

//           {/* Hook futuro: si field.uiConfig?.input === "qr", aquí luego ponemos botón Escanear */}
//           <input
//             type={
//               field.type === "NUMBER"
//                 ? "number"
//                 : field.type === "DATE"
//                 ? "date"
//                 : field.type === "TIME"
//                 ? "time"
//                 : "text"
//             }
//             value={value ?? ""}
//             onChange={(e) => setValue(e.target.value)}
//             className="w-full rounded-md border px-3 py-2 text-sm bg-background"
//           />
//         </div>
//       );

//     case "TEXTAREA":
//       return (
//         <div>
//           {label}
//           <textarea
//             value={value ?? ""}
//             onChange={(e) => setValue(e.target.value)}
//             className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[100px]"
//           />
//         </div>
//       );

//     case "SELECT":
//       return (
//         <div>
//           {label}
//           <select
//             value={value ?? ""}
//             onChange={(e) => setValue(e.target.value)}
//             className="w-full rounded-md border px-3 py-2 text-sm bg-background"
//           >
//             <option value="" disabled>
//               Selecciona una opción…
//             </option>
//             {options.map((opt) => (
//               <option key={opt} value={opt}>
//                 {opt}
//               </option>
//             ))}
//           </select>
//         </div>
//       );

//     case "CHECKBOX":
//       return (
//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={!!value}
//             onChange={(e) => setValue(e.target.checked)}
//             className="h-4 w-4"
//           />
//           <span className="text-sm">
//             {field.label} {field.required ? <span className="text-red-500">*</span> : null}
//           </span>
//         </div>
//       );

//     default:
//       return (
//         <div className="rounded-md border p-3 text-sm">
//           Campo no soportado aún: <b>{field.type}</b>
//         </div>
//       );
//   }
// }
