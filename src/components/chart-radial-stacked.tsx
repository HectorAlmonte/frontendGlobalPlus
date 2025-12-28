"use client"

import ChartRadialIndividual from "./ui/ChartRadialIndividual"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { PatioItem } from "@/types/patio"

export const description = "A radial chart with stacked sections"

export function ChartRadialStacked() {
  const [data, setData] = useState<PatioItem[]>([])
  const [loading, setLoading] = useState(true)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      console.error("❌ NEXT_PUBLIC_API_URL no está definido")
      setLoading(false)
      return
    }

    // 1) ✅ FETCH SIEMPRE (no depende del socket)
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/patios`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        const json = await res.json()
        setData(json.data ?? json)
      } catch (err) {
        console.error("❌ Error cargando patios:", err)
      } finally {
        setLoading(false)
      }
    })()

    // 2) ✅ SOCKET SOLO PARA ESCUCHAR
    const s = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    })
    socketRef.current = s

    const onConnect = () => console.log("✅ Socket conectado:", s.id)
    const onThreshold = (payload: any) =>
      console.log("📩 EVENTO RECIBIDO warehouse:threshold:", payload)
    const onConnectError = (err: any) =>
      console.error("❌ socket connect_error:", err?.message ?? err)

    s.on("connect", onConnect)
    s.on("warehouse:threshold", onThreshold)
    s.on("connect_error", onConnectError)

    // 🔍 debug brutal: imprime TODO lo que llegue por socket
    s.onAny((event, payload) => {
      console.log("📡 onAny:", event, payload)
    })

    return () => {
      s.off("connect", onConnect)
      s.off("warehouse:threshold", onThreshold)
      s.off("connect_error", onConnectError)
      s.offAny()
      s.disconnect()
      socketRef.current = null
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
