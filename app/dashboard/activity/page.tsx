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

    if (profile?.role !== 'admin') redirect('/dashboard')

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2 bg-violet-50 dark:bg-violet-950 rounded-lg">
                    <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Registro de Actividad</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Historial de eventos y auditoría del sistema.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <ActivityFilters />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Suspense fallback={<ActivityListSkeleton />} key={JSON.stringify(searchParams)}>
                    <ActivityList searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    )
}
