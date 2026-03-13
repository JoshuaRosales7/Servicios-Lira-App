import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/dashboard/clients-table'
import { Button } from '@/components/ui/button'
import { ClientSort } from '@/components/dashboard/client-sort'
import { ClientPagination } from '@/components/dashboard/client-pagination'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'

interface ClientsListProps {
    searchParams: { search?: string; status?: string; type?: string; page?: string; sort?: string }
}

export async function ClientsList({ searchParams }: ClientsListProps) {
    const supabase = await createClient()

    const page = parseInt(searchParams.page || '1')
    const limit = 20
    const offset = (page - 1) * limit
    const sortBy = searchParams.sort || 'created_at'
    const sortOrder = sortBy.startsWith('-') ? 'asc' : 'desc'
    const sortField = sortBy.replace('-', '')

    let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)

    if (searchParams.search) {
        query = query.or(`legal_name.ilike.%${searchParams.search}%,commercial_name.ilike.%${searchParams.search}%,nit.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
    }

    if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq('fiscal_status', searchParams.status)
    }

    if (searchParams.type && searchParams.type !== 'all') {
        query = query.eq('person_type', searchParams.type === 'juridica' ? 'juridica' : 'individual')
    }

    const { data: clients, count } = await query

    const totalPages = Math.ceil((count || 0) / limit)

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Header Area */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Directorio Activo</span>
                            <span className="flex h-5 items-center rounded-full bg-blue-100 px-2.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {count || 0} registros
                            </span>
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Mostrando {(clients?.length || 0)} resultados
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full">
                {clients && clients.length > 0 ? (
                    <div className="flex flex-col w-full h-full">
                        <div className="w-full">
                            <ClientsTable clients={clients} />
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800/60 p-4 sm:px-6 mt-auto bg-slate-50/30 dark:bg-slate-900/10">
                            <ClientPagination
                                currentPage={page}
                                totalPages={totalPages}
                                searchParams={searchParams}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] border border-slate-100 dark:border-slate-800 transition-transform hover:scale-105 duration-300">
                            <Users className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sin resultados</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                            {searchParams.search || searchParams.status || searchParams.type
                                ? 'No se encontraron clientes con los filtros aplicados. Intenta con otra búsqueda.'
                                : 'Aún no hay clientes registrados en el sistema. Comienza agregando uno.'}
                        </p>
                        {(searchParams.search || searchParams.status || searchParams.type) ? (
                            <Link href="/dashboard/clients">
                                <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all active:scale-95 font-medium">
                                    Limpiar Filtros
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/dashboard/clients/new">
                                <Button className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 font-semibold">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Registrar Primer Cliente
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
