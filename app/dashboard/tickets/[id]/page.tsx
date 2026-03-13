import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TicketChat } from '@/components/tickets/ticket-chat'
import { TicketActions } from '@/components/tickets/ticket-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PageProps {
    params: Promise<{ id: string }>
}

const statusMap: Record<string, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    open: { label: 'Abierto', color: 'bg-green-500/10 text-green-500', variant: 'outline' },
    in_progress: { label: 'En Proceso', color: 'bg-blue-500/10 text-blue-500', variant: 'outline' },
    resolved: { label: 'Resuelto', color: 'bg-indigo-500/10 text-indigo-500', variant: 'outline' },
    closed: { label: 'Cerrado', color: 'bg-slate-500/10 text-slate-500', variant: 'secondary' },
}

const priorityMap: Record<string, { label: string; icon: any; color: string }> = {
    low: { label: 'Baja', icon: null, color: 'text-slate-500' },
    normal: { label: 'Normal', icon: null, color: 'text-blue-500' },
    high: { label: 'Alta', icon: AlertCircle, color: 'text-orange-500' },
    urgent: { label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
}

export default async function TicketDetailPage(props: PageProps) {
    const params = await props.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Fetch ticket details
    const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
            *,
            client:profiles!client_id(full_name)
        `)
        .eq('id', params.id)
        .single()

    if (error || !ticket) {
        notFound()
    }

    // Check permissions (Client owns it or Admin)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin && ticket.client_id !== user.id) {
        redirect('/dashboard/tickets')
    }

    // Fetch messages
    const { data: messages } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true })

    const status = statusMap[ticket.status]
    const priority = priorityMap[ticket.priority]

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 bg-background z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/tickets">
                            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            {ticket.subject}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground pl-8">
                        <Badge variant={status.variant} className={status.color}>{status.label}</Badge>
                        <span className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
                        </span>
                        {isAdmin && (
                            <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                                Cliente: {ticket.client?.full_name || 'Usuario'}
                            </span>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <TicketActions
                            ticketId={ticket.id}
                            currentStatus={ticket.status}
                            currentPriority={ticket.priority}
                        />
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 min-h-0">
                <TicketChat
                    ticketId={ticket.id}
                    initialMessages={messages || []}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    )
}
