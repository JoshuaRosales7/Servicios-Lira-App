import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, FileText, Clock, Plus, ChevronRight, TrendingUp, Ticket, UploadCloud } from 'lucide-react'
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
      .maybeSingle()

    if (clientRecord) redirect(`/dashboard/clients/${clientRecord.id}`)

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 py-12">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Bienvenido, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu cuenta está activa pero aún no tiene un expediente de cliente asociado.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 w-full max-w-sm">
          <Link href="/dashboard/tickets">
            <div className="bg-card rounded-xl border border-border p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer text-center space-y-2">
              <FileText className="w-5 h-5 text-blue-600 mx-auto" />
              <h3 className="font-medium text-sm text-foreground">Crear Solicitud</h3>
            </div>
          </Link>
          <Link href="/dashboard/settings">
            <div className="bg-card rounded-xl border border-border p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer text-center space-y-2">
              <Users className="w-5 h-5 text-emerald-600 mx-auto" />
              <h3 className="font-medium text-sm text-foreground">Configuración</h3>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  const [
    { count: totalClients },
    { count: totalDocuments },
    { count: activeTickets },
    { count: urgentTickets },
    { count: inProgressTickets },
    { data: recentDocs }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'resolved').neq('status', 'closed'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).in('priority', ['high', 'urgent']).neq('status', 'resolved').neq('status', 'closed'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('documents').select('*, clients(commercial_name, legal_name)').eq('is_folder', false).order('created_at', { ascending: false }).limit(5)
  ])

  const { data: recentClients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { name: 'Clientes',  value: totalClients || 0,  icon: Users,    href: '/dashboard/clients',   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950' },
    { name: 'Documentos', value: totalDocuments || 0, icon: FileText, href: '/dashboard/documents', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { name: 'Solicitudes', value: activeTickets || 0,   icon: Clock,    href: '/dashboard/tickets',   color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  const urgentPercent = activeTickets ? Math.round(((urgentTickets || 0) / activeTickets) * 100) : 0
  const reviewPercent = activeTickets ? Math.round(((inProgressTickets || 0) / activeTickets) * 100) : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Panel de Control</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bienvenido, <span className="font-medium text-muted-foreground">{user?.email?.split('@')[0]}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="capitalize">{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="group">
            <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl transition-colors", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.name}</p>
              </div>
              <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <stat.icon className="w-20 h-20" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Clients */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h2 className="text-sm font-bold text-foreground">Clientes Recientes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos expedientes registrados</p>
              </div>
              <Link href="/dashboard/clients">
                <Button variant="ghost" size="sm" className="text-xs h-8 hover:bg-muted font-medium">Ver todos</Button>
              </Link>
            </div>
            {recentClients && recentClients.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentClients.map((client) => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm shadow-sm">
                        {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{client.commercial_name || client.legal_name}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">NIT: {client.nit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider",
                        client.fiscal_status === 'active'
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}>
                        {client.fiscal_status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="p-1 rounded-full group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-semibold text-foreground">Sin datos recientes</p>
                <p className="text-xs text-muted-foreground mt-1">No hay actividad reciente en la plataforma.</p>
              </div>
            )}
          </div>

          {/* Recent Documents Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h2 className="text-sm font-bold text-foreground">Cargas Recientes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Documentos procesados últimamente</p>
              </div>
              <Link href="/dashboard/documents">
                <Button variant="ghost" size="sm" className="text-xs h-8 hover:bg-muted font-medium">Explorar</Button>
              </Link>
            </div>
            <div className="divide-y divide-border/50">
              {recentDocs && recentDocs.length > 0 ? (
                recentDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-primary/70 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.clients?.commercial_name || doc.clients?.legal_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{doc.document_type}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/10 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">No hay documentos cargados aún</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <h2 className="text-sm font-bold text-foreground">Acciones Rápidas</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link href="/dashboard/clients/new">
                <Button className="w-full justify-start h-10 text-xs rounded-xl font-semibold gap-3 group/btn" size="sm">
                  <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  Nuevo Cliente
                </Button>
              </Link>
              <Link href="/dashboard/import">
                <Button className="w-full justify-start h-10 text-xs rounded-xl font-semibold gap-3 bg-muted hover:bg-muted/80 text-foreground border-border group/btn" variant="ghost" size="sm">
                   <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                    <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  Importación Masiva
                </Button>
              </Link>
              <Link href="/dashboard/tickets">
                <Button className="w-full justify-start h-10 text-xs rounded-xl font-semibold gap-3 bg-muted hover:bg-muted/80 text-foreground border-border group/btn" variant="ghost" size="sm">
                   <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                    <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  Gestión de Tickets
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-muted/30">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Indicadores Activos</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-muted-foreground">Vencimientos</span>
                  <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-md">{(urgentTickets || 0).toString().padStart(2, '0')}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ width: `${urgentPercent}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">Prioridad alta o urgente</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-muted-foreground">Revisiones</span>
                  <span className="text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded-md">{(inProgressTickets || 0).toString().padStart(2, '0')}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(245,158,11,0.3)]" style={{ width: `${reviewPercent}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">En proceso de revisión</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
