import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Scale, Landmark, TrendingUp, Clock, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatsCharts } from '@/components/dashboard/stats-charts'
import { startOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

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

    if (clientRecord) {
      redirect(`/dashboard/clients/${clientRecord.id}`)
    }

    // If client but no record, show simple view
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="pb-8 border-b">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bienvenido, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground mt-2">
            Tu cuenta está activa pero aún no tiene un expediente de cliente asociado.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/dashboard/tickets" className="group">
            <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
                {/* @ts-ignore */}
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Ver Mis Solicitudes</div>
                <p className="text-xs text-muted-foreground pt-1">Contacta a soporte</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    )
  }

  // --- ADMIN DATA FETCHING ---
  const [
    { count: clientsCount, data: clientsData },
    { count: documentsCount, data: documentsData },
    { count: bankingCount },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('clients').select('fiscal_status', { count: 'exact' }),
    supabase.from('documents').select('created_at', { count: 'exact' }).gte('created_at', subMonths(new Date(), 6).toISOString()),
    supabase.from('banking_data').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  // --- CHART 1: Client Status ---
  const activeClients = clientsData?.filter(c => c.fiscal_status === 'active').length || 0
  const suspendedClients = clientsData?.filter(c => c.fiscal_status === 'suspended').length || 0
  const inactiveClients = clientsData?.filter(c => c.fiscal_status === 'inactive').length || 0

  const clientStatusData = [
    { name: 'Activos', value: activeClients, color: '#10b981' }, // emerald-500
    { name: 'Suspendidos', value: suspendedClients, color: '#f59e0b' }, // amber-500
    { name: 'Inactivos', value: inactiveClients, color: '#ef4444' }, // red-500
  ]

  // --- CHART 2: Documents Volume (Last 6 Months) ---
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      date: d,
      name: format(d, 'MMMM', { locale: es }),
      key: format(d, 'yyyy-MM')
    }
  })

  // Group docs by month
  const docsByMonth: Record<string, number> = {}
  documentsData?.forEach(doc => {
    const monthKey = format(new Date(doc.created_at), 'yyyy-MM')
    docsByMonth[monthKey] = (docsByMonth[monthKey] || 0) + 1
  })

  const documentsChartData = last6Months.map(m => ({
    name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
    total: docsByMonth[m.key] || 0
  }))

  const stats = [
    {
      name: 'Total Clientes',
      value: clientsCount || 0,
      icon: Users,
      href: '/dashboard/clients',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Documentos',
      value: documentsCount || 0,
      icon: FileText,
      href: '/dashboard/documents',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      name: 'Casos Activos',
      value: clientsCount || 0, // Fallback logic or separate count
      icon: Scale,
      href: '/dashboard/legal',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      name: 'Cuentas Bancarias',
      value: bankingCount || 0,
      icon: Landmark,
      href: '/dashboard/banking',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
  ]

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="pb-8 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Panel de Control
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <p className="text-sm">
                Bienvenido, <span className="font-medium text-foreground">{user?.email?.split('@')[0]}</span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background shadow-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">
                {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Link key={stat.name} href={stat.href} className="group">
            <Card className="h-full border shadow-sm hover:shadow-md transition-shadow bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={cn("h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors")} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Registros activos
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <StatsCharts clientStatusData={clientStatusData} documentsData={documentsChartData} />


      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Clients Section */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">Clientes Recientes</CardTitle>
                <CardDescription>Últimos expedientes registrados</CardDescription>
              </div>
              <Link href="/dashboard/clients">
                <Button variant="outline" size="sm" className="h-8">
                  Ver Todos
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentClients && recentClients.length > 0 ? (
                <div className="divide-y">
                  {recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                          {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm leading-none">
                            {client.commercial_name || client.legal_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            NIT: {client.nit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          client.fiscal_status === 'active'
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}>
                          {client.fiscal_status === 'active' ? 'Activo' : 'Inactivo'}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-medium">Sin Datos Recientes</h3>
                  <p className="text-sm text-muted-foreground mt-1">No hay actividad reciente.</p>
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/dashboard/clients/new">
                <Button className="w-full justify-start h-10 px-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button className="w-full justify-start h-10 px-4" variant="ghost">
                  <FileText className="mr-2 h-4 w-4" />
                  Cargar Expediente
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border shadow-sm border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vencimientos</span>
                <span className="font-bold">08</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revisiones</span>
                <span className="font-bold text-amber-600">02</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

