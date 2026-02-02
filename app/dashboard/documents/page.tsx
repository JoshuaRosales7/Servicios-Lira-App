import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  FolderOpen,
  UploadCloud
} from 'lucide-react'
import { DocumentFilters } from '@/components/dashboard/documents-filters'
import { Suspense } from 'react'
import { DocumentsList } from './documents-list'
import { DocumentsListSkeleton } from './documents-list-skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const categoryNames: Record<string, string> = {
  fiscal: 'Fiscal',
  legal: 'Legal',
  accounting: 'Contabilidad',
  banking: 'Banca',
  other: 'Otro',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DocumentsPage(props: DocumentsPageProps) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // 1. Fetch Stats (All docs light query)
  // We keep this here because it's global stats, independent of filters (usually)
  const { data: allDocsLight } = await supabase
    .from('documents')
    .select('document_type, file_size')

  // Group by category
  const categories = ['fiscal', 'legal', 'accounting', 'banking', 'other']
  const categoryStats = categories.map((cat) => ({
    name: cat,
    count: allDocsLight?.filter((d) => d.document_type === cat).length || 0,
  }))

  const totalSize = allDocsLight?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0
  const totalCount = allDocsLight?.length || 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión Documental</h1>
          <p className="text-muted-foreground mt-1">
            Bóveda digital de expedientes, declaraciones e informes técnicos.
          </p>
        </div>
        <div>
          <Link href="/dashboard/import">
            <Button variant="outline" className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5">
              <UploadCloud className="h-4 w-4" />
              Carga Masiva
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Archivos', value: totalCount, Icon: FileText },
          { label: 'Almacenamiento', value: formatFileSize(totalSize), Icon: FolderOpen },
          ...categoryStats.slice(0, 2).map(stat => ({
            label: categoryNames[stat.name] || stat.name,
            value: stat.count,
            Icon: FileText,
          }))
        ].map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {categoryStats.map((stat) => (
          <div key={stat.name} className="bg-muted/40 p-4 rounded-lg border text-center space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">{categoryNames[stat.name] || stat.name}</p>
            <p className="text-xl font-bold">{stat.count}</p>
          </div>
        ))}
      </div>

      <DocumentFilters />

      <Suspense fallback={<DocumentsListSkeleton />} key={JSON.stringify(searchParams)}>
        <DocumentsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
