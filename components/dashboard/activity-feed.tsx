'use client'

import React from 'react'
import { ActivityLog } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Monitor, FileText, Users, DollarSign, Scale, FileSpreadsheet, StickyNote, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ActivityFeedProps {
    logs: ActivityLog[]
}

export function ActivityFeed({ logs }: ActivityFeedProps) {

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE_CLIENT': return 'Cliente Creado'
            case 'REVOKE_ACCESS': return 'Acceso Revocado'
            case 'RESET_PASSWORD_REQUEST': return 'Solicitud Reset Pass'
            case 'UPDATE_FISCAL_DATA': return 'Datos Fiscales Editados'
            case 'CREATE_FISCAL_DATA': return 'Datos Fiscales Creados'
            case 'UPDATE_LEGAL_DATA': return 'Datos Legales Editados'
            case 'CREATE_LEGAL_DATA': return 'Datos Legales Creados'
            case 'UPDATE_ACCOUNTING_DATA': return 'Contabilidad Editada'
            case 'CREATE_ACCOUNTING_DATA': return 'Contabilidad Creada'
            case 'ADD_BANK_ACCOUNT': return 'Cuenta Bancaria Agregada'
            case 'UPDATE_BANK_ACCOUNT': return 'Cuenta Bancaria Editada'
            case 'DELETE_BANK_ACCOUNT': return 'Cuenta Bancaria Eliminada'
            case 'CREATE_NOTE': return 'Nota Creada'
            case 'UPDATE_NOTE': return 'Nota Editada'
            case 'DELETE_NOTE': return 'Nota Eliminada'
            case 'UPLOAD_DOCUMENT': return 'Documento Subido'
            case 'DELETE_DOCUMENT': return 'Documento Eliminado'
            case 'RENAME_DOCUMENT': return 'Documento Renombrado'
            case 'CREATE_FOLDER': return 'Carpeta Creada'
            case 'MOVE_DOCUMENT': return 'Documento Movido'
            default: return action.replace(/_/g, ' ')
        }
    }

    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('REVOKE')) return 'text-red-500 bg-red-500/10'
        if (action.includes('CREATE') || action.includes('ADD') || action.includes('UPLOAD')) return 'text-emerald-500 bg-emerald-500/10'
        if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('RENAME')) return 'text-amber-500 bg-amber-500/10'
        return 'text-blue-500 bg-blue-500/10'
    }

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'client': return <Users className="h-4 w-4" />
            case 'document': return <FileText className="h-4 w-4" />
            case 'fiscal_data': return <DollarSign className="h-4 w-4" />
            case 'legal_data': return <Scale className="h-4 w-4" />
            case 'accounting_data': return <FileSpreadsheet className="h-4 w-4" />
            case 'banking_data': return <DollarSign className="h-4 w-4" />
            case 'note': return <StickyNote className="h-4 w-4" />
            default: return <Monitor className="h-4 w-4" />
        }
    }

    const formatDetails = (detailsRaw: any) => {
        if (!detailsRaw) return '-'

        let details = detailsRaw
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details)
            } catch (e) {
                // If parse fails, just use the string
            }
        }

        if (typeof details === 'string') {
            if (details.startsWith('{')) {
                try { details = JSON.parse(details) } catch (e) { }
            } else {
                return details.slice(0, 50) + (details.length > 50 ? '...' : '')
            }
        }

        const parts = []
        if (details.name) parts.push(`${details.name}`)
        if (details.title) parts.push(`"${details.title}"`)
        if (details.bank) parts.push(details.bank)
        if (details.commercial_name) parts.push(details.commercial_name)
        if (details.client_id && !parts.length) parts.push(`ID Cliente: ${details.client_id.slice(0, 8)}`)

        return parts.length ? parts.join(', ') : JSON.stringify(details).slice(0, 50) + (JSON.stringify(details).length > 50 ? '...' : '')
    }

    const [selectedLog, setSelectedLog] = React.useState<ActivityLog | null>(null)

    return (
        <div className="rounded-md border shadow-sm bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Actor</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead className="text-right">Fecha</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No hay registrada actividad reciente.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "font-medium",
                                            log.profiles?.role === 'admin' ? "text-amber-600 dark:text-amber-400" : ""
                                        )}>
                                            {log.profiles?.full_name || 'Desconocido'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{log.profiles?.role || 'Sistema'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("border-0", getActionColor(log.action))}>
                                        {getActionLabel(log.action)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {getResourceIcon(log.resource_type)}
                                        <span className="text-xs capitalize">{log.resource_type.replace('_', ' ')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                    {formatDetails(log.details)}
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Actividad</DialogTitle>
                        <DialogDescription>
                            {selectedLog && new Date(selectedLog.created_at).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Actor</span>
                                    <p className="font-medium">{selectedLog.profiles?.full_name || 'Desconocido'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Acción</span>
                                    <div className="flex mt-1">
                                        <Badge variant="outline" className={cn("border-0", getActionColor(selectedLog.action))}>
                                            {getActionLabel(selectedLog.action)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Recurso</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {getResourceIcon(selectedLog.resource_type)}
                                    <span className="capitalize">{selectedLog.resource_type.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Detalles Completos</span>
                                <div className="mt-2 rounded-md bg-muted p-4 overflow-auto max-h-[300px]">
                                    <pre className="text-xs font-mono whitespace-pre-wrap">
                                        {(() => {
                                            try {
                                                const d = typeof selectedLog.details === 'string'
                                                    ? JSON.parse(selectedLog.details)
                                                    : selectedLog.details
                                                return JSON.stringify(d, null, 2)
                                            } catch (e) {
                                                return String(selectedLog.details)
                                            }
                                        })()}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
