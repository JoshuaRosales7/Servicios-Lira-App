import { ActivityFilters } from '@/components/dashboard/activity-filters'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { Suspense } from 'react'
import { ActivityList } from './activity-list'
import { ActivityListSkeleton } from './activity-list-skeleton'

interface ActivityPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ActivityPage(props: ActivityPageProps) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Only admins should see this page
    if (profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Registro de Actividad</h1>
                    <p className="text-sm text-muted-foreground">
                        Historial completo de eventos y auditoría del sistema.
                    </p>
                </div>
            </div>

            <ActivityFilters />

            <Suspense fallback={<ActivityListSkeleton />} key={JSON.stringify(searchParams)}>
                <ActivityList searchParams={searchParams} />
            </Suspense>
        </div>
    )
}
