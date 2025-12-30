"use client"

import ChartRadialIndividual from "./ui/ChartRadialIndividual"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { PatioItem } from "@/types/patio"
import { toast } from "sonner"

export const description = "A radial chart with stacked sections"

export function ChartRadialStacked() {
  const [data, setData] = useState<PatioItem[]>([])
  const [loading, setLoading] = useState(true)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    const s = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    })
    socketRef.current = s

    const fetchPatios = async () => {
      try {
        const res = await fetch(`${API_URL}/api/patios`, {
          credentials: "include",
        })
        const json = await res.json()
        setData(json.data ?? json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const onConnect = () => {
      console.log("✅ Socket conectado:", s.id)
      fetchPatios() // 👈 ahora sí: el emit te va a caer
    }

    const onThreshold = (payload: any) =>
      toast.warning("🚨 Capacidad crítica", {
        description: `Patio ${payload.patio} al ${payload.porcentaje}%`,
      })

    s.on("connect", onConnect)
    s.on("warehouse:threshold", onThreshold)
    s.on("connect_error", (err) =>
      console.error("❌ connect_error:", err?.message ?? err)
    )

    return () => {
      s.off("connect", onConnect)
      s.off("warehouse:threshold", onThreshold)
      s.disconnect()
    }
  }, [])


  if (loading) return <p className="p-4 text-muted-foreground">Cargando patios...</p>

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {data.map((item) => (
        <ChartRadialIndividual
          key={item.id}
          titulo={item.titulo}
          capacidad={item.capacidad}
          material={item.material}
          espacio_libre={item.espacio_libre}
        />
      ))}
    </div>
  )
}
