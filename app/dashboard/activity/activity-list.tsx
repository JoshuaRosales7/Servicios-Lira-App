import { getActivityLogs } from '@/app/actions/system'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ActivityListProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function ActivityList({ searchParams }: ActivityListProps) {
    const page = Number(searchParams?.page) || 1
    const limit = 10
    const offset = (page - 1) * limit
    const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
    const action = typeof searchParams?.action === 'string' ? searchParams.action : undefined
    const resourceType = typeof searchParams?.resourceType === 'string' ? searchParams.resourceType : undefined

    const { logs, count } = await getActivityLogs({
        limit,
        offset,
        search,
        action,
        resourceType
    })

    const totalPages = Math.ceil(count / limit)

    // Helper to build pagination links
    const createPageLink = (newPage: number) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (action) params.set('action', action)
        if (resourceType) params.set('resourceType', resourceType)
        params.set('page', newPage.toString())
        return `?${params.toString()}`
    }

    return (
        <div className="space-y-4">
            <ActivityFeed logs={logs as any[]} />

            <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                    Mostrando {logs.length > 0 ? offset + 1 : 0} a {Math.min(offset + limit, count)} de {count} registros
                </div>
                <div className="flex items-center gap-2">
                    {page > 1 ? (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={createPageLink(page - 1)}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Anterior
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Anterior
                        </Button>
                    )}

                    {page < totalPages ? (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={createPageLink(page + 1)}>
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled>
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
