"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { CreateOrderButton } from "@/app/dashboard/ordenes/createOrderButton"

/* =========================
   SCHEMA (camiones)
========================= */
export const schema = z.object({
  id: z.number(),
  turno: z.string(),
  tracto: z.string(),
  carreta: z.string(),
  ticket: z.string(),
  peso: z.string(),
  destino: z.string(),
  ingreso: z.string(),
  salida: z.string(),
  duracion: z.string(),
})

type Camion = z.infer<typeof schema>

/* =========================
   DATA DE PRUEBA (tu Excel)
========================= */
export const camionesData: Camion[] = [
  {
    id: 1,
    turno: "TURNO 01",
    tracto: "VDZ815",
    carreta: "VCE975",
    ticket: "2644",
    peso: "30,930",
    destino: "J2",
    ingreso: "01:07:00",
    salida: "01:30:00",
    duracion: "00:23:00",
  },
  {
    id: 2,
    turno: "TURNO 01",
    tracto: "V9M752",
    carreta: "V0D977",
    ticket: "2645",
    peso: "30,840",
    destino: "J2",
    ingreso: "01:09:00",
    salida: "01:36:00",
    duracion: "00:27:00",
  },
  {
    id: 3,
    turno: "TURNO 01",
    tracto: "V6H726",
    carreta: "VDL995",
    ticket: "2647",
    peso: "31,530",
    destino: "J2",
    ingreso: "01:17:00",
    salida: "01:42:00",
    duracion: "00:25:00",
  },
  {
    id: 4,
    turno: "TURNO 01",
    tracto: "VOV829",
    carreta: "VGL986",
    ticket: "2646",
    peso: "30,900",
    destino: "J2",
    ingreso: "01:32:00",
    salida: "01:48:00",
    duracion: "00:16:00",
  },
]

/* =========================
   Drag handle (mismo estilo)
========================= */
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

/* =========================
   COLUMNAS adaptadas (mismas UI y Drawer trigger)
========================= */
const columns: ColumnDef<Camion>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "turno",
    header: "Turno",
    enableHiding: false,
    cell: ({ row }) => <div className="font-medium">{row.original.turno}</div>,
  },
  {
    accessorKey: "tracto",
    header: "Placa Tracto",
    cell: ({ row }) => (
      <Button variant="link" className="p-0 text-left" asChild>
        <DrawerTriggerMock item={row.original} />
      </Button>
    ),
  },
  {
    accessorKey: "carreta",
    header: "Placa Carreta",
  },
  {
    accessorKey: "ticket",
    header: "N° Ticket",
  },
  {
    accessorKey: "peso",
    header: "Peso Neto (KG)",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2">
        {row.original.peso}
      </Badge>
    ),
  },
  {
    accessorKey: "destino",
    header: "Destino",
  },
  {
    accessorKey: "ingreso",
    header: "Hora Ingreso",
    cell: ({ row }) => (
      <div className="text-sm">
        {/* <div>{row.original.destino}</div> */}
        <div className="text-muted-foreground text-xs">{row.original.ingreso}</div>
      </div>
    ),
  },
  {
    accessorKey: "salida",
    header: "Hora Salida",
  },
  {
    accessorKey: "duracion",
    header: "Duración",
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Ver detalle</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Eliminar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

/* Helper Drawer trigger used inside cell (keeps same Drawer used below) */
function DrawerTriggerMock({ item }: { item: Camion }) {
  // This component just renders the text and will be wrapped by DrawerTrigger in TableCellViewer,
  // we keep it minimal to match the original behavior.
  return <span className="text-foreground">{item.tracto}</span>
}

/* =========================
   Draggable row (keeps original attributes + data-attrs)
========================= */
function DraggableRow({ row, onOpen }: { row: Row<Camion>; onOpen: (d: Camion) => void }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-muted/40 cursor-pointer"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={() => onOpen(row.original)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

/* =========================
   TableCellViewer -> Drawer content (adaptado al camión)
   Usamos el mismo Drawer UI que tenías en el original
========================= */
function TableCellViewer({ item }: { item: Camion }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.tracto}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{`Detalle - ${item.tracto}`}</DrawerTitle>
          <DrawerDescription>Información del registro de pesaje</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {/* small chart area preserved (kept from original) */}
          {!isMobile && (
            <>
              <ChartContainer
                config={{
                  desktop: { label: "Pesos", color: "var(--primary)" },
                  mobile: { label: "Entradas", color: "var(--muted)" },
                }}
              >
                <AreaChart
                  data={[
                    { month: "01", desktop: 100, mobile: 50 },
                    { month: "02", desktop: 120, mobile: 70 },
                  ]}
                  margin={{ left: 0, right: 10 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                </AreaChart>
              </ChartContainer>
              <Separator />
            </>
          )}

          <form className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>Turno</Label>
              <Input defaultValue={item.turno} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Placa Tracto</Label>
              <Input defaultValue={item.tracto} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Placa Carreta</Label>
              <Input defaultValue={item.carreta} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>N° Ticket</Label>
              <Input defaultValue={item.ticket} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Peso Neto</Label>
                <Input defaultValue={item.peso} readOnly />
              </div>
              <div>
                <Label>Destino</Label>
                <Input defaultValue={item.destino} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Ingreso</Label>
                <Input defaultValue={item.ingreso} readOnly />
              </div>
              <div>
                <Label>Hora Salida</Label>
                <Input defaultValue={item.salida} readOnly />
              </div>
            </div>
            <div>
              <Label>Duración</Label>
              <Input defaultValue={item.duracion} readOnly />
            </div>
          </form>
        </div>

        <DrawerFooter>
          <Button>Editar</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

/* =========================
   COMPONENTE PRINCIPAL (mantiene tu layout original)
========================= */
export function DataTable({ data: initialData = camionesData }: { data?: Camion[] }) {
  const [data, setData] = React.useState<Camion[]>(() => initialData)
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [forceUpdate, setForceUpdate] = React.useState(0)

  // drawer states
  const [openDrawer, setOpenDrawer] = React.useState(false)
  const [selectedRow, setSelectedRow] = React.useState<Camion | null>(null)

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    // preserve your custom visibility updater and forceUpdate trick
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === "function" ? updater(columnVisibility) : updater
      setColumnVisibility(newVisibility)
      setTimeout(() => setForceUpdate(prev => prev + 1), 0)
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">View</Label>
        <Input
          placeholder="Filtrar por camiones..."
          value={(table.getColumn("tracto")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("tracto")?.setFilterValue(event.target.value)}
          id="view-selector"
          className="max-w-sm"
        />
        <CreateOrderButton onCreate={(order) => {
          setData((prev) => [
            { ...order, id: Date.now() },
            ...prev,
          ])
        }} />
        {/* <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
      </div>

      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody key={forceUpdate} className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow
                        key={row.id}
                        row={row}
                        onOpen={(d) => {
                          setSelectedRow(d)
                          setOpenDrawer(true)
                        }}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
