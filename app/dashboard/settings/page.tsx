'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  User, Settings, ShieldCheck, Bell, Palette, 
  Save, Loader2, LogOut, Key, Globe, HelpCircle, 
  Shield, Laptop, Sun, Moon, CheckCircle2, Smartphone
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [formData, setFormData] = useState({ 
    full_name: '', 
    email: '',
    phone: '',
    role: ''
  })

  const [notifications, setNotifications] = useState({
    email_reports: true,
    email_alerts: true,
    push_documents: true,
  })

  // Security states
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // MFA states
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [isEnrollingMFA, setIsEnrollingMFA] = useState(false)
  const [mfaData, setMfaData] = useState<{ id: string, qr_code: string, secret: string } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isVerifyingMFA, setIsVerifyingMFA] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setFormData({ 
          full_name: profile?.full_name || user.user_metadata?.full_name || '', 
          email: user.email || '',
          phone: profile?.phone || '',
          role: profile?.role || 'client'
        })
        
        // Load notifications from metadata if any
        if (user.user_metadata?.notifications) {
          setNotifications(user.user_metadata.notifications)
        }

        // Fetch MFA factors
        const { data: factors } = await supabase.auth.mfa.listFactors()
        setMfaFactors(factors?.all || [])
      }
      setIsPageLoading(false)
    }
    loadData()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Update Auth metadata
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      })

      // Update Database profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.warn('Database profile update failed, but auth metadata updated:', updateError)
      }
      
      toast.success('Perfil actualizado correctamente')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsChangingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      toast.success('Contraseña actualizada con éxito')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleMFAEnroll = async () => {
    setIsEnrollingMFA(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error

      setMfaData({
        id: data.id,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.totp.uri)}`,
        secret: data.totp.secret
      })
    } catch (err: any) {
      toast.error('Error al iniciar 2FA: ' + err.message)
    } finally {
      setIsEnrollingMFA(false)
    }
  }

  const handleMFAVerify = async () => {
    if (!mfaData || !mfaCode) return
    setIsVerifyingMFA(true)
    try {
      const supabase = createClient()
      
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaData.id
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaData.id,
        challengeId: challengeData.id,
        code: mfaCode
      })
      if (verifyError) throw verifyError

      toast.success('2FA activado correctamente')
      setMfaData(null)
      setMfaCode('')
      
      // Refresh factors after verification
      const { data: factors } = await supabase.auth.mfa.listFactors()
      setMfaFactors(factors?.all || [])
    } catch (err: any) {
      toast.error('Código inválido: ' + err.message)
    } finally {
      setIsVerifyingMFA(false)
    }
  }

  const handleNotificationChange = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { notifications: updated }
    })
    
    if (!error) {
      toast.success('Preferencia guardada', { duration: 1000 })
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      // In a real app, this would call an API to delete data
      // For now, we sign out and show a message
      toast.info('Solicitud de eliminación enviada a administración')
      await handleSignOut()
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (isPageLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Configuración</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Administra tu cuenta y preferencias.</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-auto p-0 mb-6 space-x-6">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 font-medium transition-none">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 font-medium transition-none">
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 font-medium transition-none">
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-1 pb-4 font-medium transition-none">
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-0 space-y-6">
          <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Información Personal</CardTitle>
              <CardDescription>Configura tus datos de contacto.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16 border border-slate-200 dark:border-slate-800">
                    <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 uppercase">
                      {formData.full_name?.[0] || user?.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{formData.full_name || 'Sin nombre'}</p>
                    <p className="text-sm text-slate-500 capitalize">{formData.role}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input 
                      id="full_name" 
                      value={formData.full_name} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                      className="rounded-lg h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" value={formData.email} disabled className="bg-slate-50 dark:bg-slate-900 rounded-lg h-10 opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      placeholder="+502 " 
                      className="rounded-lg h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol de Usuario</Label>
                    <div className="h-10 px-3 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm capitalize">
                      {formData.role}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="rounded-lg h-10 px-6">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-0 space-y-6">
          <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tema del Sistema</CardTitle>
              <CardDescription>Personaliza visualmente el panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Claro', icon: Sun },
                  { id: 'dark', label: 'Oscuro', icon: Moon },
                  { id: 'system', label: 'Sistema', icon: Laptop },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
                      theme === item.id 
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" 
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-6 w-6", theme === item.id ? "text-blue-600" : "text-slate-400")} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-0">
          <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Preferencias de Alerta</CardTitle>
              <CardDescription>Controla qué avisos quieres recibir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Reportes Semanales</p>
                  <p className="text-xs text-slate-500">Recibe un resumen de actividad por email.</p>
                </div>
                <Switch 
                  checked={notifications.email_reports} 
                  onCheckedChange={(v) => handleNotificationChange('email_reports', v)} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Alertas Fiscales</p>
                  <p className="text-xs text-slate-500">Notificaciones críticas sobre vencimientos.</p>
                </div>
                <Switch 
                  checked={notifications.email_alerts} 
                  onCheckedChange={(v) => handleNotificationChange('email_alerts', v)} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Carga de Documentos</p>
                  <p className="text-xs text-slate-500">Aviso cuando se suben nuevos archivos.</p>
                </div>
                <Switch 
                  checked={notifications.push_documents} 
                  onCheckedChange={(v) => handleNotificationChange('push_documents', v)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-0">
          <div className="grid gap-6">
            <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Seguridad de Acceso</CardTitle>
                <CardDescription>Cambia tu contraseña y protege tu cuenta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Key className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Contraseña</p>
                      <p className="text-xs text-slate-500">Cambia tu clave periódicamente.</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-lg h-9">Cambiar</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Cambiar Contraseña</DialogTitle>
                        <DialogDescription>
                          Establece una nueva clave de acceso para tu cuenta.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Nueva Contraseña</Label>
                          <Input 
                            id="new-password" 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Al menos 6 caracteres"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                          <Input 
                            id="confirm-password" 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword || !newPassword}
                        >
                          {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Actualizar Contraseña
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Smartphone className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Autenticación 2FA</p>
                      <p className="text-xs text-slate-500">Capa extra de seguridad.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {mfaFactors.some(f => f.status === 'verified') ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        ACTIVO
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
                        INACTIVO
                      </span>
                    )}
                    <Dialog onOpenChange={(open) => { if(!open) setMfaData(null) }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-lg h-9">
                          {mfaFactors.some(f => f.status === 'verified') ? 'Gestionar' : 'Configurar'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {mfaFactors.some(f => f.status === 'verified') ? 'Seguridad 2FA Activa' : 'Configurar 2FA (TOTP)'}
                          </DialogTitle>
                          <DialogDescription>
                            {mfaFactors.some(f => f.status === 'verified') 
                              ? 'Tu cuenta está protegida por un segundo factor de autenticación.' 
                              : 'Usa una aplicación como Google Authenticator o Authy.'}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {mfaFactors.some(f => f.status === 'verified') ? (
                          <div className="py-6 flex flex-col items-center gap-4 text-center">
                            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <p className="text-sm text-slate-500">
                              Ya tienes configurada la autenticación en dos pasos mediante aplicación móvil.
                            </p>
                            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => toast.info('Para desactivar 2FA contacta al administrador.')}>
                              Solicitar Desactivación
                            </Button>
                          </div>
                        ) : !mfaData ? (
                          <div className="py-6 flex flex-col items-center gap-4">
                            <Shield className="h-12 w-12 text-blue-600 opacity-20" />
                            <p className="text-sm text-center text-slate-500">
                              La autenticación en dos pasos añade una capa adicional de seguridad a tu cuenta.
                            </p>
                            <Button onClick={handleMFAEnroll} disabled={isEnrollingMFA} className="w-full">
                              {isEnrollingMFA && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Comenzar Configuración
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6 pt-4">
                            <div className="flex flex-col items-center gap-4">
                              <div className="p-2 bg-white rounded-lg border">
                                <img src={mfaData.qr_code} alt="QR Code" className="w-40 h-40" />
                              </div>
                              <div className="text-center space-y-1">
                                <p className="text-[10px] font-mono text-slate-500 uppercase">Clave Secreta</p>
                                <p className="text-xs font-mono font-bold break-all bg-slate-50 p-2 rounded border">
                                  {mfaData.secret}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="mfa-code">Introduce el código de 6 dígitos</Label>
                              <Input 
                                id="mfa-code" 
                                placeholder="000000" 
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                className="text-center text-xl tracking-[0.5em] font-bold"
                                maxLength={6}
                              />
                            </div>

                            <Button 
                              className="w-full" 
                              onClick={handleMFAVerify} 
                              disabled={isVerifyingMFA || mfaCode.length < 6}
                            >
                              {isVerifyingMFA && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Verificar y Activar
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-red-200 dark:border-red-900 border-dashed bg-red-50/20 dark:bg-red-950/20 shadow-none">
              <CardHeader>
                <CardTitle className="text-base text-red-600 dark:text-red-400">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4">La eliminación de la cuenta es permanente y no se puede deshacer.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-lg h-9 font-medium">
                      Eliminar Cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta y tus datos asociados de nuestros servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                        Sí, eliminar cuenta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
