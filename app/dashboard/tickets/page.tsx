import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TicketList } from '@/components/tickets/ticket-list'
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog'
import { TicketIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function TicketsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    let query = supabase
        .from('tickets')
        .select(`*, client:profiles!client_id(full_name)`)
        .order('last_message_at', { ascending: false })

    if (!isAdmin) query = query.eq('client_id', user.id)

    const { data: tickets, error } = await query

    if (error) {
        console.error('Error fetching tickets:', error)
        return <div>Error al cargar las solicitudes</div>
    }

    const activeTickets = tickets?.filter(t => ['open', 'in_progress'].includes(t.status)) || []
    const closedTickets = tickets?.filter(t => ['resolved', 'closed'].includes(t.status)) || []

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <TicketIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Centro de Solicitudes</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona requerimientos y comunicación con el equipo.</p>
                    </div>
                </div>
                <CreateTicketDialog />
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Activas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeTickets.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Resueltas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{closedTickets.length}</p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Tabs defaultValue="active" className="w-full">
                    <div className="px-6 border-b border-slate-100 dark:border-slate-800">
                        <TabsList className="bg-transparent h-12 gap-6 p-0">
                            <TabsTrigger value="active"
                                className="h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 text-sm font-medium text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                                Activas
                                {activeTickets.length > 0 && (
                                    <span className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                        {activeTickets.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="closed"
                                className="h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 text-sm font-medium text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                                Historial
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="p-6">
                        <TabsContent value="active" className="mt-0"><TicketList tickets={activeTickets} /></TabsContent>
                        <TabsContent value="closed" className="mt-0"><TicketList tickets={closedTickets} /></TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
