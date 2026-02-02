import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Users, Filter } from 'lucide-react'
import { ClientSearch } from '@/components/dashboard/client-search'
import { Suspense } from 'react'
import { ClientsList } from './clients-list'
import { ClientsListSkeleton } from './clients-list-skeleton'

// Helper for stats - separate query to avoid blocking if possible, or just simpler
async function getClientStats(supabase: any) {
  const { data } = await supabase.from('clients').select('fiscal_status')
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
    } else {
      redirect('/dashboard')
    }
  }

  // Fetch stats generally (global)
  const allClients = await getClientStats(supabase)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-muted-foreground font-medium">
            Gestión de cartera y expedientes administrativos.
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="rounded-lg px-5 h-10 font-bold space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </Button>
        </Link>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">{allClients.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Total</p>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">{allClients.filter((c: any) => c.fiscal_status === 'active').length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Operativos</p>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">{allClients.filter((c: any) => c.fiscal_status === 'suspended').length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Suspendidos</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar Section */}
      <div className="bg-muted/30 p-5 rounded-xl border space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtros de búsqueda</h2>
        </div>
        <ClientSearch />
      </div>

      {/* Results Section */}
      <Suspense fallback={<ClientsListSkeleton />} key={JSON.stringify(params)}>
        <ClientsList searchParams={params} />
      </Suspense>
    </div>
  )
}
