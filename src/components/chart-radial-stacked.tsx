"use client"
import ChartRadialIndividual from "./ui/ChartRadialIndividual"
import { useEffect, useState } from "react"

import { PatioItem } from "@/types/patio" // ajusta la ruta si es necesario

export const description = "A radial chart with stacked sections"


export function ChartRadialStacked() {
  const [data, setData] = useState<PatioItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
      const fetchData = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patios`, {
            method: "GET",
            credentials: "include", // ✅ ENVÍA COOKIES AUTOMÁTICAMENTE
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (res.status === 401) {
            window.location.href = "/login"
            return
          }

          if (!res.ok) throw new Error("Error al obtener patios")

          const json = await res.json()
          setData(json.data)

        } catch (error) {
          console.error("Error:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }, [])

  // ✅ LOADING
  if (loading) {
    return <p className="p-4 text-muted-foreground">Cargando patios...</p>
  }
  return (
    <>
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

    </>
  )
}
