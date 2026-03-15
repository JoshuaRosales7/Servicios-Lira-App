import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Users, CheckCircle2, XCircle, AlertCircle, Briefcase } from 'lucide-react'
import { ClientSearch } from '@/components/dashboard/client-search'
import { Suspense } from 'react'
import { ClientsList } from './clients-list'
import { ClientsListSkeleton } from './clients-list-skeleton'
import { ClientSort } from '@/components/dashboard/client-sort'
import { cn } from '@/lib/utils'

async function getClientStats(supabase: any) {
  const { data } = await supabase.from('clients').select('fiscal_status, person_type')
  return data || []
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; type?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role === 'client') {
    const { data: clientRecord } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle()
    if (clientRecord) redirect(`/dashboard/clients/${clientRecord.id}`)
    else redirect('/dashboard')
  }

  const allClients = await getClientStats(supabase)
  const activeCount = allClients.filter((c: any) => c.fiscal_status === 'active').length
  const inactiveCount = allClients.filter((c: any) => c.fiscal_status === 'inactive').length
  const suspendedCount = allClients.filter((c: any) => c.fiscal_status === 'suspended').length

  const statCards = [
    { title: 'Total Clientes', value: allClients.length, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { title: 'Activos', value: activeCount, Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { title: 'Inactivos', value: inactiveCount, Icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { title: 'Suspendidos', value: suspendedCount, Icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Directorio de Clientes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestión integral de cartera y expedientes</p>
          </div>
        </div>
        <Link href="/dashboard/clients/new">
          <Button size="sm" className="h-9 rounded-lg">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.Icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search / Filter */}
      <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="w-full lg:w-3/5 flex-1">
            <ClientSearch />
          </div>
          <div className="w-full lg:w-auto flex justify-end shrink-0">
            <ClientSort />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Suspense fallback={<ClientsListSkeleton />}>
          <ClientsList searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}