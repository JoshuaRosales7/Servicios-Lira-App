import {
  CorporateHeaderSkeleton,
  CorporateFiltersSkeleton,
  CorporateTableSkeleton,
  CorporatePaginationSkeleton
} from "@/components/ui/corporate-skeletons"

export default function FiscalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Corporate Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="w-full px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="h-9 w-56 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-40 bg-slate-900 dark:bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8 space-y-8">
        {/* Fiscal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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

        {/* Fiscal Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-18 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="p-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <CorporatePaginationSkeleton />
      </div>
    </div>
  )
}