"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { normalizeType } from "@/helpers/form-helpers";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ta } from "zod/v4/locales";

type FieldType =
  | "TEXT"
  | "NUMBER"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX"
  | "DATE"
  | "TIME";

type FormFieldDTO = {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  required: boolean;
  order: number;
  description?: string | null;
  options?: any;
  uiConfig?: any;
};

type FormDTO = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  version: number;
  fields: FormFieldDTO[];
};

function buildZodSchema(fields: FormFieldDTO[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const f of fields) {
    let schema: z.ZodTypeAny;
    const t = normalizeType(f.type);

    switch (t) {
      case "NUMBER": {
        // Base: puede venir string o number
        let base = z
          .union([z.string(), z.number()])
          .transform((v) => (typeof v === "string" ? v.trim() : v));

        if (f.required) {
          schema = base
            .refine((v) => v !== "", { message: `${f.label} es requerido` })
            .transform((v) => Number(v))
            .refine((n) => !Number.isNaN(n), { message: `${f.label} inválido` });
        } else {
          schema = base
            .optional()
            .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
            .refine((n) => n === undefined || !Number.isNaN(n), {
              message: `${f.label} inválido`,
            });
        }
        break;
      }

      case "CHECKBOX": {
        schema = z.boolean();
        // required checkbox = true
        if (f.required) {
          schema = schema.refine((v) => v === true, {
            message: `${f.label} es requerido`,
          });
        } else {
          schema = schema.optional();
        }
        break;
      }

      default: {
        // TEXT, TEXTAREA, SELECT, DATE, TIME
        schema = z.string();
        if (f.required) {
          schema = (schema as z.ZodString).min(1, {
            message: `${f.label} es requerido`,
          });
        } else {
          schema = schema.optional();
        }
        break;
      }
    }

    shape[f.name] = schema;
  }

  return z.object(shape);
}

function buildDefaultValues(fields: FormFieldDTO[]) {
  const defaults: Record<string, any> = {};
  for (const f of fields) {
    defaults[f.name] = f.type === "CHECKBOX" ? false : "";
  }
  return defaults;
}

export default function DynamicFormRHF({ slug }: { slug: string }) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [formDef, setFormDef] = useState<FormDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setServerErr(null);
        setServerMsg(null);

        const res = await fetch(`${API}/api/forms/${slug}`, {
          credentials: "include",
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || `Error (${res.status})`);

        setFormDef(body);
      } catch (e: any) {
        setServerErr(e?.message || "Error cargando formulario");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [API, slug]);

  const sortedFields = useMemo(() => {
    return (formDef?.fields ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [formDef]);

  const schema = useMemo(() => buildZodSchema(sortedFields), [sortedFields]);
  const defaultValues = useMemo(() => buildDefaultValues(sortedFields), [sortedFields]);

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!formDef) return;
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDef]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setServerErr(null);
      setServerMsg(null);

      const res = await fetch(`${API}/api/forms/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || `No se pudo enviar (${res.status})`);

      setServerMsg("✅ Enviado correctamente");
    } catch (e: any) {
      setServerErr(e?.message || "Error enviando formulario");
    }
  });

  if (loading) return <div className="p-4">Cargando…</div>;
  if (serverErr && !formDef) return <div className="p-4 text-red-600">{serverErr}</div>;
  if (!formDef) return <div className="p-4">No hay formulario</div>;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-6 md:py-6">
          <Card>
            <CardHeader>
              <CardTitle>{formDef.name}</CardTitle>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form className="flex flex-col gap-y-3" onSubmit={onSubmit}>
                  {sortedFields.map((f) => (
                    <DynamicField key={f.id} field={f} control={form.control} />
                  ))}

                  {serverMsg && <p className="text-sm text-green-600">{serverMsg}</p>}
                  {serverErr && <p className="text-sm text-red-600">{serverErr}</p>}

                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Enviando..." : "Enviar"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DynamicField({
  field,
  control,
}: {
  field: FormFieldDTO;
  control: any;
}) {
  const description = field.description || `Ingresa ${field.label.toLowerCase()}`;
  const options: string[] = Array.isArray(field.options) ? field.options : [];

  const t = normalizeType(field.type);

  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: rhf }) => (
        <FormItem>
          <FormLabel>
            {field.label} {field.required ? <span className="text-red-500">*</span> : null}
          </FormLabel>

          {/* CHECKBOX fuera de FormControl */}
          {t === "CHECKBOX" ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!rhf.value}
                onChange={(e) => rhf.onChange(e.target.checked)}
              />
              <span className="text-sm">{description}</span>
            </div>
          ) : t === "SELECT" ? (
            // SELECT mejor fuera de FormControl (shadcn)
            <Select onValueChange={rhf.onChange} defaultValue={rhf.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción…" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // FormControl SIEMPRE recibe exactamente 1 child
            <FormControl>
              {t === "TEXT" ? (
                <Input placeholder={field.label} {...rhf} />
              ) : t === "NUMBER" ? (
                <Input type="number" placeholder={field.label} {...rhf} />
              ) : t === "DATE" ? (
                <Input type="date" {...rhf} />
              ) : t === "TIME" ? (
                <Input type="time" {...rhf} />
              ) : t === "TEXTAREA" ? (
                <Textarea placeholder={field.label} {...rhf} />
              ) : (
                // fallback extra (por si algo rarísimo pasa)
                <Input placeholder={field.label} {...rhf} />
              )}
            </FormControl>
          )}

          {t !== "CHECKBOX" && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

