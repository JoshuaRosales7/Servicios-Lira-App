'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AccountingData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, Save, FileSpreadsheet, CheckCircle2 } from 'lucide-react'

interface AccountingDataFormProps {
  clientId: string
  accountingData: AccountingData | null
}

import { updateAccountingData } from '@/app/actions/data-management'

export function AccountingDataForm({ clientId, accountingData }: AccountingDataFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fiscal_year: accountingData?.fiscal_year?.toString() || new Date().getFullYear().toString(),
    accounting_method: accountingData?.accounting_method || 'accrual',
    accounting_type: accountingData?.accounting_type || 'general',
    responsible: accountingData?.responsible || '',
    status: accountingData?.status || 'open',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const data = {
        fiscal_year: parseInt(formData.fiscal_year),
        accounting_method: formData.accounting_method as any,
        accounting_type: formData.accounting_type as any,
        responsible: formData.responsible || null,
        status: formData.status as any,
      }

      await updateAccountingData(clientId, data)
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle>Periodo Contable</CardTitle>
            <CardDescription>
              Configure el ejercicio fiscal y metodología de registro.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Datos contables actualizados correctamente.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fiscal_year">Ejercicio Fiscal</Label>
              <Input
                id="fiscal_year"
                type="number"
                value={formData.fiscal_year}
                onChange={(e) => handleChange('fiscal_year', e.target.value)}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado de Periodo</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">ABIERTO</SelectItem>
                  <SelectItem value="closed">CERRADO</SelectItem>
                  <SelectItem value="pending">EN REVISIÓN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accounting_method">Método Contable</Label>
              <Select value={formData.accounting_method} onValueChange={(value) => handleChange('accounting_method', value)}>
                <SelectTrigger id="accounting_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accrual">DEVENGADO</SelectItem>
                  <SelectItem value="cash">PERCIBIDO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accounting_type">Tipo de Contaduría</Label>
              <Select value={formData.accounting_type} onValueChange={(value) => handleChange('accounting_type', value)}>
                <SelectTrigger id="accounting_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">GENERAL</SelectItem>
                  <SelectItem value="simplified">SIMPLIFICADA</SelectItem>
                  <SelectItem value="special">ESPECIAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsable de Auditoría</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => handleChange('responsible', e.target.value)}
              placeholder="Nombre del contador o firma responsable"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Actualizar Periodo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
