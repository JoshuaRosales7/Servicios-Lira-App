'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { LegalData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Save, Scale, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LegalDataFormProps {
  clientId: string
  legalData: LegalData | null
}

import { updateLegalData } from '@/app/actions/data-management'

export function LegalDataForm({ clientId, legalData }: LegalDataFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    legal_representative: legalData?.legal_representative || '',
    representative_dpi: legalData?.representative_dpi || '',
    position: legalData?.position || '',
    appointment_date: legalData?.appointment_date || '',
    documents_expiry: legalData?.documents_expiry || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const data = {
        legal_representative: formData.legal_representative || null,
        representative_dpi: formData.representative_dpi || null,
        position: formData.position || null,
        appointment_date: formData.appointment_date || null,
        documents_expiry: formData.documents_expiry || null,
      }

      await updateLegalData(clientId, data)
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col gap-1 pb-2 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5 text-indigo-500" />
          Estatuto Legal
        </h3>
        <p className="text-sm text-muted-foreground">Representación legal y vigencia de nombramientos.</p>
      </div>

      <div className="space-y-6 pt-2">
        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">Datos legales actualizados correctamente.</span>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="legal_representative">Representante Legal</Label>
            <Input
              id="legal_representative"
              value={formData.legal_representative}
              onChange={(e) => handleChange('legal_representative', e.target.value)}
              placeholder="Nombre Completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representative_dpi">Identificación (DPI)</Label>
            <Input
              id="representative_dpi"
              value={formData.representative_dpi}
              onChange={(e) => handleChange('representative_dpi', e.target.value)}
              placeholder="0000 00000 0000"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="position">Cargo u Oficio</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="Gerente, Administrador, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointment_date">Fecha Nombramiento</Label>
            <Input
              id="appointment_date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => handleChange('appointment_date', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documents_expiry">Expiración Documentación Legal</Label>
          <Input
            id="documents_expiry"
            type="date"
            value={formData.documents_expiry}
            onChange={(e) => handleChange('documents_expiry', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Actualizar Nombramiento
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
