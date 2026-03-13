import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Landmark, CreditCard, Building, Wallet, ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BankingSearch } from '@/components/dashboard/banking-search'
import { ExportButton } from '@/components/dashboard/export-button'

export default async function BankingPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; bank?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const search = params.search || ''
  const bankFilter = params.bank || 'all'

  let query = supabase.from('clients').select(`*, banking_data!inner (*)`).order('legal_name')
  if (search) query = query.or(`legal_name.ilike.%${search}%,commercial_name.ilike.%${search}%,nit.ilike.%${search}%`)
  if (bankFilter !== 'all') query = query.eq('banking_data.bank', bankFilter)

  const { data: clients } = await query.limit(100)
  const clientsWithBanking = clients || []
  const totalAccounts = clientsWithBanking.reduce((sum, c) => sum + (c.banking_data?.length || 0), 0)

  const bankGroups: Record<string, number> = {}
  clientsWithBanking.forEach((client) => {
    client.banking_data?.forEach((account: { bank: string | null }) => {
      const bankName = account.bank || 'No especificado'
      bankGroups[bankName] = (bankGroups[bankName] || 0) + 1
    })
  })
  const sortedBanks = Object.entries(bankGroups).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const exportData = clientsWithBanking.map(c => ({
    NombreLegal: c.legal_name, NombreComercial: c.commercial_name || '-', NIT: c.nit,
    Bancos: c.banking_data?.map((b: any) => b.bank).join('; ') || 'Ninguno',
    TotalCuentas: c.banking_data?.length || 0,
    Monedas: Array.from(new Set(c.banking_data?.map((b: any) => b.currency))).join('; ')
  }))

  const stats = [
    { name: 'Clientes', value: clientsWithBanking.length, Icon: Building, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { name: 'Cuentas', value: totalAccounts, Icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
    { name: 'Instituciones', value: Object.keys(bankGroups).length, Icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ecosistema Bancario</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Supervisión de cuentas y entidades financieras.</p>
          </div>
        </div>
        <ExportButton data={exportData} filename="reporte-bancario" label="Exportar CSV" />
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
        <BankingSearch />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Cartera de Cuentas</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clientes con productos bancarios activos.</p>
            </div>
            {clientsWithBanking.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {clientsWithBanking.map((client) => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{client.commercial_name || client.legal_name}</p>
                        <p className="text-xs text-slate-500">NIT: {client.nit}</p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-3">
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {client.banking_data?.filter((acc: any) => bankFilter === 'all' || acc.bank === bankFilter).slice(0, 2).map((acc: any) => (
                          <span key={acc.id} className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-medium">
                            {acc.bank}
                          </span>
                        ))}
                        {(client.banking_data?.length || 0) > 2 && bankFilter === 'all' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            +{client.banking_data.length - 2}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Landmark className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No se encontraron resultados.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Top Instituciones</h2>
            </div>
            <div className="p-5 space-y-3">
              {sortedBanks.length > 0 ? sortedBanks.map(([bankName, count], i) => (
                <div key={bankName} className="flex items-center justify-between text-sm py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-400 w-4 text-right text-xs">{i + 1}.</span>
                    <span className="text-slate-900 dark:text-white">{bankName}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                </div>
              )) : <p className="text-sm text-slate-500">Sin datos.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
