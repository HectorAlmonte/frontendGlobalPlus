"use client"

import { SectionCards } from "@/components/section-cards"
import { ChartRadialStacked } from "@/components/chart-radial-stacked"
import { useEffect } from "react"
import { useWord } from "@/context/AppContext"
export default function Page() {

  const { setWord } = useWord();

  useEffect(() => {
    setWord("Dashboard");
  
  }, [setWord])
  
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-3 py-3 md:gap-6 md:py-6">
            <SectionCards />
            <ChartRadialStacked />
          </div>
        </div>
      </div>
    </>
  )
}
