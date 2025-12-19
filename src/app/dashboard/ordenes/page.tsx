//import { DataTable } from "@/components/data-table"
"use client"

import data from "../data.json"
import { DataTable } from "@/components/data-table-ordenes"
import { useEffect } from "react"
import { useWord } from "@/context/AppContext"
import Formulario from "./formulario"
const page = () => {

    const { setWord } = useWord();
  
    useEffect(() => {
      setWord("Ordenes");
    
    }, [setWord]);

  return (
    <> 
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-6 md:py-6">
            {/* <label className="pl-5">Ordenes</label> */}
            {/* <DataTable data={data} /> */}
            <Formulario />
            <DataTable />
        </div>
        </div>
    </div>
    </>
  )
}

export default page