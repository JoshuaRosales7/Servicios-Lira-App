'use client'

import React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    FileText,
    User,
    CreditCard,
    Scale,
    Landmark,
    StickyNote,
    Plus,
    Trash,
    Edit,
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    FileBox,
    FolderOpen,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Log {
    id: string
    created_at: string
    action: string
    resource_type: string
    details: any
    profiles?: {
        full_name: string
        role: string
    }
}

interface ClientTimelineProps {
    logs: Log[]
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    // Client
    'CREATE_CLIENT': { icon: User, color: 'text-blue-500 bg-blue-500/10', label: 'Cliente Creado' },
    'UPDATE_CLIENT': { icon: User, color: 'text-blue-500 bg-blue-500/10', label: 'Perfil Actualizado' },

    // Documents
    'UPLOAD_DOCUMENT': { icon: UploadCloud, color: 'text-emerald-500 bg-emerald-500/10', label: 'Documento Subido' },
    'DELETE_DOCUMENT': { icon: Trash, color: 'text-red-500 bg-red-500/10', label: 'Documento Eliminado' },
    'RENAME_DOCUMENT': { icon: FileText, color: 'text-orange-500 bg-orange-500/10', label: 'Documento Renombrado' },
    'MOVE_DOCUMENT': { icon: FolderOpen, color: 'text-indigo-500 bg-indigo-500/10', label: 'Documento Movido' },

    // Notes
    'CREATE_NOTE': { icon: StickyNote, color: 'text-amber-500 bg-amber-500/10', label: 'Nota Agregada' },
    'UPDATE_NOTE': { icon: StickyNote, color: 'text-amber-500 bg-amber-500/10', label: 'Nota Editada' },

    // Fiscal
    'UPDATE_FISCAL_DATA': { icon: CreditCard, color: 'text-purple-500 bg-purple-500/10', label: 'Datos Fiscales' },
    'CREATE_FISCAL_DATA': { icon: CreditCard, color: 'text-purple-500 bg-purple-500/10', label: 'Fiscal Inicializado' },

    // Legal
    'UPDATE_LEGAL_DATA': { icon: Scale, color: 'text-slate-500 bg-slate-500/10', label: 'Datos Legales' },

    // Banking
    'ADD_BANK_ACCOUNT': { icon: Landmark, color: 'text-green-600 bg-green-600/10', label: 'Cuenta Bancaria' },

    // Default
    'DEFAULT': { icon: CheckCircle2, color: 'text-gray-500 bg-gray-500/10', label: 'Acción Registrada' }
}

export function ClientTimeline({ logs }: ClientTimelineProps) {
    const [showAll, setShowAll] = React.useState(false)

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-muted/20 border-dashed">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileBox className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-muted-foreground">Sin Historial</h3>
                <p className="text-xs text-muted-foreground/70 mt-1">No hay actividad reciente registrada.</p>
            </div>
        )
    }

    const displayedLogs = showAll ? logs : logs.slice(0, 5)

    // Group logs by date
    const groupedLogs = displayedLogs.reduce((groups, log) => {
        const date = new Date(log.created_at).toLocaleDateString('es-GT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(log)
        return groups
    }, {} as Record<string, Log[]>)

    return (
        <div className="relative space-y-8 pl-4 py-2">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/60" />

            {Object.entries(groupedLogs).map(([date, dayLogs], groupIndex) => (
                <div key={date} className="relative animate-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                    {/* Date Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-2.5 w-2.5 rounded-full bg-border ring-4 ring-background z-10 ml-0.5" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 bg-background px-2 py-0.5 rounded-md border border-border/50 shadow-sm">
                            {date}
                        </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-6 pl-8">
                        {dayLogs.map((log, i) => {
                            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG['DEFAULT']
                            const Icon = config.icon
                            const actorName = log.profiles?.full_name || 'Sistema'
                            const time = format(new Date(log.created_at), 'h:mm a')

                            // Parse details to something readable if possible
                            let detailsText = ''
                            if (log.resource_type === 'document' && log.details?.file_name) {
                                detailsText = log.details.file_name
                            } else if (log.action === 'CREATE_NOTE' && log.details?.content) {
                                detailsText = log.details.content.substring(0, 50) + (log.details.content.length > 50 ? '...' : '')
                            }

                            const hasChanges = log.details?.previous && log.details?.new
                            const changes = hasChanges ? Object.keys(log.details.new).filter(key => log.details.new[key] !== log.details.previous[key]) : []

                            return (
                                <div key={log.id} className="relative group">
                                    {/* Connector Line to Item */}
                                    <div className="absolute -left-[27px] top-3.5 h-px w-5 bg-border/60" />

                                    <div className="flex flex-col gap-3 bg-card border rounded-lg p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                            <div className={cn("h-9 w-9 mt-0.5 rounded-md flex items-center justify-center shrink-0", config.color)}>
                                                <Icon className="h-4.5 w-4.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold truncate">{config.label}</p>
                                                        {log.details?.ip_address && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                                                IP: {log.details.ip_address}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-sm">
                                                        {time}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:gap-1.5">
                                                    <span>Por <span className="font-medium text-foreground">{actorName}</span></span>
                                                    {detailsText && (
                                                        <>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="truncate italic max-w-[200px]">{detailsText}</span>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Audit Details (if any) */}
                                                {changes.length > 0 && (
                                                    <div className="mt-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden text-xs">
                                                        <div className="grid grid-cols-3 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 font-medium text-slate-500 dark:text-slate-400">
                                                            <div>Campo</div>
                                                            <div>Anterior</div>
                                                            <div>Nuevo</div>
                                                        </div>
                                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {changes.map(key => (
                                                                <div key={key} className="grid grid-cols-3 px-3 py-2">
                                                                    <div className="font-mono text-slate-600 dark:text-slate-400">{key}</div>
                                                                    <div className="text-red-600 dark:text-red-400 line-through truncate mr-2" title={String(log.details.previous[key])}>
                                                                        {log.details.previous[key] || '-'}
                                                                    </div>
                                                                    <div className="text-emerald-600 dark:text-emerald-400 font-medium truncate" title={String(log.details.new[key])}>
                                                                        {log.details.new[key] || '-'}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}

            {logs.length > 5 && (
                <div className="flex justify-center pt-4 relative z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="mr-2 h-3 w-3" />
                                Ver menos actividad
                            </>
                        ) : (
                            <>
                                <ChevronDown className="mr-2 h-3 w-3" />
                                Ver {logs.length - 5} eventos más
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
