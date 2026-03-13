import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, FileText, Clock, Plus, Scale, ChevronRight, TrendingUp, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'client') {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (clientRecord) redirect(`/dashboard/clients/${clientRecord.id}`)

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 py-12">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Bienvenido, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tu cuenta está activa pero aún no tiene un expediente de cliente asociado.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 w-full max-w-sm">
          <Link href="/dashboard/tickets">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer text-center space-y-2">
              <FileText className="w-5 h-5 text-blue-600 mx-auto" />
              <h3 className="font-medium text-sm text-slate-900 dark:text-white">Crear Solicitud</h3>
            </div>
          </Link>
          <Link href="/dashboard/settings">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer text-center space-y-2">
              <Users className="w-5 h-5 text-emerald-600 mx-auto" />
              <h3 className="font-medium text-sm text-slate-900 dark:text-white">Configuración</h3>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  const [
    { count: totalClients },
    { count: totalDocuments },
    { count: activeTickets }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'closed')
  ])

  const { data: recentClients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { name: 'Clientes',  value: totalClients || 0,  icon: Users,    href: '/dashboard/clients',   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950' },
    { name: 'Documentos', value: totalDocuments || 0, icon: FileText, href: '/dashboard/documents', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { name: 'Casos',     value: totalClients || 0,   icon: Scale,    href: '/dashboard/legal',     color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-950' },
    { name: 'Tickets',   value: activeTickets || 0,   icon: Clock,    href: '/dashboard/tickets',   color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Panel de Control</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bienvenido, <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email?.split('@')[0]}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Clock className="h-4 w-4" />
          <span className="capitalize">{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="group">
            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</span>
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Clients */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Clientes Recientes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Últimos expedientes registrados</p>
              </div>
              <Link href="/dashboard/clients">
                <Button variant="ghost" size="sm" className="text-xs h-8">Ver todos</Button>
              </Link>
            </div>
            {recentClients && recentClients.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentClients.map((client) => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium text-sm">
                        {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{client.commercial_name || client.legal_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">NIT: {client.nit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-md font-medium",
                        client.fiscal_status === 'active'
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      )}>
                        {client.fiscal_status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">Sin datos recientes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No hay actividad reciente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Acciones Rápidas</h2>
            </div>
            <div className="p-3 space-y-1">
              <Link href="/dashboard/clients/new">
                <Button className="w-full justify-start h-9 text-xs rounded-lg" size="sm">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Cliente
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button className="w-full justify-start h-9 text-xs rounded-lg" variant="ghost" size="sm">
                  <FileText className="mr-2 h-3.5 w-3.5" /> Cargar Expediente
                </Button>
              </Link>
              <Link href="/dashboard/tickets">
                <Button className="w-full justify-start h-9 text-xs rounded-lg" variant="ghost" size="sm">
                  <Ticket className="mr-2 h-3.5 w-3.5" /> Ver Tickets
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/20">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resumen</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Vencimientos</span>
                  <span className="font-semibold text-slate-900 dark:text-white">08</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Revisiones</span>
                  <span className="font-semibold text-amber-600">02</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}