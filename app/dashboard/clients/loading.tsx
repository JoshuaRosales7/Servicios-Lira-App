import {
  CorporateHeaderSkeleton,
  CorporateStatsGridSkeleton,
  CorporateFiltersSkeleton,
  CorporateTableSkeleton,
  CorporatePaginationSkeleton
} from "@/components/ui/corporate-skeletons"

export default function ClientsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Corporate Header */}
      <CorporateHeaderSkeleton />

      {/* Main Content */}
      <div className="w-full px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <CorporateStatsGridSkeleton />

        {/* Filters */}
        <CorporateFiltersSkeleton />

        {/* Table */}
        <CorporateTableSkeleton rows={12} />

        {/* Pagination */}
        <CorporatePaginationSkeleton />
      </div>
    </div>
  )
}
