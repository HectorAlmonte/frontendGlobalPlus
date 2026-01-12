"use client";
import { useEffect, useState } from "react";

export default function TestFetch() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/forms/seguridad-ingreso`, {
          credentials: "include",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || "Error");
        setData(body);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [API]);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!data) return <div>Cargando…</div>;

  return (
    <pre className="rounded-md border p-3 text-xs overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
