import { createClient } from '@/lib/supabase/server'
import { FileText, FolderOpen, UploadCloud, HardDrive } from 'lucide-react'
import { DocumentFilters } from '@/components/dashboard/documents-filters'
import { Suspense } from 'react'
import { DocumentsList } from './documents-list'
import { DocumentsListSkeleton } from './documents-list-skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const categoryNames: Record<string, string> = {
  fiscal: 'Fiscal', legal: 'Legal', accounting: 'Contabilidad', banking: 'Banca', other: 'Otro',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: allDocsLight } = await supabase.from('documents').select('document_type, file_size')

  const categories = ['fiscal', 'legal', 'accounting', 'banking', 'other']
  const categoryStats = categories.map((cat) => ({
    name: cat, count: allDocsLight?.filter((d) => d.document_type === cat).length || 0,
  }))
  const totalSize = allDocsLight?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0
  const totalCount = allDocsLight?.length || 0

  const statCards = [
    { label: 'Total Archivos', value: totalCount, Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Almacenamiento', value: formatFileSize(totalSize), Icon: HardDrive, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
    { label: 'Fiscal', value: categoryStats.find(s => s.name === 'fiscal')?.count || 0, Icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Legal', value: categoryStats.find(s => s.name === 'legal')?.count || 0, Icon: FolderOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Gestión Documental</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bóveda digital de expedientes e informes.</p>
          </div>
        </div>
        <Link href="/dashboard/import">
          <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2">
            <UploadCloud className="h-3.5 w-3.5" /> Carga Masiva
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.Icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {categoryStats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">{categoryNames[stat.name]}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <DocumentFilters />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Suspense fallback={<DocumentsListSkeleton />} key={JSON.stringify(searchParams)}>
          <DocumentsList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
