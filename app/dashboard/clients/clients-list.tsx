import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/dashboard/clients-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'

interface ClientsListProps {
    searchParams: { search?: string; status?: string; type?: string }
}

export async function ClientsList({ searchParams }: ClientsListProps) {
    const supabase = await createClient()

    let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (searchParams.search) {
        query = query.or(`legal_name.ilike.%${searchParams.search}%,commercial_name.ilike.%${searchParams.search}%,nit.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
    }

    if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq('fiscal_status', searchParams.status)
    }

    if (searchParams.type && searchParams.type !== 'all') {
        query = query.eq('person_type', searchParams.type)
    }

    const { data: clients } = await query

    return (
        <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b bg-muted/10">
                <div>
                    <CardTitle className="text-base font-bold">Listado General</CardTitle>
                    <CardDescription className="text-xs">
                        {clients?.length || 0} registro{clients?.length !== 1 ? 's' : ''} en total
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {clients && clients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <ClientsTable clients={clients} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                        <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-bold">Sin resultados</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-1 text-sm">
                            {searchParams.search || searchParams.status || searchParams.type
                                ? 'No se encontraron clientes con los filtros aplicados.'
                                : 'No hay clientes registrados en el sistema actualmente.'}
                        </p>
                        {(searchParams.search || searchParams.status || searchParams.type) ? (
                            <Link href="/dashboard/clients" className="mt-8">
                                <Button variant="outline" size="sm" className="rounded-lg px-8">Limpiar Filtros</Button>
                            </Link>
                        ) : (
                            <Link href="/dashboard/clients/new" className="mt-8">
                                <Button size="sm" className="rounded-lg px-8">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Registrar Primer Cliente
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
