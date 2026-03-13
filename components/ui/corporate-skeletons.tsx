'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Modern Corporate Skeleton Components

export function CorporateHeaderSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="w-full px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-64 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-5 w-96 bg-slate-200 dark:bg-slate-800" />
          </div>
          <Skeleton className="h-11 w-40 bg-slate-900 dark:bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export function CorporateStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-16 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-6 w-6 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-12 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-5 w-24 bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CorporateTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
      <CardContent className="p-0">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="grid grid-cols-6 gap-4 items-center">
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
              </div>
              <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <Skeleton className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function CorporateFiltersSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Skeleton className="h-10 w-full max-w-sm bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

export function CorporatePaginationSkeleton() {
  return (
    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
          <Skeleton className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function CorporateDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-48 bg-slate-200 dark:bg-slate-800" />
          </div>
          <Skeleton className="h-9 w-24 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-t-xl"></div>
            <CardContent className="p-6 -mt-12">
              <div className="flex justify-center mb-4">
                <Skeleton className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900" />
              </div>
              <div className="space-y-4 text-center">
                <Skeleton className="h-6 w-20 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Skeleton className="h-4 w-4 bg-slate-200 dark:bg-slate-800" />
                      <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-48 bg-slate-200 dark:bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function CorporateTabsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 px-4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>

      {/* Tab Content */}
      <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}