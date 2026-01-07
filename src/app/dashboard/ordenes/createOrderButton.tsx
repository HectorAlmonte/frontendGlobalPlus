"use client"

import * as React from "react"
import { IconPlus } from "@tabler/icons-react"

import { useMediaQuery } from "@/hooks/use-media-query"

import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

import type { Orden } from "@/types/orden"
import { CreateOrderForm } from "./createOrdenForm"

export function CreateOrderButton({
  onCreate,
}: {
  onCreate: (order: Omit<Orden, "id">) => void
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <IconPlus size={16} />
            Nueva orden
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva orden</DialogTitle>
            <DialogDescription>
              Registra una nueva orden de pesaje
            </DialogDescription>
          </DialogHeader>

          <CreateOrderForm
            onSubmit={(order) => {
              onCreate(order)
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="flex items-center gap-2">
          <IconPlus size={16} />
          Nueva orden
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Nueva orden</DrawerTitle>
          <DrawerDescription>
            Registra una nueva orden de pesaje
          </DrawerDescription>
        </DrawerHeader>

        <CreateOrderForm
          className="px-4"
          onSubmit={(order) => {
            onCreate(order)
            setOpen(false)
          }}
        />

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
