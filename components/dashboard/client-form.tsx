'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, Save, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { createClientWithAccess } from '@/app/actions/clients'

interface ClientFormProps {
  client?: Client
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    legal_name: client?.legal_name || client?.name || '',
    commercial_name: client?.commercial_name || '',
    nit: client?.nit || '',
    dpi: client?.dpi || '',
    email: client?.email || '',
    phone: client?.phone || '',
    fiscal_address: client?.fiscal_address || '',
    municipality: client?.municipality || '',
    department: client?.department || '',
    person_type: client?.person_type || 'individual',
    fiscal_status: client?.fiscal_status || 'active',
    create_access: false,
    password: '',
  })

  useEffect(() => {
    if (formData.create_access && !formData.password && formData.nit) {
      const cleanNit = formData.nit.replace(/[^a-zA-Z0-9]/g, '')
      if (cleanNit) {
        setFormData(prev => ({ ...prev, password: `User${cleanNit}` }))
      }
    }
  }, [formData.create_access, formData.nit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Debes iniciar sesión para realizar esta acción')
      setIsLoading(false)
      return
    }

    const clientData = {
      ...formData,
      user_id: user.id,
    }

    let result
    if (client) {
      result = await supabase
        .from('clients')
        .update({
          legal_name: formData.legal_name,
          commercial_name: formData.commercial_name,
          nit: formData.nit,
          dpi: formData.dpi,
          email: formData.email,
          phone: formData.phone,
          fiscal_address: formData.fiscal_address,
          municipality: formData.municipality,
          department: formData.department,
          person_type: formData.person_type,
          fiscal_status: formData.fiscal_status,
        })
        .eq('id', client.id)
        .select()
        .single()

      if (result.error) {
        setError(result.error.message)
        setIsLoading(false)
        return
      }
      router.push(`/dashboard/clients/${result.data.id}`)
    } else {
      const response = await createClientWithAccess(formData)
      if (!response.success) {
        setError(response.error)
        setIsLoading(false)
        return
      }
      router.push(`/dashboard/clients/${response.clientId}`)
    }

    router.refresh()
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Introduce la información básica de contacto del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legal_name">Nombre Legal / Razón Social *</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => handleChange('legal_name', e.target.value)}
                placeholder="Nombre Legal SA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercial_name">Nombre Comercial</Label>
              <Input
                id="commercial_name"
                value={formData.commercial_name}
                onChange={(e) => handleChange('commercial_name', e.target.value)}
                placeholder="Mi Negocio"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nit">NIT *</Label>
              <Input
                id="nit"
                value={formData.nit}
                onChange={(e) => handleChange('nit', e.target.value)}
                placeholder="1234567-8"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI</Label>
              <Input
                id="dpi"
                value={formData.dpi}
                onChange={(e) => handleChange('dpi', e.target.value)}
                placeholder="0000 00000 0000"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="person_type">Tipo de Persona *</Label>
              <Select
                value={formData.person_type}
                onValueChange={(value) => handleChange('person_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="juridica">Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal_status">Estado Fiscal</Label>
              <Select
                value={formData.fiscal_status}
                onValueChange={(value) => handleChange('fiscal_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>


        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
          <CardDescription>
            Información de dirección física del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fiscal_address">Dirección Fiscal</Label>
            <Textarea
              id="fiscal_address"
              value={formData.fiscal_address}
              onChange={(e) => handleChange('fiscal_address', e.target.value)}
              placeholder="Dirección completa registrada en SAT"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="municipality">Municipio</Label>
              <Input
                id="municipality"
                value={formData.municipality}
                onChange={(e) => handleChange('municipality', e.target.value)}
                placeholder="Municipio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Departamento"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!client && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              Acceso al Sistema
            </CardTitle>
            <CardDescription>
              Permite que el cliente acceda a su propio panel de control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-background border border-border/40">
              <Checkbox
                id="create_access"
                checked={formData.create_access}
                onCheckedChange={(checked) => setFormData({ ...formData, create_access: checked as boolean })}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="create_access"
                  className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Generar credenciales de acceso
                </label>
                <p className="text-xs text-muted-foreground">
                  Se creará un usuario con el correo electrónico del cliente.
                </p>
              </div>
            </div>

            {formData.create_access && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Autogenerado: User + NIT"
                    className="pl-10 font-mono"
                    required={formData.create_access}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-[10px] uppercase font-black"
                    onClick={() => {
                      const cleanNit = formData.nit.replace(/[^a-zA-Z0-9]/g, '')
                      setFormData(prev => ({ ...prev, password: `User${cleanNit || '2026'}` }))
                    }}
                  >
                    Regenerar
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Contraseña sugerida: <span className="font-bold text-primary">User + NIT</span> (ej: User12345678). Puede editarla si lo prefiere.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Link href="/dashboard/clients">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Clientes
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {client ? 'Actualizar Cliente' : 'Crear Cliente'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
