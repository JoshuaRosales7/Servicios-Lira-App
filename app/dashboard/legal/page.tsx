import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Building2, User, Landmark, ShieldAlert, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LegalSearch } from '@/components/dashboard/legal-search'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/dashboard/export-button'

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; expiring?: string }>
}) {
  const params = await searchParams
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
  }

  const search = params.search || ''
  const typeFilter = params.type || 'all'
  const expiringFilter = params.expiring === 'true'

  let query = supabase
    .from('clients')
    .select(`
      *,
      legal_data (*)
    `)
    .order('legal_name')

  if (search) {
    query = query.or(`legal_name.ilike.%${search}%,commercial_name.ilike.%${search}%,nit.ilike.%${search}%`)
  }

  if (typeFilter !== 'all') {
    query = query.eq('person_type', typeFilter)
  }

  const { data: clients } = await query.limit(100)

  let displayingClients = clients || []

  // Post-process filtering for expiring docs
  if (expiringFilter) {
    displayingClients = displayingClients.filter(c => {
      if (!c.legal_data?.documents_expiry) return false;
      const expiry = new Date(c.legal_data.documents_expiry);
      const today = new Date();
      // Filter for expiring within 90 days
      return expiry <= new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    })
  }

  const companies = clients?.filter((c) => c.person_type === 'juridica') || []
  const individuals = clients?.filter((c) => c.person_type === 'individual') || []
  const withLegalData = clients?.filter((c) => c.legal_data) || []

  // Ensure stats reflect "filtered view"? No, stats usually stay global or broad search context
  // Let's keep these stats as they describe the result set of the "search" query, ignoring the post-process 'expiring' filter for broader context,
  // OR we can make them dynamic. Dynamic is better.

  const expiringCount = withLegalData.filter(c => {
    if (!c.legal_data?.documents_expiry) return false;
    const expiry = new Date(c.legal_data.documents_expiry);
    const today = new Date();
    return expiry <= new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  }).length

  // Prepare Export Data (based on whatever is displayed)
  const exportData = displayingClients.map(c => ({
    NombreLegal: c.legal_name,
    Tipo: c.person_type,
    Representante: c.legal_data?.legal_representative || 'No Asignado',
    Cargo: c.legal_data?.position || '-',
    VencimientoDocumentos: c.legal_data?.documents_expiry || 'N/D'
  }))

  // Stats definition
  const stats = [
    {
      name: 'Empresas',
      value: companies.length,
      icon: Building2,
      description: 'Personas Jurídicas',
    },
    {
      name: 'Individuos',
      value: individuals.length,
      icon: User,
      description: 'Personas Individuales',
    },
    {
      name: 'Con Expediente',
      value: withLegalData.length,
      icon: Landmark,
      description: 'Documentación Legal',
    },
    {
      name: 'Vencimientos',
      value: expiringCount,
      icon: ShieldAlert,
      description: 'Próximos 90 días',
      color: 'text-amber-500',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="pb-8 border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Asuntos Legales
            </h1>
            <p className="text-muted-foreground font-medium">
              Gestión estratégica de representación legal, patentes y cumplimiento.
            </p>
          </div>
          <div>
            <ExportButton
              data={exportData}
              filename="reporte-legal"
              label="Exportar Directorio"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4 text-muted-foreground", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <LegalSearch />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content: Legal Directory */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Directorio de Representación</CardTitle>
              <CardDescription>Control centralizado de representantes legales y vigencia de documentación.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {displayingClients.length > 0 ? (
                <div className="divide-y">
                  {displayingClients.map((client) => {
                    const hasLegalData = !!client.legal_data;
                    const isExpiring = hasLegalData && client.legal_data.documents_expiry &&
                      new Date(client.legal_data.documents_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                    return (
                      <Link
                        key={client.id}
                        href={`/dashboard/clients/${client.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                            <Scale className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {client.commercial_name || client.legal_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{client.person_type}</span>
                              <span>•</span>
                              <span>NIT: {client.nit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">
                              {client.legal_data?.legal_representative || 'No Asignado'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {client.legal_data?.position || 'Sin Cargo'}
                            </p>
                          </div>

                          {isExpiring && (
                            <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              <ShieldAlert className="h-3 w-3" />
                              Expira pronto
                            </div>
                          )}

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Scale className="h-10 w-10 mb-2 opacity-20" />
                  <p>No se encontraron registros legales.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


