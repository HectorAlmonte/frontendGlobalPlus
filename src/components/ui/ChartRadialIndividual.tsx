import { TrendingUp } from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  material: {
    label: "Material",
    color: "var(--chart-1)",
  },
  espacio_libre: {
    label: "Espacio libre",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

type ChartRadialIndividualProps = {
  titulo: string
  capacidad: number
  material: number
  espacio_libre: number
}

const ChartRadialIndividual = ({
  titulo = "Patio",
  capacidad = 3000,
  material = 0,
  espacio_libre = 0,
}: ChartRadialIndividualProps) => {
  // ✅ AHORA LA DATA VIENE DE LOS PROPS
  const chartData = [
    {
      name: "estado",
      espacio_libre,
      material,
    },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        {/* ✅ TÍTULO DINÁMICO */}
        <CardTitle>{titulo}</CardTitle>

        {/* ✅ CAPACIDAD DINÁMICA */}
        <CardDescription>Capacidad máxima {capacidad}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        {/* ✅ SOLO MATERIAL EN EL CENTRO */}
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {material}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Material
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>


            <RadialBar
              dataKey="espacio_libre"
              fill="var(--color-material)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />            
            <RadialBar
              dataKey="material"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-espacio_libre)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Ocupación actual <TrendingUp className="h-4 w-4" />
        </div>

        {/* ✅ USANDO DATA REAL */}
        <div className="text-muted-foreground leading-none">
          {material} de {capacidad} utilizados
        </div>
      </CardFooter>
    </Card>
  )
}

export default ChartRadialIndividual
