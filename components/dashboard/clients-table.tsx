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
    <div>
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="font-semibold text-gray-900">Cliente</TableHead>
            <TableHead className="font-semibold text-gray-900">Tipo</TableHead>
            <TableHead className="font-semibold text-gray-900">Contacto</TableHead>
            <TableHead className="font-semibold text-gray-900">Ubicación</TableHead>
            <TableHead className="font-semibold text-gray-900 text-right">Estado</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="border-b hover:bg-gray-50">
              <TableCell className="py-4">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-600 text-sm">
                    {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {client.commercial_name || client.legal_name}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      NIT: {client.nit || '---'}
                    </span>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="text-gray-400">
                    {client.person_type === 'juridica' ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">
                    {client.person_type === 'juridica' ? 'Jurídica' : 'Individual'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate max-w-[180px]">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {client.phone}
                    </div>
                  )}
                  {!client.email && !client.phone && (
                    <span className="text-gray-400 text-xs">---</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {client.municipality || client.department ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate max-w-[140px]">{[client.municipality, client.department].filter(Boolean).join(', ')}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">---</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    client.fiscal_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : client.fiscal_status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {client.fiscal_status === 'active' ? 'Activo' : client.fiscal_status === 'inactive' ? 'Inactivo' : client.fiscal_status}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Ver Detalles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/clients/${client.id}/edit`}>
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Editar Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
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
    </div>
  )
}
