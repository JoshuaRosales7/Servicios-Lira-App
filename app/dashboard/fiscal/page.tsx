import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Receipt, AlertCircle, ShieldCheck, ArrowRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FiscalSearch } from '@/components/dashboard/fiscal-search'
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'client') {
    const { data: clientRecord } = await supabase.from('clients').select('id').eq('user_id', user.id).single()
    if (clientRecord) redirect(`/dashboard/clients/${clientRecord.id}`)
  }

  const search = params.search || ''
  const regime = params.regime || 'all'
  const frequency = params.frequency || 'all'
  const hasChildFilters = regime !== 'all' || frequency !== 'all'
  const selectString = hasChildFilters ? '*, fiscal_data!inner (*)' : '*, fiscal_data (*)'

  let query = supabase.from('clients').select(selectString).order('legal_name')
  if (search) query = query.or(`legal_name.ilike.%${search}%,commercial_name.ilike.%${search}%,nit.ilike.%${search}%`)
  if (regime !== 'all') query = query.eq('fiscal_data.tax_regime', regime)
  if (frequency !== 'all') query = query.eq('fiscal_data.declaration_frequency', frequency)

  const { data: clients } = await query.limit(100)
  const clientsWithFiscal = clients?.filter((c) => c.fiscal_data) || []
  const clientsWithoutFiscal = clients?.filter((c) => !c.fiscal_data) || []
  const displayingClients = clients || []

  const exportData = displayingClients.map(c => ({
    NombreLegal: c.legal_name, NIT: c.nit,
    Regimen: c.fiscal_data?.tax_regime || 'No Registrado',
    Frecuencia: c.fiscal_data?.declaration_frequency || '-',
    RetencionISR: c.fiscal_data?.isr_withholding ? 'Si' : 'No',
  }))

  const stats = [
    { name: 'Completos', value: clientsWithFiscal.length, Icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { name: 'En Proceso', value: clientsWithoutFiscal.length, Icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { name: 'Regímenes', value: new Set(clientsWithFiscal.map(c => c.fiscal_data?.tax_regime).filter(Boolean)).size, Icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  ]

  const completePct = Math.round((clientsWithFiscal.length / (displayingClients.length || 1)) * 100)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
            <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Cumplimiento Fiscal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de obligaciones tributarias y regímenes.</p>
          </div>
        </div>
        <ExportButton data={exportData} filename="reporte-fiscal" label="Exportar CSV" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</span>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.Icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <FiscalSearch />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Directorio de Contribuyentes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control de regímenes y frecuencias de declaración.</p>
            </div>
            {displayingClients.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayingClients.map((client) => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium text-sm">
                        {(client.commercial_name || client.legal_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{client.commercial_name || client.legal_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">NIT: {client.nit}</p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-3">
                      {client.fiscal_data ? (
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{client.fiscal_data.tax_regime || 'Sin régimen'}</p>
                          <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                            <Calendar className="h-3 w-3" />
                            {client.fiscal_data.declaration_frequency === 'monthly' ? 'Mensual' : client.fiscal_data.declaration_frequency === 'quarterly' ? 'Trimestral' : 'N/D'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 font-medium">Pendiente</span>
                      )}
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No se encontraron resultados.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resumen de Estado</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-500">Completo</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{clientsWithFiscal.length}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completePct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-500">Pendiente</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{clientsWithoutFiscal.length}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${100 - completePct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
