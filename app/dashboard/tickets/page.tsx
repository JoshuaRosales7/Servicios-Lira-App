import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TicketList } from '@/components/tickets/ticket-list'
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog'
import { MessageSquarePlus } from 'lucide-react'
import { TicketFilters } from '@/components/tickets/ticket-filters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function TicketsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    // Fetch tickets
    // If admin, fetch all (or maybe just open ones by default? let's fetch all for now and filter in UI or query)
    // For now simple query

    let query = supabase
        .from('tickets')
        .select(`
            *,
            client:profiles!client_id(full_name)
        `)
        .order('last_message_at', { ascending: false })

    if (!isAdmin) {
        query = query.eq('client_id', user.id)
    }

    const { data: tickets, error } = await query

    if (error) {
        console.error('Error fetching tickets:', error)
        return <div>Error al cargar las solicitudes</div>
    }

    const activeTickets = tickets?.filter(t => ['open', 'in_progress'].includes(t.status)) || []
    const closedTickets = tickets?.filter(t => ['resolved', 'closed'].includes(t.status)) || []

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Centro de Solicitudes
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Gestiona tus requerimientos y comunícate directamente con nuestro equipo.
                    </p>
                </div>
                <CreateTicketDialog />
            </div>

            {/* Content */}
            <Tabs defaultValue="active" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="active" className="relative">
                            Activas
                            {activeTickets.length > 0 && (
                                <span className="ml-2 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {activeTickets.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="closed">Historial</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="active" className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Solicitudes en Curso</h2>
                    <TicketList tickets={activeTickets} />
                </TabsContent>

                <TabsContent value="closed" className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Solicitudes Finalizadas</h2>
                    <TicketList tickets={closedTickets} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
