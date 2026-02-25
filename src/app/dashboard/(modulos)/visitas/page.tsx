"use client"

import { DataTable } from "@/components/data-table"
import { useEffect } from "react"
import { useWord } from "@/context/AppContext"
import data from "../../data.json"
const page = () => {

  
  const { setWord } = useWord();

  useEffect(() => {
    setWord("Visitas");
  
  }, [setWord]);
  return (
    <> 
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-6 md:py-6">
            <label className="pl-5">Visitas</label>
            
            <DataTable data={data} />
        </div>
        </div>
    </div>
    </>
  )
}

export default page