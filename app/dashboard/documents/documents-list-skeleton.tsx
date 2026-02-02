import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export function DocumentsListSkeleton() {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60 mt-2" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                                <div className="space-y-2 flex-1 max-w-[300px]">
                                    <Skeleton className="h-4 w-full" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 flex items-center gap-6">
                                <div className="text-right space-y-1">
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                    <Skeleton className="h-3 w-24 ml-auto" />
                                </div>
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
