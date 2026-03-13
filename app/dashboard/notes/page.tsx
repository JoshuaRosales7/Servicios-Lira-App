import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StickyNote, Pin, Clock, ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotesSearch } from '@/components/dashboard/notes-search'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/dashboard/export-button'

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const search = params.search || ''

  let query = supabase.from('notes').select(`*, clients (id, commercial_name, legal_name)`).order('created_at', { ascending: false })
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

  const { data: notes, error } = await query.limit(100)
  if (error) console.error('Error fetching notes:', error)

  const sortedNotes = notes ? [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }) : []

  const pinnedNotes = sortedNotes.filter((n) => n.is_pinned)
  const recentNotes = sortedNotes.filter((n) => !n.is_pinned).slice(0, 50)

  const exportData = notes?.map(n => ({
    Cliente: n.clients?.commercial_name || n.clients?.legal_name || 'Desconocido',
    Titulo: n.title || 'Sin Título', Contenido: n.content || '',
    Fecha: new Date(n.updated_at).toLocaleDateString(),
    Prioridad: n.is_pinned ? 'Alta' : 'Normal'
  })) || []

  const recentCount = notes?.filter((n) => { const w = new Date(); w.setDate(w.getDate() - 7); return new Date(n.updated_at) >= w }).length || 0

  const stats = [
    { name: 'Total Notas', value: notes?.length || 0, icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { name: 'Fijadas', value: pinnedNotes.length, icon: Pin, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { name: 'Última Semana', value: recentCount, icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <StickyNote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Bitácora & Notas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Seguimiento y cronología de observaciones por cliente.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename="reporte-notas" label="Exportar" />
          <Link href="/dashboard/clients">
            <Button size="sm" className="h-9 rounded-lg"><Plus className="h-3.5 w-3.5 mr-1.5" />Nueva Nota</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</span>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <NotesSearch />
      </div>

      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Notas Prioritarias</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-semibold">{pinnedNotes.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <Link key={note.id} href={`/dashboard/clients/${note.client_id}`}>
                <div className="h-full bg-white dark:bg-slate-900 rounded-xl border-l-3 border-l-blue-500 border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors">
                  <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1 mb-0.5">{note.title || 'Informativo'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{note.clients?.commercial_name || note.clients?.legal_name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{note.content}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Listado Cronológico</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bitácora completa de gestiones y observaciones.</p>
        </div>
        {recentNotes && recentNotes.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentNotes.map((note) => (
              <Link key={note.id} href={`/dashboard/clients/${note.client_id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{note.clients?.commercial_name || note.clients?.legal_name || 'Individual'}</p>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{new Date(note.updated_at).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h4 className="font-medium text-sm text-blue-600 dark:text-blue-400">{note.title || 'Entrada de Seguimiento'}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-3xl">{note.content}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <StickyNote className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">No se encontraron notas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
