import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Scale, Building2, User, Landmark, ShieldAlert, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LegalSearch } from '@/components/dashboard/legal-search'
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'client') {
    const { data: clientRecord } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle()
    if (clientRecord) redirect(`/dashboard/clients/${clientRecord.id}`)
  }

  const search = params.search || ''
  const typeFilter = params.type || 'all'
  const expiringFilter = params.expiring === 'true'

  let query = supabase.from('clients').select(`*, legal_data (*)`).order('legal_name')
  if (search) query = query.or(`legal_name.ilike.%${search}%,commercial_name.ilike.%${search}%,nit.ilike.%${search}%`)
  if (typeFilter !== 'all') query = query.eq('person_type', typeFilter)

  const { data: rawClients } = await query.limit(100)
  
  // Normalize legal_data from array to single object
  let displayingClients = (rawClients || []).map(client => ({
    ...client,
    legal_data: Array.isArray(client.legal_data) ? client.legal_data[0] || null : client.legal_data
  }))

  if (expiringFilter) {
    displayingClients = displayingClients.filter(c => {
      if (!c.legal_data?.documents_expiry) return false
      return new Date(c.legal_data.documents_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    })
  }

  const companies = displayingClients.filter((c) => c.person_type === 'juridica')
  const individuals = displayingClients.filter((c) => c.person_type === 'individual')
  const withLegalData = displayingClients.filter((c) => c.legal_data)

  const expiringCount = withLegalData.filter(c => {
    if (!c.legal_data?.documents_expiry) return false
    return new Date(c.legal_data.documents_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }).length

  const exportData = displayingClients.map(c => ({
    NombreLegal: c.legal_name, Tipo: c.person_type,
    Representante: c.legal_data?.legal_representative || 'No Asignado',
    Cargo: c.legal_data?.position || '-',
    VencimientoDocumentos: c.legal_data?.documents_expiry || 'N/D'
  }))

  const stats = [
    { name: 'Empresas', value: companies.length, Icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { name: 'Individuos', value: individuals.length, Icon: User, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
    { name: 'Con Expediente', value: withLegalData.length, Icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { name: 'Vencimientos', value: expiringCount, Icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 dark:bg-violet-950 rounded-lg">
            <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Asuntos Legales</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de representación legal y cumplimiento.</p>
          </div>
        </div>
        <ExportButton data={exportData} filename="reporte-legal" label="Exportar" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <LegalSearch />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Directorio de Representación</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Representantes legales y vigencia de documentación.</p>
        </div>
        {displayingClients.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayingClients.map((client) => {
              const hasLegalData = !!client.legal_data
              const isExpiring = hasLegalData && client.legal_data.documents_expiry &&
                new Date(client.legal_data.documents_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

              return (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Scale className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{client.commercial_name || client.legal_name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="capitalize">{client.person_type}</span>
                        <span>·</span>
                        <span>NIT: {client.nit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{client.legal_data?.legal_representative || 'No Asignado'}</p>
                      <p className="text-xs text-slate-500">{client.legal_data?.position || 'Sin Cargo'}</p>
                    </div>
                    {isExpiring && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                        <ShieldAlert className="h-3 w-3" /> Expira
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Scale className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No se encontraron registros legales.</p>
          </div>
        )}
      </div>
    </div>
  )
}
