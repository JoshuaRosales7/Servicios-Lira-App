'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldAlert, KeyRound, Mail, RefreshCcw, UserMinus, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'
import { sendPasswordReset, revokeClientAccess } from '@/app/actions/clients'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClientAdminToolsProps {
    clientId: string
    clientEmail: string
    clientNit: string
    userId: string | null
}

export function ClientAdminTools({ clientId, clientEmail, clientNit, userId }: ClientAdminToolsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [hasSentReset, setHasSentReset] = useState(false)

    const cleanNit = clientNit ? clientNit.replace(/[^a-zA-Z0-9]/g, '') : ''
    const suggestedPassword = `User${cleanNit}`

    const handleResetPassword = async () => {
        if (!clientEmail) {
            toast.error('El cliente no tiene un correo electrónico registrado.')
            return
        }

        setIsLoading(true)
        const result = await sendPasswordReset(clientEmail)
        setIsLoading(false)

        if (result.success) {
            setHasSentReset(true)
            toast.success('Enlace de recuperación enviado correctamente.')
        } else {
            toast.error('Error al enviar el enlace: ' + result.error)
        }
    }

    const handleRevokeAccess = async () => {
        if (!userId) return

        if (!confirm('¿Estás seguro de que deseas revocar el acceso? El cliente ya no podrá entrar a su panel.')) {
            return
        }

        setIsLoading(true)
        const result = await revokeClientAccess(clientId, userId)
        setIsLoading(false)

        if (result.success) {
            toast.success('Acceso revocado correctamente.')
            window.location.reload()
        } else {
            toast.error('Error al revocar acceso: ' + result.error)
        }
    }

    const handleCreateAccess = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!clientEmail) {
            toast.error('El cliente debe tener un correo electrónico para crear acceso.')
            return
        }

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string

        if (!password || password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setIsLoading(true)
        const { createAccessForExistingClient } = await import('@/app/actions/clients')
        const result = await createAccessForExistingClient(clientId, clientEmail, password)
        setIsLoading(false)

        if (result.success) {
            toast.success('Acceso creado correctamente.')
            window.location.reload()
        } else {
            toast.error('Error al crear acceso: ' + result.error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="text-lg font-semibold text-foreground">Configuración de Acceso</h3>
                </div>
                <p className="text-sm text-muted-foreground">Gestiona la vinculación del cliente con el portal de autoservicio.</p>
            </div>

            <div className="pt-2">
                {!userId ? (
                    <div className="space-y-6">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <KeyRound className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="max-w-xs space-y-1">
                                <h4 className="text-sm font-bold text-foreground">Sin Acceso al Portal</h4>
                                <p className="text-xs text-muted-foreground">Este cliente no tiene una cuenta de usuario vinculada. Configúrala ahora para que pueda ver sus documentos.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateAccess} className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Correo de acceso</label>
                                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border text-sm font-medium">
                                        <Mail className="h-4 w-4 text-primary" />
                                        {clientEmail || <span className="text-destructive italic">Falta correo electrónico</span>}
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contraseña temporal</label>
                                    <input 
                                        name="password"
                                        type="text"
                                        defaultValue={suggestedPassword}
                                        className="w-full h-10 px-3 bg-background rounded-lg border border-border text-sm font-mono focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Min 6 caracteres"
                                        required
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full font-bold h-10 shadow-lg shadow-primary/20" 
                                disabled={isLoading || !clientEmail}
                            >
                                {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Habilitar Acceso al Sistema
                            </Button>
                            
                            {!clientEmail && (
                                <p className="text-[10px] text-center text-destructive font-semibold">
                                    Debes agregar un correo al perfil del cliente para habilitar esta opción.
                                </p>
                            )}
                        </form>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="bg-card p-5 rounded-2xl border border-border space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado de Cuenta</span>
                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight">
                                        <CheckCircle2 className="h-3 w-3" />
                                        ACTIVO
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Usuario vinculado</p>
                                    <p className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-primary" />
                                        {clientEmail}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-card p-5 rounded-2xl border border-border space-y-3 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contraseña sugerida</span>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Base NIT (Provisional)</p>
                                    <p className="text-sm font-bold text-foreground font-mono flex items-center gap-2">
                                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                                        {suggestedPassword}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Acciones Administrativas</h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-auto py-4 justify-start px-5 rounded-2xl border-border hover:bg-muted/50 transition-all",
                                        hasSentReset && "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                                    )}
                                    onClick={handleResetPassword}
                                    disabled={isLoading}
                                >
                                    <div className={cn(
                                        "mr-4 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        hasSentReset ? "bg-emerald-500 text-white" : "bg-primary/5 text-primary"
                                    )}>
                                        {hasSentReset ? <CheckCircle2 className="h-4 w-4" /> : <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold leading-tight text-foreground">Cambio de Clave</p>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Enviar email de recuperación</p>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto py-4 justify-start px-5 rounded-2xl border-border hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive transition-all"
                                    onClick={handleRevokeAccess}
                                    disabled={isLoading}
                                >
                                    <div className="mr-4 h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 shadow-sm">
                                        <UserMinus className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold leading-tight">Revocar Acceso</p>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Desactivar portal de cliente</p>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-amber-800/80 font-medium">
                                <span className="font-bold text-amber-900">Importante:</span> Solo revoca el acceso si el cliente ya no requiere entrar al sistema. Para cambios de correo, se debe primero revocar y luego re-configurar.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
