'use client'

import { useSearchParams } from 'next/navigation'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

interface ClientPaginationProps {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
}

export function ClientPagination({ currentPage, totalPages, searchParams }: ClientPaginationProps) {
  if (totalPages <= 1) return null

  const createHref = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return `/dashboard/clients?${params.toString()}`
  }

  return (
    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
      <Pagination>
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              href={currentPage > 1 ? createHref(currentPage - 1) : undefined}
              className={cn(
                "h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200",
                currentPage <= 1 ? 'pointer-events-none opacity-50' : 'hover:shadow-sm'
              )}
            />
          </PaginationItem>

          {/* Mostrar páginas con lógica inteligente */}
          {(() => {
            const pages = []
            const showPages = 5
            const half = Math.floor(showPages / 2)

            let start = Math.max(1, currentPage - half)
            let end = Math.min(totalPages, start + showPages - 1)

            if (end - start + 1 < showPages) {
              start = Math.max(1, end - showPages + 1)
            }

            // Agregar primera página si no está incluida
            if (start > 1) {
              pages.push(
                <PaginationItem key={1}>
                  <PaginationLink
                    href={createHref(1)}
                    className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-sm"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              )
              if (start > 2) {
                pages.push(
                  <PaginationItem key="ellipsis-start">
                    <span className="flex h-9 w-9 items-center justify-center text-slate-400 dark:text-slate-600">...</span>
                  </PaginationItem>
                )
              }
            }

            // Páginas principales
            for (let i = start; i <= end; i++) {
              pages.push(
                <PaginationItem key={i}>
                  <PaginationLink
                    href={createHref(i)}
                    isActive={i === currentPage}
                    className={cn(
                      "h-9 w-9 rounded-lg border transition-all duration-200 hover:shadow-sm",
                      i === currentPage
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    {i}
                  </PaginationLink>
                </PaginationItem>
              )
            }

            // Agregar última página si no está incluida
            if (end < totalPages) {
              if (end < totalPages - 1) {
                pages.push(
                  <PaginationItem key="ellipsis-end">
                    <span className="flex h-9 w-9 items-center justify-center text-slate-400 dark:text-slate-600">...</span>
                  </PaginationItem>
                )
              }
              pages.push(
                <PaginationItem key={totalPages}>
                  <PaginationLink
                    href={createHref(totalPages)}
                    className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-sm"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )
            }

            return pages
          })()}

          <PaginationItem>
            <PaginationNext
              href={currentPage < totalPages ? createHref(currentPage + 1) : undefined}
              className={cn(
                "h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200",
                currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'hover:shadow-sm'
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}