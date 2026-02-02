'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FiscalData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Save, Receipt, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FiscalDataFormProps {
  clientId: string
  fiscalData: FiscalData | null
}

import { updateFiscalData } from '@/app/actions/data-management'

export function FiscalDataForm({ clientId, fiscalData }: FiscalDataFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    tax_regime: fiscalData?.tax_regime || '',
    obligations: fiscalData?.obligations?.join(', ') || '',
    declaration_frequency: fiscalData?.declaration_frequency || '',
    sat_user: fiscalData?.sat_user || '',
    last_declaration_date: fiscalData?.last_declaration_date || '',
    observations: fiscalData?.observations || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const data = {
        tax_regime: formData.tax_regime || null,
        obligations: formData.obligations ? formData.obligations.split(',').map(s => s.trim()) : [],
        declaration_frequency: formData.declaration_frequency || null,
        sat_user: formData.sat_user || null,
        last_declaration_date: formData.last_declaration_date || null,
        observations: formData.observations || null,
      }

      await updateFiscalData(clientId, data)
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle>Expediente Fiscal</CardTitle>
            <CardDescription>
              Resumen de obligaciones y régimen tributario ante la SAT.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="font-medium">Información fiscal actualizada con éxito.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_regime">Régimen de Impuestos</Label>
              <select
                id="tax_regime"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.tax_regime}
                onChange={(e) => handleChange('tax_regime', e.target.value)}
              >
                <option value="">Seleccionar Régimen</option>
                <option value="pequeño_contuyente">Pequeño Contribuyente</option>
                <option value="general">Régimen General</option>
                <option value="opcional_simplificado">Opcional Simplificado</option>
                <option value="utilidades">Sobre Utilidades</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="declaration_frequency">Frecuencia de Declaración</Label>
              <select
                id="declaration_frequency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.declaration_frequency}
                onChange={(e) => handleChange('declaration_frequency', e.target.value)}
              >
                <option value="">Seleccionar Frecuencia</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obligations">Listado de Obligaciones</Label>
            <Input
              id="obligations"
              value={formData.obligations}
              onChange={(e) => handleChange('obligations', e.target.value)}
              placeholder="Ej: IVA, ISR, ISO..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sat_user">Usuario Agencia Virtual</Label>
              <Input
                id="sat_user"
                value={formData.sat_user}
                onChange={(e) => handleChange('sat_user', e.target.value)}
                placeholder="Nombre de usuario SAT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_declaration_date">Fecha Última Presentación</Label>
              <Input
                id="last_declaration_date"
                type="date"
                value={formData.last_declaration_date}
                onChange={(e) => handleChange('last_declaration_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones Especiales</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              placeholder="Ingrese notas o requerimientos fiscales específicos..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Expediente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
