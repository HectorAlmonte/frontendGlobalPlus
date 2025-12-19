import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      
      {/* Tarjeta 1 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Órdenes procesadas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            50
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12,5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Aumento este mes <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Datos de los últimos 6 meses
          </div>
        </CardFooter>
      </Card>

      {/* Tarjeta 2 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de inventario</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            30.500 KG
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Disminución este período <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Atención requerida en reposición
          </div>
        </CardFooter>
      </Card>

      {/* Tarjeta 3 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Capacidad actual del inventario</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            70%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12,5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Inventario estable <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Nivel de stock dentro de los límites
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}
