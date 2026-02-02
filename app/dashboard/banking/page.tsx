import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, CreditCard, Building, Wallet, ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BankingSearch } from '@/components/dashboard/banking-search'
import { Button } from '@/components/ui/button'
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

  let query = supabase
    .from('clients')
    .select(`
      *,
      banking_data!inner (*)
    `)
    .order('legal_name')

  if (search) {
    query = query.or(`legal_name.ilike.%${search}%,commercial_name.ilike.%${search}%,nit.ilike.%${search}%`)
  }

  if (bankFilter !== 'all') {
    query = query.eq('banking_data.bank', bankFilter)
  }

  const { data: clients } = await query.limit(100)

  const clientsWithBanking = clients || []
  const totalAccounts = clientsWithBanking.reduce((sum, c) => sum + (c.banking_data?.length || 0), 0)

  // Group accounts by bank
  const bankGroups: Record<string, number> = {}
  clientsWithBanking.forEach((client) => {
    client.banking_data?.forEach((account: { bank: string | null }) => {
      // Logic: if filtered, we might want to only count matching banks?
      // But keeping it simple: show distribution of visible clients' banks
      const bankName = account.bank || 'No especificado'
      bankGroups[bankName] = (bankGroups[bankName] || 0) + 1
    })
  })

  const sortedBanks = Object.entries(bankGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Prepare Export Data
  const exportData = clientsWithBanking.map(c => ({
    NombreLegal: c.legal_name,
    NombreComercial: c.commercial_name || '-',
    NIT: c.nit,
    Bancos: c.banking_data?.map((b: any) => b.bank).join('; ') || 'Ninguno',
    TotalCuentas: c.banking_data?.length || 0,
    Monedas: Array.from(new Set(c.banking_data?.map((b: any) => b.currency))).join('; ')
  }))

  // Stats definition
  const stats = [
    {
      name: 'Clientes con Cuentas',
      value: clientsWithBanking.length,
      icon: Building,
      description: `Coincidencias`
    },
    {
      name: 'Total Cuentas',
      value: totalAccounts,
      icon: CreditCard,
      description: 'En vista actual'
    },
    {
      name: 'Bancos Operantes',
      value: Object.keys(bankGroups).length,
      icon: Landmark,
      description: 'Instituciones únicas'
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="pb-8 border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Ecosistema Bancario
            </h1>
            <p className="text-muted-foreground font-medium">
              Supervisión de cuentas, entidades financieras y flujos de capital.
            </p>
          </div>
          <div>
            <ExportButton
              data={exportData}
              filename="reporte-bancario"
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

      <BankingSearch />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content: Client Banking List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Cartera de Cuentas</CardTitle>
              <CardDescription>Clientes con productos bancarios activos.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {clientsWithBanking.length > 0 ? (
                <div className="divide-y">
                  {clientsWithBanking.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Wallet className="h-5 w-5" />
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
                        <div className="flex gap-2">
                          {client.banking_data
                            ?.filter((acc: any) => bankFilter === 'all' || acc.bank === bankFilter)
                            .slice(0, 2).map((acc: any) => (
                              <div key={acc.id} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-medium">
                                {acc.bank}
                              </div>
                            ))}
                          {(client.banking_data?.length || 0) > 2 && bankFilter === 'all' && (
                            <div className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{client.banking_data.length - 2}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Landmark className="h-10 w-10 mb-2 opacity-20" />
                  <p>No se encontraron resultados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Top Institutions */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Top Instituciones
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {sortedBanks.length > 0 ? sortedBanks.map(([bankName, count], i) => (
                <div key={bankName} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-muted-foreground w-4">{i + 1}.</span>
                    <span>{bankName}</span>
                  </div>
                  <span className="font-bold">{count}</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">Sin datos.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
