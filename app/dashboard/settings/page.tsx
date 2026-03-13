'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Save, Settings, User, ShieldCheck } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', email: '' })

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setFormData({ full_name: profile?.full_name || user.user_metadata?.full_name || '', email: user.email || '' })
      }
    }
    loadUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsLoading(true); setError(null); setSuccess(false)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('profiles').update({ full_name: formData.full_name }).eq('id', user.id)
    if (updateError) { setError(updateError.message); setIsLoading(false); return }
    await supabase.auth.updateUser({ data: { full_name: formData.full_name } })
    setSuccess(true); setIsLoading(false); router.refresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona configuración de cuenta</p>
        </div>
      </div>

      <div className="grid gap-5 max-w-2xl">
        {/* Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <User className="h-4 w-4 text-slate-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Perfil</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Actualiza tu información personal</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  <Save className="h-4 w-4 flex-shrink-0" /><span>¡Perfil actualizado correctamente!</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm">Nombre Completo</Label>
                <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Tu nombre completo" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Correo Electrónico</Label>
                <Input id="email" type="email" value={formData.email} disabled className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 opacity-70" />
                <p className="text-xs text-slate-500">El correo no se puede cambiar</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading} size="sm" className="h-9 rounded-lg">
                  {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Guardando...</> : <><Save className="mr-2 h-3.5 w-3.5" />Guardar Cambios</>}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Información de la Cuenta</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detalles de tu cuenta</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'ID de Cuenta', value: user?.id || '-', mono: true },
              { label: 'Creado', value: user?.created_at ? new Date(user.created_at).toLocaleString() : '-' },
              { label: 'Último inicio de sesión', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-' },
            ].map(item => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className={`text-sm text-slate-900 dark:text-white truncate ${item.mono ? 'font-mono text-xs' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
