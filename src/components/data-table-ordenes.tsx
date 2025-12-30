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
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
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
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { CreateOrderButton } from "@/app/dashboard/ordenes/createOrderButton"
import type { RowSelectionState } from "@tanstack/react-table"


/* =========================
   1) Schema / Types
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
   2) Data (mock)
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
   3) Small UI helpers
========================= */

/** Drag handle (con stopPropagation para no activar click de fila) */
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

/* =========================
   4) Columns (FIX select-all + stopPropagation)
========================= */
const columns: ColumnDef<Camion>[] = [
  // Drag column
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },

  // Checkbox selection column
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
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },


  // Data columns
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
      <div className="text-foreground">{row.original.tracto}</div>
    ),
  },
  { accessorKey: "carreta", header: "Placa Carreta" },
  { accessorKey: "ticket", header: "N° Ticket" },
  {
    accessorKey: "peso",
    header: "Peso Neto (KG)",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2">
        {row.original.peso}
      </Badge>
    ),
  },
  { accessorKey: "destino", header: "Destino" },
  {
    accessorKey: "ingreso",
    header: "Hora Ingreso",
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="text-muted-foreground text-xs">
          {row.original.ingreso}
        </div>
      </div>
    ),
  },
  { accessorKey: "salida", header: "Hora Salida" },
  { accessorKey: "duracion", header: "Duración" },

  // Actions column (stopPropagation para no disparar click de fila)
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
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

/* =========================
   5) Draggable Row (mantiene estética / click de fila)
========================= */
function DraggableRow({
  row,
  onOpen,
}: {
  row: Row<Camion>
  onOpen: (d: Camion) => void
}) {
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
   6) Main Component
========================= */
export function DataTable({
  data: initialData = camionesData,
}: {
  data?: Camion[]
}) {
  // -------------------------
  // State
  // -------------------------
  const [data, setData] = React.useState<Camion[]>(() => initialData)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [forceUpdate, setForceUpdate] = React.useState(0)

  // (Se mantiene tu intención de abrir drawer por fila, aunque aquí solo dejamos el callback)
  const [openDrawer, setOpenDrawer] = React.useState(false)
  const [selectedRow, setSelectedRow] = React.useState<Camion | null>(null)

  // -------------------------
  // DnD setup
  // -------------------------
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  // -------------------------
  // Table setup
  // -------------------------
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

    // Mantienes tu “forceUpdate trick” para evitar glitches visuales al cambiar visibilidad
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function" ? updater(columnVisibility) : updater
      setColumnVisibility(newVisibility)
      setTimeout(() => setForceUpdate((prev) => prev + 1), 0)
    },

    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // -------------------------
  // Handlers
  // -------------------------
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

  // -------------------------
  // Render
  // -------------------------
  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      {/* Toolbar (filtro + botón crear) */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>

        <Input
          placeholder="Filtrar por camiones..."
          value={(table.getColumn("tracto")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("tracto")?.setFilterValue(event.target.value)
          }
          id="view-selector"
          className="max-w-sm"
        />

        <CreateOrderButton
          onCreate={(order) => {
            setData((prev) => [{ ...order, id: Date.now() }, ...prev])
          }}
        />
      </div>

      {/* Table */}
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
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
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody
                key={forceUpdate}
                className="**:data-[slot=table-cell]:first:w-8"
              >
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow
                        key={row.id}
                        row={row}
                        onOpen={(d) => {
                          // Mantienes tu flujo para abrir drawer (si lo conectas luego)
                          setSelectedRow(d)
                          setOpenDrawer(true)
                        }}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>

              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>

              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>

              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
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
