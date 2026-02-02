'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BankingData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, Plus, Trash2, Building, Landmark, Search, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BankingDataSectionProps {
  clientId: string
  bankingData: BankingData[]
}

const emptyFormData = {
  bank: '',
  account_number: '',
  currency: 'GTQ',
  account_type: 'monetaria',
  accounting_use: '',
  notes: '',
}

import { createBankAccount, updateBankAccount, deleteBankAccount } from '@/app/actions/data-management'

export function BankingDataSection({ clientId, bankingData }: BankingDataSectionProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<BankingData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState(emptyFormData)

  const filteredBankingData = bankingData.filter(account =>
    account.bank?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = {
      bank: formData.bank,
      account_number: formData.account_number || null,
      currency: formData.currency,
      account_type: formData.account_type,
      accounting_use: formData.accounting_use || null,
      notes: formData.notes || null,
    }

    try {
      if (editingAccount) {
        await updateBankAccount(editingAccount.id, clientId, data)
      } else {
        await createBankAccount(clientId, data)
      }

      setIsOpen(false)
      setFormData(emptyFormData)
      setEditingAccount(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsLoading(true)

    try {
      await deleteBankAccount(deleteId, clientId)
      setDeleteId(null)
      router.refresh()
    } catch (err: any) {
      // toast.error(err.message) (if toast is available, but sticking to basics)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (account: BankingData) => {
    setEditingAccount(account)
    setFormData({
      bank: account.bank || '',
      account_number: account.account_number || '',
      currency: account.currency || 'GTQ',
      account_type: account.account_type || 'monetaria',
      accounting_use: account.accounting_use || '',
      notes: account.notes || '',
    })
    setIsOpen(true)
  }

  const openNew = () => {
    setEditingAccount(null)
    setFormData(emptyFormData)
    setIsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar banco o número de cuenta..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Vincular Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBankingData.length > 0 ? (
          filteredBankingData.map((account) => (
            <Card key={account.id} className="group border shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{account.bank || 'Institución Bancaria'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {account.currency || 'GTQ'}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {account.account_type === 'monetaria' ? 'Monetaria' : account.account_type === 'savings' ? 'Ahorro' : 'Cheques'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(account)} className="h-8 w-8">
                      <span className="sr-only">Editar</span>
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-md bg-muted/50 border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Número de Cuenta</p>
                    <p className="font-mono font-medium tracking-wide">{account.account_number || '#### #### ####'}</p>
                  </div>

                  {account.accounting_use && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Uso Destinado</p>
                      <p className="text-sm">{account.accounting_use}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center rounded-lg border border-dashed">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-muted/30 p-3">
                <Building className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-medium text-lg">Sin Cuentas Vinculadas</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Agregue cuentas bancarias para gestionar pagos y conciliaciones.</p>
            <Button variant="outline" onClick={openNew}>
              Agregar Cuenta
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Actualizar Cuenta' : 'Vincular Cuenta'}
            </DialogTitle>
            <DialogDescription>
              Configure los detalles de la institución financiera.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Institución Bancaria</Label>
                <Input
                  id="bank"
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  placeholder="Nombre del banco"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Número de Cuenta</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="000-0000000-0"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Divisa</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GTQ">Quetzales (GTQ)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                    <SelectItem value="EUR">Euros (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Haber</Label>
                <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monetaria">Monetaria</SelectItem>
                    <SelectItem value="savings">Ahorros</SelectItem>
                    <SelectItem value="checking">Cheques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accounting_use">Propósito / Uso Contable</Label>
              <Input
                id="accounting_use"
                value={formData.accounting_use}
                onChange={(e) => setFormData({ ...formData, accounting_use: e.target.value })}
                placeholder="Ej: Pago a proveedores, Nómina mensual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles adicionales sobre transferencias o firmantes..."
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingAccount ? 'Actualizar' : 'Guardar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro bancario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desvinculará permanentemente la cuenta del expediente del cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Descartar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
