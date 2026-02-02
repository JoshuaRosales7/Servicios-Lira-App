import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ClientsListSkeleton() {
    return (
        <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b bg-muted/10">
                <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-4 p-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
