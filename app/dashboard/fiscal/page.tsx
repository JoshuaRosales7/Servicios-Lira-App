import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, AlertCircle, ShieldCheck, ArrowRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FiscalSearch } from '@/components/dashboard/fiscal-search'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/dashboard/export-button'

export default async function FiscalPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; regime?: string; frequency?: string }>
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
  const regime = params.regime || 'all'
  const frequency = params.frequency || 'all'

  // Determine if we need strict filtering on child
  const hasChildFilters = regime !== 'all' || frequency !== 'all'

  // Use !inner if we are strictly filtering by fiscal properties, otherwise left join to show missing data too
  const selectString = hasChildFilters
    ? '*, fiscal_data!inner (*)'
    : '*, fiscal_data (*)'

  let query = supabase
    .from('clients')
    .select(selectString)
    .order('legal_name')

  if (search) {
    query = query.or(`legal_name.ilike.%${search}%,commercial_name.ilike.%${search}%,nit.ilike.%${search}%`)
  }

  if (regime !== 'all') {
    query = query.eq('fiscal_data.tax_regime', regime)
  }

  if (frequency !== 'all') {
    query = query.eq('fiscal_data.declaration_frequency', frequency)
  }

  const { data: clients } = await query.limit(100)

  const clientsWithFiscal = clients?.filter((c) => c.fiscal_data) || []
  const clientsWithoutFiscal = clients?.filter((c) => !c.fiscal_data) || []
  const displayingClients = clients || []

  // Prepare Export Data
  const exportData = displayingClients.map(c => ({
    NombreLegal: c.legal_name,
    NIT: c.nit,
    Regimen: c.fiscal_data?.tax_regime || 'No Registrado',
    Frecuencia: c.fiscal_data?.declaration_frequency || '-',
    RetencionISR: c.fiscal_data?.isr_withholding ? 'Si' : 'No'
  }))

  // Stats definition
  const stats = [
    {
      name: 'Eficacia Fiscal',
      value: clientsWithFiscal.length,
      icon: ShieldCheck,
      description: 'Expedientes completos',
    },
    {
      name: 'En Proceso',
      value: clientsWithoutFiscal.length,
      icon: AlertCircle,
      description: 'Requieren atención',
    },
    {
      name: 'Regímenes',
      value: new Set(clientsWithFiscal.map(c => c.fiscal_data?.tax_regime).filter(Boolean)).size,
      icon: Receipt,
      description: 'Tipos en vista',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="pb-8 border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cumplimiento Fiscal
            </h1>
            <p className="text-muted-foreground font-medium">
              Gestión estratégica de obligaciones tributarias y regímenes contributivos.
            </p>
          </div>
          <div>
            <ExportButton
              data={exportData}
              filename="reporte-fiscal"
              label="Exportar CSV"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
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

      <FiscalSearch />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content: Fiscal Directory */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Directorio de Contribuyentes</CardTitle>
              <CardDescription>Control normativo de regímenes y frecuencias de declaración.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {displayingClients.length > 0 ? (
                <div className="divide-y">
                  {displayingClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                          {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {client.commercial_name || client.legal_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            NIT: {client.nit}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center gap-4">
                        {client.fiscal_data ? (
                          <div className="text-right">
                            <div className="text-sm font-medium">{client.fiscal_data.tax_regime || 'Sin régimen'}</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                              <Calendar className="h-3 w-3" />
                              {client.fiscal_data.declaration_frequency === 'monthly' ? 'Mensual' : client.fiscal_data.declaration_frequency === 'quarterly' ? 'Trimestral' : 'N/D'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">
                            Pendiente
                          </div>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Receipt className="h-10 w-10 mb-2 opacity-20" />
                  <p>No se encontraron resultados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Status Summary */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen de Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completo</span>
                  <span className="font-bold">{clientsWithFiscal.length}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(clientsWithFiscal.length / (displayingClients?.length || 1)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Pendiente</span>
                  <span className="font-bold">{clientsWithoutFiscal.length}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(clientsWithoutFiscal.length / (displayingClients?.length || 1)) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


