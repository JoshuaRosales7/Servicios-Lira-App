import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Ticket {
    id: string
    subject: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    last_message_at: string
    created_at: string
    client?: {
        full_name: string
        email?: string
    }
}

interface TicketListProps {
    tickets: Ticket[]
}

const statusMap: Record<string, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    open: { label: 'Abierto', color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20', variant: 'outline' },
    in_progress: { label: 'En Proceso', color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20', variant: 'outline' },
    resolved: { label: 'Resuelto', color: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20', variant: 'outline' },
    closed: { label: 'Cerrado', color: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20', variant: 'secondary' },
}

const priorityMap: Record<string, { label: string; icon: any; color: string }> = {
    low: { label: 'Baja', icon: null, color: 'text-slate-500' },
    normal: { label: 'Normal', icon: null, color: 'text-blue-500' },
    high: { label: 'Alta', icon: AlertCircle, color: 'text-orange-500' },
    urgent: { label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
}

export function TicketList({ tickets }: TicketListProps) {
    if (tickets.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                    <p>No tienes solicitudes activas en este momento.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4">
            {tickets.map((ticket) => {
                const status = statusMap[ticket.status] || statusMap.open
                const priority = priorityMap[ticket.priority] || priorityMap.normal
                const PriorityIcon = priority.icon

                return (
                    <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`}>
                        <Card className="hover:bg-muted/30 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary/50">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{ticket.subject}</h3>
                                        <Badge variant={status.variant} className={status.color}>
                                            {status.label}
                                        </Badge>
                                        {ticket.priority !== 'normal' && ticket.priority !== 'low' && (
                                            <Badge variant="outline" className={`text-xs h-5 px-1.5 gap-1 ${priority.color} border-current/20`}>
                                                {PriorityIcon && <PriorityIcon className="h-3 w-3" />}
                                                {priority.label}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground gap-3">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(ticket.last_message_at), { addSuffix: true, locale: es })}
                                        </span>
                                        <span className="hidden sm:inline-block">•</span>
                                        <span className="hidden sm:inline-block">ID: {ticket.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground/30" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )
            })}
        </div>
    )
}
