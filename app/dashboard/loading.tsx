import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-4 w-[350px]" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <div className="space-y-1">
                            <Skeleton className="h-8 w-[60px]" />
                            <Skeleton className="h-3 w-[80px]" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters/Toolbar Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4">
                <Skeleton className="h-10 w-full md:w-[300px]" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-[150px]" />
                </div>
            </div>

            {/* Main Content Card Skeleton */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <Skeleton className="h-6 w-[200px]" />
                    <Skeleton className="h-4 w-[300px] mt-2" />
                </div>
                <div className="p-0">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b last:border-0">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-3 w-[150px]" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-[100px]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
