import {
  CorporateDetailSkeleton,
  CorporateTabsSkeleton
} from "@/components/ui/corporate-skeletons"

export default function ClientDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Breadcrumb Header Skeleton */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-px w-8 bg-slate-300 dark:bg-slate-700"></div>
              <div>
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mt-1"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Client Profile Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600"></div>
              <div className="px-6 pb-6 -mt-12 relative">
                <div className="h-20 w-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center mb-4 mx-auto">
                  <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Documents Section - Always Visible */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mt-1"></div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-6">
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-6">
                {['History', 'Notes', 'Fiscal', 'Legal', 'Banking', 'Accounting', 'Admin'].map((tab, i) => (
                  <div key={i} className="h-9 px-4 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                ))}
              </div>

              {/* Tab Content Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}