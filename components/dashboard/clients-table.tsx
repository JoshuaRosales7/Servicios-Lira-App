'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Eye, Edit, Trash2, Building2, User, Mail, Phone, MapPin } from 'lucide-react'

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', deleteId)

    setDeleteId(null)
    setIsDeleting(false)
    router.refresh()
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-muted/50 border-b">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Cliente</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Contacto</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ubicación</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Estado</TableHead>
            <TableHead className="w-[60px] px-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group transition-colors border-b">
              <TableCell className="px-6 py-4">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 group/link"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border font-bold text-muted-foreground text-sm shrink-0 transition-colors group-hover/link:bg-primary group-hover/link:text-primary-foreground">
                    {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm group-hover/link:text-primary transition-colors">
                      {client.commercial_name || client.legal_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      NIT: {client.nit || '---'}
                    </span>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground/60">
                    {client.person_type === 'juridica' ? (
                      <Building2 className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {client.person_type === 'juridica' ? 'Jurídica' : 'Individual'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5 py-1">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-foreground/80">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {client.phone}
                    </div>
                  )}
                  {!client.email && !client.phone && (
                    <span className="text-muted-foreground/30 text-[10px] font-bold">---</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {client.municipality || client.department ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 opacity-40 shrink-0" />
                    <span className="truncate max-w-[120px]">{[client.municipality, client.department].filter(Boolean).join(', ')}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/30 text-[10px] font-bold">---</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                    client.fiscal_status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                      : client.fiscal_status === 'inactive'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                        : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {client.fiscal_status === 'active' ? 'Activo' : client.fiscal_status === 'inactive' ? 'Inactivo' : client.fiscal_status}
                </span>
              </TableCell>
              <TableCell className="px-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 p-1">
                    <DropdownMenuItem asChild className="text-xs font-semibold px-3 py-2">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Ver Detalles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-xs font-semibold px-3 py-2">
                      <Link href={`/dashboard/clients/${client.id}/edit`}>
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Editar Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs font-semibold px-3 py-2 text-destructive focus:text-destructive"
                      onClick={() => setDeleteId(client.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl overflow-hidden p-0 border shadow-2xl">
          <div className="p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">¿Confirmar eliminación?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium pt-2">
                Esta acción eliminará de forma permanente al cliente y toda su información asociada (documentos, notas, cuentas). Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="bg-muted/30 p-4 border-t gap-3">
            <AlertDialogCancel disabled={isDeleting} className="rounded-lg h-9 text-xs font-bold border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg h-9 text-xs font-bold shadow-sm"
            >
              {isDeleting ? 'Borrando...' : 'Eliminar registro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
