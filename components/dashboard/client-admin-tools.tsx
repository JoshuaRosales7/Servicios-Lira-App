'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, KeyRound, Mail, RefreshCcw, UserMinus, CheckCircle2, AlertTriangle } from 'lucide-react'
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 pb-2 border-b border-amber-200/50">
                <div className="flex items-center gap-2 text-amber-700">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Herramientas de Administrador</h3>
                </div>
                <p className="text-sm text-muted-foreground">Gestión de credenciales y acceso al sistema.</p>
            </div>

            <div className="space-y-8 pt-2">
                {!userId ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 rounded-lg border border-dashed border-amber-500/20 bg-amber-500/5">
                        <KeyRound className="h-6 w-6 text-amber-500/50" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Sin Acceso al Sistema</p>
                            <p className="text-xs text-muted-foreground">Este cliente aún no tiene credenciales de acceso vinculadas.</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8" asChild>
                            <a href={`/dashboard/clients/${clientId}/edit`}>Configurar Acceso</a>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Credenciales de Registro</h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-3 rounded-md border bg-background space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Usuario (Email)</p>
                                    <p className="text-sm font-medium flex items-center gap-2 truncate">
                                        <Mail className="h-3 w-3 text-primary" />
                                        {clientEmail}
                                    </p>
                                </div>
                                <div className="p-3 rounded-md border bg-background space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Pass Provisional (Base NIT)</p>
                                    <p className="text-sm font-medium flex items-center gap-2 font-mono">
                                        <KeyRound className="h-3 w-3 text-primary" />
                                        {suggestedPassword}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Acciones de Control</h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-auto py-3 justify-start px-4",
                                        hasSentReset && "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                                    )}
                                    onClick={handleResetPassword}
                                    disabled={isLoading}
                                >
                                    <div className={cn(
                                        "mr-3 h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                                        hasSentReset ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                                    )}>
                                        {hasSentReset ? <CheckCircle2 className="h-4 w-4" /> : <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />}
                                    </div>
                                    <div className="text-left space-y-0.5">
                                        <p className="text-sm font-medium leading-none">Restablecer Contraseña</p>
                                        <p className="text-[10px] text-muted-foreground">Enviar enlace por correo</p>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto py-3 justify-start px-4 hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                                    onClick={handleRevokeAccess}
                                    disabled={isLoading}
                                >
                                    <div className="mr-3 h-8 w-8 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                        <UserMinus className="h-4 w-4" />
                                    </div>
                                    <div className="text-left space-y-0.5">
                                        <p className="text-sm font-medium leading-none">Revocar Acceso</p>
                                        <p className="text-[10px] text-muted-foreground">Desvincular usuario</p>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p>
                                <span className="font-semibold">Nota:</span> Si el cliente ya cambió su contraseña inicial, el campo "Pass Provisional" no reflejará la contraseña actual.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
