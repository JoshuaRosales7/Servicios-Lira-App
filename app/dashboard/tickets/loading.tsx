import {
  CorporateHeaderSkeleton,
  CorporateFiltersSkeleton,
  CorporateTableSkeleton,
  CorporatePaginationSkeleton
} from "@/components/ui/corporate-skeletons"

export default function TicketsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Corporate Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="w-full px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="h-9 w-52 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-88 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-40 bg-slate-900 dark:bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8 space-y-8">
        {/* Tickets Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-6 w-6 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <CorporateFiltersSkeleton />

        {/* Tickets List */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                  <div className="space-y-2">
                    <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <CorporatePaginationSkeleton />
      </div>
    </div>
  )
}